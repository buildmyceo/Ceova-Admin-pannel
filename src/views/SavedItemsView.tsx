import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { Task, TaskAttachment, TaskPriority } from '../types';
import { NavTab } from '../components/Sidebar';
import {
  BookmarkCheck,
  Search,
  Download,
  Paperclip,
  FileText,
  ShieldCheck,
  Clock,
  Trash2,
  ExternalLink,
  Layers,
  FileCheck,
  CheckCircle2,
  Calendar,
  User,
  X,
  ArrowRight,
  Film,
  Video,
  Image
} from 'lucide-react';

const STORAGE_KEY = 'ceova_local_tasks_cache_v2';
const SAVED_IDS_KEY = 'ceova_saved_task_ids';

import { sanitizeUrl } from '../lib/security';

export const downloadDeliverableFile = async (url: string, filename: string) => {
  if (!url) return;
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) return;

  try {
    const response = await fetch(safeUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'deliverable';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Direct file download error:', err);
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }
};

interface SavedItemsViewProps {
  onNavigate?: (tab: NavTab) => void;
}

export const SavedItemsView: React.FC<SavedItemsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'notes'>('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks for saved vault:', error.message);
      } else if (data) {
        setTasks(data as Task[]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error in saved vault load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks to only those explicitly saved (via tags contains 'saved' or local saved ID list)
  const savedTasks = useMemo(() => {
    let localSavedIds: string[] = [];
    try {
      const stored = localStorage.getItem(SAVED_IDS_KEY);
      if (stored) localSavedIds = JSON.parse(stored);
    } catch {}

    return tasks.filter(t => {
      const isTaggedSaved = t.tags && t.tags.includes('saved');
      const isLocallySaved = localSavedIds.includes(t.id);
      const isExplicitlySaved = t.is_saved === true;
      return isTaggedSaved || isLocallySaved || isExplicitlySaved;
    });
  }, [tasks]);

  // Search & Filter
  const filteredSavedTasks = useMemo(() => {
    return savedTasks.filter(t => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesAssignee = t.assigned_to_names?.some(n => n.toLowerCase().includes(q)) ||
                                t.assigned_to_name?.toLowerCase().includes(q);
        const matchesFile = t.attachments?.some(a => a.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesFile) {
          return false;
        }
      }

      // 2. Type Filter
      if (filterType === 'files') {
        const hasFiles = t.attachments && t.attachments.some(a => a.type !== 'submission_note' && a.type !== 'banner');
        if (!hasFiles) return false;
      } else if (filterType === 'notes') {
        const hasNotes = t.attachments && t.attachments.some(a => a.type === 'submission_note');
        if (!hasNotes) return false;
      }

      return true;
    });
  }, [savedTasks, searchQuery, filterType]);

  // Aggregate Vault Statistics
  const vaultStats = useMemo(() => {
    const totalSaved = savedTasks.length;
    let totalFiles = 0;
    let totalBytes = 0;
    let totalNotes = 0;

    savedTasks.forEach(t => {
      if (t.attachments) {
        t.attachments.forEach(a => {
          if (a.type === 'submission_note') {
            totalNotes++;
          } else if (a.type !== 'banner') {
            totalFiles++;
            totalBytes += a.size || 0;
          }
        });
      }
    });

    return { totalSaved, totalFiles, totalBytes, totalNotes };
  }, [savedTasks]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle Unsaving
  const handleUnsaveTask = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    if (!confirm('Remove this deliverable from your Saved Vault?\n\nNote: If this task was completed, the 72-hour auto-deletion timer will resume counting down.')) {
      return;
    }

    const newTags = (target.tags || []).filter(tag => tag !== 'saved');

    // Update local storage
    try {
      const stored = localStorage.getItem(SAVED_IDS_KEY);
      let localSavedIds: string[] = stored ? JSON.parse(stored) : [];
      localSavedIds = localSavedIds.filter(id => id !== taskId);
      localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(localSavedIds));
    } catch {}

    // Optimistic state update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, tags: newTags, is_saved: false } : t));

    // Update Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from('tasks')
          .update({ tags: newTags })
          .eq('id', taskId);
      }
    } catch (err) {
      console.error('Error removing saved tag in Supabase:', err);
      fetchTasks();
    }
  };

  // Download All Deliverables for a Task
  const handleDownloadAll = async (task: Task) => {
    const fileAttachments = (task.attachments || []).filter(a => a.type !== 'submission_note' && a.url);
    if (fileAttachments.length === 0) {
      alert('No downloadable files attached to this deliverable.');
      return;
    }

    for (const file of fileAttachments) {
      await downloadDeliverableFile(file.url, file.name);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', bg: '#2a1515', color: '#f87171', border: '#451a1a' };
      case 'high':
        return { label: 'High', bg: '#261e12', color: '#fbbf24', border: '#3d2e15' };
      case 'low':
        return { label: 'Low', bg: '#1c1c1f', color: '#a1a1aa', border: '#2e2e33' };
      case 'normal':
      default:
        return { label: 'Normal', bg: '#18181b', color: '#e4e4e7', border: '#2e2e33' };
    }
  };

  return (
    <div className="view-container fade-in">
      {/* Page Header */}
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div className="panel-title-wrap">
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#121214',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80'
          }}>
            <BookmarkCheck size={20} />
          </div>
          <div>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Saved Vault
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#14231b',
                color: '#4ade80',
                border: '1px solid #1d3827'
              }}>
                Permanent
              </span>
            </h2>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 14px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 8,
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Back to Tasks</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Vault Statistics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Total Saved Deliverables */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Saved Deliverables
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {vaultStats.totalSaved}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span>Exempt from 72h auto-delete</span>
          </div>
        </div>

        {/* Preserved Files */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preserved Files
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Paperclip size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {vaultStats.totalFiles}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
            <span>Ready for instant download</span>
          </div>
        </div>

        {/* Work Submission Summaries */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Work Summaries
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <FileText size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {vaultStats.totalNotes}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c084fc' }} />
            <span>Recorded member notes</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'rgba(12, 16, 26, 0.52)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        border: '1px solid rgba(255, 255, 255, 0.11)',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 20,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '5px 12px',
              fontSize: 11.5,
              fontWeight: filterType === 'all' ? 600 : 500,
              border: filterType === 'all' ? '1px solid #333338' : '1px solid transparent',
              borderRadius: 6,
              background: filterType === 'all' ? '#27272a' : 'transparent',
              color: filterType === 'all' ? '#ffffff' : '#8e8e93',
              cursor: 'pointer'
            }}
          >
            All Saved ({savedTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('files')}
            style={{
              padding: '5px 12px',
              fontSize: 11.5,
              fontWeight: filterType === 'files' ? 600 : 500,
              border: filterType === 'files' ? '1px solid #333338' : '1px solid transparent',
              borderRadius: 6,
              background: filterType === 'files' ? '#27272a' : 'transparent',
              color: filterType === 'files' ? '#ffffff' : '#8e8e93',
              cursor: 'pointer'
            }}
          >
            With Uploaded Files
          </button>
          <button
            type="button"
            onClick={() => setFilterType('notes')}
            style={{
              padding: '5px 12px',
              fontSize: 11.5,
              fontWeight: filterType === 'notes' ? 600 : 500,
              border: filterType === 'notes' ? '1px solid #333338' : '1px solid transparent',
              borderRadius: 6,
              background: filterType === 'notes' ? '#27272a' : 'transparent',
              color: filterType === 'notes' ? '#ffffff' : '#8e8e93',
              cursor: 'pointer'
            }}
          >
            With Written Notes
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input
            type="text"
            placeholder="Search saved deliverables, files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 28px 7px 34px',
              fontSize: 12,
              background: '#121214',
              border: '1px solid #222225',
              borderRadius: 8,
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: 2
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div style={{
          background: '#09090b',
          border: '1px solid #1f1f23',
          borderRadius: 16,
          padding: 60,
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto 12px', border: '2px solid #27272a', borderTopColor: '#ffffff', borderRadius: '50%' }} />
          <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa' }}>Loading saved vault...</p>
        </div>
      ) : filteredSavedTasks.length === 0 ? (
        <div style={{
          background: '#09090b',
          border: '1px solid #1f1f23',
          borderRadius: 16,
          padding: '68px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 15,
            background: '#141416',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80',
            marginBottom: 18
          }}>
            <BookmarkCheck size={26} strokeWidth={1.8} />
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' }}>
            {searchQuery ? 'No Matching Saved Deliverables' : 'Your Saved Vault is Empty'}
          </h3>

          <p style={{ fontSize: 13, color: '#71717a', maxWidth: 440, margin: '0 0 22px 0', lineHeight: 1.55 }}>
            {searchQuery
              ? 'No saved deliverables match your search criteria. Try clearing your search.'
              : 'Tasks marked as completed are scheduled for automatic purge after 72 hours. To preserve uploaded files and work notes forever, click the "Save Deliverable" button on any task card.'}
          </p>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              style={{
                padding: '9px 20px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #ffffff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Tasks
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filteredSavedTasks.map(task => {
            const pBadge = getPriorityBadge(task.priority);
            const banner = task.attachments?.find(a => a.type === 'banner');
            const briefingVideo = task.attachments?.find(a => a.type === 'briefing_video');
            const briefingFiles = (task.attachments || []).filter(a => a.type === 'briefing_file');
            const fileAttachments = (task.attachments || []).filter(a => 
              a.type !== 'submission_note' && a.type !== 'banner' && a.type !== 'briefing_video' && a.type !== 'briefing_file'
            );
            const noteAttachments = (task.attachments || []).filter(a => a.type === 'submission_note');

            return (
              <div
                key={task.id}
                className="task-glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 22,
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  background: 'rgba(14, 18, 16, 0.55)',
                  backdropFilter: 'blur(50px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                  boxShadow: '0 18px 40px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(16, 185, 129, 0.2)',
                  borderRadius: 20
                }}
              >
                <div>
                  {/* Task Cover Banner */}
                  {banner && (
                    <div style={{
                      margin: '-20px -20px 14px -20px',
                      height: 110,
                      position: 'relative',
                      overflow: 'hidden',
                      borderTopLeftRadius: 'inherit',
                      borderTopRightRadius: 'inherit',
                      borderBottom: '1px solid #1d3827',
                      background: '#09090b'
                    }}>
                      <img
                        src={banner.url}
                        alt={task.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,19,16,0.7) 100%)',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  )}

                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#14231b',
                        color: '#4ade80',
                        border: '1px solid #1d3827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <ShieldCheck size={11} />
                        <span>Permanent</span>
                      </span>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: pBadge.bg,
                        color: pBadge.color,
                        border: `1px solid ${pBadge.border}`,
                      }}>
                        {pBadge.label}
                      </span>

                      {task.department && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#161618',
                          color: '#a1a1aa',
                          border: '1px solid #27272a',
                        }}>
                          {task.department}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnsaveTask(task.id)}
                      title="Remove from Saved Vault"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p style={{ fontSize: 12, color: '#a1a1aa', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Preserved Briefing Video */}
                  {briefingVideo && (
                    <div style={{
                      marginBottom: 12,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #1f2b23',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#121a15',
                        borderBottom: '1px solid #1f2b23'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#4ade80' }}>
                          <Film size={12} />
                          <span>Briefing Video</span>
                        </div>
                        {!briefingVideo.url.startsWith('data:video') && (
                          <a
                            href={sanitizeUrl(briefingVideo.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#93c5fd', textDecoration: 'none' }}
                          >
                            <span>Open</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      {briefingVideo.url.startsWith('data:video') ? (
                        <video src={sanitizeUrl(briefingVideo.url)} controls style={{ width: '100%', maxHeight: 150, display: 'block' }} />
                      ) : (
                        <div style={{ padding: '8px 10px', fontSize: 11, color: '#a1a1aa' }}>
                          <a href={sanitizeUrl(briefingVideo.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'underline', wordBreak: 'break-all' }}>
                            {briefingVideo.url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preserved Briefing Reference Files */}
                  {briefingFiles.length > 0 && (
                    <div style={{
                      marginBottom: 12,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #1f2b23',
                      borderRadius: 8,
                      padding: '10px 12px'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Paperclip size={12} />
                        <span>Briefing Reference Materials ({briefingFiles.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {briefingFiles.map((bf, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#141416',
                              border: '1px solid #27272a',
                              padding: '5px 8px',
                              borderRadius: 4,
                              fontSize: 11
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                              <FileText size={11} style={{ color: '#71717a' }} />
                              <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {bf.name}
                              </span>
                              <span style={{ color: '#71717a', fontSize: 9.5 }}>
                                ({formatFileSize(bf.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadDeliverableFile(bf.url, bf.name)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10,
                                padding: '2px 7px',
                                background: '#27272a',
                                border: '1px solid #3f3f46',
                                borderRadius: 4,
                                color: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <Download size={10} /> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Preserved Files */}
                  {fileAttachments.length > 0 && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #1f2b23',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Paperclip size={12} />
                          <span>Preserved Deliverable Files ({fileAttachments.length})</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {fileAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#141416',
                              border: '1px solid #27272a',
                              padding: '6px 10px',
                              borderRadius: 4,
                              fontSize: 11
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                              <FileCheck size={12} style={{ color: '#4ade80', flexShrink: 0 }} />
                              <span style={{ color: '#ffffff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.name}
                              </span>
                              <span style={{ color: '#71717a', fontSize: 10, flexShrink: 0 }}>
                                ({formatFileSize(att.size)})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => downloadDeliverableFile(att.url, att.name)}
                              title="Download to computer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10.5,
                                fontWeight: 600,
                                padding: '3px 8px',
                                background: '#27272a',
                                border: '1px solid #3f3f46',
                                borderRadius: 4,
                                color: '#ffffff',
                                cursor: 'pointer',
                                marginLeft: 8,
                                flexShrink: 0
                              }}
                            >
                              <Download size={11} />
                              <span>Download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Preserved Work Summaries / Notes */}
                  {noteAttachments.length > 0 && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid #1f2b23',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <FileText size={12} />
                        <span>Preserved Work Summary</span>
                      </div>
                      {noteAttachments.map((note, idx) => (
                        <div key={idx} style={{
                          fontSize: 11.5,
                          color: '#e4e4e7',
                          background: '#141416',
                          borderLeft: '3px solid #60a5fa',
                          padding: '6px 10px',
                          borderRadius: 4,
                          lineHeight: 1.45,
                          whiteSpace: 'pre-wrap',
                          marginBottom: idx < noteAttachments.length - 1 ? 6 : 0
                        }}>
                          {note.note || note.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review Approval Details */}
                  {task.reviewed_by_name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10.5,
                      color: '#4ade80',
                      marginBottom: 10
                    }}>
                      <CheckCircle2 size={12} />
                      <span>Approved by {task.reviewed_by_name}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ borderTop: '1px solid #1f2b23', paddingTop: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 10, color: '#71717a' }}>
                      {task.assigned_to_name ? `By ${task.assigned_to_name}` : 'Team Deliverable'}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {fileAttachments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDownloadAll(task)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 12px',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: 6,
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Download size={11} />
                          <span>Download All</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleUnsaveTask(task.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          background: 'transparent',
                          border: '1px solid #27272a',
                          borderRadius: 6,
                          color: '#a1a1aa',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                        <span>Unsave</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
