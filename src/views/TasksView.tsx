import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { getSupabaseClient } from '../lib/supabase';
import { Task, TaskPriority, TaskStatus, TaskAttachment } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Tag, 
  Trash2, 
  X, 
  Layers, 
  ArrowUpDown, 
  Upload, 
  FileText, 
  Download, 
  Paperclip, 
  Users, 
  Check, 
  FileCheck, 
  ExternalLink,
  ChevronDown,
  Timer,
  ShieldCheck,
  RotateCcw,
  Send,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Image,
  Film,
  Video,
  FileUp,
  Play,
  Lock,
  Edit2
} from 'lucide-react';
import { downloadDeliverableFile } from './SavedItemsView';
import { sanitizeUrl, isSafeHttpUrl, validateAttachmentFile } from '../lib/security';
import { addNotification } from '../lib/notificationsService';

export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const BANNER_PRESETS = [
  {
    id: 'obsidian-grid',
    name: 'Obsidian Grid',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300"><rect width="800" height="300" fill="%2309090b"/><defs><radialGradient id="g1" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="%2327272a"/><stop offset="100%" stop-color="%2309090b"/></radialGradient><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="%2327272a" stroke-width="0.8" opacity="0.6"/></pattern></defs><rect width="800" height="300" fill="url(%23g1)"/><rect width="800" height="300" fill="url(%23grid)"/><circle cx="700" cy="80" r="140" fill="%2318181b" opacity="0.4"/><text x="40" y="160" fill="%23ffffff" font-family="sans-serif" font-weight="700" font-size="28" letter-spacing="2">CEOVA CORE</text><text x="40" y="195" fill="%2371717a" font-family="sans-serif" font-size="13" letter-spacing="1">PROJECT DELIVERABLE BRIEF</text></svg>'
  },
  {
    id: 'executive-carbon',
    name: 'Executive Carbon',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300"><rect width="800" height="300" fill="%23050507"/><defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2318181b"/><stop offset="100%" stop-color="%2309090b"/></linearGradient></defs><rect width="800" height="300" fill="url(%23grad2)"/><path d="M-50,220 Q200,60 450,200 T850,100" fill="none" stroke="%233f3f46" stroke-width="1.5" opacity="0.5"/><path d="M-50,240 Q250,80 500,220 T850,120" fill="none" stroke="%2327272a" stroke-width="1" opacity="0.4"/><text x="40" y="160" fill="%23ffffff" font-family="sans-serif" font-weight="700" font-size="28" letter-spacing="2">EXECUTIVE DIRECTIVE</text><text x="40" y="195" fill="%23a1a1aa" font-family="sans-serif" font-size="13" letter-spacing="1">SYSTEM ASSIGNMENT</text></svg>'
  },
  {
    id: 'neural-matrix',
    name: 'Neural Matrix',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300"><rect width="800" height="300" fill="%230a0a0c"/><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="%233f3f46" opacity="0.5"/></pattern></defs><rect width="800" height="300" fill="url(%23dots)"/><rect x="520" y="40" width="220" height="220" rx="16" fill="%23121215" stroke="%2327272a" stroke-width="1"/><text x="40" y="160" fill="%23ffffff" font-family="sans-serif" font-weight="700" font-size="28" letter-spacing="2">NEURAL PIPELINE</text><text x="40" y="195" fill="%2371717a" font-family="sans-serif" font-size="13" letter-spacing="1">SPECIFICATION &amp; BENCHMARK</text></svg>'
  },
  {
    id: 'studio-minimal',
    name: 'Studio Minimal',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300"><rect width="800" height="300" fill="%23101013"/><line x1="40" y1="80" x2="760" y2="80" stroke="%2327272a" stroke-width="1"/><line x1="40" y1="220" x2="760" y2="220" stroke="%2327272a" stroke-width="1"/><text x="40" y="155" fill="%23ffffff" font-family="sans-serif" font-weight="700" font-size="26" letter-spacing="3">CREATIVE &amp; SPRINT</text><text x="40" y="185" fill="%2371717a" font-family="sans-serif" font-size="12" letter-spacing="1">PRODUCTION DELIVERABLE</text></svg>'
  }
];

const STORAGE_KEY = 'ceova_local_tasks_cache_v2';
const SAVED_IDS_KEY = 'ceova_saved_task_ids';

const FILE_TYPE_PRESETS = [
  { label: 'Any File Type', value: 'all' },
  { label: 'Documents (PDF, Word, Text)', value: '.pdf,.doc,.docx,.txt' },
  { label: 'Images (PNG, JPG, SVG, WebP)', value: '.png,.jpg,.jpeg,.webp,.svg' },
  { label: 'Spreadsheets (Excel, CSV)', value: '.xlsx,.xls,.csv' },
  { label: 'Archives & Code (ZIP, JSON)', value: '.zip,.tar,.gz,.json' },
  { label: 'Custom Extensions', value: 'custom' },
];

export const TaskCountdownTimer: React.FC<{ dueDate?: string | null; status: TaskStatus; label?: string }> = ({ dueDate, status, label }) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!dueDate || status === 'completed' || status === 'review') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [dueDate, status]);

  if (status === 'completed' || status === 'review') {
    return null;
  }

  if (!dueDate) {
    return (
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        No deadline set
      </span>
    );
  }

  const target = new Date(dueDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: '#ef4444',
        fontSize: 10,
        fontWeight: 700
      }}>
        <AlertTriangle size={11} />
        <span>Overdue: {days > 0 ? `${days}d ` : ''}{hours}h {mins}m</span>
      </span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const isCritical = diff < 2 * 3600 * 1000; // < 2 hours
  const isSoon = diff < 24 * 3600 * 1000; // < 24 hours

  const bg = isCritical ? 'rgba(239, 68, 68, 0.15)' : isSoon ? 'rgba(245, 158, 11, 0.15)' : '#18181b';
  const border = isCritical ? 'rgba(239, 68, 68, 0.35)' : isSoon ? 'rgba(245, 158, 11, 0.35)' : '#27272a';
  const color = isCritical ? '#ef4444' : isSoon ? '#f59e0b' : '#e4e4e7';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeString = days > 0 
    ? `${days}d ${pad(hours)}h ${pad(mins)}m`
    : `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 4,
      background: bg,
      border: `1px solid ${border}`,
      color: color,
      fontSize: 10,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums'
    }}>
      <Clock size={11} />
      <span>{label ? `${label} ` : ''}{timeString} left</span>
    </span>
  );
};

export const TaskAutoDeleteTimer: React.FC<{
  completedAt?: string | null;
  isSaved?: boolean;
  onExpire?: () => void;
}> = ({ completedAt, isSaved, onExpire }) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (isSaved || !completedAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [completedAt, isSaved]);

  if (isSaved) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 20,
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontSize: 10.5,
        fontWeight: 600
      }}>
        <ShieldCheck size={11} />
        <span>Saved • Permanent</span>
      </span>
    );
  }

  const baseTime = completedAt ? new Date(completedAt).getTime() : Date.now();
  const expiresAt = baseTime + 72 * 3600 * 1000;
  const diff = expiresAt - now;

  if (diff <= 0) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 20,
        background: 'rgba(239, 68, 68, 0.12)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontSize: 10.5,
        fontWeight: 600
      }}>
        <Trash2 size={11} />
        <span>Purging now...</span>
      </span>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const isUrgent = hours < 12;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 20,
      background: isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.08)',
      color: isUrgent ? '#f87171' : '#fbbf24',
      border: isUrgent ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      fontSize: 10.5,
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.01em'
    }} title="Completed deliverables are automatically deleted after 72 hours unless saved.">
      <Clock size={11} style={{ opacity: 0.85 }} />
      <span>Auto-deletes in {hours}h {mins}m {secs}s</span>
    </span>
  );
};

export const getSubmissionGraceStatus = (task: Task) => {
  if (task.status !== 'review') return { isReview: false, isWithinGrace: true, remainingMs: 0 };
  const subTime = task.submitted_at 
    ? new Date(task.submitted_at).getTime()
    : ((task.attachments || []).filter(a => a.type === 'submission_note' || a.uploaded_at).slice(-1)[0]?.uploaded_at
      ? new Date((task.attachments || []).filter(a => a.type === 'submission_note' || a.uploaded_at).slice(-1)[0].uploaded_at!).getTime()
      : new Date(task.created_at).getTime());
  const elapsed = Date.now() - subTime;
  const remainingMs = Math.max(0, 5 * 60 * 1000 - elapsed);
  return {
    isReview: true,
    isWithinGrace: remainingMs > 0,
    remainingMs
  };
};

interface SubmissionGraceTimerProps {
  task: Task;
  isAssignedToUser: boolean;
  isOwner: boolean;
  onEditDeliverable: () => void;
}

export const SubmissionGraceTimer: React.FC<SubmissionGraceTimerProps> = ({
  task,
  isAssignedToUser,
  isOwner,
  onEditDeliverable
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const submissionTime = useMemo(() => {
    if (task.submitted_at) return new Date(task.submitted_at).getTime();
    const lastNote = (task.attachments || [])
      .filter(a => a.type === 'submission_note' || a.uploaded_at)
      .slice(-1)[0];
    if (lastNote?.uploaded_at) return new Date(lastNote.uploaded_at).getTime();
    return new Date(task.created_at).getTime();
  }, [task.submitted_at, task.attachments, task.created_at]);

  const graceDurationMs = 5 * 60 * 1000;
  const elapsedMs = now - submissionTime;
  const remainingMs = Math.max(0, graceDurationMs - elapsedMs);
  const isGraceActive = remainingMs > 0;

  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  const timeFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

  if (isGraceActive) {
    return (
      <div style={{
        background: 'rgba(234, 179, 8, 0.08)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#facc15', fontWeight: 600 }}>
            <Clock size={13} />
            <span>5-Min Edit Window Active: <strong style={{ color: '#fef08a' }}>{timeFormatted}</strong> left to edit</span>
          </div>

          {isAssignedToUser && (
            <button
              type="button"
              onClick={onEditDeliverable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                color: '#000000',
                background: '#facc15',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Edit2 size={11} />
              <span>Edit Deliverable</span>
            </button>
          )}
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: 10.5, color: '#d4d4d8', lineHeight: 1.4 }}>
          {isAssignedToUser 
            ? 'You have 5 minutes after submitting to make edits or replace files. Once this timer ends, your submission locks until reviewed.'
            : 'Assignee is within their 5-minute grace window and may update deliverables before it locks.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(168, 85, 247, 0.08)',
      border: '1px solid rgba(168, 85, 247, 0.25)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#c084fc', fontWeight: 700, marginBottom: 4 }}>
        <Lock size={13} style={{ flexShrink: 0 }} />
        <span>Submission Locked • 5-Min Edit Window Expired</span>
      </div>
      <p style={{ margin: 0, fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {isOwner
          ? `Submitted deliverables are locked. Please review the deliverables above and approve or request a retry.`
          : `Deliverables are locked awaiting evaluation by ${task.assigned_by_name || 'the task owner'}. Editing is disabled until the owner requests a retry.`}
      </p>
    </div>
  );
};

export interface TasksViewProps {
  initialScope?: 'mine' | 'delegated' | 'all';
}

export const TasksView: React.FC<TasksViewProps> = ({ initialScope }) => {
  const { user, role } = useAuth();
  const { members } = usePortalData();

  const isAdminUser = role === 'admin' || role === 'ceo';
  const isMemberUser = role === 'member';

  // Admin and members have task assignment privileges; interns can view, submit deliverables & update status
  const canAssign = isAdminUser || isMemberUser;

  // Filter assignable members: Admin -> members & interns; Member -> interns only (excluding paused/blocked accounts)
  const assignableMembers = useMemo(() => {
    const activeMembers = members.filter(m => m.status !== 'blocked' && m.status !== 'paused');
    if (isAdminUser) {
      return activeMembers.filter(m => m.role === 'member' || m.role === 'intern' || m.role === 'admin' || m.role === 'ceo');
    }
    if (isMemberUser) {
      return activeMembers.filter(m => m.role === 'intern');
    }
    return [];
  }, [members, isAdminUser, isMemberUser]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localSavedIds, setLocalSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_IDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  // Default viewScope is 'mine' so users only see their own tasks in their To-Do list by default
  const [viewScope, setViewScope] = useState<'all' | 'mine' | 'delegated'>(() => {
    return initialScope || 'mine';
  });

  // Sync with initialScope if passed from dashboard navigation
  useEffect(() => {
    if (initialScope) {
      setViewScope(initialScope);
    }
  }, [initialScope]);

  // Robust check: Is this task assigned to the currently logged in user?
  const isAssignedToMe = useCallback((t: Task) => {
    if (!user?.id) return false;
    return Boolean(
      (t.assigned_to_ids && t.assigned_to_ids.includes(user.id)) ||
      t.assigned_to_id === user.id ||
      (t.assigned_to_names && user.full_name && t.assigned_to_names.includes(user.full_name)) ||
      (t.assigned_to_name && user.full_name && t.assigned_to_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
    );
  }, [user]);

  // Robust check: Was this task given/delegated by the currently logged in user?
  const isGivenByMe = useCallback((t: Task) => {
    if (!user?.id) return false;
    return Boolean(
      t.assigned_by_id === user.id ||
      (t.assigned_by_name && user.full_name && t.assigned_by_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
    );
  }, [user]);

  // Scope counts for header pills (Assigned to Me, Given to Members, All Team)
  const scopeCounts = useMemo(() => {
    const mine = tasks.filter(t => isAssignedToMe(t)).length;
    const delegated = tasks.filter(t => isGivenByMe(t)).length;
    return { mine, delegated, all: tasks.length };
  }, [tasks, isAssignedToMe, isGivenByMe]);

  // Scoped tasks based on active viewScope (prevents tasks assigned to others from polluting user's To-Do list)
  const scopedTasks = useMemo(() => {
    if (viewScope === 'mine') {
      return tasks.filter(t => isAssignedToMe(t));
    }
    if (viewScope === 'delegated') {
      return tasks.filter(t => isGivenByMe(t));
    }
    return tasks;
  }, [tasks, viewScope, isAssignedToMe, isGivenByMe]);

  // Status counts scoped to active viewScope
  const statusCounts = useMemo(() => {
    const counts = { all: scopedTasks.length, todo: 0, in_progress: 0, review: 0, completed: 0 };
    scopedTasks.forEach(t => {
      if ((counts as any)[t.status] !== undefined) {
        (counts as any)[t.status]++;
      }
    });
    return counts;
  }, [scopedTasks]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Multiple Assignees Selection (by User IDs)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const userPickerRef = useRef<HTMLDivElement>(null);

  const [department, setDepartment] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');

  // File Upload Requirement Fields
  const [requiresUpload, setRequiresUpload] = useState(false);
  const [uploadInstructions, setUploadInstructions] = useState('');
  const [fileTypePreset, setFileTypePreset] = useState('all');
  const [customFileTypes, setCustomFileTypes] = useState('');
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(10);

  // Task Banner State (Cover/Thumbnail - Required on create)
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [bannerPresetId, setBannerPresetId] = useState<string | null>(null);

  // Task Briefing Video State (Optional / if required)
  const [briefingVideoFile, setBriefingVideoFile] = useState<File | null>(null);
  const [briefingVideoPreview, setBriefingVideoPreview] = useState<string>('');
  const [briefingVideoLink, setBriefingVideoLink] = useState<string>('');
  const [briefingVideoMode, setBriefingVideoMode] = useState<'upload' | 'link'>('upload');

  // Task Briefing Reference Files State (Optional / if required)
  const [briefingFiles, setBriefingFiles] = useState<File[]>([]);

  // Uploading state tracking per task ID
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // Review & Improvement evaluation state
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [reviewFeedbackText, setReviewFeedbackText] = useState<string>('');
  const [retryDueDate, setRetryDueDate] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Deliverable submission modal state for assignees
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);
  const [submissionNoteText, setSubmissionNoteText] = useState<string>('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>('');

  // Close user picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target as Node)) {
        setIsUserPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
        console.error('Error fetching tasks from Supabase:', error.message);
      } else if (data) {
        setTasks(data as Task[]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        purgeExpiredTasks(data as Task[]);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Check for 72h expired tasks every minute
    const purgeInterval = setInterval(() => {
      purgeExpiredTasks(tasks);
    }, 60000);

    const supabase = getSupabaseClient();
    if (!supabase) return () => clearInterval(purgeInterval);

    const channel = supabase
      .channel('ceova-realtime-tasks-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      clearInterval(purgeInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter assignable members based on the modal user search
  const filteredPickerMembers = useMemo(() => {
    if (!assigneeSearchQuery.trim()) return assignableMembers;
    const q = assigneeSearchQuery.toLowerCase();
    return assignableMembers.filter(m => 
      m.full_name.toLowerCase().includes(q) || 
      (m.department && m.department.toLowerCase().includes(q))
    );
  }, [assignableMembers, assigneeSearchQuery]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (.png, .jpg, .webp, .svg) for the task banner.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
      setBannerFile(file);
      setBannerPresetId(null);
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetBanner = (preset: typeof BANNER_PRESETS[0]) => {
    setBannerPreview(preset.url);
    setBannerPresetId(preset.id);
    setBannerFile(null);
    setFormError('');
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    setBannerPresetId(null);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (.mp4, .mov, .webm).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size exceeds 50MB. Please use a smaller video file or paste a video link instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBriefingVideoPreview(reader.result as string);
      setBriefingVideoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleBriefingFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBriefingFiles(prev => [...prev, ...files]);
  };

  const handleRemoveBriefingFile = (index: number) => {
    setBriefingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (!bannerPreview) {
      setFormError('Task banner is required. Please upload an image banner or select an executive preset.');
      return;
    }

    if (selectedUserIds.length === 0) {
      setFormError(isMemberUser ? 'Please select at least one intern to assign the deliverable to.' : 'Please select at least one team member or intern.');
      return;
    }

    // Role verification: members can only assign to interns
    const selectedUsers = members.filter(m => selectedUserIds.includes(m.id));
    if (isMemberUser && selectedUsers.some(m => m.role !== 'intern')) {
      setFormError('Members are only permitted to assign deliverables to Interns.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const assignedIds = selectedUsers.map(u => u.id);
      const assignedNames = selectedUsers.map(u => u.full_name);
      const firstUser = selectedUsers[0];

      const tagsList = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const resolvedAllowedTypes = fileTypePreset === 'custom' 
        ? customFileTypes.trim() || 'all' 
        : fileTypePreset;

      // Assemble initial briefing attachments (Banner + Briefing Video + Reference Files)
      const initialAttachments: TaskAttachment[] = [];

      // 1. Task Banner (Required)
      initialAttachments.push({
        name: bannerFile ? bannerFile.name : (bannerPresetId ? `preset-${bannerPresetId}.svg` : 'task-banner.png'),
        url: bannerPreview,
        size: bannerFile ? bannerFile.size : 1024,
        type: 'banner',
        uploaded_by: user?.full_name || (isAdminUser ? 'Admin' : 'Member'),
        uploaded_at: new Date().toISOString()
      });

      // 2. Task Briefing Video (Optional / if required)
      if (briefingVideoPreview && briefingVideoFile) {
        initialAttachments.push({
          name: briefingVideoFile.name,
          url: briefingVideoPreview,
          size: briefingVideoFile.size,
          type: 'briefing_video',
          uploaded_by: user?.full_name || (isAdminUser ? 'Admin' : 'Member'),
          uploaded_at: new Date().toISOString()
        });
      } else if (briefingVideoLink.trim()) {
        const cleanVideoLink = briefingVideoLink.trim();
        if (!isSafeHttpUrl(cleanVideoLink)) {
          setFormError('Please enter a valid HTTP/HTTPS video link (e.g. https://...).');
          setSubmitting(false);
          return;
        }
        initialAttachments.push({
          name: 'Task Briefing Video Link',
          url: sanitizeUrl(cleanVideoLink),
          size: 0,
          type: 'briefing_video',
          uploaded_by: user?.full_name || (isAdminUser ? 'Admin' : 'Member'),
          uploaded_at: new Date().toISOString()
        });
      }

      // 3. Task Briefing Reference Files (Optional / if required)
      for (const bf of briefingFiles) {
        const fileValidation = validateAttachmentFile(bf, 'document');
        if (!fileValidation.valid) {
          setFormError(fileValidation.error || `Invalid briefing file: ${bf.name}`);
          setSubmitting(false);
          return;
        }
        const dataUrl = await readFileAsDataUrl(bf);
        initialAttachments.push({
          name: bf.name,
          url: dataUrl,
          size: bf.size,
          type: 'briefing_file',
          uploaded_by: user?.full_name || (isAdminUser ? 'Admin' : 'Member'),
          uploaded_at: new Date().toISOString()
        });
      }

      const newTaskPayload = {
        title: title.trim(),
        description: description.trim() || null,
        assigned_to_id: firstUser ? firstUser.id : null,
        assigned_to_name: assignedNames.join(', '),
        assigned_to_ids: assignedIds,
        assigned_to_names: assignedNames,
        assigned_by_id: user?.id || null,
        assigned_by_name: user?.full_name || (isAdminUser ? 'Admin' : 'Member'),
        department: department || (firstUser?.department || 'General'),
        priority,
        status: 'todo' as TaskStatus,
        due_date: dueDate || null,
        tags: tagsList,
        requires_upload: requiresUpload,
        upload_instructions: requiresUpload ? (uploadInstructions.trim() || 'Please attach the completed deliverables.') : null,
        allowed_file_types: requiresUpload ? resolvedAllowedTypes : null,
        max_file_size_mb: requiresUpload ? maxFileSizeMb : null,
        attachments: initialAttachments,
      };

      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('tasks')
          .insert(newTaskPayload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setTasks(prev => [data as Task, ...prev]);
        }
      } else {
        // Fallback for local offline demo
        const localTask: Task = {
          id: 'task_' + Date.now(),
          ...newTaskPayload,
          created_at: new Date().toISOString(),
        };
        setTasks(prev => [localTask, ...prev]);
      }

      // Reset Form & Close
      setTitle('');
      setDescription('');
      setSelectedUserIds([]);
      setAssigneeSearchQuery('');
      setDepartment('General');
      setPriority('normal');
      setDueDate('');
      setTagInput('');
      setRequiresUpload(false);
      setUploadInstructions('');
      setFileTypePreset('all');
      setCustomFileTypes('');
      setMaxFileSizeMb(10);
      setBannerFile(null);
      setBannerPreview('');
      setBannerPresetId(null);
      setBriefingVideoFile(null);
      setBriefingVideoPreview('');
      setBriefingVideoLink('');
      setBriefingFiles([]);
      setIsModalOpen(false);

      // If task was assigned to other members, switch view to 'delegated' so creator sees it under Given to Members
      const assignedToCurrentUser = assignedIds.includes(user?.id || '');
      if (!assignedToCurrentUser) {
        setViewScope('delegated');
        setStatusFilter('all');
      } else {
        setViewScope('mine');
      }
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setFormError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const isOwner = isAdminUser || currentTask.assigned_by_id === user?.id || currentTask.assigned_by_name === user?.full_name;
    const isAssignedToUser = (currentTask.assigned_to_ids && user?.id && currentTask.assigned_to_ids.includes(user.id)) ||
                             currentTask.assigned_to_id === user?.id ||
                             currentTask.assigned_to_name === user?.full_name;

    // If an assignee (non-owner/admin) attempts to submit or complete, enforce the deliverable submission modal
    if ((targetStatus === 'completed' || targetStatus === 'review') && !isOwner && isAssignedToUser) {
      setSubmittingTask(currentTask);
      setSubmissionNoteText('');
      setSubmissionFile(null);
      setSubmissionError('');
      return;
    }

    if (currentTask.status === 'review' && !isOwner) {
      const grace = getSubmissionGraceStatus(currentTask);
      if (!grace.isWithinGrace) {
        alert('This deliverable is locked. The 5-minute edit window has expired. Awaiting reviewer feedback.');
        return;
      }
    }

    let finalStatus: TaskStatus = targetStatus;

    if (targetStatus === 'completed' && !isOwner) {
      finalStatus = 'review';
    }

    const updatePayload: Partial<Task> = {
      status: finalStatus
    };

    if (finalStatus === 'completed' && isOwner) {
      updatePayload.reviewed_by_id = user?.id || null;
      updatePayload.reviewed_by_name = user?.full_name || null;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatePayload } : t));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', taskId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      fetchTasks(); // Rollback on failure
    }
  };

  // Task Owner / Admin Review Actions (Approve or Reject with feedback)
  const handleReviewAction = async (taskId: string, decision: 'approve' | 'reject', feedbackText?: string, newDeadlineIso?: string) => {
    if (decision === 'reject' && !newDeadlineIso) {
      alert('Please select a new deadline timer for this task before requesting a retry.');
      return;
    }

    setReviewSubmitting(true);
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) {
      setReviewSubmitting(false);
      return;
    }

    const newStatus: TaskStatus = decision === 'approve' ? 'completed' : 'in_progress';
    const updatePayload: Partial<Task> = {
      status: newStatus,
      reviewed_by_id: user?.id || null,
      reviewed_by_name: user?.full_name || null,
      reviewed_at: new Date().toISOString(),
      submitted_at: decision === 'reject' ? null : (targetTask.submitted_at || null),
      review_feedback: decision === 'reject' 
        ? (feedbackText?.trim() || 'Please revise the requirements and submit updated deliverables.') 
        : null,
      ...(decision === 'reject' && newDeadlineIso ? { due_date: newDeadlineIso } : {})
    };

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatePayload } : t));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', taskId);

        if (error) {
          if (error.message && error.message.includes('submitted_at')) {
            const fallback = { ...updatePayload };
            delete fallback.submitted_at;
            await supabase.from('tasks').update(fallback).eq('id', taskId);
          } else {
            throw error;
          }
        }
      }

      // Dispatch notification (and Resend email) to assignee
      try {
        const recipientIds = targetTask.assigned_to_ids && targetTask.assigned_to_ids.length > 0
          ? targetTask.assigned_to_ids
          : (targetTask.assigned_to_id ? [targetTask.assigned_to_id] : []);
        
        if (decision === 'reject') {
          addNotification({
            title: 'Task Revision Required (Retry)',
            message: `Feedback for "${targetTask.title}": ${feedbackText?.trim() || 'Please revise your deliverables and re-submit.'}. A new deadline has been set.`,
            target_type: 'members',
            recipient_ids: recipientIds,
            type: 'task'
          });
        } else {
          addNotification({
            title: 'Task Deliverable Approved',
            message: `Your deliverable for "${targetTask.title}" has been reviewed and approved by ${user?.full_name || 'Task Owner'}.`,
            target_type: 'members',
            recipient_ids: recipientIds,
            type: 'task'
          });
        }
      } catch (notifErr) {
        console.warn('Failed to dispatch review notification:', notifErr);
      }

      setReviewingTaskId(null);
      setReviewFeedbackText('');
      setRetryDueDate('');
    } catch (err: any) {
      console.error('Error submitting task review:', err);
      alert('Failed to submit review: ' + (err.message || 'Unknown error'));
      fetchTasks();
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Upload deliverable file to Supabase Storage and attach to task
  const handleUploadDeliverable = async (task: Task, file: File) => {
    const isOwner = isAdminUser || task.assigned_by_id === user?.id || task.assigned_by_name === user?.full_name;
    if (task.status === 'review' && !isOwner) {
      const grace = getSubmissionGraceStatus(task);
      if (!grace.isWithinGrace) {
        alert('This deliverable is locked. The 5-minute edit window has expired. Awaiting reviewer feedback.');
        return;
      }
    }

    // 0. Security Extension & Payload Verification
    const securityCheck = validateAttachmentFile(file, 'document');
    if (!securityCheck.valid) {
      alert(securityCheck.error || 'This file type is blocked for security purposes.');
      return;
    }

    // 1. File Size Verification
    const limitMb = task.max_file_size_mb || 10;
    const maxBytes = limitMb * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File size exceeds the limit. Maximum allowed size is ${limitMb} MB (Selected file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // 2. File Type Verification
    if (task.allowed_file_types && task.allowed_file_types !== 'all') {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = task.allowed_file_types
        .toLowerCase()
        .split(',')
        .map(e => e.trim());
      
      const isAllowed = allowedExtensions.some(a => a === ext || file.type.toLowerCase().includes(a.replace('.', '')));
      if (!isAllowed) {
        alert(`Invalid file extension. This deliverable requires: ${task.allowed_file_types}`);
        return;
      }
    }

    setUploadingTaskId(task.id);

    try {
      const supabase = getSupabaseClient();
      let fileUrl = '';

      if (supabase) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `task_deliverables/${task.id}/${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from('portal-assets')
          .upload(storagePath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('portal-assets')
          .getPublicUrl(storagePath);

        fileUrl = publicUrlData.publicUrl;
      } else {
        fileUrl = URL.createObjectURL(file);
      }

      const newAttachment: TaskAttachment = {
        name: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type || 'file',
        uploaded_by: user?.full_name || 'Team Member',
        uploaded_at: new Date().toISOString()
      };

      const updatedAttachments = [...(task.attachments || []), newAttachment];
      // Keep in progress when file is uploaded
      const updatedStatus: TaskStatus = task.status === 'todo' ? 'in_progress' : task.status;

      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, attachments: updatedAttachments, status: updatedStatus } : t
      ));

      if (supabase) {
        const { error: dbError } = await supabase
          .from('tasks')
          .update({
            attachments: updatedAttachments,
            status: updatedStatus
          })
          .eq('id', task.id);

        if (dbError) throw dbError;
      }
    } catch (err: any) {
      console.error('Deliverable upload failed:', err);
      alert('Failed to upload deliverable: ' + (err.message || 'Unknown error'));
      fetchTasks();
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleDeleteAttachment = async (task: Task, attachmentIndex: number) => {
    const isOwner = isAdminUser || task.assigned_by_id === user?.id || task.assigned_by_name === user?.full_name;
    if (task.status === 'review' && !isOwner) {
      const grace = getSubmissionGraceStatus(task);
      if (!grace.isWithinGrace) {
        alert('This deliverable is locked. The 5-minute edit window has expired.');
        return;
      }
    }
    if (!confirm('Are you sure you want to remove this attached deliverable?')) return;

    const updated = (task.attachments || []).filter((_, i) => i !== attachmentIndex);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, attachments: updated } : t));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from('tasks')
          .update({ attachments: updated })
          .eq('id', task.id);
      }
    } catch (err) {
      console.error('Failed to remove attachment:', err);
      fetchTasks();
    }
  };

  // Toggle Save Deliverable (Permanent preservation from 72h auto-delete)
  const handleToggleSave = async (task: Task) => {
    let currentSaved = [...localSavedIds];
    const isCurrentlySaved = (task.tags && task.tags.includes('saved')) || currentSaved.includes(task.id) || task.is_saved;
    const willSave = !isCurrentlySaved;

    let newTags = (task.tags || []).filter(t => t !== 'saved');
    if (willSave) {
      newTags.push('saved');
      if (!currentSaved.includes(task.id)) {
        currentSaved.push(task.id);
      }
    } else {
      currentSaved = currentSaved.filter(id => id !== task.id);
    }

    setLocalSavedIds(currentSaved);
    try {
      localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(currentSaved));
    } catch {}

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, tags: newTags, is_saved: willSave } : t));

    // Update Supabase
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from('tasks')
          .update({ tags: newTags })
          .eq('id', task.id);
      }
    } catch (err) {
      console.error('Error toggling saved state in Supabase:', err);
    }
  };

  // Purge completed tasks older than 72 hours unless saved
  const purgeExpiredTasks = async (currentTasks: Task[]) => {
    let savedIds: string[] = [];
    try {
      const stored = localStorage.getItem(SAVED_IDS_KEY);
      if (stored) savedIds = JSON.parse(stored);
    } catch {}

    const now = Date.now();
    const expiredUnsaved = currentTasks.filter(t => {
      if (t.status !== 'completed') return false;
      const isSaved = (t.tags && t.tags.includes('saved')) || savedIds.includes(t.id) || t.is_saved;
      if (isSaved) return false;
      const completedTime = new Date(t.reviewed_at || t.created_at).getTime();
      return now - completedTime >= 72 * 3600 * 1000;
    });

    if (expiredUnsaved.length > 0) {
      const expiredIds = expiredUnsaved.map(t => t.id);
      setTasks(prev => prev.filter(t => !expiredIds.includes(t.id)));

      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('tasks').delete().in('id', expiredIds);
        }
      } catch (err) {
        console.error('Error auto-purging expired completed tasks:', err);
      }
    }
  };

  // Submit Deliverable Work (Strictly requires file if requires_upload is true, or written summary if false)
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    setSubmissionError('');

    const hasExistingFile = submittingTask.attachments && submittingTask.attachments.some(a => 
      a.type !== 'submission_note' && a.type !== 'banner' && a.type !== 'briefing_video' && a.type !== 'briefing_file'
    );

    // Rule 1: If requires_upload is TRUE, file upload is strictly required
    if (submittingTask.requires_upload && !hasExistingFile && !submissionFile) {
      setSubmissionError('File upload is strictly required for this deliverable. Please attach your completed file before submitting.');
      return;
    }

    // Rule 2: If requires_upload is FALSE, writing a work summary is strictly required
    if (!submittingTask.requires_upload && !submissionNoteText.trim()) {
      setSubmissionError('Please write what you completed before submitting this deliverable.');
      return;
    }

    try {
      setSubmittingWork(true);
      const supabase = getSupabaseClient();
      let updatedAttachments: TaskAttachment[] = [...(submittingTask.attachments || [])];

      // If a file was selected in modal, upload it to storage
      if (submissionFile) {
        const securityCheck = validateAttachmentFile(submissionFile, 'document');
        if (!securityCheck.valid) {
          setSubmissionError(securityCheck.error || 'Blocked file type or size limit.');
          setSubmittingWork(false);
          return;
        }

        let fileUrl = '';
        if (supabase) {
          const sanitizedName = submissionFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `task_deliverables/${submittingTask.id}/${Date.now()}_${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from('portal-assets')
            .upload(storagePath, submissionFile, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('portal-assets')
            .getPublicUrl(storagePath);

          fileUrl = publicUrlData.publicUrl;
        } else {
          fileUrl = URL.createObjectURL(submissionFile);
        }

        updatedAttachments.push({
          name: submissionFile.name,
          url: fileUrl,
          size: submissionFile.size,
          type: submissionFile.type || 'file',
          uploaded_by: user?.full_name || 'Team Member',
          uploaded_at: new Date().toISOString()
        });
      }

      // If written summary was entered, record as submission note (replace prior note if editing)
      if (submissionNoteText.trim()) {
        updatedAttachments = updatedAttachments.filter(a => a.type !== 'submission_note');
        updatedAttachments.push({
          name: 'Work Submission Summary',
          url: '',
          size: submissionNoteText.trim().length,
          type: 'submission_note',
          uploaded_by: user?.full_name || 'Team Member',
          uploaded_at: new Date().toISOString(),
          note: submissionNoteText.trim()
        });
      }

      const submissionTimestamp = submittingTask.status === 'review' && submittingTask.submitted_at 
        ? submittingTask.submitted_at 
        : new Date().toISOString();

      const updatePayload: Partial<Task> = {
        attachments: updatedAttachments,
        status: 'review',
        submitted_at: submissionTimestamp
      };

      setTasks(prev => prev.map(t => t.id === submittingTask.id ? { ...t, ...updatePayload } : t));

      if (supabase) {
        const { error: dbError } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', submittingTask.id);

        if (dbError) {
          if (dbError.message && dbError.message.includes('submitted_at')) {
            const fallbackPayload = {
              attachments: updatedAttachments,
              status: 'review'
            };
            await supabase.from('tasks').update(fallbackPayload).eq('id', submittingTask.id);
          } else {
            throw dbError;
          }
        }
      }

      // Dispatch notification (and Resend email) to task owner/assigner
      try {
        if (submittingTask.assigned_by_id) {
          addNotification({
            title: 'Task Deliverable Submitted for Review',
            message: `Deliverable for "${submittingTask.title}" has been submitted by ${user?.full_name || 'Team Member'} for review. 5-minute grace window active.`,
            target_type: 'members',
            recipient_ids: [submittingTask.assigned_by_id],
            type: 'task'
          });
        }
      } catch (notifErr) {
        console.warn('Failed to dispatch submission notification:', notifErr);
      }

      setSubmittingTask(null);
      setSubmissionNoteText('');
      setSubmissionFile(null);
      setSubmissionError('');
    } catch (err: any) {
      console.error('Deliverable submission failed:', err);
      setSubmissionError('Submission failed: ' + (err.message || 'Unknown error'));
      fetchTasks();
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchTasks();
    }
  };

  // Filtered Tasks (using scopedTasks so user's To-Do list reflects only their assigned tasks when in 'mine' scope)
  const filteredTasks = useMemo(() => {
    return scopedTasks.filter(task => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesAssignee = task.assigned_to_names?.some(name => name.toLowerCase().includes(q)) ||
                                task.assigned_to_name?.toLowerCase().includes(q);
        const matchesTag = task.tags?.some(tag => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesTag) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [scopedTasks, searchQuery, statusFilter, priorityFilter]);

  // Statistics (scoped to current viewScope so the assigner's To-Do KPI is not polluted by tasks given to others)
  const stats = useMemo(() => {
    const total = scopedTasks.length;
    const todo = scopedTasks.filter(t => t.status === 'todo').length;
    const inProgress = scopedTasks.filter(t => t.status === 'in_progress').length;
    const review = scopedTasks.filter(t => t.status === 'review').length;
    const completed = scopedTasks.filter(t => t.status === 'completed').length;
    return { total, todo, inProgress, review, completed };
  }, [scopedTasks]);

  // Find nearest active deadline for the logged in user
  const nearestTaskForUser = useMemo(() => {
    const activeTasksWithDeadline = tasks
      .filter(t => {
        return isAssignedToMe(t) && t.status !== 'completed' && t.status !== 'review' && t.due_date;
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    return activeTasksWithDeadline[0] || null;
  }, [tasks, isAssignedToMe]);

  const applyDeadlinePreset = (preset: { hours?: number; special?: string }) => {
    const d = new Date();
    if (preset.special === 'today_6pm') {
      d.setHours(18, 0, 0, 0);
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }
    } else if (preset.hours) {
      d.setTime(d.getTime() + preset.hours * 3600 * 1000);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', bg: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: 'rgba(239, 68, 68, 0.22)' };
      case 'high':
        return { label: 'High', bg: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.22)' };
      case 'low':
        return { label: 'Low', bg: 'rgba(255, 255, 255, 0.03)', color: '#a1a1aa', border: 'rgba(255, 255, 255, 0.07)' };
      case 'normal':
      default:
        return { label: 'Normal', bg: 'rgba(255, 255, 255, 0.04)', color: '#d4d4d8', border: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return { label: 'Completed', bg: 'rgba(16, 185, 129, 0.09)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)', dot: '#10b981' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'rgba(59, 130, 246, 0.09)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)', dot: '#3b82f6' };
      case 'review':
        return { label: 'Under Review', bg: 'rgba(168, 85, 247, 0.09)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.25)', dot: '#a855f7' };
      case 'todo':
      default:
        return { label: 'To Do', bg: 'rgba(255, 255, 255, 0.03)', color: '#a1a1aa', border: 'rgba(255, 255, 255, 0.08)', dot: '#71717a' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="view-container fade-in">
      {/* Top Header */}
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div className="panel-title-wrap">
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#161618',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <CheckSquare size={19} />
          </div>
          <div>
            <h2 className="neo-serif-title" style={{ margin: 0, color: '#ffffff' }}>Tasks & Deliverables</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Assign multi-user tasks, manage required deliverable uploads, and track execution
            </p>
          </div>
        </div>

        {canAssign ? (
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #ffffff'
            }}
          >
            <Plus size={16} />
            <span>Assign Task</span>
          </button>
        ) : (
          <div style={{
            fontSize: 12,
            padding: '6px 12px',
            background: '#161618',
            border: '1px solid #27272a',
            borderRadius: 6,
            color: 'var(--text-muted)'
          }}>
            Intern View • Deliverable Submissions Active
          </div>
        )}
      </div>

      {/* KPI Stats Row (5-Column Executive Balanced Layout) */}
      <div className="tasks-kpi-grid">
        {/* 1. Total Tasks */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Tasks
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <Layers size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {stats.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#71717a' }} />
            <span>All deliverables</span>
          </div>
        </div>

        {/* 2. To Do */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To Do
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <Clock size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {stats.todo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#71717a' }} />
            <span>Queued pending</span>
          </div>
        </div>

        {/* 3. In Progress */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Progress
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <ArrowUpDown size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {stats.inProgress}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
            <span>Active work</span>
          </div>
        </div>

        {/* 4. Under Review */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Under Review
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {stats.review}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a1a1aa' }} />
            <span>Awaiting check</span>
          </div>
        </div>

        {/* 5. Completed */}
        <div className="tasks-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, marginBottom: 6 }}>
            {stats.completed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span>Delivered & done</span>
          </div>
        </div>
      </div>

      {/* Active Deadline Spotlight Banner for User's Nearest Task */}
      {nearestTaskForUser && (
        <div 
          style={{
            background: '#101012',
            border: '1px solid #27272a',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#18181b',
              border: '1px solid #2e2e33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <Timer size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa' }}>
                Active Deadline Spotlight • Deliverable Due
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginTop: 2 }}>
                {nearestTaskForUser.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TaskCountdownTimer dueDate={nearestTaskForUser.due_date} status={nearestTaskForUser.status} label="Time Remaining" />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        background: '#0d0d0f',
        border: '1px solid #222225',
        borderRadius: 14,
        padding: '10px 14px',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Status Tabs Segmented Control */}
          <div className="ceova-filter-scroll-row ceova-hide-scrollbar" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#121214',
            padding: 3,
            borderRadius: 8,
            border: '1px solid #222225',
            gap: 2,
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {[
              { id: 'all', label: 'All Tasks', count: statusCounts.all },
              { id: 'todo', label: 'To Do', count: statusCounts.todo },
              { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
              { id: 'review', label: 'Review', count: statusCounts.review },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    padding: '6px 13px',
                    borderRadius: 6,
                    border: active ? '1px solid #333338' : '1px solid transparent',
                    background: active ? '#27272a' : 'transparent',
                    color: active ? '#ffffff' : '#8e8e93',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#8e8e93';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: active ? '#18181b' : '#161618',
                    color: active ? '#ffffff' : '#71717a'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scope Toggle & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', maxWidth: '100%' }}>
            <div className="ceova-filter-scroll-row ceova-hide-scrollbar" style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#121214',
              borderRadius: 8,
              padding: 3,
              border: '1px solid #222225',
              gap: 2,
              overflowX: 'auto',
              maxWidth: '100%'
            }}>
              <button
                type="button"
                onClick={() => setViewScope('mine')}
                style={{
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontWeight: viewScope === 'mine' ? 600 : 500,
                  border: viewScope === 'mine' ? '1px solid #333338' : '1px solid transparent',
                  borderRadius: 6,
                  background: viewScope === 'mine' ? '#27272a' : 'transparent',
                  color: viewScope === 'mine' ? '#ffffff' : '#8e8e93',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Assigned to Me</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: viewScope === 'mine' ? '#18181b' : '#161618',
                  color: viewScope === 'mine' ? '#60a5fa' : '#71717a'
                }}>
                  {scopeCounts.mine}
                </span>
              </button>
              {canAssign && (
                <button
                  type="button"
                  onClick={() => setViewScope('delegated')}
                  style={{
                    padding: '5px 12px',
                    fontSize: 11.5,
                    fontWeight: viewScope === 'delegated' ? 600 : 500,
                    border: viewScope === 'delegated' ? '1px solid #333338' : '1px solid transparent',
                    borderRadius: 6,
                    background: viewScope === 'delegated' ? '#27272a' : 'transparent',
                    color: viewScope === 'delegated' ? '#ffffff' : '#8e8e93',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Given to Members</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: viewScope === 'delegated' ? '#18181b' : '#161618',
                    color: viewScope === 'delegated' ? '#c084fc' : '#71717a'
                  }}>
                    {scopeCounts.delegated}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewScope('all')}
                style={{
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontWeight: viewScope === 'all' ? 600 : 500,
                  border: viewScope === 'all' ? '1px solid #333338' : '1px solid transparent',
                  borderRadius: 6,
                  background: viewScope === 'all' ? '#27272a' : 'transparent',
                  color: viewScope === 'all' ? '#ffffff' : '#8e8e93',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>All Team</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: viewScope === 'all' ? '#18181b' : '#161618',
                  color: viewScope === 'all' ? '#ffffff' : '#71717a'
                }}>
                  {scopeCounts.all}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input
                type="text"
                placeholder="Search deliverables, user names..."
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
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#222225'; }}
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
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task List / Cards Container */}
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
          <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa' }}>Loading deliverables...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background: '#09090b',
          border: '1px solid #1f1f23',
          borderRadius: 16,
          padding: '68px 24px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Aesthetic Double-bordered Icon Tile */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 15,
            background: '#141416',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: 18,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
          }}>
            <CheckSquare size={26} strokeWidth={1.8} />
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {searchQuery || statusFilter !== 'all' || viewScope === 'mine' ? 'No Deliverables Found' : 'No Deliverables Scheduled'}
          </h3>

          <p style={{ fontSize: 13, color: '#71717a', maxWidth: 440, margin: '0 0 22px 0', lineHeight: 1.55 }}>
            {searchQuery || statusFilter !== 'all' || viewScope === 'mine'
              ? 'No deliverables match your search query or selected filter criteria. Try resetting your search filters.'
              : canAssign
              ? 'Assign deliverables with countdown timers, required file upload verification, and review workflows to keep the team aligned.'
              : 'You have no assigned tasks at the moment. Deliverables assigned to you will appear here.'}
          </p>

          {/* Interactive CTAs */}
          {searchQuery || statusFilter !== 'all' || viewScope === 'mine' ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setViewScope('all');
              }}
              style={{
                padding: '8px 18px',
                background: '#1c1c1f',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27272a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1c1c1f';
              }}
            >
              Reset All Filters
            </button>
          ) : canAssign ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '9px 20px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #ffffff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e4e4e7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Assign Deliverable</span>
            </button>
          ) : null}

          {/* Feature Highlights */}
          {!searchQuery && statusFilter === 'all' && viewScope === 'all' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 26,
              paddingTop: 20,
              borderTop: '1px solid #1a1a1d',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: 11.5, color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} style={{ color: '#a1a1aa' }} /> Live Countdowns
              </span>
              <span style={{ fontSize: 11.5, color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Upload size={12} style={{ color: '#a1a1aa' }} /> Deliverable Verification
              </span>
              <span style={{ fontSize: 11.5, color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Users size={12} style={{ color: '#a1a1aa' }} /> Multi-member Assignees
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="ceova-tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {filteredTasks.map((task) => {
            const pBadge = getPriorityBadge(task.priority);
            const sBadge = getStatusBadge(task.status);
            const canDelete = role === 'admin' || role === 'ceo' || task.assigned_by_id === user?.id;

            // Check if current user is an assignee or creator/admin
            const isAssignedToUser = (task.assigned_to_ids && user?.id && task.assigned_to_ids.includes(user.id)) ||
                                     task.assigned_to_id === user?.id ||
                                     task.assigned_to_name === user?.full_name;
            const isOwner = isAdminUser || task.assigned_by_id === user?.id || task.assigned_by_name === user?.full_name;
            const grace = getSubmissionGraceStatus(task);
            const isLockedReview = task.status === 'review' && !grace.isWithinGrace && !isOwner;
            const canUploadDeliverable = isAssignedToUser && !isLockedReview;

            // Resolved list of assignee names
            const displayAssignees = (task.assigned_to_names && task.assigned_to_names.length > 0)
              ? task.assigned_to_names
              : (task.assigned_to_name ? task.assigned_to_name.split(',').map(s => s.trim()) : ['Unassigned']);

            const isUploadingThis = uploadingTaskId === task.id;
            const isSaved = (task.tags && task.tags.includes('saved')) || localSavedIds.includes(task.id) || task.is_saved === true;

            return (
              <div 
                key={task.id} 
                className="task-glass-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: 22,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  border: task.status === 'completed' 
                    ? '1px solid rgba(16, 185, 129, 0.22)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: task.status === 'completed'
                    ? 'rgba(14, 18, 16, 0.55)'
                    : 'rgba(14, 14, 18, 0.52)',
                  backdropFilter: 'blur(50px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                  boxShadow: task.status === 'completed'
                    ? '0 18px 40px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(16, 185, 129, 0.2)'
                    : '0 18px 40px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  position: 'relative'
                }}
              >
                <div>
                  {/* Task Banner (Cover Image) */}
                  {(() => {
                    const banner = task.attachments?.find(a => a.type === 'banner');
                    if (!banner) return null;
                    return (
                      <div style={{
                        margin: '-22px -22px 14px -22px',
                        height: 120,
                        position: 'relative',
                        overflow: 'hidden',
                        borderTopLeftRadius: 'inherit',
                        borderTopRightRadius: 'inherit',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(9,9,11,0.65) 100%)',
                          pointerEvents: 'none'
                        }} />
                      </div>
                    );
                  })()}

                  {/* Top Header: Priority, Department, Upload Required Badge & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: pBadge.bg,
                        color: pBadge.color,
                        border: `1px solid ${pBadge.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: pBadge.color }} />
                        {pBadge.label}
                      </span>

                      {isAssignedToUser ? (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: 20,
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <User size={10} />
                          Assigned to You
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 500,
                          padding: '3px 9px',
                          borderRadius: 20,
                          background: 'rgba(168, 85, 247, 0.08)',
                          color: '#d8b4fe',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Users size={10} style={{ opacity: 0.8 }} />
                          Given to {displayAssignees.join(', ')} • Not in your To-Do
                        </span>
                      )}

                      {task.department && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: 'rgba(255, 255, 255, 0.025)',
                          color: 'var(--text-muted)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}>
                          {task.department}
                        </span>
                      )}

                      {task.requires_upload && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#e4e4e7',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Upload size={10} />
                          Deliverable
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Save to Vault Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSave(task)}
                        title={isSaved ? "Saved to Vault (Permanent • Protected from 72h auto-delete)" : "Save to Vault (Protect from 72h auto-delete)"}
                        style={{
                          background: isSaved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSaved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
                          color: isSaved ? '#34d399' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px 7px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: task.status === 'completed' ? 'rgba(255, 255, 255, 0.7)' : '#ffffff', 
                    margin: '0 0 6px 0',
                    lineHeight: 1.35,
                    letterSpacing: '-0.01em',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    textDecorationColor: 'rgba(255, 255, 255, 0.25)'
                  }}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p style={{ 
                      fontSize: 12.5, 
                      color: 'var(--text-muted)', 
                      margin: '0 0 14px 0',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                      {task.tags.map((tg, i) => (
                        <span key={i} style={{
                          fontSize: 10,
                          fontWeight: 500,
                          background: 'rgba(255, 255, 255, 0.03)',
                          color: '#a1a1aa',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '2px 8px',
                          borderRadius: 20,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Tag size={9} style={{ opacity: 0.6 }} />
                          {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Active Countdown Timer Bar */}
                  {task.due_date && task.status !== 'completed' && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Timer size={13} style={{ color: '#a1a1aa' }} />
                        <span>{isAssignedToUser ? 'Deadline Timer:' : `Member Deadline (${displayAssignees.join(', ')}):`}</span>
                      </div>
                      <TaskCountdownTimer dueDate={task.due_date} status={task.status} />
                    </div>
                  )}

                  {/* TASK BRIEFING VIDEO */}
                  {(() => {
                    const briefingVideo = task.attachments?.find(a => a.type === 'briefing_video');
                    if (!briefingVideo) return null;
                    const isDirectVideo = briefingVideo.url.startsWith('data:video') || 
                                          briefingVideo.url.endsWith('.mp4') || 
                                          briefingVideo.url.endsWith('.webm') || 
                                          briefingVideo.url.endsWith('.mov');

                    return (
                      <div style={{
                        marginBottom: 14,
                        background: '#121215',
                        border: '1px solid #27272a',
                        borderRadius: 8,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderBottom: '1px solid #1f1f23',
                          background: '#161619'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                            <Film size={13} style={{ color: '#a1a1aa' }} />
                            <span>Task Briefing Video</span>
                          </div>
                          {!isDirectVideo && (
                            <a
                              href={sanitizeUrl(briefingVideo.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10,
                                color: '#93c5fd',
                                textDecoration: 'none'
                              }}
                            >
                              <span>Open Link</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        {isDirectVideo ? (
                          <video
                            src={sanitizeUrl(briefingVideo.url)}
                            controls
                            preload="metadata"
                            style={{
                              width: '100%',
                              maxHeight: 180,
                              display: 'block',
                              background: '#000000'
                            }}
                          />
                        ) : (
                          <div style={{ padding: '10px 12px', fontSize: 11.5, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ExternalLink size={13} style={{ color: '#71717a' }} />
                            <a
                              href={sanitizeUrl(briefingVideo.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#ffffff', textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              {briefingVideo.url}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* TASK BRIEFING REFERENCE FILES */}
                  {(() => {
                    const briefingFiles = (task.attachments || []).filter(a => a.type === 'briefing_file');
                    if (briefingFiles.length === 0) return null;

                    return (
                      <div style={{
                        marginBottom: 14,
                        background: '#121215',
                        border: '1px solid #27272a',
                        borderRadius: 8,
                        padding: '10px 12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                            <Paperclip size={12} style={{ color: '#a1a1aa' }} />
                            <span>Briefing Reference Materials ({briefingFiles.length})</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {briefingFiles.map((bf, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 9px',
                                borderRadius: 6,
                                background: '#17171a',
                                border: '1px solid #222225',
                                fontSize: 11
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                <FileText size={12} style={{ color: '#71717a', flexShrink: 0 }} />
                                <span style={{ color: '#e4e4e7', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {bf.name}
                                </span>
                                <span style={{ fontSize: 9.5, color: '#71717a', flexShrink: 0 }}>
                                  ({formatFileSize(bf.size)})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadDeliverableFile(bf.url, bf.name)}
                                title="Download briefing reference file"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  background: '#222226',
                                  border: '1px solid #2e2e33',
                                  color: '#ffffff',
                                  fontSize: 10,
                                  cursor: 'pointer',
                                  marginLeft: 8,
                                  flexShrink: 0
                                }}
                              >
                                <Download size={10} /> Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* DELIVERABLE & SUBMISSION SECTION */}
                  {(() => {
                    const memberDeliverables = (task.attachments || []).filter(a => 
                      a.type !== 'banner' && a.type !== 'briefing_video' && a.type !== 'briefing_file' && a.type !== 'submission_note'
                    );
                    const submissionNotes = (task.attachments || []).filter(a => a.type === 'submission_note');
                    const hasSubmissions = memberDeliverables.length > 0 || submissionNotes.length > 0;

                    if (!task.requires_upload && !hasSubmissions) return null;

                    return (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        marginBottom: 14
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileCheck size={13} style={{ color: '#a1a1aa' }} />
                            <span>{task.requires_upload ? 'Deliverable Submission' : 'Submitted Work & Attachments'}</span>
                          </div>
                          {task.requires_upload ? (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Max {task.max_file_size_mb || 10} MB • {task.allowed_file_types === 'all' ? 'Any format' : task.allowed_file_types}
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600 }}>
                              Attachments & Notes
                            </div>
                          )}
                        </div>

                        {task.upload_instructions && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>
                            "{task.upload_instructions}"
                          </div>
                        )}

                        {/* Uploaded Attachments & Notes List */}
                        {hasSubmissions && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {submissionNotes.map((att, idx) => (
                              <div key={'note-' + idx} style={{
                                background: '#141416',
                                border: '1px solid #27272a',
                                borderLeft: '3px solid #60a5fa',
                                padding: '8px 10px',
                                borderRadius: 4,
                                fontSize: 11
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#93c5fd', fontWeight: 600, fontSize: 10.5 }}>
                                    <FileText size={12} />
                                    <span>Work Submission Note ({att.uploaded_by})</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                      {new Date(att.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {(canDelete || (att.uploaded_by === user?.full_name && !isLockedReview)) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAttachment(task, (task.attachments || []).indexOf(att))}
                                        title="Remove note"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          padding: 2
                                        }}
                                      >
                                        <X size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div style={{ color: 'var(--text-main)', fontSize: 11.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                                  {att.note || att.name}
                                </div>
                              </div>
                            ))}

                            {memberDeliverables.map((att, idx) => (
                              <div key={'deliv-' + idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-color)',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 11
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                  <Paperclip size={12} style={{ color: '#a1a1aa', flexShrink: 0 }} />
                                  <span style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {att.name}
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
                                    ({formatFileSize(att.size)})
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                  <button 
                                    type="button"
                                    onClick={() => downloadDeliverableFile(att.url, att.name)}
                                    title="Download deliverable file"
                                    style={{
                                      color: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 10,
                                      background: '#27272a',
                                      border: '1px solid #3f3f46',
                                      padding: '3px 8px',
                                      borderRadius: 4,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Download size={10} /> Download
                                  </button>

                                  {(canDelete || (att.uploaded_by === user?.full_name && !isLockedReview)) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttachment(task, (task.attachments || []).indexOf(att))}
                                      title="Remove deliverable"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: 2
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action Bar for Deliverables (Download All) */}
                        {memberDeliverables.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginTop: 8, marginBottom: 8, padding: '4px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const files = memberDeliverables.filter(a => a.url);
                                files.forEach(f => downloadDeliverableFile(f.url, f.name));
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#ffffff',
                                background: '#1f1f23',
                                border: '1px solid #2e2e33',
                                borderRadius: 4,
                                padding: '3px 8px',
                                cursor: 'pointer'
                              }}
                            >
                              <Download size={11} />
                              <span>Download All Deliverables</span>
                            </button>
                          </div>
                        )}

                      {/* File Upload Input Button */}
                      {canUploadDeliverable && (
                        <div>
                          <label 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '7px 12px',
                              background: isUploadingThis ? '#27272a' : '#141416',
                              border: '1px dashed #333338',
                              borderRadius: 'var(--radius-sm)',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: isUploadingThis ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Upload size={12} />
                            <span>{isUploadingThis ? 'Uploading deliverable...' : '+ Upload Deliverable File'}</span>
                            <input
                              type="file"
                              disabled={isUploadingThis}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadDeliverable(task, file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* OWNER REVIEW FEEDBACK DISPLAY (NEEDS IMPROVEMENT) */}
                  {task.review_feedback && task.status !== 'completed' && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      marginBottom: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                          <AlertTriangle size={13} />
                          <span>
                            {isAssignedToUser
                              ? 'Owner Review Feedback • Needs Improvement'
                              : `Review Feedback Sent to ${displayAssignees.join(', ')} • Needs Improvement`}
                          </span>
                        </div>
                        {task.reviewed_at && (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {new Date(task.reviewed_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: 12,
                        color: 'var(--text-main)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderLeft: '3px solid #f59e0b',
                        padding: '8px 10px',
                        borderRadius: 4,
                        marginBottom: 8,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {task.review_feedback}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                        <span>Reviewed by: <strong style={{ color: 'var(--text-main)' }}>{task.reviewed_by_name || task.assigned_by_name || 'Task Owner'}</strong></span>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                          {isAssignedToUser ? 'Please make changes & re-submit' : 'Awaiting member revisions & re-submission'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* OWNER EVALUATION PANEL (WHEN STATUS IS UNDER REVIEW & USER IS OWNER/ADMIN) */}
                  {task.status === 'review' && isOwner && (
                    <div style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      marginBottom: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#c084fc' }}>
                          <ShieldCheck size={14} />
                          <span>Task Under Review • Owner Decision Required</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Pending approval
                        </span>
                      </div>


                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                        The assignee has submitted this task. Review their deliverables and choose an action:
                      </p>

                      {reviewingTaskId === task.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RotateCcw size={11} />
                            <span>What needs to be improved in this task?</span>
                          </label>
                          <textarea
                            value={reviewFeedbackText}
                            onChange={(e) => setReviewFeedbackText(e.target.value)}
                            placeholder="Specify what changes are needed, what is missing, or how to improve before approval..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: 11,
                              background: 'rgba(0, 0, 0, 0.45)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-main)',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />

                          {/* Compulsory Retry Deadline Timer Selector */}
                          <div style={{ marginTop: 4, marginBottom: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                              <Timer size={12} />
                              <span>New Task Deadline Timer (Compulsory for Retry):</span>
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              {[
                                { label: '+1 Hour', hours: 1 },
                                { label: '+3 Hours', hours: 3 },
                                { label: '+6 Hours', hours: 6 },
                                { label: '+12 Hours', hours: 12 },
                                { label: '+24 Hours (1 Day)', hours: 24 },
                                { label: '+48 Hours (2 Days)', hours: 48 },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    const d = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
                                    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                    setRetryDueDate(localIso);
                                  }}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid #3f3f46',
                                    borderRadius: 4,
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                            <input
                              type="datetime-local"
                              value={retryDueDate}
                              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                              onChange={(e) => setRetryDueDate(e.target.value)}
                              required
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                fontSize: 11,
                                background: 'rgba(0, 0, 0, 0.45)',
                                border: !retryDueDate ? '1px solid #ef4444' : '1px solid #3f3f46',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ffffff',
                                outline: 'none'
                              }}
                            />
                            {!retryDueDate && (
                              <span style={{ fontSize: 10, color: '#f87171', marginTop: 3, display: 'block' }}>
                                * A new deadline timer must be set to request a retry.
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingTaskId(null);
                                setReviewFeedbackText('');
                                setRetryDueDate('');
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={reviewSubmitting || !reviewFeedbackText.trim() || !retryDueDate}
                              onClick={() => handleReviewAction(task.id, 'reject', reviewFeedbackText, new Date(retryDueDate).toISOString())}
                              style={{
                                padding: '6px 14px',
                                fontSize: 11,
                                fontWeight: 600,
                                background: '#ef4444',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: 'var(--radius-sm)',
                                cursor: reviewSubmitting || !reviewFeedbackText.trim() || !retryDueDate ? 'not-allowed' : 'pointer',
                                opacity: !reviewFeedbackText.trim() || !retryDueDate ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Send size={11} />
                              <span>{reviewSubmitting ? 'Sending...' : 'Send Feedback & Request Retry'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => handleReviewAction(task.id, 'approve')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              fontSize: 11,
                              padding: '7px 10px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark as Complete</span>
                          </button>

                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => {
                              setReviewingTaskId(task.id);
                              setReviewFeedbackText(task.review_feedback || '');
                              const defaultNext = new Date(Date.now() + 24 * 60 * 60 * 1000);
                              const localIso = new Date(defaultNext.getTime() - defaultNext.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                              setRetryDueDate(localIso);
                            }}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              fontSize: 11,
                              padding: '7px 10px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>Not Complete (Give Review)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBMISSION GRACE TIMER & LOCK NOTICE (FOR ASSIGNEES / NON-OWNERS) */}
                  {task.status === 'review' && !isOwner && (
                    <SubmissionGraceTimer
                      task={task}
                      isAssignedToUser={isAssignedToUser}
                      isOwner={isOwner}
                      onEditDeliverable={() => {
                        const existingNote = (task.attachments || []).find(a => a.type === 'submission_note');
                        setSubmissionNoteText(existingNote?.note || '');
                        setSubmissionFile(null);
                        setSubmissionError('');
                        setSubmittingTask(task);
                      }}
                    />
                  )}

                  {/* ASSIGNEE "SUBMIT FOR REVIEW" ACTION BUTTON */}
                  {isAssignedToUser && task.status !== 'completed' && task.status !== 'review' && (
                    <div style={{ marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittingTask(task);
                          setSubmissionNoteText('');
                          setSubmissionFile(null);
                          setSubmissionError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: 'var(--radius-sm)',
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Send size={12} />
                        <span>{task.review_feedback ? 'Re-Submit for Review' : 'Submit Work for Review'}</span>
                      </button>
                    </div>
                  )}

                  {/* VERIFIED APPROVAL & 72H RETENTION BAR */}
                  {task.status === 'completed' && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                      border: isSaved ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#34d399', fontWeight: 600 }}>
                        <CheckCircle2 size={14} />
                        <span>Approved {task.reviewed_by_name ? `by ${task.reviewed_by_name}` : ''}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!isSaved ? (
                          <>
                            <TaskAutoDeleteTimer
                              completedAt={task.reviewed_at || task.created_at}
                              isSaved={isSaved}
                              onExpire={() => purgeExpiredTasks(tasks)}
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleSave(task)}
                              style={{
                                padding: '4px 10px',
                                fontSize: 10.5,
                                fontWeight: 600,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                borderRadius: 8,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Bookmark size={11} />
                              <span>Save to Vault</span>
                            </button>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: '#34d399' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <ShieldCheck size={12} />
                              <span>Preserved in Vault</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleSave(task)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: 10,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Unsave
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Section: Multiple Assignees + Status Switcher */}
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: 12,
                  marginTop: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    {/* Multiple Assignees Display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 2 }}>
                        {displayAssignees.slice(0, 3).map((name, i) => (
                          <div
                            key={i}
                            title={name}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: i === 0 
                                ? 'linear-gradient(135deg, #27272a, #18181b)' 
                                : i === 1 
                                  ? 'linear-gradient(135deg, #3f3f46, #27272a)' 
                                  : 'linear-gradient(135deg, #52525b, #3f3f46)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: 10,
                              fontWeight: 700,
                              marginLeft: i > 0 ? -6 : 0,
                              border: '1.5px solid rgba(255, 255, 255, 0.12)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              flexShrink: 0
                            }}
                          >
                            {(name || 'U').charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>

                      <div style={{ minWidth: 0, lineHeight: 1.25, flex: 1 }}>
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          color: '#f4f4f5', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {displayAssignees.join(', ')}
                        </div>
                        {task.assigned_by_name && (
                          <div style={{ fontSize: 9.5, color: '#71717a' }}>
                            by {task.assigned_by_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 5, 
                        fontSize: 10.5, 
                        color: new Date(task.due_date) < new Date() && task.status !== 'completed' ? '#f87171' : 'var(--text-muted)',
                        flexShrink: 0,
                        marginLeft: 8
                      }}>
                        <Calendar size={11} style={{ opacity: 0.7 }} />
                        <span>
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {' '}
                          {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator / Controller */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#71717a' }}>Status:</span>
                    {isAssignedToUser ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select
                          value={task.status}
                          disabled={isLockedReview}
                          title={isLockedReview ? "Submission locked after 5-minute grace window. Awaiting reviewer feedback." : undefined}
                          onChange={(e) => {
                            const val = e.target.value as TaskStatus;
                            if (val === 'review' || val === 'completed') {
                              setSubmittingTask(task);
                              setSubmissionNoteText('');
                              setSubmissionFile(null);
                              setSubmissionError('');
                            } else {
                              handleUpdateStatus(task.id, val);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 20,
                            border: `1px solid ${sBadge.border}`,
                            background: sBadge.bg,
                            color: sBadge.color,
                            outline: 'none',
                            cursor: isLockedReview ? 'not-allowed' : 'pointer',
                            opacity: isLockedReview ? 0.7 : 1,
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)'
                          }}
                        >
                          <option value="todo" style={{ background: '#18181b', color: '#ffffff' }}>To Do</option>
                          <option value="in_progress" style={{ background: '#18181b', color: '#60a5fa' }}>In Progress</option>
                          <option value="review" style={{ background: '#18181b', color: '#c084fc' }}>Under Review</option>
                          <option value="completed" style={{ background: '#18181b', color: '#10b981' }}>
                            Completed (Submits Review)
                          </option>
                        </select>
                        {isLockedReview && (
                          <span 
                            title="Submission locked after 5-minute window"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 3, 
                              fontSize: 10, 
                              color: '#c084fc',
                              background: 'rgba(192, 132, 252, 0.12)',
                              border: '1px solid rgba(192, 132, 252, 0.3)',
                              padding: '2px 6px',
                              borderRadius: 12
                            }}
                          >
                            <Lock size={10} /> Locked
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 20,
                        background: sBadge.bg,
                        color: sBadge.color,
                        border: `1px solid ${sBadge.border}`,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: sBadge.dot,
                          boxShadow: `0 0 8px ${sBadge.dot}`
                        }} />
                        <span>
                          {task.status === 'todo' && !isAssignedToUser 
                            ? `To Do • Queued for ${displayAssignees[0] || 'assignee'}` 
                            : sBadge.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN TASK MODAL (ADMIN & MEMBERS ONLY) */}
      {isModalOpen && canAssign && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 580,
            background: '#0d0d0f',
            border: '1px solid #27272a',
            borderRadius: 18,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: 26
          }}>
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
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
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#161618',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                <CheckSquare size={20} />
              </div>
              <div style={{ paddingRight: 36 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {isMemberUser ? 'Assign Task to Interns' : 'Assign New Task'}
                </h3>
                <div style={{ fontSize: 12.5, color: '#71717a', marginTop: 3 }}>
                  {isMemberUser 
                    ? 'Members can assign deliverables to one or multiple Interns' 
                    : 'Admins can assign deliverables to multiple Members and Interns'}
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: 8, 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                color: '#ef4444', 
                fontSize: 12.5, 
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Task Title */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Task Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Responsive Dashboard Layout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #27272a',
                    background: '#121214',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
                />
              </div>

              {/* TASK BANNER (COVER IMAGE) - REQUIRED */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Image size={13} style={{ color: '#ffffff' }} />
                    <span>Task Banner (Cover Image)</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: bannerPreview ? '#14231b' : 'rgba(239, 68, 68, 0.1)',
                    color: bannerPreview ? '#4ade80' : '#f87171',
                    border: bannerPreview ? '1px solid #1d3827' : '1px solid rgba(239, 68, 68, 0.25)'
                  }}>
                    {bannerPreview ? 'Banner Ready' : 'Required'}
                  </span>
                </div>

                {bannerPreview ? (
                  <div style={{
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid #3f3f46',
                    height: 140,
                    background: '#09090b',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                  }}>
                    <img
                      src={bannerPreview}
                      alt="Task Banner Preview"
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: '1px solid #3f3f46',
                          color: '#ffffff'
                        }}>
                          {bannerPresetId ? `Preset: ${BANNER_PRESETS.find(p => p.id === bannerPresetId)?.name}` : 'Custom Upload'}
                        </span>
                        {bannerFile && (
                          <span style={{ fontSize: 10.5, color: '#a1a1aa' }}>
                            {bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: '#1f1f23',
                          border: '1px solid #3f3f46',
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}>
                          <FileUp size={11} />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleRemoveBanner}
                          title="Remove Banner"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Drag & drop or click upload */}
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px 16px',
                      borderRadius: 10,
                      border: '1px dashed #3f3f46',
                      background: '#121214',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: '#1c1c1f',
                        border: '1px solid #2e2e33',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        marginBottom: 8
                      }}>
                        <FileUp size={18} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                        Click to upload task cover banner
                      </div>
                      <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                        PNG, JPG, WebP, SVG • 16:6 aspect ratio recommended
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Quick Executive Presets */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 6, fontWeight: 600 }}>
                        Or choose an executive preset texture:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {BANNER_PRESETS.map((preset) => (
                          <div
                            key={preset.id}
                            onClick={() => handleSelectPresetBanner(preset)}
                            style={{
                              height: 52,
                              borderRadius: 6,
                              overflow: 'hidden',
                              border: '1px solid #27272a',
                              cursor: 'pointer',
                              position: 'relative',
                              background: '#09090b',
                              transition: 'transform 0.15s ease, border-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#ffffff';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#27272a';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: '2px 4px',
                              background: 'rgba(0, 0, 0, 0.75)',
                              fontSize: 9.5,
                              fontWeight: 600,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center'
                            }}>
                              {preset.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TASK BRIEFING VIDEO & REFERENCE FILES (OPTIONAL / IF REQUIRED) */}
              <div style={{
                background: '#101012',
                border: '1px solid #222225',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: '#18181b',
                      border: '1px solid #27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}>
                      <Film size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                        Task Briefing Assets (Video &amp; Files)
                      </div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>
                        Provide video instructions or reference documents for assignees
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: '#18181b',
                    color: '#a1a1aa',
                    border: '1px solid #27272a'
                  }}>
                    If Required
                  </span>
                </div>

                {/* 1. Briefing Video Input */}
                <div style={{ paddingTop: 10, borderTop: '1px solid #1c1c1f' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Video size={12} style={{ color: '#ffffff' }} />
                      <span>Task Briefing Video</span>
                    </label>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setBriefingVideoMode('upload')}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: briefingVideoMode === 'upload' ? '#27272a' : 'transparent',
                          color: briefingVideoMode === 'upload' ? '#ffffff' : '#71717a',
                          border: briefingVideoMode === 'upload' ? '1px solid #3f3f46' : '1px solid transparent',
                          cursor: 'pointer'
                        }}
                      >
                        Upload Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setBriefingVideoMode('link')}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: briefingVideoMode === 'link' ? '#27272a' : 'transparent',
                          color: briefingVideoMode === 'link' ? '#ffffff' : '#71717a',
                          border: briefingVideoMode === 'link' ? '1px solid #3f3f46' : '1px solid transparent',
                          cursor: 'pointer'
                        }}
                      >
                        Video URL / Link
                      </button>
                    </div>
                  </div>

                  {briefingVideoMode === 'upload' ? (
                    <div>
                      {briefingVideoPreview ? (
                        <div style={{
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid #2e2e33',
                          background: '#09090b',
                          position: 'relative'
                        }}>
                          <video
                            src={briefingVideoPreview}
                            controls
                            style={{ width: '100%', maxHeight: 150, display: 'block' }}
                          />
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: '#141416',
                            borderTop: '1px solid #222225'
                          }}>
                            <span style={{ fontSize: 11, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {briefingVideoFile?.name} ({(briefingVideoFile ? briefingVideoFile.size / (1024 * 1024) : 0).toFixed(1)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setBriefingVideoFile(null);
                                setBriefingVideoPreview('');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f87171',
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <X size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px dashed #2e2e33',
                          background: '#141416',
                          cursor: 'pointer'
                        }}>
                          <Video size={16} style={{ color: '#71717a' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>
                              Attach Briefing Video (.mp4, .mov, .webm)
                            </div>
                            <div style={{ fontSize: 10.5, color: '#71717a' }}>
                              Max 50MB for direct file upload
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="e.g. https://www.loom.com/share/... or YouTube / Drive link"
                        value={briefingVideoLink}
                        onChange={(e) => setBriefingVideoLink(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #27272a',
                          background: '#141416',
                          color: '#ffffff',
                          outline: 'none',
                          fontSize: 12.5,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Briefing Reference Files Input */}
                <div style={{ paddingTop: 10, borderTop: '1px solid #1c1c1f' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={12} style={{ color: '#ffffff' }} />
                      <span>Reference Briefing Files ({briefingFiles.length})</span>
                    </label>

                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#1c1c1f',
                      border: '1px solid #2e2e33',
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      <Plus size={11} />
                      <span>Add Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleBriefingFilesUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {briefingFiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {briefingFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: '#141416',
                            border: '1px solid #27272a',
                            fontSize: 11.5
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                            <FileText size={12} style={{ color: '#71717a', flexShrink: 0 }} />
                            <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </span>
                            <span style={{ color: '#71717a', fontSize: 10, flexShrink: 0 }}>
                              ({(f.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBriefingFile(i)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#71717a',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#71717a', fontStyle: 'italic' }}>
                      No reference files attached yet. (e.g. Spec PDFs, Figma exports, project assets)
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Description / Deliverable Overview
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context, references, or expected deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #27272a',
                    background: '#121214',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: 13,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
                />
              </div>

              {/* MULTI-USER ASSIGNEE SELECTION */}
              <div ref={userPickerRef} style={{ position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  <span>
                    {isMemberUser ? 'Assign To Intern(s) *' : 'Assign To Team Member(s) & Intern(s) *'}
                  </span>
                  <span style={{ fontSize: 11, color: '#ffffff', background: '#1c1c1f', border: '1px solid #2e2e33', padding: '1px 8px', borderRadius: 100, textTransform: 'none', fontWeight: 600 }}>
                    {selectedUserIds.length} selected
                  </span>
                </label>

                {/* Selected Users Chips Preview & Click to Open Picker */}
                <div 
                  onClick={() => setIsUserPickerOpen(!isUserPickerOpen)}
                  style={{
                    minHeight: 44,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: isUserPickerOpen ? '1px solid #52525b' : '1px solid #27272a',
                    background: '#121214',
                    cursor: 'pointer',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 6,
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                    {selectedUserIds.length === 0 ? (
                      <span style={{ color: '#52525b', fontSize: 13 }}>
                        {isMemberUser ? 'Select one or more interns by name...' : 'Select one or more users by name...'}
                      </span>
                    ) : (
                      members
                        .filter(m => selectedUserIds.includes(m.id))
                        .map(m => (
                          <span
                            key={m.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#1c1c1f',
                              border: '1px solid #2e2e33',
                              color: '#ffffff',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectUser(m.id);
                            }}
                          >
                            <span>{m.full_name}</span>
                            <span style={{
                              fontSize: 9.5,
                              color: '#a1a1aa',
                              textTransform: 'uppercase'
                            }}>
                              ({m.role})
                            </span>
                            <X size={12} style={{ color: '#71717a', marginLeft: 2 }} />
                          </span>
                        ))
                    )}
                  </div>
                  <ChevronDown size={15} style={{ color: '#71717a', flexShrink: 0, transform: isUserPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </div>

                {/* Dropdown User List with Search */}
                {isUserPickerOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    marginTop: 6,
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderRadius: 10,
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    padding: 6
                  }}>
                    {/* User Name Search Input inside Picker */}
                    <div style={{ padding: '4px 6px 8px 6px', borderBottom: '1px solid #1f1f23' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                          type="text"
                          placeholder="Search users by name..."
                          value={assigneeSearchQuery}
                          onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            padding: '7px 10px 7px 30px',
                            fontSize: 12,
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: 6,
                            color: '#ffffff',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {filteredPickerMembers.length === 0 ? (
                      <div style={{ padding: '16px 10px', textAlign: 'center', fontSize: 12, color: '#71717a' }}>
                        {isMemberUser ? 'No interns available to select.' : 'No users match search.'}
                      </div>
                    ) : (
                      filteredPickerMembers.map((m) => {
                        const isSelected = selectedUserIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleSelectUser(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: isSelected ? '#1c1c20' : 'transparent',
                              cursor: 'pointer',
                              marginBottom: 2,
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#161618';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: '#27272a',
                                border: '1px solid #3f3f46',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 700
                              }}>
                                {(m.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                                  {m.full_name}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#71717a' }}>
                                  <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#a1a1aa' }}>
                                    {m.role}
                                  </span>
                                  {m.department && ` • ${m.department}`}
                                </div>
                              </div>
                            </div>

                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: isSelected ? '1px solid #ffffff' : '1px solid #3f3f46',
                              background: isSelected ? '#ffffff' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000000'
                            }}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Priority & Due Date (Equal Height & Elegant Layout) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #27272a',
                      background: '#121214',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Deadline (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #27272a',
                      background: '#121214',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                  {/* Preset Quick Deadline Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {[
                      { label: '+2h', hours: 2 },
                      { label: '+6h', hours: 6 },
                      { label: 'Today 6PM', special: 'today_6pm' },
                      { label: 'Tomorrow', hours: 24 },
                      { label: '3 Days', hours: 72 },
                      { label: '1 Week', hours: 168 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => applyDeadlinePreset(btn)}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#161618',
                          border: '1px solid #27272a',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#222226';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#3f3f46';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#161618';
                          e.currentTarget.style.color = '#a1a1aa';
                          e.currentTarget.style.borderColor = '#27272a';
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Design, Engineering"
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
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Design, Sprint 4"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
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
                  />
                </div>
              </div>

              {/* REQUIRE DELIVERABLE FILE UPLOAD SECTION (Executive Switch Card) */}
              <div style={{
                background: requiresUpload ? '#141417' : '#101012',
                border: requiresUpload ? '1px solid #3f3f46' : '1px solid #222225',
                borderRadius: 12,
                padding: '14px 16px',
                marginTop: 2,
                transition: 'all 0.2s ease'
              }}>
                <div 
                  onClick={() => setRequiresUpload(!requiresUpload)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: requiresUpload ? '#222226' : '#161618',
                      border: '1px solid #2e2e33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      <Upload size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                        Require Deliverable File Upload
                      </div>
                      <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 1 }}>
                        Assigned user(s) must upload proof, files, or attachments to complete this task
                      </div>
                    </div>
                  </div>

                  {/* Custom Toggle Switch (Solid, No Neon) */}
                  <div style={{
                    width: 38,
                    height: 22,
                    borderRadius: 100,
                    background: requiresUpload ? '#ffffff' : '#27272a',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: requiresUpload ? '#000000' : '#71717a',
                      position: 'absolute',
                      top: 3,
                      left: requiresUpload ? 19 : 3,
                      transition: 'left 0.2s ease, background 0.2s ease'
                    }} />
                  </div>
                </div>

                {/* Sub-options when Deliverable File Upload is enabled */}
                {requiresUpload && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #222225', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                        What to upload / Submission Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Exported Figma designs, signed NDA PDF, or project code ZIP"
                        value={uploadInstructions}
                        onChange={(e) => setUploadInstructions(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #27272a',
                          background: '#161618',
                          color: '#ffffff',
                          outline: 'none',
                          fontSize: 12.5,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                          Allowed File Type
                        </label>
                        <select
                          value={fileTypePreset}
                          onChange={(e) => setFileTypePreset(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: '1px solid #27272a',
                            background: '#161618',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: 12.5,
                            boxSizing: 'border-box'
                          }}
                        >
                          {FILE_TYPE_PRESETS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                          Maximum File Size
                        </label>
                        <select
                          value={maxFileSizeMb}
                          onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: '1px solid #27272a',
                            background: '#161618',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: 12.5,
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value={5}>5 MB</option>
                          <option value={10}>10 MB (Standard)</option>
                          <option value={25}>25 MB</option>
                          <option value={50}>50 MB</option>
                          <option value={100}>100 MB</option>
                        </select>
                      </div>
                    </div>

                    {fileTypePreset === 'custom' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                          Custom Extensions (comma separated, e.g. .pdf,.zip,.png)
                        </label>
                        <input
                          type="text"
                          placeholder=".pdf,.png,.zip"
                          value={customFileTypes}
                          onChange={(e) => setCustomFileTypes(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: '1px solid #27272a',
                            background: '#161618',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: 12.5,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons (Solid Executive Design) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 16, borderTop: '1px solid #1f1f23' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    background: '#161618',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    color: '#a1a1aa',
                    fontSize: 13,
                    fontWeight: 500,
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 22px',
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #ffffff',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) e.currentTarget.style.background = '#e4e4e7';
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERABLE SUBMISSION MODAL FOR ASSIGNEES */}
      {submittingTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: 14,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #1f1f23',
              background: '#0d0d0f'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: '#18181b',
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Send size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {submittingTask.status === 'review' 
                      ? 'Edit Deliverable (5-Min Grace Window)' 
                      : (submittingTask.review_feedback ? 'Re-Submit Deliverable' : 'Submit Deliverable for Review')}
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>
                    {submittingTask.status === 'review'
                      ? 'Update notes or deliverable files before the 5-minute lock takes effect'
                      : `Sent to ${submittingTask.assigned_by_name || 'Task Owner'} for evaluation`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmittingTask(null);
                  setSubmissionNoteText('');
                  setSubmissionFile(null);
                  setSubmissionError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmitWork} style={{ padding: 20, overflowY: 'auto' }}>
              {/* Task Title Banner */}
              <div style={{
                background: '#141416',
                border: '1px solid #27272a',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#71717a', fontWeight: 700, marginBottom: 2 }}>
                  Deliverable
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  {submittingTask.title}
                </div>
                {submittingTask.description && (
                  <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.4 }}>
                    {submittingTask.description}
                  </div>
                )}
              </div>

              {/* Review Feedback Alert if re-submitting */}
              {submittingTask.review_feedback && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={13} />
                    <span>Owner Feedback to Address:</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-main)', lineHeight: 1.45 }}>
                    {submittingTask.review_feedback}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submissionError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: '#f87171'
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Task Briefing Materials Overview */}
              {(() => {
                const banner = submittingTask.attachments?.find(a => a.type === 'banner');
                const briefingVideo = submittingTask.attachments?.find(a => a.type === 'briefing_video');
                const briefingFiles = (submittingTask.attachments || []).filter(a => a.type === 'briefing_file');

                if (!banner && !briefingVideo && briefingFiles.length === 0) return null;

                return (
                  <div style={{
                    marginBottom: 16,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#121214',
                    border: '1px solid #27272a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Task Briefing Materials
                    </div>

                    {banner && (
                      <div style={{ height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid #2e2e33' }}>
                        <img src={banner.url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {briefingVideo && (
                      <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: '#18181b', borderRadius: 6, border: '1px solid #27272a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ffffff' }}>
                          <Film size={12} style={{ color: '#a1a1aa' }} />
                          <span>Briefing Video</span>
                        </div>
                        {briefingVideo.url.startsWith('data:video') ? (
                          <span style={{ color: '#a1a1aa', fontSize: 10 }}>(Attached Video)</span>
                        ) : (
                          <a href={sanitizeUrl(briefingVideo.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                            Watch Link <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}

                    {briefingFiles.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {briefingFiles.map((bf, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: '#18181b', borderRadius: 4, fontSize: 11, border: '1px solid #27272a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                              <Paperclip size={11} style={{ color: '#71717a' }} />
                              <span style={{ color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bf.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadDeliverableFile(bf.url, bf.name)}
                              style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#ffffff', borderRadius: 4, padding: '2px 6px', fontSize: 9.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <Download size={9} /> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Upload Required vs Note Required Condition */}
              {submittingTask.requires_upload ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={13} style={{ color: '#60a5fa' }} />
                      <span>Deliverable File Upload <strong style={{ color: '#ef4444' }}>* (Required)</strong></span>
                    </label>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Max {submittingTask.max_file_size_mb || 10} MB • {submittingTask.allowed_file_types === 'all' ? 'Any format' : submittingTask.allowed_file_types}
                    </span>
                  </div>

                  {submittingTask.upload_instructions && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: 4, border: '1px solid #27272a' }}>
                      Instructions: {submittingTask.upload_instructions}
                    </div>
                  )}

                  {/* Existing Files already attached */}
                  {submittingTask.attachments && submittingTask.attachments.filter(a => a.type !== 'submission_note' && a.type !== 'banner' && a.type !== 'briefing_video' && a.type !== 'briefing_file').length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CheckCircle2 size={12} />
                        <span>Already Attached Deliverables:</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {submittingTask.attachments.filter(a => a.type !== 'submission_note' && a.type !== 'banner' && a.type !== 'briefing_video' && a.type !== 'briefing_file').map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 4, fontSize: 11, border: '1px solid #27272a' }}>
                            <Paperclip size={11} style={{ color: '#a1a1aa' }} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({formatFileSize(a.size)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Input Box */}
                  <div style={{
                    border: '1px dashed #3f3f46',
                    borderRadius: 8,
                    padding: '16px',
                    textAlign: 'center',
                    background: '#141416',
                    cursor: 'pointer',
                    position: 'relative',
                    marginBottom: 14
                  }}>
                    <input
                      type="file"
                      id="deliverable-modal-file-req"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSubmissionFile(file);
                          setSubmissionError('');
                        }
                      }}
                    />
                    {submissionFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#ffffff', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        <span>Selected: {submissionFile.name} ({formatFileSize(submissionFile.size)})</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSubmissionFile(null);
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <Upload size={20} style={{ color: '#a1a1aa' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>Choose or drag deliverable file</span>
                        <span style={{ fontSize: 10, color: '#71717a' }}>Required before submission</span>
                      </div>
                    )}
                  </div>

                  {/* Optional notes when upload is required */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                      Submission Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional details for reviewer)</span>
                    </label>
                    <textarea
                      value={submissionNoteText}
                      onChange={(e) => setSubmissionNoteText(e.target.value)}
                      placeholder="Add any notes, links, or context explaining the deliverables attached..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 12,
                        background: '#121214',
                        border: '1px solid #27272a',
                        borderRadius: 8,
                        color: '#ffffff',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* When file upload is NOT required, writing work summary is strictly mandatory */
                <div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: '#93c5fd'
                  }}>
                    <FileText size={14} style={{ flexShrink: 0 }} />
                    <span>No file upload is required for this deliverable. Please write what you completed before submitting.</span>
                  </div>

                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                    What did you complete? <strong style={{ color: '#ef4444' }}>* (Required before submitting)</strong>
                  </label>
                  <textarea
                    value={submissionNoteText}
                    onChange={(e) => {
                      setSubmissionNoteText(e.target.value);
                      if (submissionError) setSubmissionError('');
                    }}
                    placeholder="Write a clear summary of what you did, completed tasks, results, links or proof of work..."
                    rows={4}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: 12,
                      background: '#121214',
                      border: '1px solid #27272a',
                      borderRadius: 8,
                      color: '#ffffff',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      marginBottom: 14
                    }}
                  />

                  {/* Optional file upload even if not strictly required */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Attach supporting file or screenshot (optional):
                    </label>
                    <div style={{
                      border: '1px dashed #27272a',
                      borderRadius: 8,
                      padding: '10px 14px',
                      background: '#141416',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <input
                        type="file"
                        id="deliverable-modal-file-optional"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSubmissionFile(file);
                        }}
                      />
                      {submissionFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ffffff' }}>
                          <Paperclip size={12} style={{ color: '#10b981' }} />
                          <span>{submissionFile.name} ({formatFileSize(submissionFile.size)})</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a1a1aa' }}>
                          <Upload size={12} />
                          <span>Click to attach file (optional)</span>
                        </div>
                      )}
                      {submissionFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSubmissionFile(null);
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittingTask(null);
                    setSubmissionNoteText('');
                    setSubmissionFile(null);
                    setSubmissionError('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    color: '#a1a1aa',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork}
                  style={{
                    padding: '8px 20px',
                    background: '#ffffff',
                    border: '1px solid #ffffff',
                    borderRadius: 8,
                    color: '#000000',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: submittingWork ? 'not-allowed' : 'pointer',
                    opacity: submittingWork ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Send size={12} />
                  <span>
                    {submittingWork 
                      ? 'Submitting...' 
                      : (submittingTask.status === 'review' ? 'Update Deliverable' : 'Submit for Review')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
