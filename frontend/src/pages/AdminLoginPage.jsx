import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('adminpass');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(result.message || 'Login gagal. Periksa kembali username dan password.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <Card className="max-w-md w-full shadow-sm border border-slate-200">
        
        {/* Header Card */}
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="w-12 h-12 rounded-md bg-[#0B192C] flex items-center justify-center mx-auto shadow-xs border border-slate-700">
            <img 
              src="/logo_padang.svg" 
              alt="Kota Padang" 
              className="w-8 h-8 object-contain" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <CardTitle className="text-xl font-bold font-heading text-slate-900 pt-1">
            Login Petugas WBS
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Inspektorat Daerah Pemerintah Kota Padang
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-slate-700">
                Username Petugas
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-9 text-sm rounded-md border-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Kata Sandi (Password)
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 text-sm rounded-md border-slate-300"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 font-semibold bg-[#0B192C] hover:bg-slate-800 text-white rounded-md h-10 transition-colors"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 leading-relaxed mx-auto">
            Halaman ini khusus untuk verifikator dan auditor Inspektorat Daerah Kota Padang. Akses tidak sah akan dicatat pada sistem pengawasan log.
          </p>
        </CardFooter>

      </Card>
    </div>
  );
}
