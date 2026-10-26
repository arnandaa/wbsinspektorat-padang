// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8000;
const LOG_FILE = path.join(__dirname, 'server.log');

// Cryptographically secure active sessions storage (in-memory)
// Format: token -> { createdAt: Date, username: string }
const activeSessions = new Map();
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours session timeout

// Failed login attempt tracking for brute-force protection
// Format: ip -> { count: number, lockedUntil: Date|null }
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/* ==========================================================================
   SECURITY MIDDLEWARE STACK
   ========================================================================== */

// 1. Security Headers via Helmet (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, onsubmit, etc.)
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,       // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,              // X-Content-Type-Options: nosniff
    xssFilter: true,            // X-XSS-Protection (legacy browsers)
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 2. Rate Limiting — General API (max 100 req/15 min per IP)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.' },
    handler: (req, res, next, options) => {
        writeLog('WARN', `Rate limit exceeded on ${req.url} from IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// 3. Strict Rate Limiting — Login endpoint (max 10 req/15 min per IP)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    message: { success: false, message: 'Terlalu banyak percobaan login. Akun terkunci sementara 15 menit.' },
    handler: (req, res, next, options) => {
        writeLog('WARN', `Login rate limit exceeded from IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

app.use('/api/', generalLimiter);

// 4. Middleware for parsing JSON body
app.use(express.json({ limit: '10mb' })); // Limit JSON payload to protect from DoS

// 4.5. Secure File Protection Middleware: Block direct access to sensitive project files
app.use((req, res, next) => {
    const forbiddenFiles = [
        /^\/\.env/i,
        /^\/server\.js/i,
        /^\/server\.log/i,
        /^\/package\.json/i,
        /^\/package-lock\.json/i,
        /^\/wbs_database\.db/i,
        /^\/\.git/i,
        /^\/node_modules/i
    ];
    if (forbiddenFiles.some(regex => regex.test(req.path))) {
        writeLog('WARN', `Unauthorized access attempt to sensitive file: ${req.path} from IP: ${req.ip}`);
        return res.status(403).json({ success: false, message: 'Akses ditolak: File sensitif' });
    }
    next();
});

// 5. Serve static frontend files safely
app.use(express.static(__dirname));

// 6. HTTPS Redirect Middleware (if behind a proxy/load balancer in production)
app.use((req, res, next) => {
    // Add Strict-Transport-Security manually for proxy environments
    if (process.env.NODE_ENV === 'production') {
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
    }
    next();
});


// Cybersecurity Standard: Logging utility
function writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    // Only write to file when not running in serverless environment (e.g. Vercel)
    if (!process.env.VERCEL) {
        fs.appendFile(LOG_FILE, logMessage, (err) => {
            if (err) console.error('Error writing to log file:', err);
        });
    }
    console.log(`[${level}] ${message}`);
}

// Error formatting helper to handle Node AggregateError (e.g. for connection errors)
function formatError(err) {
    if (!err) return 'Unknown error';
    if (err.errors && Array.isArray(err.errors)) {
        return err.errors.map(e => e.message).join('; ');
    }
    return err.message || err.toString();
}

/* ==========================================================================
   IDENTITY ENCRYPTION (AES-256-GCM)
   Encrypts sensitive reporter identity fields before database storage.
   ========================================================================== */

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
const ENCRYPTION_ALGO = 'aes-256-gcm';

function encryptData(text) {
    if (!text || !ENCRYPTION_KEY_HEX) return text;
    try {
        const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
        const iv = crypto.randomBytes(12); // 96-bit IV for GCM
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Format: iv:authTag:encryptedData
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (e) {
        writeLog('WARN', `Encryption failed, storing plaintext: ${e.message}`);
        return text;
    }
}

function decryptData(encryptedText) {
    if (!encryptedText || !ENCRYPTION_KEY_HEX) return encryptedText;
    // Check if it looks encrypted (contains two colons)
    if (!encryptedText.includes(':')) return encryptedText;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) return encryptedText;
        const [ivHex, authTagHex, encrypted] = parts;
        const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        writeLog('WARN', `Decryption failed, returning raw value: ${e.message}`);
        return encryptedText;
    }
}

/* ==========================================================================
   DATABASE CONFIGURATION & INITIALIZATION (PostgreSQL & SQLite)
   ========================================================================== */

const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const usePostgres = !!postgresUrl;
let dbAdapter;

if (usePostgres) {
    const sslConfig = postgresUrl && 
                      !postgresUrl.includes('localhost') && 
                      !postgresUrl.includes('127.0.0.1')
        ? { rejectUnauthorized: false }
        : false;

    const pgPool = new Pool({
        connectionString: postgresUrl,
        ssl: sslConfig
    });

    dbAdapter = {
        isPostgres: true,
        query: (text, params) => pgPool.query(text, params),
        connect: () => pgPool.connect(),
        end: () => pgPool.end()
    };
} else if (process.env.VERCEL) {
    // Vercel serverless environment fallback when PostgreSQL is not yet connected
    writeLog('WARN', 'DATABASE_URL / POSTGRES_URL belum disetel di Vercel. Database berjalan dalam mode aman (non-crash).');
    dbAdapter = {
        isPostgres: false,
        query: async () => ({ rows: [] }),
        connect: async () => ({
            query: async () => ({ rows: [] }),
            release: () => {}
        }),
        end: async () => {}
    };
} else {
    // SQLite local fallback (for local offline development only)
    const sqlite3 = require('sqlite3').verbose();
    const sqliteDb = new sqlite3.Database(path.join(__dirname, 'wbs_database.db'));

    const sqliteQuery = (sql, params = []) => {
        // Replace PostgreSQL $1, $2 with SQLite ?
        const normalizedSql = sql.replace(/\$\d+/g, '?');
        return new Promise((resolve, reject) => {
            const isSelect = /^\s*select/i.test(normalizedSql);
            if (isSelect) {
                sqliteDb.all(normalizedSql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve({ rows });
                });
            } else {
                sqliteDb.run(normalizedSql, params, function(err) {
                    if (err) return reject(err);
                    resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                });
            }
        });
    };

    dbAdapter = {
        isPostgres: false,
        query: (text, params) => sqliteQuery(text, params),
        connect: async () => {
            return {
                query: (text, params) => sqliteQuery(text, params),
                release: () => {}
            };
        },
        end: () => {
            return new Promise((resolve, reject) => {
                sqliteDb.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    };
}

async function initDb() {
    if (process.env.VERCEL && !pool.isPostgres) {
        writeLog('SYSTEM', 'Aplikasi berjalan di Vercel tanpa database PostgreSQL. Harap sambungkan Vercel Postgres atau masukkan DATABASE_URL.');
        return;
    }
    const client = await pool.connect();
    try {
        const idType = pool.isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id ${idType},
                token VARCHAR(50) UNIQUE NOT NULL,
                date_submitted VARCHAR(50) NOT NULL,
                is_anonim INTEGER NOT NULL DEFAULT 1,
                category VARCHAR(100) NOT NULL,
                title VARCHAR(200) NOT NULL,
                incident_date VARCHAR(50),
                location VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                file_name VARCHAR(255),
                file_data TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'Diajukan',
                reporter_name VARCHAR(100),
                reporter_nik VARCHAR(50),
                reporter_email VARCHAR(100),
                reporter_hp VARCHAR(50)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS report_history (
                id ${idType},
                report_token VARCHAR(50) NOT NULL REFERENCES reports(token) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                note TEXT,
                date VARCHAR(50) NOT NULL,
                is_user_msg INTEGER NOT NULL DEFAULT 0,
                file_name VARCHAR(255),
                file_data TEXT
            );
        `);

        // Check and create indexes safely
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(token);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_history_token ON report_history(report_token);`);

        writeLog('SYSTEM', `${pool.isPostgres ? 'PostgreSQL' : 'SQLite'} database initialized successfully.`);
    } catch (err) {
        writeLog('ERROR', `Failed to initialize database: ${formatError(err)}`);
        throw err;
    } finally {
        client.release();
    }
}

/* ==========================================================================
   AUTO-MIGRATION: Import existing reports.json/reports_backup.json data to PostgreSQL
   ========================================================================== */

async function migrateFromJson() {
    if (!pool.isPostgres) return;
    
    let jsonPath = path.join(__dirname, 'reports.json');
    if (!fs.existsSync(jsonPath)) {
        jsonPath = path.join(__dirname, 'reports_backup.json');
    }
    
    if (!fs.existsSync(jsonPath)) return;
    
    try {
        const countRes = await pool.query('SELECT COUNT(*) as count FROM reports');
        const count = parseInt(countRes.rows[0].count, 10);
        if (count > 0) {
            writeLog('INFO', `Database already has ${count} reports. Skipping JSON migration.`);
            return;
        }
        
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const reports = JSON.parse(jsonData || '[]');
        if (reports.length === 0) return;
        
        writeLog('INFO', `Migrating ${reports.length} reports from ${path.basename(jsonPath)} to PostgreSQL...`);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const insertReportText = `
                INSERT INTO reports (token, date_submitted, is_anonim, category, title, incident_date, location, description, file_name, file_data, status, reporter_name, reporter_nik, reporter_email, reporter_hp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (token) DO NOTHING
            `;
            
            const insertHistoryText = `
                INSERT INTO report_history (report_token, status, note, date, is_user_msg, file_name, file_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            for (const report of reports) {
                await client.query(insertReportText, [
                    report.token,
                    report.dateSubmitted,
                    report.isAnonim ? 1 : 0,
                    report.category,
                    report.title,
                    report.incidentDate,
                    report.location,
                    report.description,
                    report.fileName || null,
                    report.fileData || null,
                    report.status || 'Diajukan',
                    report.reporterName || null,
                    report.reporterNik || null,
                    report.reporterEmail || null,
                    report.reporterHp || null
                ]);
                
                if (report.history && Array.isArray(report.history)) {
                    for (const hist of report.history) {
                        await client.query(insertHistoryText, [
                            report.token,
                            hist.status,
                            hist.note || null,
                            hist.date,
                            hist.isUserMsg ? 1 : 0,
                            hist.fileName || null,
                            hist.fileData || null
                        ]);
                    }
                }
            }
            
            await client.query('COMMIT');
            writeLog('INFO', `Successfully migrated ${reports.length} reports from JSON to PostgreSQL.`);
            
            // Rename reports.json if it exists to avoid running migration from it next time
            const oldJson = path.join(__dirname, 'reports.json');
            if (!process.env.VERCEL && fs.existsSync(oldJson)) {
                try {
                    fs.renameSync(oldJson, path.join(__dirname, 'reports_backup.json'));
                    writeLog('INFO', `Old reports.json renamed to reports_backup.json as backup.`);
                } catch (fsErr) {
                    writeLog('WARN', `Could not rename reports.json: ${fsErr.message}`);
                }
            }
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
    } catch (err) {
        writeLog('ERROR', `Failed to migrate from JSON to PostgreSQL: ${formatError(err)}`);
    }
}

// Database Startup & Serverless Readiness Helper
let isDbInitialized = false;
let dbInitPromise = null;

function ensureDbInit() {
    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            await initDb();
            await migrateFromJson();
            isDbInitialized = true;
        })();
    }
    return dbInitPromise;
}

// Database Startup IIFE
(async () => {
    try {
        await ensureDbInit();
    } catch (err) {
        writeLog('ERROR', `Database startup failed: ${formatError(err)}`);
    }
})();

// Serverless DB readiness middleware for /api/ routes
app.use('/api/', async (req, res, next) => {
    if (!isDbInitialized) {
        try {
            await ensureDbInit();
        } catch (err) {
            writeLog('ERROR', `Database not ready on ${req.method} ${req.url}: ${formatError(err)}`);
            return res.status(500).json({ success: false, message: 'Database initialization error' });
        }
    }
    next();
});

/* ==========================================================================
   DATABASE QUERY HELPERS
   ========================================================================== */

// Get a single report with its history (formatted as the frontend expects)
async function getReportByToken(token) {
    const reportRes = await pool.query('SELECT * FROM reports WHERE UPPER(token) = UPPER($1)', [token]);
    if (reportRes.rows.length === 0) return null;
    const report = reportRes.rows[0];
    
    const historyRes = await pool.query('SELECT * FROM report_history WHERE report_token = $1 ORDER BY id ASC', [report.token]);
    
    return {
        token: report.token,
        dateSubmitted: report.date_submitted,
        isAnonim: report.is_anonim === 1,
        category: report.category,
        title: report.title,
        incidentDate: report.incident_date,
        location: report.location,
        description: report.description,
        fileName: report.file_name,
        fileData: report.file_data,
        status: report.status,
        // Decrypt sensitive identity fields
        reporterName: decryptData(report.reporter_name),
        reporterNik: decryptData(report.reporter_nik),
        reporterEmail: decryptData(report.reporter_email),
        reporterHp: decryptData(report.reporter_hp),
        history: historyRes.rows.map(h => ({
            status: h.status,
            note: h.note,
            date: h.date,
            isUserMsg: h.is_user_msg === 1,
            fileName: h.file_name,
            fileData: h.file_data
        }))
    };
}

// Get all reports with their history
async function getAllReports() {
    const reportsRes = await pool.query('SELECT * FROM reports ORDER BY date_submitted DESC');
    const reports = reportsRes.rows;
    
    const result = [];
    for (const report of reports) {
        const historyRes = await pool.query('SELECT * FROM report_history WHERE report_token = $1 ORDER BY id ASC', [report.token]);
        result.push({
            token: report.token,
            dateSubmitted: report.date_submitted,
            isAnonim: report.is_anonim === 1,
            category: report.category,
            title: report.title,
            incidentDate: report.incident_date,
            location: report.location,
            description: report.description,
            fileName: report.file_name,
            fileData: report.file_data,
            status: report.status,
            // Decrypt sensitive identity fields
            reporterName: decryptData(report.reporter_name),
            reporterNik: decryptData(report.reporter_nik),
            reporterEmail: decryptData(report.reporter_email),
            reporterHp: decryptData(report.reporter_hp),
            history: historyRes.rows.map(h => ({
                status: h.status,
                note: h.note,
                date: h.date,
                isUserMsg: h.is_user_msg === 1,
                fileName: h.file_name,
                fileData: h.file_data
            }))
        });
    }
    return result;
}

/* ==========================================================================
   TELEGRAM INTEGRATION
   ========================================================================== */

function sendTelegramNotification(report) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const primaryChatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !primaryChatId) {
        writeLog('WARN', 'Telegram bot token or chat ID not configured. Skipping notification.');
        return;
    }
    
    writeLog('INFO', `Attempting Telegram notification to chat ID: ${primaryChatId} for token: ${report.token}`);
    
    const chatIds = [primaryChatId];
    
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return isoString;
        }
    };

    const text = `🔔 *PENGADUAN BARU WBS* 🔔\n` +
                 `--------------------------------------\n` +
                 `*Token:* \`${report.token}\`\n` +
                 `*Kategori:* ${report.category}\n` +
                 `*Judul:* ${report.title}\n` +
                 `*OPD/Lokasi:* ${report.location}\n` +
                 `*Tanggal Kejadian:* ${formatDate(report.incidentDate)}\n` +
                 `*Tipe Pelapor:* ${report.isAnonim ? 'Anonim (Dirahasiakan)' : 'Identitas Asli'}\n` +
                 `*Kronologi:* \n_${report.description.substring(0, 300)}${report.description.length > 300 ? '...' : ''}_\n` +
                 `--------------------------------------\n` +
                 `Silakan periksa di Dashboard Admin WBS Padang.`;

    const trySend = (index) => {
        if (index >= chatIds.length) {
            writeLog('ERROR', `Failed sending Telegram to all chat IDs. Please ensure the bot has been added to the target group.`);
            return;
        }
        
        const chatId = chatIds[index];
        const data = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    writeLog('WARN', `Telegram send failed for chat ID ${chatId} (status ${res.statusCode}): ${body}. Retrying next ID...`);
                    trySend(index + 1);
                } else {
                    writeLog('INFO', `Telegram notification sent successfully to chat ID ${chatId} for token: ${report.token}`);
                }
            });
        });

        req.on('error', (error) => {
            writeLog('ERROR', `Error sending Telegram message request: ${error.message}`);
            trySend(index + 1);
        });

        req.write(data);
        req.end();
    };

    trySend(0);
}

/* ==========================================================================
   INPUT VALIDATION
   ========================================================================== */

function validateReportInput(report) {
    // Check required fields
    if (!report.category || typeof report.category !== 'string' || report.category.trim() === '') return 'Kategori aduan wajib diisi';
    if (!report.title || typeof report.title !== 'string' || report.title.trim() === '') return 'Judul aduan wajib diisi';
    if (!report.incidentDate || typeof report.incidentDate !== 'string' || report.incidentDate === '') return 'Tanggal kejadian tidak valid';
    if (!report.location || typeof report.location !== 'string' || report.location.trim() === '') return 'Lokasi dinas/OPD wajib diisi';
    if (!report.description || typeof report.description !== 'string' || report.description.trim() === '') return 'Deskripsi aduan wajib diisi';
    
    // Length constraints (Cybersecurity input sanitation)
    if (report.title.length > 150) return 'Judul aduan terlalu panjang (maksimal 150 karakter)';
    if (report.location.length > 200) return 'Lokasi kejadian terlalu panjang (maksimal 200 karakter)';
    if (report.description.length > 5000) return 'Deskripsi kronologi terlalu panjang (maksimal 5000 karakter)';
    
    // File validation: Size and allowed extensions (.pdf, .jpg, .jpeg, .png, .mp4, .mov, .heic)
    if (report.fileName && report.fileName.trim() !== '') {
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'heic'];
        const ext = report.fileName.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return 'Format berkas tidak diizinkan. Hanya diperbolehkan: PDF, JPG, JPEG, PNG, MP4, MOV, HEIC.';
        }
        
        if (report.fileData) {
            // Validate base64 length against max 5MB (Base64 string length * 0.75 is actual bytes)
            const sizeInBytes = report.fileData.length * 0.75;
            const maxBytes = 5 * 1024 * 1024;
            if (sizeInBytes > maxBytes) {
                return 'Ukuran berkas melebihi batas maksimal 5MB';
            }
        }
    }
    
    // Non-anonymous reporter details validation
    if (!report.isAnonim) {
        if (!report.reporterName || report.reporterName.trim() === '') return 'Nama pelapor wajib diisi';
        if (!report.reporterNik || !/^\d{16}$/.test(report.reporterNik)) return 'NIK pelapor tidak valid (harus 16 digit angka)';
        if (!report.reporterEmail || !/^\S+@\S+\.\S+$/.test(report.reporterEmail)) return 'Email pelapor tidak valid';
        if (!report.reporterHp || report.reporterHp.length < 9) return 'Nomor handphone tidak valid';
    }
    
    return null;
}

/* ==========================================================================
   ACCESS CONTROL & SESSION VERIFICATION
   Supports both in-memory map and HMAC-signed tokens for serverless resilience
   ========================================================================== */

function verifyToken(token) {
    if (!token) return null;
    
    // Check HMAC-signed token (resilient across serverless instances)
    if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length === 2) {
            const [payloadB64, signature] = parts;
            const secret = process.env.SESSION_SECRET || 'wbs-padang-default-secret-key-change-in-env';
            const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
            
            if (signature.length === expectedSig.length && 
                crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
                try {
                    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
                    const now = Date.now();
                    if (now - payload.t <= SESSION_DURATION_MS) {
                        return { username: payload.u, createdAt: payload.t };
                    }
                } catch (e) {
                    // Invalid payload
                }
            }
        }
    }
    
    // Fallback: check in-memory Map
    const session = activeSessions.get(token);
    if (session) {
        const now = Date.now();
        if (now - session.createdAt <= SESSION_DURATION_MS) {
            return session;
        } else {
            activeSessions.delete(token);
        }
    }
    return null;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
    
    if (!token) {
        writeLog('WARN', `Access denied: Token missing on ${req.method} ${req.url} from ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Akses ditolak: Token tidak ditemukan' });
    }
    
    const session = verifyToken(token);
    if (!session) {
        writeLog('WARN', `Access denied: Invalid session token used on ${req.method} ${req.url}`);
        return res.status(403).json({ success: false, message: 'Akses ditolak: Sesi tidak valid atau sudah berakhir' });
    }
    
    req.adminUser = session.username;
    next();
}

/* ==========================================================================
   PUBLIC API ENDPOINTS
   ========================================================================== */

// PUBLIC API: Health check & diagnostics (for Railway deployment verification)
app.get('/api/health', async (req, res) => {
    try {
        const reportCountRes = await pool.query('SELECT COUNT(*) as count FROM reports');
        const count = parseInt(reportCountRes.rows[0].count, 10);
        res.json({
            status: 'OK',
            database: `${pool.isPostgres ? 'PostgreSQL' : 'SQLite'} connected`,
            reports: count,
            telegram: {
                botToken: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured',
                chatId: process.env.TELEGRAM_CHAT_ID ? 'configured' : 'not configured'
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                port: PORT
            }
        });
    } catch (err) {
        writeLog('ERROR', `Health check failed: ${formatError(err)}`);
        res.status(500).json({ status: 'ERROR', database: `${pool.isPostgres ? 'PostgreSQL' : 'SQLite'} connection failed`, message: formatError(err) });
    }
});

// PUBLIC API: Get report statistics for home landing page
app.get('/api/reports/stats', async (req, res) => {
    try {
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('Diverifikasi', 'Diajukan') THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Ditindaklanjuti' THEN 1 ELSE 0 END) as process,
                SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as resolved
            FROM reports
        `);
        const stats = statsRes.rows[0];
        
        res.json({
            success: true,
            total: parseInt(stats.total || 0, 10),
            pending: parseInt(stats.pending || 0, 10),
            process: parseInt(stats.process || 0, 10),
            resolved: parseInt(stats.resolved || 0, 10)
        });
    } catch (err) {
        writeLog('ERROR', `Error in GET /api/reports/stats: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// PUBLIC API: Submit new complaint
app.post('/api/reports', async (req, res) => {
    try {
        const report = req.body;
        
        // Input Validation
        const validationError = validateReportInput(report);
        if (validationError) {
            writeLog('WARN', `Report validation failed: ${validationError}`);
            return res.status(400).json({ success: false, message: validationError });
        }
        
        // Check for token duplicates
        const existingRes = await pool.query('SELECT token FROM reports WHERE token = $1', [report.token]);
        if (existingRes.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Token aduan duplikat' });
        }
        
        // Insert report and history in a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            await client.query(`
                INSERT INTO reports (token, date_submitted, is_anonim, category, title, incident_date, location, description, file_name, file_data, status, reporter_name, reporter_nik, reporter_email, reporter_hp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
                report.token,
                report.dateSubmitted,
                report.isAnonim ? 1 : 0,
                report.category,
                report.title,
                report.incidentDate,
                report.location,
                report.description,
                report.fileName || null,
                report.fileData || null,
                'Diajukan',
                // Encrypt sensitive identity fields before storing
                report.isAnonim ? null : encryptData(report.reporterName || null),
                report.isAnonim ? null : encryptData(report.reporterNik || null),
                report.isAnonim ? null : encryptData(report.reporterEmail || null),
                report.isAnonim ? null : encryptData(report.reporterHp || null)
            ]);
            
            // Insert initial history entry
            if (report.history && report.history.length > 0) {
                const h = report.history[0];
                await client.query(`
                    INSERT INTO report_history (report_token, status, note, date, is_user_msg)
                    VALUES ($1, $2, $3, $4, $5)
                `, [report.token, h.status, h.note, h.date, 0]);
            }
            
            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
        
        writeLog('INFO', `New report registered: ${report.token} (${report.isAnonim ? 'Anonim' : 'Identitas Asli'})`);
        
        // Securely notify Telegram from backend
        sendTelegramNotification(report);
        
        res.status(201).json({ success: true, message: 'Pengaduan berhasil dikirim' });
        
    } catch (err) {
        writeLog('ERROR', `Error in POST /api/reports: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// PUBLIC API: Track report (Secure Data Protection)
app.get('/api/reports/track/:token', async (req, res) => {
    try {
        const token = req.params.token.toUpperCase();
        const report = await getReportByToken(token);
        
        if (!report) {
            writeLog('INFO', `Tracking failed: Token not found: ${token}`);
            return res.status(404).json({ success: false, message: 'Token aduan tidak ditemukan' });
        }
        
        // Data Protection: Never leak whistleblower's sensitive information on public endpoint
        const secureReport = {
            token: report.token,
            dateSubmitted: report.dateSubmitted,
            isAnonim: report.isAnonim,
            category: report.category,
            title: report.title,
            incidentDate: report.incidentDate,
            location: report.location,
            description: report.description,
            fileName: report.fileName,
            fileData: report.fileData,
            status: report.status,
            history: report.history,
            // Masked identity variables
            reporterName: report.isAnonim ? 'Anonim' : 'Pelapor (Identitas Dilindungi)',
            reporterNik: '-',
            reporterEmail: '-',
            reporterHp: '-'
        };
        
        res.json({ success: true, report: secureReport });
    } catch (err) {
        writeLog('ERROR', `Error in GET /api/reports/track: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// PUBLIC API: Whistleblower submits comment
app.post('/api/reports/comment', async (req, res) => {
    try {
        const { token, note, date, isUserMsg } = req.body;
        
        if (!token || !note || note.trim() === '') {
            return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
        }
        
        // Check if report exists
        const reportRes = await pool.query('SELECT token, status FROM reports WHERE token = $1', [token]);
        if (reportRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Token tidak ditemukan' });
        }
        const report = reportRes.rows[0];
        
        await pool.query(`
            INSERT INTO report_history (report_token, status, note, date, is_user_msg)
            VALUES ($1, $2, $3, $4, $5)
        `, [token, report.status, note, date, isUserMsg ? 1 : 0]);
        
        writeLog('INFO', `Whistleblower comment added to report: ${token}`);
        res.json({ success: true });
        
    } catch (err) {
        writeLog('ERROR', `Error in POST /api/reports/comment: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

/* ==========================================================================
   SECURE ADMIN API ENDPOINTS
   ========================================================================== */

// SECURE API: Check username (Step 1 of 2-step login — verify username before allowing password input)
app.post('/api/check-username', loginLimiter, (req, res) => {
    const { username } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    
    if (!username || typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ success: false, message: 'Username tidak boleh kosong' });
    }
    
    if (!adminUser) {
        return res.status(500).json({ success: false, message: 'Admin belum dikonfigurasi' });
    }
    
    // Compare username (case-insensitive for usability)
    const isValid = username.trim().toLowerCase() === adminUser.toLowerCase();
    if (isValid) {
        writeLog('INFO', `Username check passed for: "${username.trim()}" from IP: ${req.ip}`);
        return res.json({ success: true, message: 'Username valid. Silakan masukkan password.' });
    } else {
        writeLog('WARN', `Username check failed: "${username.trim()}" from IP: ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Username tidak ditemukan.' });
    }
});

// SECURE API: Admin Login (Step 2 — password verification with bcrypt + lockout)
app.post('/api/login', loginLimiter, async (req, res) => {
    const clientIp = req.ip;
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 50) {
        return res.status(400).json({ success: false, message: 'Password harus antara 6-50 karakter' });
    }
    
    // Brute-force lockout check
    const attemptData = loginAttempts.get(clientIp) || { count: 0, lockedUntil: null };
    if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
        const remainingMinutes = Math.ceil((attemptData.lockedUntil - Date.now()) / 60000);
        writeLog('WARN', `Blocked login attempt from locked IP: ${clientIp}. Remaining lockout: ${remainingMinutes} minutes.`);
        return res.status(429).json({ 
            success: false, 
            message: `Terlalu banyak percobaan gagal. Akun terkunci ${remainingMinutes} menit lagi.` 
        });
    }
    
    // Server-Side Authentication using environment variables
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;     // plaintext in .env
    const adminPassHash = process.env.ADMIN_PASSWORD_HASH; // bcrypt hash (preferred)
    
    if (!adminUser || (!adminPass && !adminPassHash)) {
        writeLog('ERROR', 'Admin credentials are not configured in environment variables');
        return res.status(500).json({ success: false, message: 'Autentikasi admin belum dikonfigurasi di server' });
    }
    
    // Compare username first
    if (username.trim().toLowerCase() !== adminUser.toLowerCase()) {
        writeLog('WARN', `Failed admin login: wrong username "${username}" from IP: ${clientIp}`);
        return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
    }
    
    // Compare password — prefer bcrypt hash, fallback to plaintext for backward compatibility
    let passwordMatch = false;
    if (adminPassHash) {
        // Bcrypt comparison (recommended — asesmen requirement: algoritma enkripsi kuat)
        passwordMatch = await bcrypt.compare(password, adminPassHash);
    } else {
        // Fallback: plaintext comparison (legacy, still supported)
        passwordMatch = (password === adminPass);
    }
    
    if (passwordMatch) {
        // Reset failed attempts on successful login
        loginAttempts.delete(clientIp);
        
        // Generate secure cryptographically random + HMAC-signed session token (works on serverless & local)
        const secret = process.env.SESSION_SECRET || 'wbs-padang-default-secret-key-change-in-env';
        const payloadObj = {
            u: adminUser,
            t: Date.now(),
            r: crypto.randomBytes(16).toString('hex')
        };
        const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
        const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        const token = `${payloadB64}.${signature}`;
        
        activeSessions.set(token, {
            createdAt: payloadObj.t,
            username: adminUser,
            ipAddress: clientIp
        });
        
        // Invalidate all old sessions (force single session per admin)
        // NOTE: for multi-admin, remove this block
        for (const [existingToken, sessionData] of activeSessions.entries()) {
            if (existingToken !== token && sessionData.username === adminUser) {
                activeSessions.delete(existingToken);
            }
        }
        
        writeLog('INFO', `Admin login successful from IP: ${clientIp}. Session token generated.`);
        res.json({ success: true, token: token, expiresIn: SESSION_DURATION_MS / 1000 });
    } else {
        // Increment failed attempt counter
        attemptData.count = (attemptData.count || 0) + 1;
        if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
            attemptData.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            writeLog('WARN', `IP ${clientIp} locked out after ${MAX_LOGIN_ATTEMPTS} failed login attempts.`);
        }
        loginAttempts.set(clientIp, attemptData);
        
        const remaining = MAX_LOGIN_ATTEMPTS - attemptData.count;
        const message = remaining > 0 
            ? `Username atau Password salah! Sisa percobaan: ${remaining}` 
            : 'Terlalu banyak percobaan gagal. Akun terkunci 15 menit.';
        
        writeLog('WARN', `Failed admin login attempt #${attemptData.count} from IP: ${clientIp}`);
        res.status(401).json({ success: false, message });
    }
});

// SECURE API: Admin Password Change
app.post('/api/admin/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validation — password policy: 6-50 chars and complexity
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
        }
        if (newPassword.length < 6 || newPassword.length > 50) {
            return res.status(400).json({ success: false, message: 'Password baru harus antara 6-50 karakter' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\[\]{}|\\:";'<>?,.\/~`-])[A-Za-z\d@$!%*?&#^()_+=\[\]{}|\\:";'<>?,.\/~`-]{6,50}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password baru harus mengandung minimal 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 karakter spesial' 
            });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama' });
        }
        
        // Verify current password
        const adminPass = process.env.ADMIN_PASSWORD;
        const adminPassHash = process.env.ADMIN_PASSWORD_HASH;
        
        let currentPasswordValid = false;
        if (adminPassHash) {
            currentPasswordValid = await bcrypt.compare(currentPassword, adminPassHash);
        } else {
            currentPasswordValid = (currentPassword === adminPass);
        }
        
        if (!currentPasswordValid) {
            writeLog('WARN', 'Admin password change failed: current password incorrect');
            return res.status(401).json({ success: false, message: 'Password lama tidak sesuai' });
        }
        
        // Hash new password with bcrypt (cost factor 12)
        const newHash = await bcrypt.hash(newPassword, 12);
        
        // Write new hash to .env file if running locally
        const envPath = path.join(__dirname, '.env');
        if (!process.env.VERCEL && fs.existsSync(envPath)) {
            try {
                let envContent = fs.readFileSync(envPath, 'utf8');
                // Update or add ADMIN_PASSWORD_HASH
                if (envContent.includes('ADMIN_PASSWORD_HASH=')) {
                    envContent = envContent.replace(/ADMIN_PASSWORD_HASH=.*/g, `ADMIN_PASSWORD_HASH=${newHash}`);
                } else {
                    envContent += `\nADMIN_PASSWORD_HASH=${newHash}\n`;
                }
                fs.writeFileSync(envPath, envContent);
            } catch (fsErr) {
                writeLog('WARN', `Could not update .env file: ${fsErr.message}`);
            }
        }
        process.env.ADMIN_PASSWORD_HASH = newHash;
        
        // Invalidate all existing sessions (force re-login after password change)
        activeSessions.clear();
        
        writeLog('INFO', 'Admin password changed successfully. All sessions invalidated.');
        res.json({ success: true, message: 'Password berhasil diubah. Silakan login kembali.' });
        
    } catch (err) {
        writeLog('ERROR', `Error in POST /api/admin/change-password: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// SECURE API: Admin logout (invalidates specific session token)
app.post('/api/admin/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        activeSessions.delete(token);
    }
    writeLog('INFO', `Admin logout successful from IP: ${req.ip}`);
    res.json({ success: true });
});

// SECURE API: Session status check
app.get('/api/admin/session-status', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const session = verifyToken(token);
    
    if (session) {
        const elapsed = Date.now() - session.createdAt;
        const remainingMs = SESSION_DURATION_MS - elapsed;
        res.json({
            success: true,
            username: session.username,
            loginTime: new Date(session.createdAt).toISOString(),
            expiresInSeconds: Math.max(0, Math.floor(remainingMs / 1000))
        });
    } else {
        res.status(401).json({ success: false, message: 'Sesi tidak ditemukan' });
    }
});

// SECURE API: Get all reports (Requires session token validation)
app.get('/api/admin/reports', authenticateToken, async (req, res) => {
    try {
        const reports = await getAllReports();
        res.json({ success: true, reports: reports });
    } catch (err) {
        writeLog('ERROR', `Error in GET /api/admin/reports: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// SECURE API: Admin update status (Requires session token validation with optional file attachment)
app.post('/api/admin/reports/update-status', authenticateToken, async (req, res) => {
    try {
        const { token, status, note, date, fileName, fileData } = req.body;
        
        if (!token || !status || !note) {
            return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
        }
        
        // Attachment validation if present
        if (fileName && fileName.trim() !== '') {
            const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'heic'];
            const ext = fileName.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                return res.status(400).json({ success: false, message: 'Format berkas tanggapan tidak diizinkan. Hanya diperbolehkan: PDF, JPG, JPEG, PNG, MP4, MOV, HEIC.' });
            }
            if (fileData) {
                const sizeInBytes = fileData.length * 0.75;
                const maxBytes = 5 * 1024 * 1024;
                if (sizeInBytes > maxBytes) {
                    return res.status(400).json({ success: false, message: 'Ukuran berkas tanggapan melebihi batas maksimal 5MB' });
                }
            }
        }
        
        // Check if report exists
        const reportRes = await pool.query('SELECT token FROM reports WHERE token = $1', [token]);
        if (reportRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengaduan tidak ditemukan' });
        }
        
        // Update status and add history entry in a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            await client.query('UPDATE reports SET status = $1 WHERE token = $2', [status, token]);
            
            await client.query(`
                INSERT INTO report_history (report_token, status, note, date, is_user_msg, file_name, file_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [token, status, note, date, 0, fileName || null, fileData || null]);
            
            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
        
        writeLog('INFO', `Admin updated status of report ${token} to ${status}${fileName ? ' with attachment: ' + fileName : ''}`);
        res.json({ success: true });
        
    } catch (err) {
        writeLog('ERROR', `Error in POST /api/admin/reports/update-status: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// SECURE API: Admin resets database (Requires session token validation)
app.post('/api/admin/reports/reset', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM report_history');
            await client.query('DELETE FROM reports');
            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }
        
        writeLog('INFO', 'Database was cleared/reset by Admin.');
        res.json({ success: true });
        
    } catch (err) {
        writeLog('ERROR', `Error in POST /api/admin/reports/reset: ${err.message}`);
        res.status(500).json({ success: false, message: 'Kesalahan internal server' });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Custom Error Handlers (prevent leaking technical info)
app.use((req, res) => {
    writeLog('WARN', `404 Not Found: ${req.method} ${req.url} from IP: ${req.ip}`);
    res.status(404).json({ success: false, message: 'Halaman atau sumber daya tidak ditemukan (404)' });
});

app.use((err, req, res, next) => {
    writeLog('ERROR', `Unhandled server error on ${req.method} ${req.url}: ${err.message}`);
    // Do NOT expose stack trace or internal error details to client
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server. Silakan hubungi administrator.' });
});

// Periodic cleanup of expired sessions and login attempt records
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    let expiredSessions = 0;
    for (const [token, session] of activeSessions.entries()) {
        if (now - session.createdAt > SESSION_DURATION_MS) {
            activeSessions.delete(token);
            expiredSessions++;
        }
    }
    if (expiredSessions > 0) {
        writeLog('INFO', `Session cleanup: removed ${expiredSessions} expired session(s).`);
    }
    
    // Clean up old login attempt records
    for (const [ip, data] of loginAttempts.entries()) {
        if (!data.lockedUntil || now > data.lockedUntil + LOCKOUT_DURATION_MS) {
            loginAttempts.delete(ip);
        }
    }
}, 30 * 60 * 1000); // Run every 30 minutes
if (cleanupTimer.unref) cleanupTimer.unref();

// Graceful shutdown: close database connection
process.on('SIGINT', async () => {
    writeLog('SYSTEM', 'Server shutting down, closing database...');
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    writeLog('SYSTEM', 'Server shutting down, closing database...');
    await pool.end();
    process.exit(0);
});

// Start the server (when not running in Vercel serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        writeLog('SYSTEM', `WBS Inspektorat Padang server is listening on port ${PORT} (${pool.isPostgres ? 'PostgreSQL' : 'SQLite'} database)`);
    });
}

module.exports = app;
