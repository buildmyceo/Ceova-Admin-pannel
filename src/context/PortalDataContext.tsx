import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Profile, 
  Department, 
  Announcement, 
  TaskItem, 
  MemberRequest, 
  ActivityLog, 
  UserRole,
  TaskStatus,
  RequestStatus,
  PriorityLevel,
  RequestType,
  Project,
  ChatChannel,
  ChatMessage,
  FinancialMetric,
  NotificationItem,
  StrategicDecision,
  WaitlistRequest
} from '../types';
import { 
  REAL_MEMBERS, 
  REAL_DEPARTMENTS, 
  REAL_PROJECTS,
  REAL_TASKS, 
  REAL_CHANNELS,
  REAL_MESSAGES,
  REAL_FINANCIALS,
  REAL_STRATEGIC_DECISIONS,
  REAL_ANNOUNCEMENTS, 
  REAL_NOTIFICATIONS,
  REAL_REQUESTS, 
  REAL_ACTIVITY,
  REAL_WAITLIST 
} from '../lib/realData';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PortalDataContextType {
  members: Profile[];
  departments: Department[];
  projects: Project[];
  tasks: TaskItem[];
  channels: ChatChannel[];
  messages: Record<string, ChatMessage[]>;
  financials: FinancialMetric;
  strategicDecisions: StrategicDecision[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  requests: MemberRequest[];
  activityLogs: ActivityLog[];
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  
  // Member Management
  updateMemberRole: (memberId: string, newRole: UserRole) => Promise<void>;
  updateMemberDepartment: (memberId: string, newDept: string) => Promise<void>;
  updateMemberStatus: (memberId: string, newStatus: Profile['status']) => Promise<void>;
  addMember: (member: Omit<Profile, 'id' | 'created_at'>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  
  // Projects
  addProject: (proj: Omit<Project, 'id'>) => Promise<void>;
  toggleMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  
  // Tasks
  addTask: (task: {
    title: string;
    description: string;
    assigned_to_id: string;
    department: string;
    project_name?: string;
    priority: TaskItem['priority'];
    due_date: string;
  }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Chat System
  sendMessage: (channelId: string, text: string, attachment?: ChatMessage['attachment']) => Promise<void>;
  addReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (channelId: string, messageId: string) => Promise<void>;
  createTaskFromMessage: (message: ChatMessage) => Promise<void>;
  createApprovalFromMessage: (message: ChatMessage) => Promise<void>;

  // Financial & Approvals
  resolveApproval: (approvalId: string, status: 'approved' | 'rejected') => Promise<void>;
  updateDecisionStatus: (decisionId: string, status: StrategicDecision['status']) => Promise<void>;

  // Announcements
  addAnnouncement: (announcement: {
    title: string;
    content: string;
    priority: PriorityLevel;
    target_role: Announcement['target_role'];
    target_department: string;
  }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Requests & Waitlist
  submitRequest: (request: { type: RequestType; subject: string; description: string; amount?: string }) => Promise<void>;
  resolveRequest: (requestId: string, status: RequestStatus) => Promise<void>;
  waitlistRequests: WaitlistRequest[];
  submitWaitlistRequest: (req: {
    full_name: string;
    email: string;
    requested_role: UserRole;
    department: string;
    phone?: string;
    reason: string;
  }) => Promise<void>;
  resolveWaitlistRequest: (requestId: string, status: 'approved' | 'rejected') => Promise<void>;
}

const PortalDataContext = createContext<PortalDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ceova_team_os_v1_';

export const PortalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseConfigured } = useAuth();

  const [members, setMembers] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'members');
      return saved ? JSON.parse(saved) : REAL_MEMBERS;
    } catch {
      return REAL_MEMBERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'departments');
      return saved ? JSON.parse(saved) : REAL_DEPARTMENTS;
    } catch {
      return REAL_DEPARTMENTS;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'projects');
      return saved ? JSON.parse(saved) : REAL_PROJECTS;
    } catch {
      return REAL_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'tasks');
      return saved ? JSON.parse(saved) : REAL_TASKS;
    } catch {
      return REAL_TASKS;
    }
  });

  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'channels');
      return saved ? JSON.parse(saved) : REAL_CHANNELS;
    } catch {
      return REAL_CHANNELS;
    }
  });

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'messages');
      return saved ? JSON.parse(saved) : REAL_MESSAGES;
    } catch {
      return REAL_MESSAGES;
    }
  });

  const [financials, setFinancials] = useState<FinancialMetric>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'financials');
      return saved ? JSON.parse(saved) : REAL_FINANCIALS;
    } catch {
      return REAL_FINANCIALS;
    }
  });

  const [strategicDecisions, setStrategicDecisions] = useState<StrategicDecision[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'decisions');
      return saved ? JSON.parse(saved) : REAL_STRATEGIC_DECISIONS;
    } catch {
      return REAL_STRATEGIC_DECISIONS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'announcements');
      return saved ? JSON.parse(saved) : REAL_ANNOUNCEMENTS;
    } catch {
      return REAL_ANNOUNCEMENTS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'notifications');
      return saved ? JSON.parse(saved) : REAL_NOTIFICATIONS;
    } catch {
      return REAL_NOTIFICATIONS;
    }
  });

  const [requests, setRequests] = useState<MemberRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'requests');
      return saved ? JSON.parse(saved) : REAL_REQUESTS;
    } catch {
      return REAL_REQUESTS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'activity');
      return saved ? JSON.parse(saved) : REAL_ACTIVITY;
    } catch {
      return REAL_ACTIVITY;
    }
  });

  const [waitlistRequests, setWaitlistRequests] = useState<WaitlistRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'waitlist');
      return saved ? JSON.parse(saved) : REAL_WAITLIST;
    } catch {
      return REAL_WAITLIST;
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Sync to local storage for fast cached render
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'waitlist', JSON.stringify(waitlistRequests));
  }, [waitlistRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'financials', JSON.stringify(financials));
  }, [financials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'decisions', JSON.stringify(strategicDecisions));
  }, [strategicDecisions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'activity', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Log action locally and to Supabase
  const logAction = async (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      user_id: user?.id || 'unknown',
      user_name: user?.full_name || 'System',
      role: user?.role || 'member',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('activity_logs').insert([{
          id: newLog.id,
          user_id: user?.id,
          user_name: user?.full_name,
          role: user?.role,
          action,
          details,
          timestamp: newLog.timestamp,
        }]);
      } catch (e) {
        console.warn('Failed to log to Supabase', e);
      }
    }
  };

  // Comprehensive Supabase fetch for all real production tables
  const refreshData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;

    setIsLoadingData(true);
    try {
      const [
        { data: profData },
        { data: deptData },
        { data: projData },
        { data: taskData },
        { data: chanData },
        { data: msgData },
        { data: finData },
        { data: decData },
        { data: ancData },
        { data: reqData },
        { data: logData },
        { data: wlData }
      ] = await Promise.all([
        client.from('profiles').select('*').order('created_at', { ascending: true }),
        client.from('departments').select('*'),
        client.from('projects').select('*'),
        client.from('tasks').select('*').order('created_at', { ascending: false }),
        client.from('channels').select('*'),
        client.from('chat_messages').select('*').order('timestamp', { ascending: true }),
        client.from('financials').select('*').maybeSingle(),
        client.from('strategic_decisions').select('*'),
        client.from('announcements').select('*').order('created_at', { ascending: false }),
        client.from('member_requests').select('*').order('created_at', { ascending: false }),
        client.from('activity_logs').select('*').order('timestamp', { ascending: false }),
        client.from('waitlist_requests').select('*').order('created_at', { ascending: false })
      ]);

      if (profData && profData.length > 0) setMembers(profData as Profile[]);
      if (deptData && deptData.length > 0) setDepartments(deptData as Department[]);
      if (projData && projData.length > 0) setProjects(projData as Project[]);
      if (taskData && taskData.length > 0) setTasks(taskData as TaskItem[]);
      if (chanData && chanData.length > 0) setChannels(chanData as ChatChannel[]);
      
      if (msgData && msgData.length > 0) {
        const grouped: Record<string, ChatMessage[]> = {};
        for (const msg of msgData) {
          if (!grouped[msg.channel_id]) grouped[msg.channel_id] = [];
          grouped[msg.channel_id].push(msg as ChatMessage);
        }
        setMessages(grouped);
      }

      if (finData) setFinancials(finData as FinancialMetric);
      if (decData && decData.length > 0) setStrategicDecisions(decData as StrategicDecision[]);
      if (ancData && ancData.length > 0) setAnnouncements(ancData as Announcement[]);
      if (reqData && reqData.length > 0) setRequests(reqData as MemberRequest[]);
      if (logData && logData.length > 0) setActivityLogs(logData as ActivityLog[]);
      if (wlData && wlData.length > 0) setWaitlistRequests(wlData as WaitlistRequest[]);
    } catch (err) {
      console.warn('Could not complete Supabase sync:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Mount real data loader and Realtime event listener
  useEffect(() => {
    refreshData();

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('ceova_realtime_portal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_requests' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_requests' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'strategic_decisions' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshData())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [refreshData]);

  // Member Management
  const updateMemberRole = async (memberId: string, newRole: UserRole) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').update({ role: newRole }).eq('id', memberId);
    }

    await logAction(
      'ROLE_CHANGE',
      `Changed role for ${targetMember.full_name} from ${targetMember.role.toUpperCase()} to ${newRole.toUpperCase()}`
    );
  };

  const updateMemberDepartment = async (memberId: string, newDept: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, department: newDept } : m))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').update({ department: newDept }).eq('id', memberId);
    }

    await logAction(
      'DEPARTMENT_CHANGE',
      `Reassigned ${targetMember.full_name} to ${newDept} department`
    );
  };

  const updateMemberStatus = async (memberId: string, newStatus: Profile['status']) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').update({ status: newStatus }).eq('id', memberId);
    }
  };

  const addMember = async (memberData: Omit<Profile, 'id' | 'created_at'>) => {
    const newProfile: Profile = {
      ...memberData,
      id: 'usr-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setMembers((prev) => [newProfile, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').insert(newProfile);
    }

    await logAction('MEMBER_ADDED', `Added new member: ${newProfile.full_name} (${newProfile.role.toUpperCase()})`);
  };

  const deleteMember = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));

    const client = getSupabaseClient();
    if (client) {
      await client.from('profiles').delete().eq('id', memberId);
    }

    if (target) {
      await logAction('MEMBER_REMOVED', `Removed member ${target.full_name}`);
    }
  };

  // Projects
  const addProject = async (projData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...projData,
      id: 'proj-' + Date.now(),
    };
    setProjects((prev) => [newProj, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('projects').insert(newProj);
    }

    await logAction('PROJECT_CREATED', `Created new project: ${newProj.name}`);
  };

  const toggleMilestone = async (projectId: string, milestoneId: string) => {
    let updatedProj: Project | undefined;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        updatedProj = {
          ...p,
          milestones: updatedMilestones,
          progress: newProgress,
        };
        return updatedProj;
      })
    );

    const client = getSupabaseClient();
    if (client && updatedProj) {
      await client.from('projects').update({
        milestones: updatedProj.milestones,
        progress: updatedProj.progress
      }).eq('id', projectId);
    }
  };

  // Tasks
  const addTask = async (taskData: {
    title: string;
    description: string;
    assigned_to_id: string;
    department: string;
    project_name?: string;
    priority: TaskItem['priority'];
    due_date: string;
  }) => {
    const assignee = members.find((m) => m.id === taskData.assigned_to_id);

    const newTask: TaskItem = {
      ...taskData,
      id: 'task-' + Date.now(),
      assigned_to_name: assignee?.full_name || 'Team Member',
      assigned_by_id: user?.id || 'usr-ceo',
      assigned_by_name: user?.full_name || 'Lead',
      status: 'todo',
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('tasks').insert(newTask);
    }

    await logAction('TASK_ASSIGNED', `Assigned task "${taskData.title}" to ${newTask.assigned_to_name}`);

    // Create notification for assignee
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: 'New Task Assigned',
      message: `${newTask.assigned_by_name} assigned you "${newTask.title}"`,
      category: 'task',
      read: false,
      created_at: 'Just now'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('tasks').update({ status }).eq('id', taskId);
    }

    if (task) {
      await logAction('TASK_STATUS_UPDATED', `Moved task "${task.title}" to ${status.toUpperCase()}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const client = getSupabaseClient();
    if (client) {
      await client.from('tasks').delete().eq('id', taskId);
    }
  };

  // Chat System
  const sendMessage = async (channelId: string, text: string, attachment?: ChatMessage['attachment']) => {
    if (!text.trim() && !attachment) return;

    // Check for auto-task / auto-approval heuristics in text
    let suggested_task: ChatMessage['suggested_task'] = undefined;
    let suggested_approval: ChatMessage['suggested_approval'] = undefined;

    const lower = text.toLowerCase();
    if (lower.includes('finish') || lower.includes('complete') || lower.includes('implement') || lower.includes('fix')) {
      const words = text.split(' ');
      const candidateName = words[0].replace(',', '').trim();
      const matchedMember = members.find(m => m.full_name.toLowerCase().includes(candidateName.toLowerCase()));

      suggested_task = {
        title: text.length > 50 ? text.substring(0, 50) + '...' : text,
        assignee: matchedMember ? matchedMember.full_name : 'Rahul Sharma',
        project: channelId.includes('cctv') ? 'Ceova CCTV' : channelId.includes('android') ? 'Ceova Android' : 'Ceova CCTV',
        department: 'Development',
        priority: lower.includes('urgent') || lower.includes('asap') ? 'Critical' : 'High',
        deadline: 'Wednesday'
      };
    }

    if (lower.includes('approve') || lower.includes('₹') || lower.includes('budget') || lower.includes('invoice')) {
      const matchAmount = text.match(/(₹\s?[\d,]+|\d+k)/i);
      suggested_approval = {
        amount: matchAmount ? matchAmount[0] : '₹18,000',
        purpose: text,
        requester: user?.full_name || 'Elena Rostova',
        department: user?.department || 'Operations'
      };
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      channel_id: channelId,
      sender_id: user?.id || 'usr-ceo',
      sender_name: user?.full_name || 'Harshit (CEO)',
      sender_role: user?.role || 'ceo',
      sender_avatar: user?.avatar_url,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      reactions: [],
      attachment,
      suggested_task,
      suggested_approval
    };

    setMessages((prev) => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), newMsg]
    }));

    const client = getSupabaseClient();
    if (client) {
      await client.from('chat_messages').insert(newMsg);
    }

    await logAction('CHAT_MESSAGE_SENT', `Sent message in #${channelId}`);
  };

  const addReaction = async (channelId: string, messageId: string, emoji: string) => {
    let finalReactions: any[] = [];
    setMessages((prev) => {
      const channelMsgs = prev[channelId] || [];
      const updated = channelMsgs.map((m) => {
        if (m.id !== messageId) return m;
        const existingReaction = m.reactions?.find((r: any) => r.emoji === emoji);
        let newReactions = [...(m.reactions || [])];
        if (existingReaction) {
          if (existingReaction.users.includes(user?.id || '')) {
            newReactions = newReactions.map((r: any) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u !== user?.id) }
                : r
            ).filter((r: any) => r.count > 0);
          } else {
            newReactions = newReactions.map((r: any) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, user?.id || ''] }
                : r
            );
          }
        } else {
          newReactions.push({ emoji, count: 1, users: [user?.id || ''] });
        }
        finalReactions = newReactions;
        return { ...m, reactions: newReactions };
      });
      return { ...prev, [channelId]: updated };
    });

    const client = getSupabaseClient();
    if (client) {
      await client.from('chat_messages').update({ reactions: finalReactions }).eq('id', messageId);
    }
  };

  const togglePinMessage = async (channelId: string, messageId: string) => {
    let newPinned = false;
    setMessages((prev) => {
      const channelMsgs = prev[channelId] || [];
      const updated = channelMsgs.map((m) => {
        if (m.id !== messageId) return m;
        newPinned = !(m.pinned ?? m.is_pinned);
        return { ...m, pinned: newPinned, is_pinned: newPinned };
      });
      return { ...prev, [channelId]: updated };
    });

    const client = getSupabaseClient();
    if (client) {
      await client.from('chat_messages').update({ pinned: newPinned }).eq('id', messageId);
    }
  };

  const createTaskFromMessage = async (message: ChatMessage) => {
    if (!message.suggested_task) return;
    const { title, assignee, project, priority } = message.suggested_task;
    const assignedUser = members.find(m => m.full_name.toLowerCase().includes(assignee.toLowerCase())) || members[0];

    await addTask({
      title,
      description: `Created directly from chat message by ${message.sender_name}: "${message.text}"`,
      assigned_to_id: assignedUser.id,
      department: assignedUser.department || 'Development',
      project_name: project,
      priority: priority.toLowerCase() as any,
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    });
  };

  const createApprovalFromMessage = async (message: ChatMessage) => {
    if (!message.suggested_approval) return;
    const { amount, purpose, requester, department } = message.suggested_approval;
    const numAmount = parseInt(amount.replace(/[^0-9]/g, '')) || 18000;

    const newApproval: FinancialMetric['approvals'][0] = {
      id: 'appr-' + Date.now(),
      title: purpose,
      amount: numAmount,
      requested_by: requester,
      department,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedApprovals = [newApproval, ...financials.approvals];
    setFinancials(prev => ({
      ...prev,
      approvals: updatedApprovals
    }));

    const client = getSupabaseClient();
    if (client) {
      await client.from('financials').update({
        approvals: updatedApprovals,
        updated_at: new Date().toISOString()
      }).eq('id', 'primary_metrics');
    }

    await logAction('APPROVAL_REQUESTED', `Disbursement approval requested for ${amount} (${purpose})`);
  };

  // Financial & Approvals
  const resolveApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    const updatedApprovals = financials.approvals.map((a) => (a.id === approvalId ? { ...a, status } : a));
    setFinancials((prev) => ({
      ...prev,
      approvals: updatedApprovals,
    }));

    const client = getSupabaseClient();
    if (client) {
      await client.from('financials').update({
        approvals: updatedApprovals,
        updated_at: new Date().toISOString()
      }).eq('id', 'primary_metrics');
    }

    await logAction('APPROVAL_RESOLVED', `Marked approval #${approvalId} as ${status.toUpperCase()}`);
  };

  const updateDecisionStatus = async (decisionId: string, status: StrategicDecision['status']) => {
    setStrategicDecisions((prev) =>
      prev.map((d) => (d.id === decisionId ? { ...d, status } : d))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('strategic_decisions').update({ status }).eq('id', decisionId);
    }

    await logAction('STRATEGIC_DECISION_UPDATED', `Strategic decision #${decisionId} updated to ${status.toUpperCase()}`);
  };

  // Announcements
  const addAnnouncement = async (ancData: {
    title: string;
    content: string;
    priority: PriorityLevel;
    target_role: Announcement['target_role'];
    target_department: string;
  }) => {
    const newAnc: Announcement = {
      id: 'anc-' + Date.now(),
      title: ancData.title,
      content: ancData.content,
      author_id: user?.id || 'usr-ceo',
      author_name: user?.full_name || 'Harshit (CEO)',
      author_role: user?.role || 'ceo',
      priority: ancData.priority,
      target_role: ancData.target_role,
      target_department: ancData.target_department,
      pinned: true,
      created_at: new Date().toISOString().split('T')[0],
    };

    setAnnouncements((prev) => [newAnc, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('announcements').insert(newAnc);
    }

    await logAction('ANNOUNCEMENT_POSTED', `Posted announcement: "${newAnc.title}"`);
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    const client = getSupabaseClient();
    if (client) {
      await client.from('announcements').delete().eq('id', id);
    }
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Requests
  const submitRequest = async (reqData: { type: RequestType; subject: string; description: string; amount?: string }) => {
    const newReq: MemberRequest = {
      ...reqData,
      id: 'req-' + Date.now(),
      user_id: user?.id || 'guest',
      user_name: user?.full_name || 'Member',
      user_email: user?.email || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('member_requests').insert(newReq);
    }

    await logAction('REQUEST_SUBMITTED', `${newReq.user_name} submitted ${newReq.type}: "${newReq.subject}"`);
  };

  const resolveRequest = async (requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, reviewed_by: user?.full_name } : r))
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('member_requests').update({
        status,
        reviewed_by: user?.full_name
      }).eq('id', requestId);
    }
  };

  // Waitlist System
  const submitWaitlistRequest = async (reqData: {
    full_name: string;
    email: string;
    requested_role: UserRole;
    department: string;
    phone?: string;
    reason: string;
  }) => {
    const newWaitlistReq: WaitlistRequest = {
      id: 'wl-' + Date.now(),
      ...reqData,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setWaitlistRequests((prev) => [newWaitlistReq, ...prev]);

    const client = getSupabaseClient();
    if (client) {
      await client.from('waitlist_requests').insert(newWaitlistReq);
    }

    await logAction(
      'WAITLIST_SUBMISSION',
      `New candidate ${reqData.full_name} (${reqData.email}) requested clearance for ${reqData.department} as ${reqData.requested_role}`
    );

    const ceoNotif: NotificationItem = {
      id: 'notif-wl-' + Date.now(),
      title: 'New Access Clearance Request',
      message: `${reqData.full_name} requested clearance to join Ceova Team OS. Pending CEO review.`,
      category: 'system',
      read: false,
      created_at: new Date().toISOString()
    };
    setNotifications((prev) => [ceoNotif, ...prev]);
  };

  const resolveWaitlistRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const target = waitlistRequests.find((w) => w.id === requestId);
    if (!target) return;

    setWaitlistRequests((prev) =>
      prev.map((w) =>
        w.id === requestId
          ? {
              ...w,
              status,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.full_name || 'Harshit (CEO)',
            }
          : w
      )
    );

    const client = getSupabaseClient();
    if (client) {
      await client.from('waitlist_requests').update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.full_name || 'Harshit (CEO)'
      }).eq('id', requestId);
    }

    if (status === 'approved') {
      const newMember: Profile = {
        id: 'usr-' + Date.now(),
        email: target.email,
        full_name: target.full_name,
        role: target.requested_role,
        department: target.department,
        designation: target.requested_role === 'intern' ? 'Fellowship Intern' : `${target.department} Specialist`,
        status: 'active',
        phone: target.phone,
        bio: target.reason,
        permissions: ['manage_tasks'],
        created_at: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);

      if (client) {
        await client.from('profiles').insert(newMember);
      }

      await logAction('ACCESS_APPROVED', `CEO ${user?.full_name || 'Harshit'} granted Team OS clearance to ${target.full_name} (${target.department})`);
      
      const newNotif: NotificationItem = {
        id: 'notif-' + Date.now(),
        title: 'Access Clearance Granted',
        message: `${target.full_name} was granted access to ${target.department} by CEO.`,
        category: 'system',
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    } else {
      await logAction('ACCESS_REJECTED', `CEO ${user?.full_name || 'Harshit'} declined clearance request for ${target.full_name}`);
    }
  };

  return (
    <PortalDataContext.Provider
      value={{
        members,
        departments,
        projects,
        tasks,
        channels,
        messages,
        financials,
        strategicDecisions,
        announcements,
        notifications,
        requests,
        activityLogs,
        isLoadingData,
        refreshData,
        updateMemberRole,
        updateMemberDepartment,
        updateMemberStatus,
        addMember,
        deleteMember,
        addProject,
        toggleMilestone,
        addTask,
        updateTaskStatus,
        deleteTask,
        sendMessage,
        addReaction,
        togglePinMessage,
        createTaskFromMessage,
        createApprovalFromMessage,
        resolveApproval,
        updateDecisionStatus,
        addAnnouncement,
        deleteAnnouncement,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        submitRequest,
        resolveRequest,
        waitlistRequests,
        submitWaitlistRequest,
        resolveWaitlistRequest,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
};

export const usePortalData = () => {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error('usePortalData must be used within a PortalDataProvider');
  }
  return context;
};
