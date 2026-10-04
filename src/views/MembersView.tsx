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
  X,
  Network,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Profile, UserRole } from '../types';

interface MembersViewProps {
  onOpenInvite: () => void;
  onNavigateToChat?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onOpenInvite, onNavigateToChat }) => {
  const { user: currentUser, role: currentRole, switchUserById } = useAuth();
  const { members, departments } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'hierarchy'>('grid');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  const isCSuite = currentRole === 'ceo' || currentRole === 'admin' || currentRole === 'cto' || currentRole === 'coo';

  // Filter logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.designation && member.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.skills && member.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesDept = deptFilter === 'all' || member.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Hierarchy levels
  const ceoMember = members.find(m => m.role === 'ceo' || m.role === 'admin') || members[0];
  const cSuiteMembers = members.filter(m => ['cto', 'cmo', 'cfo', 'coo'].includes(m.role));
  const coreMembers = members.filter(m => m.role === 'member' || m.role === 'lead');
  const internMembers = members.filter(m => m.role === 'intern');

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header-row">
        <div>
          <h2>Team Directory & Organizational Structure</h2>
          <p className="view-subtitle">
            Ceova team hierarchy, role-based visibility, reporting managers, and active project assignments.
          </p>
        </div>

        <div className="view-actions-row">
          <div className="view-toggle-group">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={14} /> Directory Grid
            </button>
            <button
              className={`toggle-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
              onClick={() => setViewMode('hierarchy')}
            >
              <Network size={14} /> Org Hierarchy Tree
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={14} /> Table
            </button>
          </div>

          {isCSuite && (
            <button type="button" className="btn btn-primary" onClick={onOpenInvite}>
              <UserPlus size={15} /> Add Team Member
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (for grid and table) */}
      {viewMode !== 'hierarchy' && (
        <div className="filter-bar">
          <div className="search-field-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search by name, email, skills..."
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
            <option value="ceo">CEO</option>
            <option value="cto">CTO</option>
            <option value="cmo">CMO</option>
            <option value="cfo">CFO</option>
            <option value="coo">COO</option>
            <option value="member">Core Member</option>
            <option value="intern">Intern</option>
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
      )}

      {/* Hierarchy Tree View */}
      {viewMode === 'hierarchy' ? (
        <div className="org-tree-canvas">
          {/* Level 1: CEO */}
          <div className="org-tree-level">
            <div className="org-tree-node ceo-node" onClick={() => setSelectedMember(ceoMember)}>
              <div className="node-avatar-wrap">
                {ceoMember.avatar_url ? (
                  <img src={ceoMember.avatar_url} alt={ceoMember.full_name} className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">{ceoMember.full_name.charAt(0)}</div>
                )}
                <span className={`user-status-dot status-${ceoMember.status}`} />
              </div>
              <div className="node-info">
                <span className="node-badge ceo">CEO</span>
                <h4>{ceoMember.full_name}</h4>
                <span className="node-desig">{ceoMember.designation}</span>
                <span className="node-dept">{ceoMember.department}</span>
              </div>
            </div>
          </div>

          <div className="org-tree-connector-down" />

          {/* Level 2: C-Suite (CTO, CMO, CFO, COO) */}
          <div className="org-tree-level c-suite-level">
            {cSuiteMembers.map((member) => (
              <div 
                key={member.id} 
                className={`org-tree-node csuite-node role-${member.role}`}
                onClick={() => setSelectedMember(member)}
              >
                <div className="node-avatar-wrap">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback">{member.full_name.charAt(0)}</div>
                  )}
                  <span className={`user-status-dot status-${member.status}`} />
                </div>
                <div className="node-info">
                  <span className={`node-badge ${member.role}`}>{member.role.toUpperCase()}</span>
                  <h4>{member.full_name}</h4>
                  <span className="node-desig">{member.designation}</span>
                  <span className="node-dept">{member.department}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="org-tree-connector-down" />

          {/* Level 3: Core Team Members */}
          <div className="org-level-title">Core Team Members</div>
          <div className="org-tree-level core-level">
            {coreMembers.map((member) => (
              <div 
                key={member.id} 
                className="org-tree-node member-node"
                onClick={() => setSelectedMember(member)}
              >
                <div className="node-avatar-wrap">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback">{member.full_name.charAt(0)}</div>
                  )}
                </div>
                <div className="node-info">
                  <h4>{member.full_name}</h4>
                  <span className="node-desig">{member.designation}</span>
                  <span className="node-reporting">Reports to: {member.reporting_to}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="org-tree-connector-down" />

          {/* Level 4: Interns */}
          <div className="org-level-title">Fellowship & Interns</div>
          <div className="org-tree-level intern-level">
            {internMembers.map((intern) => (
              <div 
                key={intern.id} 
                className="org-tree-node intern-node"
                onClick={() => setSelectedMember(intern)}
              >
                <div className="node-avatar-wrap">
                  {intern.avatar_url ? (
                    <img src={intern.avatar_url} alt={intern.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback">{intern.full_name.charAt(0)}</div>
                  )}
                </div>
                <div className="node-info">
                  <span className="node-badge intern">INTERN</span>
                  <h4>{intern.full_name}</h4>
                  <span className="node-desig">{intern.designation}</span>
                  <span className="node-reporting">Supervisor: {intern.supervisor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="members-grid">
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              className="member-card"
              onClick={() => setSelectedMember(member)}
            >
              <div className="member-card-header">
                <div className="user-avatar-wrap" style={{ width: 48, height: 48 }}>
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback">{member.full_name.charAt(0)}</div>
                  )}
                  <span className={`user-status-dot status-${member.status}`} />
                </div>

                <span className={`role-badge role-${member.role}`}>
                  {member.role.toUpperCase()}
                </span>
              </div>

              <div className="member-card-body">
                <h4>{member.full_name}</h4>
                <div className="member-desig-text">{member.designation}</div>
                <div className="member-dept-text">{member.department}</div>

                {member.current_project && (
                  <div className="member-proj-tag">
                    <Layers size={11} /> {member.current_project}
                  </div>
                )}
              </div>

              <div className="member-card-footer">
                <span className="member-reporting-sub">
                  {member.supervisor ? `Supervisor: ${member.supervisor.split(' ')[0]}` : `Reports to: ${member.reporting_to?.split(' ')[0] || 'Executive'}`}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-subtle)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="task-list-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Reporting To / Supervisor</th>
                <th>Current Project</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr key={m.id} onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="avatar-chip-small">{m.full_name.charAt(0)}</span>
                      <div>
                        <strong>{m.full_name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${m.role}`}>{m.role.toUpperCase()}</span>
                  </td>
                  <td>{m.department}</td>
                  <td>{m.designation}</td>
                  <td>{m.supervisor || m.reporting_to || 'Board'}</td>
                  <td>{m.current_project || 'General'}</td>
                  <td>
                    <span className={`status-pill status-${m.status}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Profile Drawer */}
      {selectedMember && (
        <div className="member-drawer-overlay" onClick={() => setSelectedMember(null)}>
          <div className="member-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Member Profile</h3>
              <button className="btn-icon" onClick={() => setSelectedMember(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-user-identity">
                <div className="user-avatar-wrap" style={{ width: 64, height: 64 }}>
                  {selectedMember.avatar_url ? (
                    <img src={selectedMember.avatar_url} alt={selectedMember.full_name} className="avatar-img" />
                  ) : (
                    <div className="avatar-fallback" style={{ fontSize: 24 }}>{selectedMember.full_name.charAt(0)}</div>
                  )}
                  <span className={`user-status-dot status-${selectedMember.status}`} />
                </div>
                <div>
                  <h4>{selectedMember.full_name}</h4>
                  <div className="drawer-sub">{selectedMember.designation}</div>
                  <span className={`role-badge role-${selectedMember.role}`} style={{ marginTop: 4 }}>
                    {selectedMember.role.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="drawer-quick-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    switchUserById(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  title="Switch session to this user to view their dashboard"
                >
                  <User size={13} /> Switch Active View
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedMember(null);
                    onNavigateToChat?.();
                  }}
                >
                  <MessageSquare size={13} /> Send Message
                </button>
              </div>

              {/* Department & Reporting Info */}
              <div className="drawer-section">
                <h5>Organizational Details</h5>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <span className="info-label">Department</span>
                    <span className="info-val">{selectedMember.department}</span>
                  </div>
                  <div className="drawer-info-item">
                    <span className="info-label">Reporting Manager</span>
                    <span className="info-val">{selectedMember.reporting_to || 'Board of Directors'}</span>
                  </div>
                  {selectedMember.supervisor && (
                    <div className="drawer-info-item">
                      <span className="info-label">Designated Supervisor</span>
                      <span className="info-val text-cyan">{selectedMember.supervisor}</span>
                    </div>
                  )}
                  <div className="drawer-info-item">
                    <span className="info-label">Current Project</span>
                    <span className="info-val text-purple">{selectedMember.current_project || 'Ceova Core'}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Skills */}
              {selectedMember.bio && (
                <div className="drawer-section">
                  <h5>Bio</h5>
                  <p className="drawer-bio">{selectedMember.bio}</p>
                </div>
              )}

              {selectedMember.skills && selectedMember.skills.length > 0 && (
                <div className="drawer-section">
                  <h5>Skills & Core Competencies</h5>
                  <div className="skills-chips-row">
                    {selectedMember.skills.map((s, idx) => (
                      <span key={idx} className="skill-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions & Access Control */}
              <div className="drawer-section">
                <h5>System Permissions (RBAC)</h5>
                <div className="permissions-chips-row">
                  {selectedMember.permissions?.map((p, idx) => (
                    <span key={idx} className="perm-chip">
                      ✓ {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
