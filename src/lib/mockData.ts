import { Profile, Department, Announcement, TaskItem, MemberRequest, ActivityLog } from '../types';

export const INITIAL_MEMBERS: Profile[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@ceova.online',
    full_name: 'Alex Rivera',
    role: 'admin',
    department: 'Executive',
    designation: 'Managing Director & CEO',
    phone: '+1 (555) 234-8901',
    status: 'active',
    bio: 'Founder & Executive Director at Ceova. Driving core strategy, AI product innovations and ecosystem scale.',
    skills: ['Leadership', 'Strategic Planning', 'AI Architecture', 'Product Vision'],
    created_at: '2026-01-10T08:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-head-tech',
    email: 'head.tech@ceova.online',
    full_name: 'Elena Rostova',
    role: 'head',
    department: 'Engineering',
    designation: 'VP of Engineering',
    phone: '+1 (555) 345-6789',
    status: 'active',
    bio: 'Leading backend microservices, real-time distributed systems, and cloud infrastructure.',
    skills: ['Rust', 'Node.js', 'PostgreSQL', 'Kubernetes', 'System Design'],
    created_at: '2026-02-01T09:30:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-head-ai',
    email: 'head.ai@ceova.online',
    full_name: 'Marcus Thorne',
    role: 'head',
    department: 'AI & Machine Learning',
    designation: 'Head of AI Research',
    phone: '+1 (555) 456-7890',
    status: 'in_meeting',
    bio: 'Overseeing agentic workflows, LLM fine-tuning, voice avatars, and multimodal interfaces.',
    skills: ['PyTorch', 'Transformers', 'Agentic AI', 'Vector DBs', 'Python'],
    created_at: '2026-02-05T11:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-head-design',
    email: 'head.design@ceova.online',
    full_name: 'Sophia Chen',
    role: 'head',
    department: 'Product & Design',
    designation: 'Principal Design Lead',
    phone: '+1 (555) 567-8901',
    status: 'active',
    bio: 'Crafting fluid UI/UX systems, user journeys, micro-interactions, and design systems.',
    skills: ['Figma', 'Design Systems', 'Micro-interactions', 'Design Thinking'],
    created_at: '2026-02-12T14:15:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-member-1',
    email: 'member.sarah@ceova.online',
    full_name: 'Sarah Jenkins',
    role: 'member',
    department: 'Engineering',
    designation: 'Senior Frontend Engineer',
    phone: '+1 (555) 678-9012',
    status: 'active',
    bio: 'Passionate about responsive web performance, accessible interfaces, and React architecture.',
    skills: ['React', 'TypeScript', 'CSS3', 'WebSockets', 'GraphQL'],
    created_at: '2026-03-01T10:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-member-2',
    email: 'member.devon@ceova.online',
    full_name: 'Devon Vance',
    role: 'member',
    department: 'AI & Machine Learning',
    designation: 'Machine Learning Specialist',
    phone: '+1 (555) 789-0123',
    status: 'away',
    bio: 'Building low-latency inference pipelines and multi-agent coordination frameworks.',
    skills: ['Python', 'FastAPI', 'LangChain', 'Docker', 'CUDA'],
    created_at: '2026-03-10T11:45:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-member-3',
    email: 'member.priya@ceova.online',
    full_name: 'Priya Patel',
    role: 'member',
    department: 'Operations & HR',
    designation: 'Operations Coordinator',
    phone: '+1 (555) 890-1234',
    status: 'active',
    bio: 'Managing onboarding, cross-team synchronization, logistics, and company culture.',
    skills: ['Agile Project Ops', 'HR Tech', 'Process Automation', 'Talent'],
    created_at: '2026-03-15T09:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-member-4',
    email: 'member.liam@ceova.online',
    full_name: 'Liam O’Connor',
    role: 'member',
    department: 'Marketing & Growth',
    designation: 'Growth Marketer',
    phone: '+1 (555) 901-2345',
    status: 'offline',
    bio: 'Scaling user acquisition, conversion funnel experiments, and brand content.',
    skills: ['SEO', 'Content Strategy', 'Analytics', 'Copywriting'],
    created_at: '2026-03-20T13:20:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-eng',
    name: 'Engineering',
    description: 'Core software development, web architecture, and infrastructure.',
    head_id: 'usr-head-tech',
    head_name: 'Elena Rostova',
    color: '#3b82f6',
    member_count: 5
  },
  {
    id: 'dept-ai',
    name: 'AI & Machine Learning',
    description: 'Voice AI, vision models, autonomous agents, and inference.',
    head_id: 'usr-head-ai',
    head_name: 'Marcus Thorne',
    color: '#8b5cf6',
    member_count: 4
  },
  {
    id: 'dept-des',
    name: 'Product & Design',
    description: 'UI/UX design systems, user journeys, and feature specifications.',
    head_id: 'usr-head-design',
    head_name: 'Sophia Chen',
    color: '#ec4899',
    member_count: 3
  },
  {
    id: 'dept-ops',
    name: 'Operations & HR',
    description: 'Talent acquisition, operations workflow, and member engagement.',
    head_id: 'usr-member-3',
    head_name: 'Priya Patel',
    color: '#10b981',
    member_count: 2
  },
  {
    id: 'dept-mkt',
    name: 'Marketing & Growth',
    description: 'Brand distribution, partnerships, campaigns, and community.',
    head_id: 'usr-member-4',
    head_name: 'Liam O’Connor',
    color: '#f59e0b',
    member_count: 3
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: 'Ceova Portal v2.0 Rollout & New Access Control',
    content: 'Welcome to the unified Ceova Portal! We have introduced multi-role access for Admins, Department Heads, and Team Members with email authentication and instant role dashboards.',
    author_id: 'usr-admin-1',
    author_name: 'Alex Rivera (CEO)',
    author_role: 'admin',
    priority: 'urgent',
    target_role: 'all',
    target_department: 'all',
    pinned: true,
    created_at: '2026-09-28T10:00:00Z'
  },
  {
    id: 'anc-2',
    title: 'Sprint Demo & Architecture Review this Thursday',
    content: 'All Engineering and AI members are invited to our sprint showcase. We will demonstrate the new neural model pipeline and portal integrations.',
    author_id: 'usr-head-tech',
    author_name: 'Elena Rostova (Engineering Head)',
    author_role: 'head',
    priority: 'high',
    target_role: 'all',
    target_department: 'Engineering',
    pinned: false,
    created_at: '2026-09-27T14:30:00Z'
  },
  {
    id: 'anc-3',
    title: 'Q4 Health & Wellness Benefits Updates',
    content: 'Operations has published new guidelines for equipment allowance and remote work flexibilities. Please review the documentation in the handbook.',
    author_id: 'usr-member-3',
    author_name: 'Priya Patel (Operations)',
    author_role: 'member',
    priority: 'normal',
    target_role: 'all',
    target_department: 'all',
    pinned: false,
    created_at: '2026-09-25T09:15:00Z'
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Optimize Supabase RLS policies for audit logging',
    description: 'Ensure row level security correctly segregates activity logs between admins and department leads.',
    assigned_to_id: 'usr-member-1',
    assigned_to_name: 'Sarah Jenkins',
    assigned_by_id: 'usr-head-tech',
    assigned_by_name: 'Elena Rostova',
    department: 'Engineering',
    priority: 'high',
    status: 'in_progress',
    due_date: '2026-10-02',
    created_at: '2026-09-26T11:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Benchmarking Multi-agent latency on edge runtimes',
    description: 'Run inference latency tests on edge endpoints to ensure sub-200ms roundtrips.',
    assigned_to_id: 'usr-member-2',
    assigned_to_name: 'Devon Vance',
    assigned_by_id: 'usr-head-ai',
    assigned_by_name: 'Marcus Thorne',
    department: 'AI & Machine Learning',
    priority: 'urgent',
    status: 'todo',
    due_date: '2026-10-04',
    created_at: '2026-09-27T08:30:00Z'
  },
  {
    id: 'task-3',
    title: 'Design Dark Mode contrast tokens for data tables',
    description: 'Refine WCAG AAA compliance for role badges, status pills, and sidebar hover states.',
    assigned_to_id: 'usr-head-design',
    assigned_to_name: 'Sophia Chen',
    assigned_by_id: 'usr-admin-1',
    assigned_by_name: 'Alex Rivera',
    department: 'Product & Design',
    priority: 'normal',
    status: 'done',
    due_date: '2026-09-28',
    created_at: '2026-09-24T15:00:00Z'
  }
];

export const INITIAL_REQUESTS: MemberRequest[] = [
  {
    id: 'req-1',
    user_id: 'usr-member-1',
    user_name: 'Sarah Jenkins',
    user_email: 'member.sarah@ceova.online',
    type: 'equipment',
    subject: 'Request for secondary 4K display',
    description: 'Need additional screen real estate for frontend testing and multi-window debugging.',
    status: 'pending',
    created_at: '2026-09-28T16:00:00Z'
  },
  {
    id: 'req-2',
    user_id: 'usr-member-2',
    user_name: 'Devon Vance',
    user_email: 'member.devon@ceova.online',
    type: 'leave',
    subject: 'Annual leave Oct 12 - Oct 16',
    description: 'Planning scheduled time off after model release milestone.',
    status: 'approved',
    reviewed_by: 'Marcus Thorne',
    created_at: '2026-09-25T11:20:00Z'
  }
];

export const INITIAL_ACTIVITY: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'usr-admin-1',
    user_name: 'Alex Rivera',
    role: 'admin',
    action: 'ROLE_PROMOTION',
    details: 'Promoted Marcus Thorne to Head of AI & Machine Learning',
    timestamp: '2026-09-28T09:20:00Z'
  },
  {
    id: 'log-2',
    user_id: 'usr-head-tech',
    user_name: 'Elena Rostova',
    role: 'head',
    action: 'TASK_ASSIGNED',
    details: 'Assigned "Optimize Supabase RLS policies" to Sarah Jenkins',
    timestamp: '2026-09-27T11:15:00Z'
  },
  {
    id: 'log-3',
    user_id: 'usr-admin-1',
    user_name: 'Alex Rivera',
    role: 'admin',
    action: 'ANNOUNCEMENT_POSTED',
    details: 'Broadcasted "Ceova Portal v2.0 Rollout"',
    timestamp: '2026-09-28T10:00:00Z'
  }
];
