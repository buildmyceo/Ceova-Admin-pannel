import React, { useState } from 'react';
import { Department } from '../types';
import { usePortalData } from '../context/PortalDataContext';
import { 
  X, 
  FolderPlus, 
  Check, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdGroup: Department) => void;
  initialRole?: 'intern' | 'member' | 'admin' | string;
}

const PRESET_GROUPS = [
  { name: 'Marketing', color: '#ec4899', description: 'Brand identity, growth, and campaigns' },
  { name: 'Development', color: '#3b82f6', description: 'Software engineering, tech, and architecture' },
  { name: 'Design & UI/UX', color: '#8b5cf6', description: 'Product design, interface, and visual assets' },
  { name: 'AI & Research', color: '#06b6d4', description: 'Machine learning, edge vision models, and experiments' },
  { name: 'Sales & Growth', color: '#f59e0b', description: 'Enterprise client acquisition and partnerships' },
  { name: 'Content & Media', color: '#10b981', description: 'Videography, social media, and storytelling' },
];

const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'intern'
}) => {
  const { createGroup, departments } = usePortalData();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_GROUPS[0]) => {
    setName(preset.name);
    setColor(preset.color);
    setDescription(preset.description);
    setMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setIsError(true);
      setMessage('Please enter a group name.');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim(),
        color
      });

      if (!res.success || !res.department) {
        throw new Error(res.error || 'Failed to create group.');
      }

      setMessage(`✓ Group "${res.department.name}" created successfully!`);
      if (onSuccess) {
        onSuccess(res.department);
      }

      setTimeout(() => {
        setName('');
        setDescription('');
        setMessage('');
        onClose();
      }, 700);
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'Error creating group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20
    }}>
      <div style={{
        background: '#0d0d0f',
        border: '1px solid #27272a',
        borderRadius: 18,
        width: '100%',
        maxWidth: 480,
        padding: 26,
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#161618',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#222226';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#161618';
            e.currentTarget.style.color = '#a1a1aa';
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1f1f23' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0
          }}>
            <FolderPlus size={22} />
          </div>
          <div style={{ paddingRight: 36 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {initialRole === 'intern' ? 'Make a New Intern Group' : 'Make a New Group'}
            </h3>
            <div style={{ fontSize: 12.5, color: '#71717a', marginTop: 3 }}>
              Every intern comes under a group. Create a group to assign & organize members.
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
            border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
            color: isError ? '#ef4444' : '#22c55e',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            marginBottom: 16
          }}>
            {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{message}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={12} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Suggestions
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_GROUPS.map((preset) => {
              const isSelected = name.toLowerCase() === preset.name.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : '#161618',
                    border: isSelected ? `1px solid ${preset.color}` : '1px solid #27272a',
                    color: isSelected ? '#ffffff' : '#d4d4d8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: preset.color }} />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Group Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Group Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing, Development, Design, Sales"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #27272a',
                background: '#121214',
                color: '#ffffff',
                outline: 'none',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
            />
          </div>

          {/* Group Description */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Branding, campaigns, engineering, outreach..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #27272a',
                background: '#121214',
                color: '#ffffff',
                outline: 'none',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
            />
          </div>

          {/* Group Theme Color */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Group Badge Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_PALETTE.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c,
                      border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected ? `0 0 12px ${c}` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Groups Pill Notice */}
          {departments.length > 0 && (
            <div style={{
              fontSize: 11.5,
              color: '#71717a',
              background: '#141416',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #1f1f23'
            }}>
              Existing groups in portal: <strong style={{ color: '#d4d4d8' }}>{departments.map(d => d.name).join(', ')}</strong>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4, paddingTop: 14, borderTop: '1px solid #1f1f23' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                background: 'transparent',
                color: '#a1a1aa',
                border: '1px solid #27272a',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.borderColor = '#27272a';
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                background: '#fbbf24',
                color: '#000000',
                border: '1px solid #fbbf24',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = '1';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <FolderPlus size={14} />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
