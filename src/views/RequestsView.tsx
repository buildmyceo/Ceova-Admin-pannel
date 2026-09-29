import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  MessageSquareQuote, 
  Plus, 
  Check, 
  X, 
  Clock, 
  User, 
  Filter 
} from 'lucide-react';

interface RequestsViewProps {
  onOpenSubmit: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ onOpenSubmit }) => {
  const { user, role } = useAuth();
  const { requests, resolveRequest } = usePortalData();

  const [statusFilter, setStatusFilter] = useState('all');

  const canReview = role === 'admin' || role === 'head';

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    // If regular member, optionally view own or all
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Member Requests & Helpdesk</h2>
          <p>Submit operational inquiries, time-off requests, hardware needs, or 1-on-1 mentorship sessions.</p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenSubmit}>
            <Plus size={15} />
            Submit New Request
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <select
          className="select-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Request Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredRequests.map((req) => (
          <div key={req.id} className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="brand-pill" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: 10 }}>
                  {req.type}
                </span>

                <span 
                  className="tag-badge"
                  style={{
                    background: req.status === 'approved' ? 'var(--success-bg)' : req.status === 'rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    color: req.status === 'approved' ? 'var(--success)' : req.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                    textTransform: 'uppercase',
                    fontSize: 10
                  }}
                >
                  {req.status}
                </span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                {new Date(req.created_at).toLocaleDateString()}
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
              {req.subject}
            </h3>

            {req.description && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                {req.description}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
                <User size={13} />
                <span>Requested by <strong style={{ color: 'var(--text-main)' }}>{req.user_name}</strong> ({req.user_email})</span>
              </div>

              {canReview && req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                    onClick={() => resolveRequest(req.id, 'approved')}
                  >
                    <Check size={13} /> Approve
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => resolveRequest(req.id, 'rejected')}
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}

              {req.reviewed_by && (
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                  Reviewed by: <strong>{req.reviewed_by}</strong>
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No requests found in this category.
          </div>
        )}
      </div>
    </div>
  );
};
