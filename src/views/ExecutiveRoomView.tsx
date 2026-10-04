import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  ShieldCheck, 
  Lock, 
  MessageSquare, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Clock, 
  Send, 
  AlertTriangle,
  Award,
  Crown,
  Sparkles,
  XCircle,
  BookOpen
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface ExecutiveRoomViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const ExecutiveRoomView: React.FC<ExecutiveRoomViewProps> = ({ onNavigate }) => {
  const { user, isCSuite } = useAuth();
  const { strategicDecisions, financials, resolveApproval, messages, sendMessage } = usePortalData();

  const [activeTab, setActiveTab] = useState<'decisions' | 'approvals' | 'notes'>('decisions');

  if (!isCSuite) {
    return (
      <div className="restricted-screen">
        <div className="restricted-card bento-card" style={{ maxWidth: 520, textAlign: 'center', padding: '40px 32px' }}>
          <div className="neu-inset-box" style={{ width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--neo-gold)' }}>
            <Lock size={32} />
          </div>
          <div className="neo-sub-roman" style={{ color: 'var(--neo-gold)' }}>RESTRICTED C-SUITE EXECUTIVE ACCESS</div>
          <h2 className="neo-serif-title" style={{ fontSize: 24, margin: '8px 0 14px' }}>
            Executive Chamber Restricted
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            This chamber is strictly restricted to C-Suite Executives (CEO Harshit, CTO Elena, CMO Sophia, CFO David, and COO Aarav).
            Your current authenticated role is <strong>{user?.role.toUpperCase()}</strong>.
          </p>
          <button className="neu-pill-btn primary" style={{ margin: '0 auto' }} onClick={() => onNavigate('dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pendingApprovals = financials.approvals.filter(a => a.status === 'pending');

  const executiveNotes = [
    {
      date: 'Oct 04, 2026',
      title: 'Ceova Team OS Deployment & Q4 Operating Cadence',
      author: 'Harshit (CEO)',
      bullets: [
        'Role-specific dashboards successfully deployed across all 4 departments.',
        'CTO and CMO aligned on Oct 25 CCTV camera release date.',
        'Next board sync scheduled for Thursday 4:00 PM.'
      ]
    },
    {
      date: 'Sept 29, 2026',
      title: 'Series A Capital Strategy & Cap Table Planning',
      author: 'David Sterling (CFO)',
      bullets: [
        'Targeting $3.5M round with 18-month deployment runway.',
        'MeitY deep-tech grant milestone 2 accepted without adjustments.',
        'Cap table post-seed dilution model verified.'
      ]
    }
  ];

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">SENATUS ET CONSILIUM • C-SUITE EXECUTIVE ROOM</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Executive Chamber & Strategic Command
          </h2>
          <p className="view-subtitle">
            Private governance suite for CEO Harshit, CTO Elena, CMO Sophia, CFO David, and COO Aarav.
          </p>
        </div>

        <div className="view-actions-row">
          <div className="neu-inset-box" style={{ display: 'flex', gap: 6, padding: '4px 8px', borderRadius: 24 }}>
            {['CEO', 'CTO', 'CMO', 'CFO', 'COO'].map((r) => (
              <span 
                key={r} 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: 12, 
                  background: user?.role === r.toLowerCase() ? 'var(--neo-gold)' : 'rgba(255, 255, 255, 0.05)',
                  color: user?.role === r.toLowerCase() ? '#000' : 'var(--text-muted)'
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs in Bento Card Container */}
      <div className="bento-card" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className={`neu-pill-btn ${activeTab === 'decisions' ? 'primary' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            <Crown size={14} />
            <span>Strategic Decisions ({strategicDecisions.length})</span>
          </button>
          <button 
            className={`neu-pill-btn ${activeTab === 'approvals' ? 'primary' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <DollarSign size={14} />
            <span>Executive Approvals ({pendingApprovals.length} Pending)</span>
          </button>
          <button 
            className={`neu-pill-btn ${activeTab === 'notes' ? 'primary' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <BookOpen size={14} />
            <span>Meeting Notes & Memos</span>
          </button>
        </div>
      </div>

      {/* Tab Content: Decisions */}
      {activeTab === 'decisions' && (
        <div className="bento-grid">
          {strategicDecisions.map((decision, idx) => (
            <div key={decision.id} className="bento-card bento-col-6">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="neo-sub-roman" style={{ fontSize: 10 }}>DECISION #{idx + 1}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--neo-gold)'
                  }}>
                    {decision.impact} IMPACT
                  </span>
                  <span className={`status-pill status-${decision.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                    {decision.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
                {decision.title}
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                {decision.description}
              </p>

              <div className="neu-inset-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Owner: <strong style={{ color: '#fff' }}>{decision.owner}</strong> • {decision.department}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--neo-gold)', fontWeight: 600 }}>
                  Target: {decision.deadline}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Approvals */}
      {activeTab === 'approvals' && (
        <div className="bento-grid">
          {financials.approvals.map((appr) => (
            <div key={appr.id} className="bento-card bento-col-6">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{appr.title}</h4>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Requested by <strong style={{ color: 'var(--text-main)' }}>{appr.requested_by}</strong> • {appr.department}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--neo-gold)', fontFamily: 'var(--font-serif)' }}>
                  ₹{appr.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="neu-inset-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date: {appr.date}</span>
                {appr.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn-tiny-success"
                      style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => resolveApproval(appr.id, 'approved')}
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button 
                      className="btn-tiny-danger"
                      style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => resolveApproval(appr.id, 'rejected')}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className={`status-pill status-${appr.status}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                    {appr.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Meeting Notes & Memos */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {executiveNotes.map((note, idx) => (
            <div key={idx} className="bento-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{note.title}</h4>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Recorded by: <strong style={{ color: 'var(--neo-gold)' }}>{note.author}</strong></span>
                </div>
                <span className="badge-gold">{note.date}</span>
              </div>
              <div className="neu-inset-box" style={{ padding: '14px 18px' }}>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {note.bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: 4 }}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
