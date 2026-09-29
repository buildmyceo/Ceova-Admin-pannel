export type UserRole = 'admin' | 'head' | 'member';

export type UserStatus = 'active' | 'away' | 'in_meeting' | 'offline';

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
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head_id?: string;
  head_name?: string;
  color: string;
  member_count?: number;
}

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  priority: PriorityLevel;
  target_role: 'all' | 'admin' | 'head' | 'member';
  target_department: string;
  pinned: boolean;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_by_id: string;
  assigned_by_name: string;
  department: string;
  priority: PriorityLevel;
  status: TaskStatus;
  due_date: string;
  created_at: string;
}

export type RequestType = 'leave' | 'equipment' | '1on1' | 'access' | 'general';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface MemberRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: RequestType;
  subject: string;
  description: string;
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
