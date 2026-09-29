import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield, 
  Check, 
  Sparkles,
  Camera
} from 'lucide-react';
import { UserStatus } from '../types';

export const ProfileView: React.FC = () => {
  const { user, role, updateCurrentProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState<UserStatus>(user?.status || 'active');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateCurrentProfile({
      full_name: fullName.trim(),
      designation: designation.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      status,
      avatar_url: avatarUrl.trim() || undefined,
      skills: skillsArray,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>My Profile & Personal Preferences</h2>
          <p>Manage your account credentials, directory visibility, and status broadcast.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 28 }}>
        <form onSubmit={handleSave}>
          {/* Header Profile Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <div className="user-avatar-wrap" style={{ width: 72, height: 72 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="avatar-img" />
              ) : (
                <div className="avatar-fallback" style={{ fontSize: 24 }}>{fullName.charAt(0) || 'U'}</div>
              )}
              <span className={`user-status-dot status-${status}`} style={{ width: 14, height: 14 }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>
                  {user?.full_name}
                </h3>
                <span 
                  className="tag-badge"
                  style={{
                    background: role === 'admin' ? 'var(--role-admin-bg)' : role === 'head' ? 'var(--role-head-bg)' : 'var(--role-member-bg)',
                    color: role === 'admin' ? 'var(--role-admin)' : role === 'head' ? 'var(--role-head)' : 'var(--role-member)',
                    textTransform: 'uppercase',
                    fontSize: 10
                  }}
                >
                  {role}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user?.email} • Department: <strong>{user?.department}</strong>
              </div>
            </div>
          </div>

          {savedSuccess && (
            <div 
              style={{ 
                background: 'var(--success-bg)', 
                border: '1px solid rgba(16,185,129,0.3)', 
                color: 'var(--success)', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Check size={16} />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Title / Designation</label>
              <input
                type="text"
                className="form-input"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                <option value="active">🟢 Available / Online</option>
                <option value="away">🟡 Away</option>
                <option value="in_meeting">🟣 In Meeting</option>
                <option value="offline">⚪ Offline</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills & Specializations (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="React, Rust, PyTorch, Cloud Architecture"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio & Overview</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 110 }}
              placeholder="Tell colleagues about your role and focus areas..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="submit" className="btn btn-primary">
              <Check size={14} />
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
