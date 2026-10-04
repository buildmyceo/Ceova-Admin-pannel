import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { X, Mail, Lock, User, Briefcase, Shield, Crown, Eye, EyeOff, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { loginWithEmail, signUpWithEmail, quickLoginAs, isSupabaseConfigured } = useAuth();
  const { submitWaitlistRequest } = usePortalData();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [department, setDepartment] = useState('Development');
  
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
        if (onLoginSuccess) onLoginSuccess();
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

      // Automatically queue on CEO Waiting List
      await submitWaitlistRequest({
        full_name: fullName.trim(),
        email: email.trim(),
        requested_role: selectedRole,
        department,
        reason: 'New team member registration through portal gate'
      });

      setLoading(false);
      setSuccessMessage('Your registration is queued on the Waiting List! CEO Harshit has received your clearance dossier on his Executive Command deck.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
            }}>
              <img src="/ceovaimage.png" alt="Ceova" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
                {mode === 'signin' ? 'Ceova Team OS • Internal Access' : 'Register for Portal Access'}
              </div>
            </div>
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
          {/* Mode Switch Tabs: Only Sign In and Sign Up */}
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
              Sign In
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
              Sign Up
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
        </div>
      </div>
    </div>
  );
};
