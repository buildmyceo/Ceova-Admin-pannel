import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Crown, 
  User, 
  MoreVertical, 
  ExternalLink,
  X
} from 'lucide-react';
import { Profile, UserRole } from '../types';

interface MembersViewProps {
  onOpenInvite: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onOpenInvite }) => {
  const { role: currentRole } = useAuth();
  const { members, departments, updateMemberRole } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  const isAdmin = currentRole === 'admin';

  // Filter logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.designation && member.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.skills && member.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesDept = deptFilter === 'all' || member.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Organization Directory</h2>
          <p>Browse all active team members, department heads, and system administrators.</p>
        </div>

        <div className="page-actions">
          {isAdmin && (
            <button type="button" className="btn btn-primary" onClick={onOpenInvite}>
              <UserPlus size={15} />
              Add / Invite Member
            </button>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 2, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: viewMode === 'grid' ? 'var(--bg-surface-hover)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-subtle)',
                border: 'none'
              }}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: viewMode === 'table' ? 'var(--bg-surface-hover)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-subtle)',
                border: 'none'
              }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, email, role, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="head">Department Heads</option>
          <option value="member">Members</option>
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

        <select
          className="select-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Available</option>
          <option value="away">Away</option>
          <option value="in_meeting">In Meeting</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="members-grid">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="member-card"
              onClick={() => setSelectedMember(member)}
              style={{ cursor: 'pointer' }}
            >
              <div className="member-card-header">
                <div className="user-avatar-wrap" style={{ width: 48, height: 48 }}>
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback" style={{ fontSize: 16 }}>{member.full_name.charAt(0)}</div>
                  )}
                  <span className={`user-status-dot status-${member.status}`} style={{ width: 11, height: 11 }} />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.full_name}
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {member.designation}
                  </div>
                </div>

                <span 
                  className={`tag-badge tag-priority-${member.role === 'admin' ? 'urgent' : member.role === 'head' ? 'high' : 'normal'}`}
                  style={{ textTransform: 'uppercase', fontSize: 10 }}
                >
                  {member.role}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 12 }}>
                <strong>Dept:</strong> {member.department}
              </div>

              {member.bio && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {member.bio}
                </p>
              )}

              {member.skills && member.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                  {member.skills.slice(0, 3).map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="brand-pill" 
                      style={{ fontSize: 10, background: 'rgba(255, 255, 255, 0.04)' }}
                    >
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 3 && (
                    <span className="brand-pill" style={{ fontSize: 10 }}>
                      +{member.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Email Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-wrap" style={{ width: 32, height: 32 }}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-fallback" style={{ fontSize: 12 }}>{member.full_name.charAt(0)}</div>
                        )}
                        <span className={`user-status-dot status-${member.status}`} style={{ width: 8, height: 8 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{member.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="tag-badge"
                      style={{
                        background: member.role === 'admin' ? 'var(--role-admin-bg)' : member.role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                        color: member.role === 'admin' ? 'var(--role-admin)' : member.role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                        border: `1px solid ${member.role === 'admin' ? 'var(--role-admin-border)' : member.role === 'head' ? 'var(--role-head-border)' : 'var(--role-member-border)'}`,
                        textTransform: 'uppercase'
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td>{member.department}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{member.designation}</td>
                  <td>
                    <span 
                      className="brand-pill" 
                      style={{
                        background: member.status === 'active' ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)',
                        color: member.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                        textTransform: 'capitalize'
                      }}
                    >
                      {member.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <a href={`mailto:${member.email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} />
                      {member.email}
                    </a>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedMember(member)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>
          No members found matching your search and filter criteria.
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Member Profile Details</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setSelectedMember(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div className="user-avatar-wrap" style={{ width: 64, height: 64 }}>
                  {selectedMember.avatar_url ? (
                    <img src={selectedMember.avatar_url} alt={selectedMember.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback" style={{ fontSize: 22 }}>{selectedMember.full_name.charAt(0)}</div>
                  )}
                  <span className={`user-status-dot status-${selectedMember.status}`} style={{ width: 14, height: 14 }} />
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{selectedMember.full_name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedMember.designation}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span 
                      className="tag-badge" 
                      style={{ 
                        textTransform: 'uppercase',
                        background: selectedMember.role === 'admin' ? 'var(--role-admin-bg)' : selectedMember.role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                        color: selectedMember.role === 'admin' ? 'var(--role-admin)' : selectedMember.role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                      }}
                    >
                      {selectedMember.role}
                    </span>
                    <span className="brand-pill">{selectedMember.department}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>
                  Contact Information
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: 'var(--text-subtle)' }} />
                    <a href={`mailto:${selectedMember.email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      {selectedMember.email}
                    </a>
                  </div>
                  {selectedMember.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} style={{ color: 'var(--text-subtle)' }} />
                      <span style={{ color: 'var(--text-main)' }}>{selectedMember.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedMember.bio && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>
                    About
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {selectedMember.bio}
                  </p>
                </div>
              )}

              {selectedMember.skills && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>
                    Expertise & Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedMember.skills.map((s, i) => (
                      <span key={i} className="brand-pill" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedMember(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
