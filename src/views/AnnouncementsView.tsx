import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Clock, 
  Pin, 
  Filter, 
  User, 
  Briefcase 
} from 'lucide-react';
import { PriorityLevel } from '../types';

interface AnnouncementsViewProps {
  onOpenCreate: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onOpenCreate }) => {
  const { user, role } = useAuth();
  const { announcements, deleteAnnouncement, departments } = usePortalData();

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const canPost = role === 'admin' || role === 'head';
  const isAdmin = role === 'admin';

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    const matchesDept = deptFilter === 'all' || a.target_department === deptFilter;
    return matchesPriority && matchesDept;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Organization Notice Board & Broadcasts</h2>
          <p>Important announcements, releases, executive mandates, and department updates.</p>
        </div>

        <div className="page-actions">
          {canPost && (
            <button type="button" className="btn btn-primary" onClick={onOpenCreate}>
              <Plus size={15} />
              Publish Announcement
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="select-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High Priority</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select
          className="select-field"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredAnnouncements.map((ann) => {
          const canDelete = isAdmin || ann.author_id === user?.id;

          return (
            <div key={ann.id} className={`announcement-card ${ann.priority}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {ann.pinned && (
                    <span 
                      className="tag-badge" 
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    >
                      <Pin size={11} /> PINNED
                    </span>
                  )}
                  <span className={`tag-badge tag-priority-${ann.priority}`}>
                    {ann.priority.toUpperCase()}
                  </span>
                  <span className="brand-pill" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    Audience: {ann.target_role === 'all' ? 'All Roles' : ann.target_role.toUpperCase() + 's'}
                  </span>
                  {ann.target_department !== 'all' && (
                    <span className="brand-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                      Dept: {ann.target_department}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />
                    {new Date(ann.created_at).toLocaleDateString()}
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary btn-icon"
                      onClick={() => deleteAnnouncement(ann.id)}
                      title="Delete Announcement"
                    >
                      <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                    </button>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                {ann.title}
              </h3>

              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {ann.content}
              </p>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-subtle)' }}>
                  <User size={13} />
                  <span>Posted by <strong style={{ color: 'var(--text-main)' }}>{ann.author_name}</strong></span>
                  <span 
                    className="tag-badge" 
                    style={{ 
                      fontSize: 9, 
                      textTransform: 'uppercase',
                      background: ann.author_role === 'admin' ? 'var(--role-admin-bg)' : ann.author_role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                      color: ann.author_role === 'admin' ? 'var(--role-admin)' : ann.author_role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                    }}
                  >
                    {ann.author_role}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No announcements found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
