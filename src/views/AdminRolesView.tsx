import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  ShieldCheck, 
  Crown, 
  User, 
  Trash2, 
  UserPlus, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface AdminRolesViewProps {
  onOpenInvite: () => void;
}

export const AdminRolesView: React.FC<AdminRolesViewProps> = ({ onOpenInvite }) => {
  const { user: currentUser } = useAuth();
  const { 
    members, 
    departments, 
    updateMemberRole, 
    updateMemberDepartment, 
    deleteMember 
  } = usePortalData();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    await updateMemberRole(memberId, newRole);
  };

  const handleDeptChange = async (memberId: string, newDept: string) => {
    await updateMemberDepartment(memberId, newDept);
  };

  const handleDelete = async (memberId: string) => {
    if (confirmDeleteId === memberId) {
      await deleteMember(memberId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(memberId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>Roles & Staff Privileges Command Center</h2>
            <span className="badge badge-role-admin">Admin Only</span>
          </div>
          <p>
            Promote or demote user roles across Administrator, Department Head, and Member levels. Reassign departments and manage platform security.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenInvite}>
            <UserPlus size={15} />
            Invite / Add Staff
          </button>
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div 
          className="stat-card" 
          style={{ 
            background: 'var(--role-admin-bg)', 
            borderColor: 'var(--role-admin-border)' 
          }}
        >
          <div className="stat-info">
            <div className="title" style={{ color: 'var(--role-admin)' }}>Administrator</div>
            <div className="value" style={{ fontSize: 20 }}>Superuser</div>
            <div className="subtitle" style={{ color: 'var(--text-muted)' }}>
              Full access to member roles, departments, system announcements, audit logs & settings.
            </div>
          </div>
          <ShieldCheck size={28} style={{ color: 'var(--role-admin)' }} />
        </div>

        <div 
          className="stat-card" 
          style={{ 
            background: 'var(--role-head-bg)', 
            borderColor: 'var(--role-head-border)' 
          }}
        >
          <div className="stat-info">
            <div className="title" style={{ color: 'var(--role-head)' }}>Department Head</div>
            <div className="value" style={{ fontSize: 20 }}>Team Lead</div>
            <div className="subtitle" style={{ color: 'var(--text-muted)' }}>
              Manages departmental personnel, assigns project tasks, posts team notices, reviews requests.
            </div>
          </div>
          <Crown size={28} style={{ color: 'var(--role-head)' }} />
        </div>

        <div 
          className="stat-card" 
          style={{ 
            background: 'var(--role-member-bg)', 
            borderColor: 'var(--role-member-border)' 
          }}
        >
          <div className="stat-info">
            <div className="title" style={{ color: 'var(--role-member)' }}>Team Member</div>
            <div className="value" style={{ fontSize: 20 }}>Specialist</div>
            <div className="subtitle" style={{ color: 'var(--text-muted)' }}>
              Executes assigned tasks, accesses the company directory, views notice board, submits requests.
            </div>
          </div>
          <User size={28} style={{ color: 'var(--role-member)' }} />
        </div>
      </div>

      {/* Access Matrix Table */}
      <div className="table-container">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Member Name & Email</th>
              <th>Current Role</th>
              <th>Assign Role</th>
              <th>Department</th>
              <th>Account Management</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.id === currentUser?.id;
              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-wrap" style={{ width: 34, height: 34 }}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-fallback" style={{ fontSize: 13 }}>{member.full_name.charAt(0)}</div>
                        )}
                        <span className={`user-status-dot status-${member.status}`} style={{ width: 8, height: 8 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {member.full_name}
                          {isSelf && (
                            <span className="brand-pill" style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', fontSize: 9 }}>
                              You
                            </span>
                          )}
                        </div>
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
                        textTransform: 'uppercase',
                        fontWeight: 700
                      }}
                    >
                      {member.role}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: member.role === 'admin' ? 'var(--role-admin)' : 'var(--bg-surface)',
                          color: member.role === 'admin' ? '#fff' : 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          fontSize: 11,
                          padding: '4px 8px'
                        }}
                        onClick={() => handleRoleChange(member.id, 'admin')}
                        title="Promote to Administrator"
                      >
                        Admin
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: member.role === 'head' ? 'var(--role-head)' : 'var(--bg-surface)',
                          color: member.role === 'head' ? '#0b192c' : 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          fontSize: 11,
                          padding: '4px 8px'
                        }}
                        onClick={() => handleRoleChange(member.id, 'head')}
                        title="Promote to Department Head"
                      >
                        Head
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: member.role === 'member' ? 'var(--role-member)' : 'var(--bg-surface)',
                          color: member.role === 'member' ? '#fff' : 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          fontSize: 11,
                          padding: '4px 8px'
                        }}
                        onClick={() => handleRoleChange(member.id, 'member')}
                        title="Set as Regular Member"
                      >
                        Member
                      </button>
                    </div>
                  </td>

                  <td>
                    <select
                      className="select-field"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      value={member.department}
                      onChange={(e) => handleDeptChange(member.id, e.target.value)}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    {isSelf ? (
                      <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Active Admin</span>
                    ) : (
                      <button
                        type="button"
                        className={`btn btn-sm ${confirmDeleteId === member.id ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ fontSize: 11 }}
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 size={13} />
                        {confirmDeleteId === member.id ? 'Confirm Remove' : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
