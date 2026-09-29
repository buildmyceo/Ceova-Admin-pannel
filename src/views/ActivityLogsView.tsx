import React, { useState } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { 
  FileText, 
  Clock, 
  User, 
  ShieldCheck, 
  Crown, 
  CheckCircle,
  Filter
} from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs } = usePortalData();
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>System Audit Trail & Security Logs</h2>
            <span className="badge badge-role-admin">Compliance</span>
          </div>
          <p>Real-time security and administration events across member roles, task delegations, and announcements.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="select-field"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="all">All Event Types</option>
          <option value="ROLE">Role & Access Changes</option>
          <option value="TASK">Task Delegations</option>
          <option value="ANNOUNCEMENT">Announcements</option>
          <option value="MEMBER">Member Additions & Deletions</option>
          <option value="REQUEST">Requests Resolved</option>
        </select>
      </div>

      <div className="table-container">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action Category</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ color: 'var(--text-subtle)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  • {new Date(log.timestamp).toLocaleDateString()}
                </td>

                <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {log.user_name}
                </td>

                <td>
                  <span 
                    className="tag-badge"
                    style={{
                      background: log.role === 'admin' ? 'var(--role-admin-bg)' : log.role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                      color: log.role === 'admin' ? 'var(--role-admin)' : log.role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                      textTransform: 'uppercase',
                      fontSize: 10
                    }}
                  >
                    {log.role}
                  </span>
                </td>

                <td>
                  <span className="brand-pill" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {log.action}
                  </span>
                </td>

                <td style={{ color: 'var(--text-muted)' }}>
                  {log.details}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-subtle)' }}>
                  No log entries recorded matching this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
