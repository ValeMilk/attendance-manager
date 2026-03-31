import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/login-users`)
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0059A0] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/15" />
          <div className="absolute top-1/3 right-10 w-48 h-48 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 text-center px-12">
          <img src="/logo-valemilk.png" alt="ValeMilk" className="w-72 mx-auto mb-8 drop-shadow-2xl" />
          <p className="text-white/80 text-lg font-light tracking-wide">
            Sistema de Apontamento de Presença
          </p>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo-valemilk.png" alt="ValeMilk" className="w-40" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bem-vindo</h1>
            <p className="text-gray-500 mt-1 text-sm">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Usuário
              </label>
              <div className="relative">
                <select
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm text-gray-900 appearance-none transition-all duration-200 focus:outline-none focus:border-[#0059A0] focus:bg-white focus:ring-4 focus:ring-[#0059A0]/10 disabled:opacity-50"
                >
                  <option value="">Selecione o usuário</option>
                  {users.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-12 pl-4 pr-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:border-[#0059A0] focus:bg-white focus:ring-4 focus:ring-[#0059A0]/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username}
              className="w-full h-12 bg-[#0059A0] hover:bg-[#004A85] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0059A0]/25 hover:shadow-xl hover:shadow-[#0059A0]/30 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-10">
            © 2026 ValeMilk — Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
