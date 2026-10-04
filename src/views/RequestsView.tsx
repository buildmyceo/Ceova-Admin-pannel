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
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface RequestsViewProps {
  onOpenSubmit: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ onOpenSubmit }) => {
  const { user, isCSuite } = useAuth();
  const { requests, resolveRequest } = usePortalData();

  const [statusFilter, setStatusFilter] = useState('all');

  const canReview = isCSuite;

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">PETITIONES ET AUXILIUM • HELPDESK & RESOLUTION</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Member Requests & Helpdesk
          </h2>
          <p className="view-subtitle">
            Operational inquiries, hardware requisitions, time-off requests, and 1-on-1 mentorship sessions.
          </p>
        </div>

        <div className="view-actions-row">
          <button type="button" className="neu-pill-btn primary" onClick={onOpenSubmit}>
            <Plus size={14} />
            <span>Submit Request</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Bento Card */}
      <div className="bento-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} style={{ color: 'var(--neo-gold)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Filter Status:</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                className={`neu-pill-btn ${statusFilter === st ? 'primary' : ''}`}
                style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'all' ? 'All Requests' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List in Bento Grid style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredRequests.map((req) => (
          <div key={req.id} className="bento-card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge-gold" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em' }}>
                  {req.type}
                </span>

                <span 
                  className={`status-pill status-${req.status === 'approved' ? 'completed' : req.status === 'rejected' ? 'blocked' : 'in_progress'}`}
                  style={{ textTransform: 'uppercase', fontSize: 10 }}
                >
                  {req.status}
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} />
                {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              {req.subject}
            </h3>

            {req.description && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                {req.description}
              </p>
            )}

            <div className="neu-inset-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <User size={13} style={{ color: 'var(--neo-gold)' }} />
                <span>Requested by <strong style={{ color: '#fff' }}>{req.user_name}</strong> ({req.user_email})</span>
              </div>

              {canReview && req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-tiny-success"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => resolveRequest(req.id, 'approved')}
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>

                  <button
                    type="button"
                    className="btn-tiny-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => resolveRequest(req.id, 'rejected')}
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              )}

              {req.reviewed_by && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Reviewed by: <strong style={{ color: 'var(--neo-gold)' }}>{req.reviewed_by}</strong>
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="bento-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <HelpCircle size={32} style={{ color: 'var(--text-subtle)', marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>No requests in this category</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              Submit a new request or adjust your status filter above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
