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
    return new Date(iso).toLocaleString('en-US', {
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
        'Could not load logs.';
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
      const label = log.user?.email ?? 'No user';
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
      <div className="logs-header">
        <h2 style={{ margin: 0 }}>Logs</h2>
        <button className="primary-button" onClick={loadLogs} disabled={loading}>
          {loading ? 'Refreshing...' : 'Reload'}
        </button>
      </div>

      <div className="logs-filters">
        <label>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Action</span>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>User</span>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">All</option>
            {uniqueUsers.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Date</span>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>

        {(actionFilter || userFilter || dateFilter) && (
          <button type="button" className="secondary-button" onClick={clearFilters} style={{ alignSelf: 'end' }}>
            Clear filters
          </button>
        )}
      </div>

      {loading && logs.length === 0 ? (
        <p>Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p>No logs found for the current filters.</p>
      ) : (
        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace' }}>{log.action}</td>
                  <td>{log.user?.email ?? '—'}</td>
                  <td>{formatDateTime(log.createdAt)}</td>
                  <td>
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
                            background: 'var(--color-sidebar-bg)',
                            color: 'var(--color-sidebar-text)',
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
