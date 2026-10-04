export type UserRole = 
  | 'ceo' 
  | 'cto' 
  | 'cmo' 
  | 'cfo' 
  | 'coo' 
  | 'lead' 
  | 'member' 
  | 'intern' 
  | 'admin' 
  | 'head';

export type UserStatus = 'active' | 'away' | 'in_meeting' | 'offline';

export type Permission = 
  | 'view_company_overview'
  | 'view_financials'
  | 'view_executive_room'
  | 'manage_tasks'
  | 'manage_projects'
  | 'approve_requests'
  | 'manage_team'
  | 'manage_departments'
  | 'publish_company_announcements'
  | 'publish_dept_announcements'
  | 'view_all_departments';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  department: string;
  designation: string;
  phone?: string;
  status: UserStatus;
  bio?: string;
  skills?: string[];
  reporting_to?: string; // Manager or C-suite executive
  supervisor?: string;   // For interns
  current_project?: string;
  weekly_progress?: number;
  attendance_rate?: number;
  supervisor_feedback?: string;
  permissions: Permission[];
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  code: 'dev' | 'mkt' | 'fin' | 'ops' | 'des' | 'exec';
  description: string;
  c_suite_leader: string;
  head_id?: string;
  head_name?: string;
  color: string;
  member_count?: number;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Needs Attention' | 'Operational';
  pending_tasks_count: number;
  critical_issues: string[];
}

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  due_date: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  owner_name: string;
  owner_role: string;
  department: string;
  status: 'active' | 'at_risk' | 'planning' | 'completed';
  progress: number; // 0 - 100
  deadline: string;
  members: Array<{ id: string; name: string; avatar?: string; role: string }>;
  milestones: Milestone[];
  risks: string[];
  tasks_count: { total: number; completed: number };
  files_count: number;
  chat_channel_id: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked' | 'done';

export interface TaskAttachment {
  name: string;
  size: string;
  type: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_by_id: string;
  assigned_by_name: string;
  department: string;
  project_name?: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'normal' | 'urgent';
  status: TaskStatus;
  due_date: string;
  attachments?: TaskAttachment[];
  comments_count?: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  priority: PriorityLevel;
  target_role: 'all' | 'c_suite' | 'head' | 'member' | 'intern' | 'admin';
  target_department: string;
  pinned: boolean;
  created_at: string;
}

export type RequestType = 'leave' | 'equipment' | '1on1' | 'access' | 'general' | 'approval';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface MemberRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: RequestType;
  subject: string;
  description: string;
  amount?: string;
  status: RequestStatus;
  reviewed_by?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_avatar?: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: Array<{ emoji: string; count: number; users: string[] }>;
  is_pinned?: boolean;
  pinned?: boolean;
  reply_to?: { id: string; text: string; sender_name: string };
  attachment?: { 
    type: 'image' | 'file' | 'audio'; 
    name: string; 
    url?: string; 
    duration?: string; 
    size?: string; 
  };
  suggested_task?: { 
    title: string; 
    assignee: string; 
    project: string; 
    deadline: string; 
    priority: string;
    department: string;
  };
  suggested_approval?: { 
    amount: string; 
    purpose: string; 
    requester: string;
    department: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'dm' | 'group' | 'project' | 'executive' | 'announcement';
  department?: string;
  avatar?: string;
  members_count?: number;
  last_message?: string;
  last_timestamp?: string;
  unread_count?: number;
  is_restricted?: boolean;
  allowed_roles?: UserRole[];
  topic?: string;
}

export interface FinancialMetric {
  cash_balance: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_burn: number;
  runway_months: number;
  pending_payments_total: number;
  pending_reimbursements_total: number;
  total_funding: number;
  investors: Array<{ id: string; name: string; type: string; commitment: number; stage: string }>;
  grants: Array<{ id: string; name: string; agency: string; amount: number; status: string }>;
  approvals: Array<{ id: string; title: string; amount: number; requested_by: string; department: string; status: 'pending' | 'approved' | 'rejected'; date: string }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'task' | 'message' | 'approval' | 'announcement' | 'system';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export interface StrategicDecision {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'pending' | 'decided' | 'review';
  owner: string;
  impact: 'Critical' | 'High' | 'Medium';
  deadline: string;
}

export interface WaitlistRequest {
  id: string;
  full_name: string;
  email: string;
  requested_role: UserRole;
  department: string;
  phone?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}
