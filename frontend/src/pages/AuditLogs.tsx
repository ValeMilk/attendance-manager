import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuditLogItem {
  _id: string;
  action: string;
  userName: string;
  userRole: string;
  targetType: string;
  description: string;
  details: Record<string, any>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  attendance_update: 'Presença',
  justification_create: 'Justificativa (nova)',
  justification_update: 'Justificativa (edição)',
  justification_delete: 'Justificativa (exclusão)',
  period_unlock: 'Período desbloqueado',
  period_lock: 'Período bloqueado',
};

const ACTION_COLORS: Record<string, string> = {
  attendance_update: 'bg-blue-100 text-blue-800',
  justification_create: 'bg-green-100 text-green-800',
  justification_update: 'bg-yellow-100 text-yellow-800',
  justification_delete: 'bg-red-100 text-red-800',
  period_unlock: 'bg-purple-100 text-purple-800',
  period_lock: 'bg-orange-100 text-orange-800',
};

export default function AuditLogs() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [accessToken, page, filterAction, filterStartDate, filterEndDate]);

  async function fetchLogs() {
    if (!accessToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (filterAction) params.set('action', filterAction);
      if (filterStartDate) params.set('startDate', filterStartDate);
      if (filterEndDate) params.set('endDate', filterEndDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Falha ao buscar logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function renderDetails(log: AuditLogItem) {
    const d = log.details || {};
    if (log.action === 'attendance_update') {
      const parts: string[] = [];
      if (d.apontador) parts.push(`Apontador: ${d.apontador}`);
      if (d.supervisor) parts.push(`Supervisor: ${d.supervisor}`);
      return parts.join(' | ') || '-';
    }
    if (log.action.startsWith('justification_')) {
      if (d.deletedText) return `Texto excluído: "${d.deletedText}"`;
      const parts: string[] = [];
      if (d.text) parts.push(`"${d.text}"`);
      if (d.previousText) parts.push(`(anterior: "${d.previousText}")`);
      return parts.join(' ') || '-';
    }
    if (log.action.startsWith('period_')) {
      return d.months ? `Meses: ${d.months.join(', ')}` : '-';
    }
    return '-';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 Registro de Alterações</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            ← Voltar
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="attendance_update">Presença</option>
              <option value="justification_create">Justificativa (nova)</option>
              <option value="justification_update">Justificativa (edição)</option>
              <option value="justification_delete">Justificativa (exclusão)</option>
              <option value="period_unlock">Período desbloqueado</option>
              <option value="period_lock">Período bloqueado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => { setFilterAction(''); setFilterStartDate(''); setFilterEndDate(''); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpar filtros
          </button>
          <span className="text-sm text-gray-500 ml-auto">{total} registro(s)</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum registro encontrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Data/Hora</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Usuário</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Descrição</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.userName}</div>
                      <div className="text-xs text-gray-400">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={renderDetails(log)}>
                      {renderDetails(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
