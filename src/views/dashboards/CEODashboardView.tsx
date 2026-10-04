import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  Sparkles,
  Flame,
  ArrowRight,
  Crown,
  Lock,
  Compass,
  UserCheck,
  XCircle,
  Mail,
  Phone
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface CEODashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenTaskModal: () => void;
  onOpenAnnouncementModal: () => void;
}

export const CEODashboardView: React.FC<CEODashboardViewProps> = ({
  onNavigate,
  onOpenTaskModal,
  onOpenAnnouncementModal,
}) => {
  const { user } = useAuth();
  const { 
    members, 
    departments, 
    projects, 
    financials, 
    strategicDecisions, 
    activityLogs,
    updateDecisionStatus,
    waitlistRequests,
    resolveWaitlistRequest
  } = usePortalData();

  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const atRiskProjectsCount = projects.filter(p => p.status === 'at_risk' || p.risks.length > 1).length;
  const totalMembers = members.length;
  const pendingDecisionsCount = strategicDecisions.filter(d => d.status === 'pending').length;
  const pendingWaitlist = waitlistRequests.filter(w => w.status === 'pending');

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">IMPERIUM ET ORDO • EXECUTIVE GOVERNANCE</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Ceova Executive Command
          </h2>
          <p className="view-subtitle">
            Chief Executive Officer • Overall strategic alignment, cross-departmental throughput, and capital health.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn" onClick={onOpenAnnouncementModal}>
            <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Broadcast Notice</span>
          </button>
          <button className="neu-pill-btn primary" onClick={() => onNavigate('executive_room')}>
            <Lock size={14} />
            <span>Executive Chamber</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Executive Mission Deck (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="badge-gold">
              <Crown size={12} /> Office of the Founder & CEO
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> Live Telemetry • OS v1.0
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Welcome back, {user?.full_name || 'Harshit'}
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
            Ceova commercial rollout is tracking at <strong>72% overall completion</strong>. Edge hardware benchmarks for Ceova CCTV are performing within target limits, and Q4 market positioning is converging on schedule.
          </p>

          {/* Neumorphic Inset Execution Progress Bar */}
          <div className="neu-inset-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Company Execution Index (Sprint 14)</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>72% ON TRACK</strong>
            </div>
            <div className="mini-progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="mini-bar-fill" 
                style={{ 
                  width: '72%', 
                  background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #d4af37 100%)',
                  boxShadow: '0 0 12px rgba(212, 175, 55, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* Quick Action Pill Bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="neu-pill-btn" onClick={() => onNavigate('projects')}>
              <Layers size={14} style={{ color: '#818cf8' }} />
              <span>Inspect Projects ({projects.length})</span>
            </button>
            <button className="neu-pill-btn" onClick={() => onNavigate('chat')}>
              <ShieldCheck size={14} style={{ color: '#34d399' }} />
              <span>Enter Executive Chat</span>
            </button>
            <button className="neu-pill-btn" onClick={() => onNavigate('team')}>
              <Users size={14} style={{ color: '#38bdf8' }} />
              <span>Org Hierarchy ({members.length})</span>
            </button>
          </div>
        </div>

        {/* Bento Box 2: Capital & Treasury Capsule (Span 4) */}
        <div className="bento-card bento-col-4 gold-border">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="neo-sub-roman">FISCUS • TREASURY</div>
            <div className="neo-monogram">C</div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Treasury Cash Balance</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '4px 0 12px', letterSpacing: '-0.02em' }}>
            ₹4.20 <span style={{ fontSize: 18, color: 'var(--neo-gold)' }}>Cr</span>
          </div>

          <div className="neu-inset-box" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Monthly Revenue:</span>
              <strong style={{ color: '#34d399' }}>₹24.5 L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Monthly Net Burn:</span>
              <strong style={{ color: '#f87171' }}>₹8.3 L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Fiscal Runway:</span>
              <strong style={{ color: 'var(--neo-gold)' }}>18.5 Months</strong>
            </div>
          </div>

          <button 
            className="neu-pill-btn" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onNavigate('reports')}
          >
            <DollarSign size={13} style={{ color: 'var(--neo-gold)' }} />
            <span>Open Financial Ledger</span>
          </button>
        </div>

        {/* Bento Box 3: Metric - Active Projects (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Active Projects</span>
            <div className="metric-icon-wrap blue"><Layers size={16} /></div>
          </div>
          <div className="metric-value">{activeProjectsCount}</div>
          <div className="metric-footer positive">
            <ArrowUpRight size={13} /> 2 launching this month
          </div>
        </div>

        {/* Bento Box 4: Metric - Team Members (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('team')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Total Team</span>
            <div className="metric-icon-wrap purple"><Users size={16} /></div>
          </div>
          <div className="metric-value">{totalMembers}</div>
          <div className="metric-footer neutral">5 C-Suite • 4 Core • 2 Interns</div>
        </div>

        {/* Bento Box 5: Metric - Projects At Risk (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Projects At Risk</span>
            <div className="metric-icon-wrap orange"><AlertTriangle size={16} /></div>
          </div>
          <div className="metric-value">{atRiskProjectsCount}</div>
          <div className="metric-footer warning">Zero delayed milestones</div>
        </div>

        {/* Bento Box 6: Metric - Deadlines (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('tasks')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Upcoming Deadlines</span>
            <div className="metric-icon-wrap red"><Clock size={16} /></div>
          </div>
          <div className="metric-value">3</div>
          <div className="metric-footer neutral">CCTV human detection due Wed</div>
        </div>

        {/* Bento Box 7: Department Matrix (Span 7) */}
        <div className="bento-card bento-col-7">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <Building2 size={16} className="panel-icon gold" />
              <h3 className="neo-serif-title" style={{ fontSize: 16 }}>Department Status & Executive Health</h3>
            </div>
            <span className="badge-subtle">4 Core Departments</span>
          </div>

          <div className="departments-ceo-list">
            {departments.map((dept, index) => (
              <div key={dept.id} className="dept-ceo-item">
                <div className="dept-item-top">
                  <div className="dept-item-identity">
                    <span className="dept-color-bar" style={{ backgroundColor: dept.color }} />
                    <div>
                      <div className="dept-name-row">
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-subtle)' }}>
                          {['I', 'II', 'III', 'IV'][index]} •
                        </span>
                        <h4>{dept.name}</h4>
                        <span className={`status-pill status-${(dept.status || 'Active').toLowerCase().replace(' ', '-')}`}>
                          {dept.status || 'Active'}
                        </span>
                      </div>
                      <div className="dept-lead-label">Lead: {dept.c_suite_leader}</div>
                    </div>
                  </div>

                  <div className="dept-progress-wrap">
                    <span className="dept-progress-pct">{dept.progress}%</span>
                    <div className="mini-progress-bar">
                      <div className="mini-bar-fill" style={{ width: `${dept.progress}%`, backgroundColor: dept.color }} />
                    </div>
                  </div>
                </div>

                <div className="dept-metrics-row">
                  <span className="dept-stat"><strong>{dept.member_count}</strong> active staff</span>
                  <span className="dept-stat-divider">•</span>
                  <span className="dept-stat"><strong>{dept.pending_tasks_count}</strong> pending tasks</span>
                </div>

                {dept.critical_issues && dept.critical_issues.length > 0 && (
                  <div className="dept-issue-box">
                    <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <span>{dept.critical_issues[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 8: Strategic Decisions & Audit History (Span 5) */}
        <div className="bento-card bento-col-5">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <ShieldCheck size={16} className="panel-icon gold" />
              <h3 className="neo-serif-title" style={{ fontSize: 16 }}>Strategic Decisions</h3>
            </div>
            <span className="badge-warning-soft">{pendingDecisionsCount} Pending</span>
          </div>

          <div className="decisions-list">
            {strategicDecisions.map((decision, dIdx) => (
              <div key={decision.id} className={`decision-item ${decision.status}`}>
                <div className="decision-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--neo-gold)' }}>
                      {['I', 'II', 'III'][dIdx]}
                    </span>
                    <h5>{decision.title}</h5>
                  </div>
                  <span className={`impact-badge ${(decision.impact || 'medium').toLowerCase()}`}>
                    {decision.impact || 'Medium'}
                  </span>
                </div>
                <p className="decision-desc">{decision.description}</p>
                <div className="decision-footer">
                  <span className="decision-owner">Lead: {decision.owner}</span>
                  <div className="decision-actions">
                    {decision.status === 'pending' ? (
                      <button 
                        className="btn-tiny-success"
                        onClick={() => updateDecisionStatus(decision.id, 'decided')}
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                    ) : (
                      <span className="decision-finalized">
                        <CheckCircle2 size={12} /> FINALIZED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="neo-divider" />

          {/* Recent Audit Mini Feed */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8, letterSpacing: '0.05em' }}>
            Latest Audit Entry
          </div>
          {activityLogs[0] && (
            <div className="neu-inset-box" style={{ fontSize: 12 }}>
              <div style={{ color: '#fff', fontWeight: 600 }}>{activityLogs[0].action}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{activityLogs[0].details}</div>
              <div style={{ color: 'var(--text-subtle)', fontSize: 10, marginTop: 4 }}>
                {activityLogs[0].user_name} • {new Date(activityLogs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Bento Box 9: Access Clearance & Waiting List Queue (Span 12) */}
        <div className="bento-card bento-col-12" style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                padding: '4px 8px', 
                background: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: 8, 
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <img src="/ceovaimage.png" alt="Ceova" style={{ height: 20, width: 'auto' }} />
              </div>
              <div>
                <span className="neo-sub-roman">V • ADMISSIONES ET VETTING • ACCESS CLEARANCE QUEUE</span>
                <h3 className="neo-serif-title" style={{ fontSize: 18, margin: '2px 0 0', color: '#fff' }}>
                  New User Admission & Waiting List
                </h3>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge-gold">
                {pendingWaitlist.length} Applicants Awaiting CEO Approval
              </span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, maxWidth: 840, lineHeight: 1.5 }}>
            External candidates, contractors, and incoming team members requesting entry to Ceova Team OS.
            As Founder & CEO, your executive clearance activates their cryptographic profile and departmental workspace.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {waitlistRequests.map((req) => (
              <div 
                key={req.id} 
                className="neu-inset-box" 
                style={{ 
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: req.status === 'pending' 
                    ? '3px solid var(--accent-primary)' 
                    : req.status === 'approved' 
                      ? '3px solid #3b82f6' 
                      : '3px solid #ef4444'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{req.full_name}</h4>
                      <div style={{ fontSize: 11.5, color: 'var(--accent-primary)', marginTop: 2, fontWeight: 600 }}>
                        {req.department} • <span style={{ textTransform: 'capitalize' }}>{req.requested_role}</span>
                      </div>
                    </div>
                    <span 
                      className={`status-pill status-${req.status === 'approved' ? 'completed' : req.status === 'rejected' ? 'blocked' : 'in_progress'}`}
                      style={{ fontSize: 10 }}
                    >
                      {req.status === 'pending' ? 'WAITLIST QUEUED' : req.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0 10px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} style={{ color: 'var(--accent-primary)' }} />
                      <span>{req.email}</span>
                    </div>
                    {req.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} style={{ color: 'var(--accent-primary)' }} />
                        <span>{req.phone}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    padding: '8px 10px', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: 8, 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: 12,
                    color: 'var(--text-main)',
                    lineHeight: 1.4,
                    marginBottom: 12
                  }}>
                    "{req.reason}"
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>
                    Requested: {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn-tiny-success"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                        onClick={() => resolveWaitlistRequest(req.id, 'approved')}
                      >
                        <UserCheck size={13} /> Grant Clearance
                      </button>
                      <button 
                        className="btn-tiny-danger"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                        onClick={() => resolveWaitlistRequest(req.id, 'rejected')}
                      >
                        <XCircle size={13} /> Decline
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: req.status === 'approved' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {req.status === 'approved' ? '✓ Clearance Granted' : '✕ Request Declined'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
