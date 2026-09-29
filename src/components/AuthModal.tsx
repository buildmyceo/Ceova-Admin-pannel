import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Briefcase, Shield, Crown, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, signUpWithEmail, quickLoginAs, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [department, setDepartment] = useState('Engineering');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (mode === 'signin') {
      const res = await loginWithEmail(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } else {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full name.');
        setLoading(false);
        return;
      }

      const res = await signUpWithEmail(email, password, {
        fullName: fullName.trim(),
        role: selectedRole,
        department,
      });

      setLoading(false);
      if (res.success) {
        if (res.message) {
          setSuccessMessage(res.message);
        } else {
          onClose();
        }
      } else {
        setErrorMessage(res.error || 'Failed to sign up.');
      }
    }
  };

  const handleDemoLogin = (targetRole: UserRole) => {
    quickLoginAs(targetRole);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 28, height: 28, fontSize: 13 }}>C</div>
            <h3>{mode === 'signin' ? 'Sign In to Ceova Portal' : 'Create Ceova Account'}</h3>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Demo Switcher helper */}
          <div 
            style={{ 
              background: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Instant 1-Click Role Login:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--role-admin-bg)', color: 'var(--role-admin)', border: '1px solid var(--role-admin-border)' }}
                onClick={() => handleDemoLogin('admin')}
              >
                <Shield size={12} />
                Admin
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--role-head-bg)', color: 'var(--role-head)', border: '1px solid var(--role-head-border)' }}
                onClick={() => handleDemoLogin('head')}
              >
                <Crown size={12} />
                Head
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--role-member-bg)', color: 'var(--role-member)', border: '1px solid var(--role-member-border)' }}
                onClick={() => handleDemoLogin('member')}
              >
                <User size={12} />
                Member
              </button>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'var(--bg-primary)', 
              padding: 3, 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              marginBottom: 20 
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: mode === 'signin' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'signin' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Email Login
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: mode === 'signup' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'signup' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Register New User
            </button>
          </div>

          {errorMessage && (
            <div 
              style={{ 
                background: 'var(--danger-bg)', 
                border: '1px solid rgba(239,68,68,0.3)', 
                color: 'var(--danger)', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 16
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div 
              style={{ 
                background: 'var(--success-bg)', 
                border: '1px solid rgba(16,185,129,0.3)', 
                color: 'var(--success)', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Elena Rostova"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-input"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    >
                      <option value="member">Member</option>
                      <option value="head">Department Head</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-input"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="AI & Machine Learning">AI & ML</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="Operations & HR">Operations & HR</option>
                      <option value="Marketing & Growth">Marketing</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@ceova.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading 
                ? 'Authenticating...' 
                : mode === 'signin' 
                  ? 'Sign In' 
                  : 'Complete Registration'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)' }}>
            {isSupabaseConfigured 
              ? '🔐 Connected to live Supabase Authentication' 
              : '⚡ Demo Mode Active: Use any demo role or enter any credentials'}
          </div>
        </div>
      </div>
    </div>
  );
};
