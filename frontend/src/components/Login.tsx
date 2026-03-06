import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs block mb-1">Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-2 py-2" />
        </div>
        <div>
          <label className="text-xs block mb-1">Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-2 py-2" />
        </div>
        {error && <div className="text-destructive text-sm">{error}</div>}
          {/* Demo credentials box removed per request */}
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Entrar</button>
          </div>
      </form>
    </div>
  );
}
