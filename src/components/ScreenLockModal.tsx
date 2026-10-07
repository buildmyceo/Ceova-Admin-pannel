import React, { useState } from 'react';
import { Lock, AlertCircle, KeyRound, LogOut } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ScreenLockModalProps {
  onUnlock: () => void;
  onLogout: () => void;
}

export const ScreenLockModal: React.FC<ScreenLockModalProps> = ({ onUnlock, onLogout }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Check if they already have a pin in their auth metadata
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkPin = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setHasPin(false);
        return;
      }
      const { data } = await client.auth.getUser();
      if (data.user?.user_metadata?.screen_lock_pin) {
        setHasPin(true);
      } else {
        setHasPin(false);
        setIsSettingUp(true);
      }
    };
    checkPin();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (setupPin.length < 4) {
      setError('Password/PIN must be at least 4 characters');
      return;
    }
    if (setupPin !== confirmPin) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();
    if (client) {
      await client.auth.updateUser({
        data: { screen_lock_pin: setupPin }
      });
    }
    setIsLoading(false);
    onUnlock();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.auth.getUser();
      const savedPin = data.user?.user_metadata?.screen_lock_pin;
      
      if (savedPin && savedPin === pin) {
        onUnlock();
      } else {
        setError('Incorrect password');
      }
    } else {
      // Fallback if no supabase
      if (pin === 'admin') onUnlock();
      else setError('Incorrect password');
    }
    setIsLoading(false);
  };

  if (hasPin === null) return <div className="screen-lock-overlay"><div className="spinner"></div></div>;

  return (
    <div className="screen-lock-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="screen-lock-box" style={{
        background: 'rgba(12, 16, 26, 0.65)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24, padding: 40, width: '100%', maxWidth: 420,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: '#18181b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          border: '1px solid #27272a', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          {isSettingUp ? <KeyRound size={28} color="#fff" /> : <Lock size={28} color="#fff" />}
        </div>

        <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 8, fontWeight: 600 }}>
          {isSettingUp ? 'Setup Gateway Lock' : 'Gateway Locked'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 32 }}>
          {isSettingUp 
            ? 'Create a quick password to lock your screen without logging out completely.' 
            : `Enter your screen lock password to unlock ${user?.full_name?.split(' ')[0] || 'your'} session.`}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {isSettingUp ? (
          <form onSubmit={handleSetup}>
            <input 
              type="password" 
              placeholder="Enter new lock password" 
              value={setupPin}
              onChange={e => setSetupPin(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, marginBottom: 16, outline: 'none', textAlign: 'center' }}
              autoFocus
            />
            <input 
              type="password" 
              placeholder="Confirm password" 
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, marginBottom: 24, outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" disabled={isLoading} style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
              {isLoading ? 'Saving...' : 'Set Lock Password'}
            </button>
            <button type="button" onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
              Cancel & Sign Out
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, marginBottom: 24, outline: 'none', textAlign: 'center', letterSpacing: pin.length > 0 ? '0.2em' : 'normal' }}
              autoFocus
            />
            <button type="submit" disabled={isLoading} style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
              {isLoading ? 'Unlocking...' : 'Unlock Gateway'}
            </button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12 }}>Forgot your lock password?</p>
              <button type="button" onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                <LogOut size={14} /> Sign Out & Re-Authenticate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
