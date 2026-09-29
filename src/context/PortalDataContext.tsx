import React, { createContext, useContext, useState, useEffect } from 'react';
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
  RequestType
} from '../types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_TASKS, 
  INITIAL_REQUESTS, 
  INITIAL_ACTIVITY 
} from '../lib/mockData';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PortalDataContextType {
  members: Profile[];
  departments: Department[];
  announcements: Announcement[];
  tasks: TaskItem[];
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
  
  // Departments
  addDepartment: (dept: { name: string; description: string; color: string; head_id?: string; head_name?: string }) => Promise<void>;
  
  // Announcements
  addAnnouncement: (announcement: {
    title: string;
    content: string;
    priority: PriorityLevel;
    target_role: 'all' | 'admin' | 'head' | 'member';
    target_department: string;
  }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  // Tasks
  addTask: (task: {
    title: string;
    description: string;
    assigned_to_id: string;
    department: string;
    priority: PriorityLevel;
    due_date: string;
  }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  
  // Requests
  submitRequest: (request: { type: RequestType; subject: string; description: string }) => Promise<void>;
  resolveRequest: (requestId: string, status: RequestStatus) => Promise<void>;
}

const PortalDataContext = createContext<PortalDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ceova_data_';

export const PortalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseConfigured } = useAuth();

  const [members, setMembers] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'members');
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'departments');
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'announcements');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [requests, setRequests] = useState<MemberRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'requests');
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'activity');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY;
    } catch {
      return INITIAL_ACTIVITY;
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'activity', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Fetch real data from Supabase if connected
  const refreshData = async () => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) return;

    setIsLoadingData(true);
    try {
      // 1. Fetch profiles
      const { data: profilesData } = await client.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesData && profilesData.length > 0) {
        setMembers(profilesData as Profile[]);
      }

      // 2. Fetch departments
      const { data: deptData } = await client.from('departments').select('*');
      if (deptData && deptData.length > 0) {
        setDepartments(deptData as Department[]);
      }

      // 3. Fetch announcements
      const { data: annData } = await client.from('announcements').select('*').order('created_at', { ascending: false });
      if (annData && annData.length > 0) {
        setAnnouncements(annData as Announcement[]);
      }

      // 4. Fetch tasks
      const { data: taskData } = await client.from('tasks').select('*').order('created_at', { ascending: false });
      if (taskData && taskData.length > 0) {
        setTasks(taskData as TaskItem[]);
      }

      // 5. Fetch member requests
      const { data: reqData } = await client.from('member_requests').select('*').order('created_at', { ascending: false });
      if (reqData && reqData.length > 0) {
        setRequests(reqData as MemberRequest[]);
      }

      // 6. Fetch logs
      const { data: logData } = await client.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(25);
      if (logData && logData.length > 0) {
        setActivityLogs(logData as ActivityLog[]);
      }
    } catch (err) {
      console.warn('Could not complete Supabase sync (tables might still be initializing):', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      refreshData();
    }
  }, [isSupabaseConfigured]);

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
    if (client && isSupabaseConfigured) {
      try {
        await client.from('activity_logs').insert([{
          user_id: user?.id,
          user_name: user?.full_name,
          role: user?.role,
          action,
          details,
        }]);
      } catch (e) {
        console.warn('Failed to log to Supabase', e);
      }
    }
  };

  // Member management
  const updateMemberRole = async (memberId: string, newRole: UserRole) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );

    await logAction(
      'ROLE_CHANGE',
      `Changed role for ${targetMember.full_name} (${targetMember.email}) from ${targetMember.role.toUpperCase()} to ${newRole.toUpperCase()}`
    );

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').update({ role: newRole }).eq('id', memberId);
      } catch (e) {
        console.error('Supabase update role error', e);
      }
    }
  };

  const updateMemberDepartment = async (memberId: string, newDept: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, department: newDept } : m))
    );

    await logAction(
      'DEPARTMENT_CHANGE',
      `Reassigned ${targetMember.full_name} to ${newDept} department`
    );

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').update({ department: newDept }).eq('id', memberId);
      } catch (e) {
        console.error('Supabase update department error', e);
      }
    }
  };

  const updateMemberStatus = async (memberId: string, newStatus: Profile['status']) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
    );

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').update({ status: newStatus }).eq('id', memberId);
      } catch (e) {
        console.error('Supabase update status error', e);
      }
    }
  };

  const addMember = async (memberData: Omit<Profile, 'id' | 'created_at'>) => {
    const newProfile: Profile = {
      ...memberData,
      id: 'usr-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setMembers((prev) => [newProfile, ...prev]);

    await logAction(
      'MEMBER_INVITED',
      `Added new ${newProfile.role} profile: ${newProfile.full_name} (${newProfile.email})`
    );

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').insert([newProfile]);
      } catch (e) {
        console.error('Supabase insert profile error', e);
      }
    }
  };

  const deleteMember = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));

    if (target) {
      await logAction('MEMBER_REMOVED', `Removed member ${target.full_name} (${target.email})`);
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('profiles').delete().eq('id', memberId);
      } catch (e) {
        console.error('Supabase delete member error', e);
      }
    }
  };

  // Departments
  const addDepartment = async (deptData: { name: string; description: string; color: string; head_id?: string; head_name?: string }) => {
    const newDept: Department = {
      ...deptData,
      id: 'dept-' + Date.now(),
      member_count: 1,
    };
    setDepartments((prev) => [...prev, newDept]);

    await logAction('DEPARTMENT_CREATED', `Created new department: ${newDept.name}`);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('departments').insert([{
          name: deptData.name,
          description: deptData.description,
          color: deptData.color,
          head_id: deptData.head_id,
        }]);
      } catch (e) {
        console.error('Supabase add department error', e);
      }
    }
  };

  // Announcements
  const addAnnouncement = async (annData: {
    title: string;
    content: string;
    priority: PriorityLevel;
    target_role: 'all' | 'admin' | 'head' | 'member';
    target_department: string;
  }) => {
    const newAnnouncement: Announcement = {
      ...annData,
      id: 'anc-' + Date.now(),
      author_id: user?.id || 'usr-admin-1',
      author_name: user?.full_name || 'Administrator',
      author_role: user?.role || 'admin',
      pinned: annData.priority === 'urgent',
      created_at: new Date().toISOString(),
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    await logAction('ANNOUNCEMENT_POSTED', `Posted announcement: "${annData.title}" (${annData.priority.toUpperCase()})`);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('announcements').insert([{
          title: annData.title,
          content: annData.content,
          priority: annData.priority,
          target_role: annData.target_role,
          target_department: annData.target_department,
          author_id: user?.id,
          pinned: annData.priority === 'urgent',
        }]);
      } catch (e) {
        console.error('Supabase add announcement error', e);
      }
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('announcements').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete announcement error', e);
      }
    }
  };

  // Tasks
  const addTask = async (taskData: {
    title: string;
    description: string;
    assigned_to_id: string;
    department: string;
    priority: PriorityLevel;
    due_date: string;
  }) => {
    const assignee = members.find((m) => m.id === taskData.assigned_to_id);

    const newTask: TaskItem = {
      ...taskData,
      id: 'task-' + Date.now(),
      assigned_to_name: assignee?.full_name || 'Team Member',
      assigned_by_id: user?.id || 'usr-admin-1',
      assigned_by_name: user?.full_name || 'Lead',
      status: 'todo',
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    await logAction('TASK_ASSIGNED', `Assigned task "${taskData.title}" to ${newTask.assigned_to_name}`);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('tasks').insert([{
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assigned_to_id,
          assigned_by: user?.id,
          department: taskData.department,
          priority: taskData.priority,
          status: 'todo',
          due_date: taskData.due_date,
        }]);
      } catch (e) {
        console.error('Supabase add task error', e);
      }
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('tasks').update({ status }).eq('id', taskId);
      } catch (e) {
        console.error('Supabase update task error', e);
      }
    }
  };

  // Requests
  const submitRequest = async (reqData: { type: RequestType; subject: string; description: string }) => {
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

    await logAction('REQUEST_SUBMITTED', `${newReq.user_name} submitted a ${newReq.type} request: "${newReq.subject}"`);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('member_requests').insert([{
          user_id: user?.id,
          type: reqData.type,
          subject: reqData.subject,
          description: reqData.description,
          status: 'pending',
        }]);
      } catch (e) {
        console.error('Supabase submit request error', e);
      }
    }
  };

  const resolveRequest = async (requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, reviewed_by: user?.full_name } : r))
    );

    const targetReq = requests.find((r) => r.id === requestId);
    if (targetReq) {
      await logAction('REQUEST_RESOLVED', `${user?.full_name} marked request "${targetReq.subject}" as ${status.toUpperCase()}`);
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured) {
      try {
        await client.from('member_requests').update({
          status,
          reviewed_by: user?.id,
        }).eq('id', requestId);
      } catch (e) {
        console.error('Supabase resolve request error', e);
      }
    }
  };

  return (
    <PortalDataContext.Provider
      value={{
        members,
        departments,
        announcements,
        tasks,
        requests,
        activityLogs,
        isLoadingData,
        refreshData,
        updateMemberRole,
        updateMemberDepartment,
        updateMemberStatus,
        addMember,
        deleteMember,
        addDepartment,
        addAnnouncement,
        deleteAnnouncement,
        addTask,
        updateTaskStatus,
        submitRequest,
        resolveRequest,
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
