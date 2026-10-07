import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, CreditCard, DollarSign, Activity, Settings, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConnectedApp } from '../types';

interface AppDashboardViewProps {
  appId: string | null;
  onBack: () => void;
}

export const AppDashboardView: React.FC<AppDashboardViewProps> = ({ appId, onBack }) => {
  const { user } = useAuth();
  const [app, setApp] = useState<ConnectedApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.apps && appId) {
      const found = user.apps.find(a => a.id === appId);
      setApp(found || null);
    }
    // Simulate initial load of remote data
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [user, appId]);

  if (!appId || (!loading && !app)) {
    return (
      <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-main)', marginBottom: 16 }}>App Not Found</h2>
          <button className="btn-primary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {app?.name || 'Loading...'}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} /> Connected to Supabase
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 16 }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ color: 'var(--text-muted)' }}>Connecting to {app?.name || 'database'}...</div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
            
            <div className="bento-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Customers</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>1,248</div>
              </div>
            </div>

            <div className="bento-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Earnings</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>$42,890</div>
              </div>
            </div>

            <div className="bento-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Subs</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>892</div>
              </div>
            </div>

            <div className="bento-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>API Requests</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>142k</div>
              </div>
            </div>
            
          </div>

          <div className="bento-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', margin: '0 auto 20px auto' }}>
              <Settings size={32} />
            </div>
            <h3 style={{ fontSize: 20, color: 'var(--text-main)', marginBottom: 8 }}>Connection Established</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
              Successfully connected to Supabase and Razorpay. Live metrics dashboard is currently in read-only preview mode. Full sync will run on the next cycle.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
