import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Users, 
  Crown, 
  Briefcase, 
  Activity, 
  Bell, 
  CheckSquare, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Shield, 
  MessageSquareQuote,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenInvite: () => void;
  onOpenAnnouncement: () => void;
  onOpenTask: () => void;
  onOpenRequest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenInvite,
  onOpenAnnouncement,
  onOpenTask,
  onOpenRequest,
}) => {
  const { user, role } = useAuth();
  const { 
    members, 
    departments, 
    announcements, 
    tasks, 
    requests, 
    activityLogs 
  } = usePortalData();

  const isAdmin = role === 'admin';
  const isHead = role === 'head';

  // Stats computation
  const totalMembers = members.length;
  const totalHeads = members.filter((m) => m.role === 'head').length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const activeRate = Math.round((activeMembers / (totalMembers || 1)) * 100);

  // Department-specific for Head
  const myDeptName = user?.department || 'Engineering';
  const myDeptMembers = members.filter((m) => m.department === myDeptName);
  const myDeptTasks = tasks.filter((t) => t.department === myDeptName);
  const myDeptPendingTasks = myDeptTasks.filter((t) => t.status !== 'done');

  // Member-specific
  const myAssignedTasks = tasks.filter((t) => t.assigned_to_id === user?.id);
  const myPendingTasks = myAssignedTasks.filter((t) => t.status !== 'done');
  const myRequests = requests.filter((r) => r.user_id === user?.id);

  // Relevant announcements for this user
  const relevantAnnouncements = announcements.filter((a) => {
    if (a.target_role !== 'all' && a.target_role !== role && !isAdmin) return false;
    if (a.target_department !== 'all' && a.target_department !== user?.department && !isAdmin) return false;
    return true;
  });

  return (
    <div>
      {/* Welcome Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          marginBottom: 24, 
          position: 'relative', 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.9) 0%, rgba(30, 41, 69, 0.7) 100%)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span 
                className="tag-badge" 
                style={{ 
                  background: role === 'admin' ? 'var(--role-admin-bg)' : role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                  color: role === 'admin' ? 'var(--role-admin)' : role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                  border: `1px solid ${role === 'admin' ? 'var(--role-admin-border)' : role === 'head' ? 'var(--role-head-border)' : 'var(--role-member-border)'}`,
                  textTransform: 'uppercase'
                }}
              >
                {role === 'admin' ? '👑 Executive Admin View' : role === 'head' ? '⚡ Department Lead Cockpit' : '👤 Member Workspace'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.department}</span>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.full_name || 'Team Member'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, maxWidth: 550 }}>
              {isAdmin 
                ? 'Complete oversight across all executive divisions, department leads, active roster, and system alerts.'
                : isHead 
                  ? `Leading the ${myDeptName} department. Track deliverables, manage team members, and broadcast updates.`
                  : 'Your daily hub for assigned deliverables, company notices, department updates, and requests.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                <button type="button" className="btn btn-primary" onClick={onOpenInvite}>
                  <Plus size={15} />
                  Add Member
                </button>
                <button type="button" className="btn btn-secondary" onClick={onOpenAnnouncement}>
                  <Bell size={15} />
                  Broadcast Notice
                </button>
              </>
            )}

            {isHead && (
              <>
                <button type="button" className="btn btn-primary" onClick={onOpenTask}>
                  <Plus size={15} />
                  Assign Task
                </button>
                <button type="button" className="btn btn-secondary" onClick={onOpenAnnouncement}>
                  <Bell size={15} />
                  Post Team Notice
                </button>
              </>
            )}

            {role === 'member' && (
              <>
                <button type="button" className="btn btn-primary" onClick={onOpenRequest}>
                  <Plus size={15} />
                  Submit Request
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate('tasks')}>
                  <CheckSquare size={15} />
                  View My Tasks
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {isAdmin ? (
          <>
            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Total Roster</div>
                <div className="value">{totalMembers}</div>
                <div className="subtitle">All active & registered staff</div>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
                <Users size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Department Heads</div>
                <div className="value">{totalHeads}</div>
                <div className="subtitle">Leading {departments.length} divisions</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--role-head-bg)', color: 'var(--role-head)' }}>
                <Crown size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Active Status</div>
                <div className="value">{activeRate}%</div>
                <div className="subtitle">{activeMembers} members online now</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                <Activity size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Pending Requests</div>
                <div className="value">{requests.filter(r => r.status === 'pending').length}</div>
                <div className="subtitle">Awaiting lead/admin review</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <MessageSquareQuote size={20} />
              </div>
            </div>
          </>
        ) : isHead ? (
          <>
            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Department Roster</div>
                <div className="value">{myDeptMembers.length}</div>
                <div className="subtitle">Engineers & specialists in {myDeptName}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--role-head-bg)', color: 'var(--role-head)' }}>
                <Users size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Active Deliverables</div>
                <div className="value">{myDeptPendingTasks.length}</div>
                <div className="subtitle">Tasks currently in flight</div>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <CheckSquare size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Completion Rate</div>
                <div className="value">
                  {myDeptTasks.length > 0 
                    ? Math.round(((myDeptTasks.length - myDeptPendingTasks.length) / myDeptTasks.length) * 100) 
                    : 100}%
                </div>
                <div className="subtitle">{myDeptTasks.length - myDeptPendingTasks.length} of {myDeptTasks.length} finished</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                <Activity size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Notices Published</div>
                <div className="value">{announcements.filter(a => a.author_id === user?.id).length}</div>
                <div className="subtitle">Broadcasted to team</div>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                <Bell size={20} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-info">
                <div className="title">My Open Tasks</div>
                <div className="value">{myPendingTasks.length}</div>
                <div className="subtitle">Active assignments</div>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <CheckSquare size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Completed Tasks</div>
                <div className="value">{myAssignedTasks.length - myPendingTasks.length}</div>
                <div className="subtitle">Successfully delivered</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                <Activity size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">My Requests</div>
                <div className="value">{myRequests.length}</div>
                <div className="subtitle">{myRequests.filter(r => r.status === 'approved').length} approved</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <MessageSquareQuote size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="title">Department Team</div>
                <div className="value">{myDeptMembers.length}</div>
                <div className="subtitle">Colleagues in {myDeptName}</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--role-member-bg)', color: 'var(--role-member)' }}>
                <Users size={20} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Two Column Layout: Announcements + Tasks / Department breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Left Column: Recent Notices */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
              Notice Board & Announcements
            </h3>
            <button 
              type="button" 
              className="btn btn-sm btn-secondary" 
              onClick={() => onNavigate('announcements')}
            >
              View All ({announcements.length})
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {relevantAnnouncements.slice(0, 3).map((a) => (
              <div key={a.id} className={`announcement-card ${a.priority}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`tag-badge tag-priority-${a.priority}`}>
                      {a.priority.toUpperCase()}
                    </span>
                    {a.target_department !== 'all' && (
                      <span className="brand-pill" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {a.target_department}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                  {a.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {a.content}
                </p>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                    Posted by <strong style={{ color: 'var(--text-main)' }}>{a.author_name}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                    Audience: {a.target_role === 'all' ? 'All Staff' : a.target_role.toUpperCase() + 's'}
                  </span>
                </div>
              </div>
            ))}

            {relevantAnnouncements.length === 0 && (
              <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                No active announcements for your department yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Departments or My Tasks */}
        <div>
          {isAdmin ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={18} style={{ color: 'var(--role-head)' }} />
                  Department Breakdown
                </h3>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => onNavigate('members')}>
                  Directory
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {departments.map((dept) => {
                  const deptCount = members.filter((m) => m.department === dept.name).length;
                  return (
                    <div 
                      key={dept.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                          style={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            backgroundColor: dept.color || '#6366f1' 
                          }} 
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                            {dept.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            Lead: {dept.head_name || 'Unassigned'}
                          </div>
                        </div>
                      </div>
                      <span className="brand-pill" style={{ fontSize: 11, fontWeight: 700 }}>
                        {deptCount} {deptCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Recent Audit Log Activity */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                    Recent Audit Actions
                  </h4>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => onNavigate('logs')}>
                    View Logs
                  </button>
                </div>
                <div className="glass-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} style={{ fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>•</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{log.user_name}: </span>
                        <span style={{ color: 'var(--text-muted)' }}>{log.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                  {isHead ? 'Department Tasks' : 'My Active Tasks'}
                </h3>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => onNavigate('tasks')}>
                  Task Board
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(isHead ? myDeptTasks : myAssignedTasks).slice(0, 4).map((t) => (
                  <div key={t.id} className="kanban-task-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className={`tag-badge tag-priority-${t.priority}`}>
                        {t.priority}
                      </span>
                      <span 
                        className="brand-pill" 
                        style={{ 
                          textTransform: 'uppercase', 
                          fontSize: 10,
                          background: t.status === 'done' ? 'var(--success-bg)' : 'rgba(255,255,255,0.06)',
                          color: t.status === 'done' ? 'var(--success)' : 'var(--text-muted)'
                        }}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                      {t.title}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <span>Due: {t.due_date}</span>
                      <span>Assignee: {t.assigned_to_name}</span>
                    </div>
                  </div>
                ))}

                {(isHead ? myDeptTasks : myAssignedTasks).length === 0 && (
                  <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No pending tasks assigned.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
