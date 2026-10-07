import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { X, Eye, EyeOff, CheckCircle, Mail, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { loginWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNotCeovaUser, setIsNotCeovaUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    setIsNotCeovaUser(false);
    setSuccessMessage('');
    setLoading(true);

    if (mode === 'signin') {
      const cleanEmail = email.trim().toLowerCase();
      const res = await loginWithEmail(cleanEmail, password);
      setLoading(false);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
        onClose();
      } else {
        const errText = res.error || 'Authentication failed. Please verify your credentials.';
        setErrorMessage(errText);
        if (errText.toLowerCase().includes('wrong email') || errText.toLowerCase().includes('not registered with ceova') || errText.toLowerCase().includes('not from ceova')) {
          setIsNotCeovaUser(true);
        } else {
          setIsNotCeovaUser(false);
        }
      }
    } else {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full name.');
        setLoading(false);
        return;
      }

      const res = await signUpWithEmail(email, password, { fullName: fullName.trim() });
      setLoading(false);
      if (res.success) {
        setSuccessMessage('CEO account registered successfully!');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
          onClose();
        }, 1000);
      } else {
        setErrorMessage(res.error || 'Failed to sign up.');
      }
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
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              <img src="/ceovaimage.png" alt="Ceova" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {mode === 'signin' ? 'Sign In to Ceova OS' : 'CEO Portal Registration'}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Founder & Executive Command
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
                background: 'rgba(239, 68, 68, 0.12)', 
                border: '1px solid rgba(239, 68, 68, 0.35)', 
                color: '#f87171', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, lineHeight: 1.45 }}>
                  {isNotCeovaUser && (
                    <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                      Access Restricted
                    </div>
                  )}
                  <span>{errorMessage}</span>
                </div>
              </div>

              {isNotCeovaUser && (
                <div style={{ paddingTop: 4, borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <a
                    href={`mailto:buildmyceo@gmail.com?subject=${encodeURIComponent('CEOVA Portal Access Request')}&body=${encodeURIComponent(`Hello CEOVA Team,\n\nI am requesting access to the CEOVA Portal for: ${email.trim()}\n\nIf this was a mistake, please verify and invite my account.\n\nThank you!`)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Mail size={12} />
                    <span>Mail Support (buildmyceo@gmail.com)</span>
                  </a>
                </div>
              )}
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
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Founder & CEO"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@ceova.online"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                  ? 'Sign In as CEO' 
                  : 'Register CEO Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
