export type UserRole = 'admin' | 'member' | 'intern' | 'ceo';

export type UserStatus = 'active' | 'away' | 'in_meeting' | 'offline' | 'pending';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  social_links?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
  };
  apps?: ConnectedApp[];
  role: UserRole;
  department: string;
  designation: string;
  phone?: string;
  status: UserStatus;
  bio?: string;
  skills?: string[];
  created_at: string;
  updated_at?: string;
  last_active_at?: string;
}

export interface SavedAccount {

  profile: Profile;
  session?: {
    access_token: string;
    refresh_token: string;
  } | null;
  lastActive?: string;
}


export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  member_count?: number;
  progress?: number;
  status?: string;
  c_suite_leader?: string;
}

export interface ConnectedApp {
  id: string;
  name: string;
  supabaseUrl: string;
  supabaseKey: string;
  razorpayKey?: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface TaskAttachment {
  name: string;
  url: string;
  size: number;
  type?: string;
  uploaded_by: string;
  uploaded_at: string;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assigned_to_id?: string | null;
  assigned_to_name?: string | null;
  assigned_to_ids?: string[];
  assigned_to_names?: string[];
  assigned_by_id?: string | null;
  assigned_by_name?: string | null;
  department?: string;
  project_name?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  tags?: string[];
  requires_upload?: boolean;
  upload_instructions?: string | null;
  allowed_file_types?: string | null;
  max_file_size_mb?: number | null;
  attachments?: TaskAttachment[];
  review_feedback?: string | null;
  reviewed_by_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  created_at: string;
  is_saved?: boolean;
  saved_at?: string | null;
}

export type MeetingCategory = 'executive' | 'standup' | 'review' | 'sprint' | 'general';

export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  meet_link: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time?: string; // HH:mm
  duration_minutes: number;
  category: MeetingCategory;
  target_type: 'all' | 'members';
  attendee_ids?: string[];
  attendee_names?: string[];
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export type NotificationType = 'meeting' | 'task' | 'deliverable' | 'system' | 'message';

export interface NotificationAttachment {
  id: string;
  name: string;
  url: string;
  type: 'photo' | 'file';
  size?: number;
}

export interface AppNotification {
  id: string;
  user_id?: string | null; // null or 'all' for broadcast
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  read_by_ids?: string[];
  read_by_names?: string[];
  created_at: string;
  meeting_id?: string;
  task_id?: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: UserRole;
  sender_avatar?: string;
  target_type?: 'all' | 'members';
  recipient_ids?: string[];
  recipient_names?: string[];
  photos?: NotificationAttachment[];
  files?: NotificationAttachment[];
  meta?: any;
}

