import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UserItem { id: string; username: string; role: string }

export function UserManagement() {
  const { accessToken, register } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('supervisor');
  const [error, setError] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users', { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' } });
      if (!res.ok) throw new Error('Falha ao buscar usuários');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro');
    }
  }

  useEffect(() => { fetchUsers(); }, [accessToken]);

  const handleCreate = async () => {
    setError(null);
    try {
      await register({ username, password, role });
      setUsername(''); setPassword(''); setRole('supervisor');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar');
    }
  };

  return (
    <div className="mt-6 border border-border rounded p-4 bg-card">
      <h3 className="font-semibold mb-3">Gerenciamento de Usuários</h3>
      {error && <div className="text-destructive mb-2">{error}</div>}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} className="border px-2 py-1 rounded" />
        <input placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={role} onChange={e => setRole(e.target.value)} className="border px-2 py-1 rounded">
          <option value="admin">admin</option>
          <option value="supervisor">supervisor</option>
          <option value="expectador">expectador</option>
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={handleCreate} className="px-3 py-1 bg-primary text-white rounded">Criar</button>
        <button onClick={fetchUsers} className="px-3 py-1 border rounded">Atualizar</button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="px-2 py-1 text-left">Usuário</th>
            <th className="px-2 py-1 text-left">Papel</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="px-2 py-1">{u.username}</td>
              <td className="px-2 py-1">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
