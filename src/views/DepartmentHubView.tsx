import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Briefcase, 
  Crown, 
  Users, 
  CheckSquare, 
  Plus, 
  Mail, 
  Calendar,
  Layers
} from 'lucide-react';

interface DepartmentHubViewProps {
  onOpenTask: () => void;
  onOpenAnnouncement: () => void;
}

export const DepartmentHubView: React.FC<DepartmentHubViewProps> = ({
  onOpenTask,
  onOpenAnnouncement
}) => {
  const { user, role } = useAuth();
  const { members, departments, tasks, updateTaskStatus } = usePortalData();

  const isAdmin = role === 'admin';

  // If admin, allow selecting any department. If head, lock to their department.
  const [selectedDeptName, setSelectedDeptName] = useState<string>(
    user?.department || (departments[0]?.name ?? 'Engineering')
  );

  const currentDept = departments.find((d) => d.name === selectedDeptName) || departments[0];
  const deptMembers = members.filter((m) => m.department === selectedDeptName);
  const deptHead = members.find((m) => m.id === currentDept?.head_id) || members.find((m) => m.role === 'head' && m.department === selectedDeptName);
  const deptTasks = tasks.filter((t) => t.department === selectedDeptName);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>Department Hub & Team Operations</h2>
            <span className="badge badge-role-head">Leadership</span>
          </div>
          <p>
            Manage team assignments, supervise milestones, and coordinate deliverables for {selectedDeptName}.
          </p>
        </div>

        <div className="page-actions">
          {isAdmin && (
            <select
              className="select-field"
              value={selectedDeptName}
              onChange={(e) => setSelectedDeptName(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>Switch Dept: {d.name}</option>
              ))}
            </select>
          )}

          <button type="button" className="btn btn-primary" onClick={onOpenTask}>
            <Plus size={15} />
            Assign Dept Task
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenAnnouncement}>
            <Plus size={15} />
            Post Team Notice
          </button>
        </div>
      </div>

      {/* Department Summary Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: 24,
          marginBottom: 24,
          borderLeft: `4px solid ${currentDept?.color || '#6366f1'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
              {currentDept?.name}
            </h3>
            <span className="brand-pill" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {deptMembers.length} Members
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 650 }}>
            {currentDept?.description || 'Active division handling specialized goals, product features, and research.'}
          </p>
        </div>

        {deptHead && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              background: 'var(--bg-surface)', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div className="user-avatar-wrap" style={{ width: 40, height: 40 }}>
              {deptHead.avatar_url ? (
                <img src={deptHead.avatar_url} alt={deptHead.full_name} className="avatar-img" />
              ) : (
                <div className="avatar-fallback">{deptHead.full_name.charAt(0)}</div>
              )}
              <span className={`user-status-dot status-${deptHead.status}`} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--role-head)', fontWeight: 700, textTransform: 'uppercase' }}>
                <Crown size={12} />
                Department Head
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                {deptHead.full_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                {deptHead.designation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Team Roster + Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
        {/* Left Column: Team Roster */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} style={{ color: 'var(--role-head)' }} />
              Team Roster ({deptMembers.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deptMembers.map((m) => (
              <div 
                key={m.id} 
                className="glass-panel" 
                style={{ 
                  padding: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="user-avatar-wrap" style={{ width: 34, height: 34 }}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.full_name} className="avatar-img" />
                    ) : (
                      <div className="avatar-fallback" style={{ fontSize: 12 }}>{m.full_name.charAt(0)}</div>
                    )}
                    <span className={`user-status-dot status-${m.status}`} style={{ width: 8, height: 8 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{m.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{m.designation}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span 
                    className="tag-badge" 
                    style={{ 
                      fontSize: 10,
                      textTransform: 'uppercase',
                      background: m.role === 'admin' ? 'var(--role-admin-bg)' : m.role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                      color: m.role === 'admin' ? 'var(--role-admin)' : m.role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                    }}
                  >
                    {m.role}
                  </span>
                  <a href={`mailto:${m.email}`} className="btn btn-sm btn-secondary btn-icon" title="Email Member">
                    <Mail size={13} />
                  </a>
                </div>
              </div>
            ))}

            {deptMembers.length === 0 && (
              <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                No members currently assigned to {selectedDeptName}.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Department Tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckSquare size={16} style={{ color: 'var(--accent-primary)' }} />
              Active Department Deliverables ({deptTasks.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deptTasks.map((t) => (
              <div key={t.id} className="kanban-task-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`tag-badge tag-priority-${t.priority}`}>{t.priority}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Assigned to {t.assigned_to_name}</span>
                  </div>

                  <select
                    className="select-field"
                    style={{ padding: '3px 8px', fontSize: 11 }}
                    value={t.status}
                    onChange={(e) => updateTaskStatus(t.id, e.target.value as any)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  {t.title}
                </div>

                {t.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>
                    {t.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subtle)', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <span>Created by: {t.assigned_by_name}</span>
                  <span>Due: {t.due_date}</span>
                </div>
              </div>
            ))}

            {deptTasks.length === 0 && (
              <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                No active tasks logged for this department yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
