import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getSupabaseCredentials, 
  testSupabaseConnection 
} from '../lib/supabase';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  Code
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { updateSupabaseConfig, disconnectSupabase, isSupabaseConfigured } = useAuth();
  
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url || '');
      setAnonKey(creds.key || '');
      setTestResult(null);
    }
  }, [isOpen]);

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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTesting(false);
    setTestResult(result);
  };

  const handleSave = () => {
    updateSupabaseConfig(url, anonKey);
    onClose();
  };

  const handleDisconnect = () => {
    disconnectSupabase();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
  };

  const handleCopySql = () => {
    const sqlText = `-- CEOVA Schema is ready in supabase_schema.sql in your project directory
-- You can run the whole file directly in Supabase SQL Editor.`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--success)'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3>Supabase Connection Settings</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Connect your live Supabase project for real email authentication & PostgreSQL storage
              </p>
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
          {/* Quick status bar */}
          <div 
            style={{ 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)',
              background: isSupabaseConfigured ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              border: isSupabaseConfigured ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`status-dot ${isSupabaseConfigured ? 'connected' : 'demo'}`} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {isSupabaseConfigured 
                  ? 'Connected to live Supabase project' 
                  : 'Running in Local / Demo Mode'}
              </div>
            </div>

            {isSupabaseConfigured && (
              <button 
                type="button" 
                className="btn btn-sm btn-danger" 
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Project URL (`SUPABASE_URL`)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
              Found in Supabase Dashboard → Settings → API → Project URL
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key (`SUPABASE_ANON_KEY`)</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
              Found in Supabase Dashboard → Settings → API → Project API Keys (anon public)
            </div>
          </div>

          {testResult && (
            <div 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)',
                background: testResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: testResult.success ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                color: testResult.success ? 'var(--success)' : 'var(--danger)',
                fontSize: 13,
                marginBottom: 16
              }}
            >
              {testResult.message}
            </div>
          )}

          {/* Database Setup Helper Guide */}
          <div 
            style={{ 
              background: 'var(--bg-primary)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              padding: 14,
              marginTop: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Code size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Database Schema Setup</span>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={handleCopySql}
              >
                {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSql ? 'Copied!' : 'Copy Schema Info'}</span>
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              A complete production SQL schema file has been generated for you at <code style={{ color: 'var(--accent-primary)' }}>supabase_schema.sql</code>.
              Simply paste its content into the <strong>Supabase SQL Editor</strong> to enable tables, RLS security policies, and automatic profile creation!
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleTestConnection}
            disabled={testing || !url || !anonKey}
          >
            {testing ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
            Test Connection
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!url || !anonKey}
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
