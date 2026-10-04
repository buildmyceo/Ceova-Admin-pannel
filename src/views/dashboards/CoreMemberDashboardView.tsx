import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  CheckSquare, 
  Layers, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  ChevronRight,
  Shield,
  Bell,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface CoreMemberDashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenTaskModal: () => void;
}

export const CoreMemberDashboardView: React.FC<CoreMemberDashboardViewProps> = ({
  onNavigate,
  onOpenTaskModal,
}) => {
  const { user } = useAuth();
  const { tasks, projects, announcements, members, updateTaskStatus } = usePortalData();

  // Filter tasks strictly for this user
  const myTasks = tasks.filter(t => t.assigned_to_id === user?.id || t.assigned_to_name.includes(user?.full_name?.split(' ')[0] || ''));
  const completedTasks = myTasks.filter(t => t.status === 'completed' || t.status === 'done');
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 100;

  // Filter projects user is involved in
  const myProjects = projects.filter(p => 
    p.department === user?.department || 
    p.members.some(m => m.id === user?.id || m.name.includes(user?.full_name?.split(' ')[0] || ''))
  );

  // Relevant department teammates
  const myTeammates = members.filter(m => m.department === user?.department && m.id !== user?.id);

  // Department announcements
  const myDeptAnnouncements = announcements.filter(a => a.target_department === user?.department || a.target_department === 'all');

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">OPERA ET DILIGENTIA • MEMBER WORKSPACE</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            {user?.department} Workbench
          </h2>
          <p className="view-subtitle">
            Welcome back, {user?.full_name} • {user?.designation} • Reporting to <strong>{user?.reporting_to || 'Department Executive'}</strong>.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn" onClick={() => onNavigate('tasks')}>
            <CheckSquare size={14} style={{ color: 'var(--neo-gold)' }} />
            <span>My Tasks ({myTasks.length})</span>
          </button>
          <button className="neu-pill-btn primary" onClick={() => onNavigate('chat')}>
            <MessageSquare size={14} />
            <span>Team Chat</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Member Mission & Sprint Completion (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="badge-gold">
              <Shield size={12} /> {user?.department} Clearances
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> Sprint 14 Active
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Hello, {user?.full_name?.split(' ')[0]}
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
            You have <strong>{myTasks.filter(t => t.status !== 'completed' && t.status !== 'done').length} active sprint deliverables</strong> assigned across {myProjects.length} strategic projects.
          </p>

          {/* Neumorphic Inset Execution Progress Bar */}
          <div className="neu-inset-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Personal Sprint Velocity</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>{completionRate}% DELIVERED</strong>
            </div>
            <div className="mini-progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="mini-bar-fill" 
                style={{ 
                  width: `${completionRate}%`, 
                  background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #d4af37 100%)',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* 4 Mini Neumorphic Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assigned Tasks</span>
                <CheckSquare size={13} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{myTasks.length}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Total deliverables</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>In Progress</span>
                <Clock size={13} style={{ color: 'var(--neo-gold)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {myTasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--neo-gold)', marginTop: 3 }}>Active sprint</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Projects</span>
                <Layers size={13} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{myProjects.length}</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>Active scope</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed</span>
                <CheckCircle2 size={13} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{completedTasks.length}</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>Verified done</div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Team Peers & Leadership (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">I • DEPARTMENT PEERS</span>
            <Users size={16} style={{ color: '#818cf8' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myTeammates.map((teammate) => (
              <div key={teammate.id} className="neu-inset-box" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 11 }}>
                  {teammate.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {teammate.full_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{teammate.designation}</div>
                </div>
                <span className={`status-pill role-${teammate.role}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                  {teammate.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Reporting Executive:</span>
              <strong style={{ color: 'var(--neo-gold)' }}>{user?.reporting_to || 'Department Lead'}</strong>
            </div>
          </div>
        </div>

        {/* Bento Box 3: My Sprint Priority Tasks (Span 7) */}
        <div className="bento-card bento-col-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">II • ASSIGNED SPRINT DELIVERABLES</span>
            </div>
            <button className="neu-pill-btn" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={onOpenTaskModal}>
              + Add Subtask
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myTasks.length === 0 ? (
              <div className="neu-inset-box" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No tasks currently assigned. You're completely caught up!
              </div>
            ) : (
              myTasks.map((t) => (
                <div key={t.id} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <h4 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', margin: 0 }}>{t.title}</h4>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Project: <strong>{t.project_name}</strong></span>
                    </div>
                    <span className={`status-pill status-${t.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {t.due_date}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status !== 'completed' && t.status !== 'done' && (
                        <button 
                          className="btn-tiny-success"
                          style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, cursor: 'pointer' }}
                          onClick={() => updateTaskStatus(t.id, 'completed')}
                        >
                          Mark Done
                        </button>
                      )}
                      {t.status === 'todo' && (
                        <button 
                          className="btn-tiny-primary"
                          style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, cursor: 'pointer' }}
                          onClick={() => updateTaskStatus(t.id, 'in_progress')}
                        >
                          Start Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bento Box 4: Active Projects Radar & Milestones (Span 5) */}
        <div className="bento-card bento-col-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">III • ACTIVE PROJECTS RADAR</span>
            <Layers size={16} style={{ color: '#38bdf8' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myProjects.map((p) => (
              <div key={p.id} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--neo-gold)' }}>{p.progress}%</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                  {p.description}
                </p>
                <div className="mini-progress-bar" style={{ height: 5 }}>
                  <div 
                    className="mini-bar-fill" 
                    style={{ 
                      width: `${p.progress}%`, 
                      background: 'var(--accent-gradient)' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 5: Department Notices & Bulletins (Span 12) */}
        <div className="bento-card bento-col-12">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">IV • NOTICES & OPERATIONAL BULLETINS</span>
            </div>
            <span className="badge-gold">Verified Broadcasts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {myDeptAnnouncements.slice(0, 3).map((anc) => (
              <div key={anc.id} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--neo-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {anc.target_department.toUpperCase()} • {anc.priority.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  {anc.title}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px' }}>
                  {anc.content}
                </p>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  By <strong>{anc.author_name}</strong> • {anc.created_at}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
