import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

type LogEntry = {
  id: number;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  payload?: unknown;
  createdAt: string;
  user?: {
    id: number;
    email: string;
  } | null;
};

const NO_USER_KEY = '__no_user__';

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<LogEntry[]>('/api/logs', { params: { take: 100 } });
      setLogs(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        'Não foi possível carregar os logs.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort();
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const result = new Map<string, string>();
    logs.forEach((log) => {
      const key = log.user?.email ?? NO_USER_KEY;
      const label = log.user?.email ?? 'Sem usuário';
      if (!result.has(key)) {
        result.set(key, label);
      }
    });
    return Array.from(result.entries());
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (userFilter) {
        if (userFilter === NO_USER_KEY) {
          if (log.user) return false;
        } else if (log.user?.email !== userFilter) {
          return false;
        }
      }
      if (dateFilter) {
        const logDate = log.createdAt.slice(0, 10);
        if (logDate !== dateFilter) return false;
      }
      return true;
    });
  }, [logs, actionFilter, userFilter, dateFilter]);

  const clearFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setDateFilter('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Logs</h2>
        <button
          onClick={loadLogs}
          disabled={loading}
          style={{
            background: '#0ea5e9',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Atualizando...' : 'Recarregar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Ação</span>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Todas</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Usuário</span>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">Todos</option>
            {uniqueUsers.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Data</span>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>

        {(actionFilter || userFilter || dateFilter) && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              alignSelf: 'end',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5f5',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading && logs.length === 0 ? (
        <p>Carregando logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p>Nenhum log encontrado com os filtros atuais.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f1f5f9' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Ação</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Usuário</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Horário</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{log.action}</td>
                  <td style={{ padding: '10px 12px' }}>{log.user?.email ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{formatDateTime(log.createdAt)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {log.entity ? (
                        <span>
                          {log.entity}
                          {log.entityId ? ` #${log.entityId}` : ''}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                      {log.payload !== undefined && log.payload !== null && (
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#e2e8f0',
                            margin: 0,
                            padding: 8,
                            borderRadius: 6,
                            maxHeight: 140,
                            overflow: 'auto',
                            fontSize: 12,
                          }}
                        >
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
