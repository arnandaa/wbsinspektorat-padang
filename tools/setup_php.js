const fs = require('fs');
const path = require('path');

const phpDir = 'C:\\Users\\ROG\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe';
const iniPath = path.join(phpDir, 'php.ini');
const devIni = path.join(phpDir, 'php.ini-development');

let content = fs.readFileSync(fs.existsSync(iniPath) ? iniPath : devIni, 'utf8');
content = content.replace(';extension_dir = "ext"', 'extension_dir = "ext"');

const exts = ['curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_pgsql', 'pgsql', 'pdo_sqlite', 'sqlite3', 'gd', 'zip'];
exts.forEach(e => {
  content = content.replace(';extension=' + e, 'extension=' + e);
});

fs.writeFileSync(iniPath, content, 'utf8');
console.log('php.ini configured successfully!');
