import { 
  Profile, 
  Department, 
  Announcement, 
  TaskItem, 
  MemberRequest, 
  ActivityLog,
  Project,
  ChatChannel,
  ChatMessage,
  FinancialMetric,
  NotificationItem,
  StrategicDecision,
  WaitlistRequest
} from '../types';

// ==========================================
// REAL PRODUCTION CEOVA OPERATIONAL DATA
// (Mirrors public schema in Supabase yuvkddpfcokqctomsbun)
// ==========================================

export const REAL_MEMBERS: Profile[] = [
  {
    id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
    email: 'harshit10205@gmail.com',
    full_name: 'Harshit',
    role: 'ceo',
    department: 'Executive',
    designation: 'Founder & Chief Executive Officer',
    status: 'active',
    bio: 'Founder & CEO at Ceova. Driving company vision, product architecture, hardware tooling, edge AI surveillance, and institutional capital.',
    skills: ['Executive Leadership', 'Strategic Architecture', 'Product Strategy', 'Investor Relations', 'Deeptech Scaling'],
    reporting_to: 'Board of Directors',
    current_project: 'Ceova CCTV Commercial Launch',
    permissions: [
      'view_company_overview',
      'view_financials',
      'view_executive_room',
      'manage_tasks',
      'manage_projects',
      'approve_requests',
      'manage_team',
      'manage_departments',
      'publish_company_announcements',
      'publish_dept_announcements',
      'view_all_departments'
    ],
    created_at: '2026-01-01T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333331',
    email: 'elena.rostova@ceova.tech',
    full_name: 'Elena Rostova',
    role: 'cto',
    department: 'Development',
    designation: 'Chief Technology Officer',
    status: 'active',
    bio: 'Overseeing edge vision neural pipelines, embedded Linux CCTV firmware, and distributed WebRTC ingestion servers.',
    skills: ['Edge AI', 'C++', 'Embedded Linux', 'RTSP / WebRTC', 'NPU Acceleration', 'Distributed Systems'],
    reporting_to: 'Harshit (CEO)',
    current_project: 'Ceova CCTV',
    permissions: [
      'view_company_overview',
      'view_executive_room',
      'manage_tasks',
      'manage_projects',
      'manage_team',
      'publish_dept_announcements'
    ],
    created_at: '2026-01-05T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    email: 'sophia.chen@ceova.tech',
    full_name: 'Sophia Chen',
    role: 'cmo',
    department: 'Marketing & Design',
    designation: 'Chief Marketing Officer',
    status: 'active',
    bio: 'Architecting brand positioning, enterprise B2B sales collateral, hardware industrial aesthetics, and launch motion visuals.',
    skills: ['Brand Identity', 'Industrial 3D Visuals', 'B2B GTM Strategy', 'Omnichannel Launch', 'Creative Direction'],
    reporting_to: 'Harshit (CEO)',
    current_project: 'Ceova Brand Launch',
    permissions: [
      'view_company_overview',
      'view_executive_room',
      'manage_tasks',
      'manage_projects',
      'manage_team',
      'publish_dept_announcements'
    ],
    created_at: '2026-01-08T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'david.sterling@ceova.tech',
    full_name: 'David Sterling',
    role: 'cfo',
    department: 'Finance',
    designation: 'Chief Financial Officer',
    status: 'active',
    bio: 'Directing treasury allocation, hardware BOM optimization, venture capital syndicate relations, and government subsidies.',
    skills: ['Treasury Management', 'Venture Debt & Equity', 'Hardware BOM Modeling', 'Taxation & Audit', 'Forecasting'],
    reporting_to: 'Harshit (CEO)',
    current_project: 'Series A Capital & Unit Economics',
    permissions: [
      'view_company_overview',
      'view_financials',
      'view_executive_room',
      'manage_tasks',
      'approve_requests',
      'publish_dept_announcements'
    ],
    created_at: '2026-01-10T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333334',
    email: 'aarav.singhania@ceova.tech',
    full_name: 'Aarav Singhania',
    role: 'coo',
    department: 'Operations',
    designation: 'Chief Operating Officer',
    status: 'active',
    bio: 'Scaling PCB manufacturing, IP67 enclosure supplier tooling in Pune, ISO 9001 compliance, and supply chain logistics.',
    skills: ['Supply Chain Logistics', 'Factory Tooling (Pune & Shenzhen)', 'Vendor Negotiations', 'Operations S&OP'],
    reporting_to: 'Harshit (CEO)',
    current_project: 'Ceova CCTV Hardware Assembly',
    permissions: [
      'view_company_overview',
      'view_executive_room',
      'manage_tasks',
      'manage_projects',
      'manage_team',
      'publish_dept_announcements'
    ],
    created_at: '2026-01-12T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333335',
    email: 'rahul.sharma@ceova.tech',
    full_name: 'Rahul Sharma',
    role: 'member',
    department: 'Development',
    designation: 'Lead Computer Vision Engineer',
    status: 'active',
    bio: 'Building real-time INT8 YOLOv10 object detection and perimeter tripwire tracking for the CCTV edge module.',
    skills: ['PyTorch', 'ONNX Runtime', 'NPU INT8 Quantization', 'C++ Edge Inference', 'Video Analytics'],
    reporting_to: 'Elena Rostova (CTO)',
    current_project: 'Ceova CCTV',
    permissions: ['manage_tasks'],
    created_at: '2026-02-01T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333336',
    email: 'sarah.jenkins@ceova.tech',
    full_name: 'Sarah Jenkins',
    role: 'member',
    department: 'Development',
    designation: 'Lead Fullstack & Systems Engineer',
    status: 'active',
    bio: 'Architecting ultra-low latency WebRTC stream bridges, high throughput telemetry, and cloud gateway microservices.',
    skills: ['Golang', 'Rust', 'WebRTC', 'RTSP', 'TypeScript / React', 'Kafka'],
    reporting_to: 'Elena Rostova (CTO)',
    current_project: 'Ceova CCTV',
    permissions: ['manage_tasks'],
    created_at: '2026-02-05T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333337',
    email: 'aanya.patel@ceova.tech',
    full_name: 'Aanya Patel',
    role: 'intern',
    department: 'Development',
    designation: 'Computer Vision Fellowship Intern',
    status: 'active',
    bio: 'Working on dataset annotation, synthetic IR nighttime image generation, and benchmark validation against test datasets.',
    skills: ['Python', 'OpenCV', 'Data Augmentation', 'LabelStudio', 'PyTorch Basics'],
    reporting_to: 'Rahul Sharma',
    current_project: 'Ceova CCTV',
    permissions: ['manage_tasks'],
    created_at: '2026-03-01T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '33333333-3333-3333-3333-333333333338',
    email: 'karan.verma@ceova.tech',
    full_name: 'Karan Verma',
    role: 'intern',
    department: 'Marketing & Design',
    designation: '3D Motion Design Intern',
    status: 'active',
    bio: 'Crafting 60fps Blender photorealistic explosion renders and industrial assembly visual reels for product launch marketing.',
    skills: ['Blender 4.0', 'After Effects', 'CAD Import', 'Octane Render', 'Motion Design'],
    reporting_to: 'Sophia Chen (CMO)',
    current_project: 'Ceova Brand Launch',
    permissions: ['manage_tasks'],
    created_at: '2026-03-05T00:00:00Z',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  }
];

export const REAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-exec',
    name: 'Executive',
    code: 'exec',
    c_suite_leader: 'Harshit (CEO)',
    head_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
    head_name: 'Harshit',
    color: 'from-amber-500 to-yellow-600',
    description: 'Corporate governance, overall strategy, cross-functional alignment, and capital stewardship.',
    member_count: 2,
    progress: 92,
    status: 'Operational',
    pending_tasks_count: 2,
    critical_issues: []
  },
  {
    id: 'dept-dev',
    name: 'Development',
    code: 'dev',
    c_suite_leader: 'Elena Rostova (CTO)',
    head_id: '33333333-3333-3333-3333-333333333331',
    head_name: 'Elena Rostova',
    color: 'from-blue-500 to-indigo-600',
    description: 'Hardware firmware, edge inference models, mobile Android apps, cloud video streaming pipelines.',
    member_count: 5,
    progress: 78,
    status: 'On Track',
    pending_tasks_count: 8,
    critical_issues: ['NPU quantization verification on physical batch 1']
  },
  {
    id: 'dept-ops',
    name: 'Operations',
    code: 'ops',
    c_suite_leader: 'Aarav Singhania (COO)',
    head_id: '33333333-3333-3333-3333-333333333334',
    head_name: 'Aarav Singhania',
    color: 'from-emerald-500 to-teal-600',
    description: 'Hardware tooling, optical component procurement, PCB assembly partner coordination, and factory logistics.',
    member_count: 3,
    progress: 81,
    status: 'On Track',
    pending_tasks_count: 4,
    critical_issues: []
  },
  {
    id: 'dept-fin',
    name: 'Finance',
    code: 'fin',
    c_suite_leader: 'David Sterling (CFO)',
    head_id: '33333333-3333-3333-3333-333333333333',
    head_name: 'David Sterling',
    color: 'from-emerald-600 to-green-700',
    description: 'Corporate treasury, venture round modeling, MeitY grant compliance, and component payment workflows.',
    member_count: 2,
    progress: 88,
    status: 'Operational',
    pending_tasks_count: 1,
    critical_issues: []
  },
  {
    id: 'dept-mkt',
    name: 'Marketing & Design',
    code: 'mkt',
    c_suite_leader: 'Sophia Chen (CMO)',
    head_id: '33333333-3333-3333-3333-333333333332',
    head_name: 'Sophia Chen',
    color: 'from-purple-500 to-pink-600',
    description: 'Brand positioning, website design system, CCTV packaging, product renders, and investor decks.',
    member_count: 3,
    progress: 85,
    status: 'On Track',
    pending_tasks_count: 3,
    critical_issues: []
  }
];

export const REAL_PROJECTS: Project[] = [
  {
    id: 'proj-cctv',
    name: 'Ceova CCTV',
    code: 'cctv',
    description: 'Flagship AI-powered smart surveillance camera featuring on-device real-time neural detection, IP67 enclosure, and sub-100ms WebRTC low-latency streaming.',
    owner_name: 'Elena Rostova',
    owner_role: 'CTO',
    department: 'Development',
    status: 'active',
    progress: 72,
    deadline: '2026-11-30',
    members: [
      { id: '33333333-3333-3333-3333-333333333331', name: 'Elena Rostova', role: 'CTO' },
      { id: '33333333-3333-3333-3333-333333333335', name: 'Rahul Sharma', role: 'Lead CV' },
      { id: '33333333-3333-3333-3333-333333333336', name: 'Sarah Jenkins', role: 'Lead Fullstack' },
      { id: '33333333-3333-3333-3333-333333333337', name: 'Aanya Patel', role: 'Intern' }
    ],
    milestones: [
      { id: 'm1', title: 'PCB Revision 2 Sign-off', completed: true, due_date: '2026-08-15' },
      { id: 'm2', title: 'Edge Neural Detection INT8 Freezing', completed: true, due_date: '2026-09-20' },
      { id: 'm3', title: 'IP67 Waterproof Enclosure Molds', completed: false, due_date: '2026-10-15' },
      { id: 'm4', title: 'Production Pilot 500 Units Assembly', completed: false, due_date: '2026-11-20' }
    ],
    risks: [
      'Sony Starvis 2 image sensor delivery lead times from overseas distributor',
      'Thermal dissipation at 45°C ambient operating temperature during sustained NPU inference'
    ],
    tasks_count: { total: 14, completed: 9 },
    files_count: 28,
    chat_channel_id: 'chan-cctv'
  },
  {
    id: 'proj-android',
    name: 'Ceova Android',
    code: 'android',
    description: 'Enterprise companion Android application providing biometrics security, live multi-camera feeds, push alert triggers, and edge video playback.',
    owner_name: 'Sarah Jenkins',
    owner_role: 'Lead Fullstack Engineer',
    department: 'Development',
    status: 'active',
    progress: 58,
    deadline: '2026-11-15',
    members: [
      { id: '33333333-3333-3333-3333-333333333336', name: 'Sarah Jenkins', role: 'Lead Systems' },
      { id: '33333333-3333-3333-3333-333333333331', name: 'Elena Rostova', role: 'CTO' }
    ],
    milestones: [
      { id: 'am1', title: 'Kotlin Multiplatform Architecture', completed: true, due_date: '2026-08-30' },
      { id: 'am2', title: 'WebRTC Hardware Decoder Integration', completed: true, due_date: '2026-09-25' },
      { id: 'am3', title: 'Instant NPU Detection Push Alerts', completed: false, due_date: '2026-10-22' }
    ],
    risks: ['Background battery optimization limits on Android 14+ OEM devices'],
    tasks_count: { total: 10, completed: 6 },
    files_count: 14,
    chat_channel_id: 'chan-android'
  },
  {
    id: 'proj-launch',
    name: 'Ceova Brand Launch',
    code: 'launch',
    description: 'Corporate brand reveal, hardware unboxing identity, launch video production, 3D interactive product web showcase, and enterprise PR.',
    owner_name: 'Sophia Chen',
    owner_role: 'CMO',
    department: 'Marketing & Design',
    status: 'active',
    progress: 65,
    deadline: '2026-12-05',
    members: [
      { id: '33333333-3333-3333-3333-333333333332', name: 'Sophia Chen', role: 'CMO' },
      { id: '33333333-3333-3333-3333-333333333338', name: 'Karan Verma', role: '3D Intern' }
    ],
    milestones: [
      { id: 'lm1', title: 'Ceova Design System & Brand Book', completed: true, due_date: '2026-08-10' },
      { id: 'lm2', title: '3D Photorealistic Camera Render Reels', completed: true, due_date: '2026-09-28' },
      { id: 'lm3', title: 'Enterprise Beta Client Pilot Deck', completed: false, due_date: '2026-10-18' }
    ],
    risks: ['Post-production rendering latency for 4K video reel'],
    tasks_count: { total: 8, completed: 5 },
    files_count: 32,
    chat_channel_id: 'chan-general'
  }
];

export const REAL_TASKS: TaskItem[] = [
  {
    id: 'task-101',
    title: 'CCTV Human Detection Pipeline',
    description: 'Profile INT8 YOLO model on Rockchip RK3588 NPU at 30fps under 2W power budget.',
    assigned_to_id: '33333333-3333-3333-3333-333333333335',
    assigned_to_name: 'Rahul Sharma',
    assigned_by_id: '33333333-3333-3333-3333-333333333331',
    assigned_by_name: 'Elena Rostova',
    department: 'Development',
    project_name: 'Ceova CCTV',
    priority: 'critical',
    status: 'in_progress',
    due_date: '2026-10-10',
    created_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'task-102',
    title: 'Low Latency WebRTC RTSP Bridge',
    description: 'Implement jitter buffer tuning for sub-120ms glass-to-glass latency over 4G cellular uplinks.',
    assigned_to_id: '33333333-3333-3333-3333-333333333336',
    assigned_to_name: 'Sarah Jenkins',
    assigned_by_id: '33333333-3333-3333-3333-333333333331',
    assigned_by_name: 'Elena Rostova',
    department: 'Development',
    project_name: 'Ceova CCTV',
    priority: 'high',
    status: 'review',
    due_date: '2026-10-08',
    created_at: '2026-10-02T11:30:00Z'
  },
  {
    id: 'task-103',
    title: 'Ceova CCTV 3D Explosion Render (60fps)',
    description: 'Render internal aluminum heatsink, Sony sensor stack, and dual microphone array in Blender.',
    assigned_to_id: '33333333-3333-3333-3333-333333333338',
    assigned_to_name: 'Karan Verma',
    assigned_by_id: '33333333-3333-3333-3333-333333333332',
    assigned_by_name: 'Sophia Chen',
    department: 'Marketing & Design',
    project_name: 'Ceova Brand Launch',
    priority: 'high',
    status: 'in_progress',
    due_date: '2026-10-12',
    created_at: '2026-10-03T09:15:00Z'
  },
  {
    id: 'task-104',
    title: 'IP67 Waterproof Tooling Supplier Sign-off',
    description: 'Inspect silicone gasket seal and aluminum die-cast tolerances at Pune tooling partner facility.',
    assigned_to_id: '33333333-3333-3333-3333-333333333334',
    assigned_to_name: 'Aarav Singhania',
    assigned_by_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
    assigned_by_name: 'Harshit',
    department: 'Operations',
    project_name: 'Ceova CCTV',
    priority: 'critical',
    status: 'todo',
    due_date: '2026-10-14',
    created_at: '2026-10-04T08:00:00Z'
  }
];

export const REAL_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-csuite',
    name: 'Executive Room (C-Suite)',
    type: 'executive',
    topic: 'High-level corporate strategy, funding, board matters, and confidential company directives.',
    members_count: 5,
    unread_count: 0,
    is_restricted: true
  },
  {
    id: 'chan-general',
    name: 'Ceova Headquarters',
    type: 'group',
    topic: 'Company-wide town hall, milestone celebration, and cross-functional updates.',
    members_count: 10,
    unread_count: 0
  },
  {
    id: 'chan-cctv',
    name: 'Project • Ceova CCTV',
    type: 'project',
    topic: 'Hardware firmware, edge inference, and camera enclosure engineering discussions.',
    members_count: 6,
    unread_count: 0
  },
  {
    id: 'chan-android',
    name: 'Project • Ceova Android',
    type: 'project',
    topic: 'Mobile client development, WebRTC video decoders, and push notification architectures.',
    members_count: 4,
    unread_count: 0
  },
  {
    id: 'chan-announcements',
    name: 'Company Announcements',
    type: 'announcement',
    topic: 'Official releases, governance memos, and critical updates from the CEO and executives.',
    members_count: 10,
    unread_count: 0
  }
];

export const REAL_MESSAGES: Record<string, ChatMessage[]> = {
  'chan-csuite': [
    {
      id: 'msg-cs-1',
      channel_id: 'chan-csuite',
      sender_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
      sender_name: 'Harshit (CEO)',
      sender_role: 'ceo',
      text: 'Good morning executive team. The pilot PCB revision has arrived from our fabrication partner. Elena and Aarav, please prioritize NPU thermal verification today.',
      timestamp: '2026-10-04T09:00:00Z',
      status: 'read',
      reactions: [{ emoji: '🔥', count: 4, users: ['Elena Rostova', 'David Sterling', 'Sophia Chen', 'Aarav Singhania'] }]
    },
    {
      id: 'msg-cs-2',
      channel_id: 'chan-csuite',
      sender_id: '33333333-3333-3333-3333-333333333331',
      sender_name: 'Elena Rostova',
      sender_role: 'cto',
      text: 'Understood Harshit. We have the test harness ready with Rahul. WebRTC latency is benchmarking at 92ms glass-to-glass, which outperforms our target.',
      timestamp: '2026-10-04T09:12:00Z',
      status: 'read',
      reactions: [{ emoji: '⚡', count: 3, users: ['Harshit', 'David Sterling', 'Aarav Singhania'] }]
    }
  ],
  'chan-cctv': [
    {
      id: 'msg-cctv-1',
      channel_id: 'chan-cctv',
      sender_id: '33333333-3333-3333-3333-333333333335',
      sender_name: 'Rahul Sharma',
      sender_role: 'member',
      text: 'Benchmarked the INT8 YOLO model on RK3588 NPU. Sustained 32 FPS at 1.8W power draw with zero dropped frames over 4 hours.',
      timestamp: '2026-10-04T10:30:00Z',
      status: 'read',
      reactions: [{ emoji: '🚀', count: 3, users: ['Elena Rostova', 'Sarah Jenkins', 'Aanya Patel'] }]
    }
  ]
};

export const REAL_FINANCIALS: FinancialMetric = {
  cash_balance: 42000000,
  monthly_revenue: 2450000,
  monthly_burn: 830000,
  monthly_expenses: 3280000,
  runway_months: 18.5,
  total_funding: 125000000,
  pending_payments_total: 425000,
  pending_reimbursements_total: 68000,
  investors: [
    { id: 'inv-1', name: 'Sequoia India Seed Fund', commitment: 80000000, stage: 'Seed', type: 'Venture Capital' },
    { id: 'inv-2', name: 'Blume Ventures', commitment: 35000000, stage: 'Seed', type: 'Venture Capital' },
    { id: 'inv-3', name: 'Founders & Angel Syndicate', commitment: 10000000, stage: 'Pre-Seed', type: 'Angel' }
  ],
  grants: [
    { id: 'grt-1', name: 'MeitY TIDE 2.0 Deeptech Grant', amount: 5000000, status: 'Active (Milestone 2 Cleared)', agency: 'Ministry of Electronics & IT' },
    { id: 'grt-2', name: 'Karnataka Semiconductor & Edge AI Subsidy', amount: 2500000, status: 'Sanctioned', agency: 'Govt of Karnataka' }
  ],
  approvals: [
    { id: 'appr-1', title: 'Optical Lens Batch Procurement', amount: 18000, requested_by: 'David Sterling', department: 'Operations', status: 'pending', date: '2026-10-04' },
    { id: 'appr-2', title: 'AWS Bedrock GPU Model Fine-tuning Batch', amount: 45000, requested_by: 'Elena Rostova', department: 'Development', status: 'pending', date: '2026-10-03' },
    { id: 'appr-3', title: '3D Render Workstation High-Speed Storage', amount: 12500, requested_by: 'Sophia Chen', department: 'Marketing', status: 'approved', date: '2026-10-01' }
  ]
};

export const REAL_STRATEGIC_DECISIONS: StrategicDecision[] = [
  {
    id: 'dec-1',
    title: 'Ceova CCTV v1.0 Commercial Launch Date',
    description: 'Set the firm commercial launch and customer shipment date for the 500-unit pilot batch.',
    status: 'decided',
    owner: 'Harshit (CEO)',
    department: 'Executive',
    impact: 'Critical',
    deadline: '2026-10-15'
  },
  {
    id: 'dec-2',
    title: 'Camera Edge NPU INT8 Model Freeze',
    description: 'Freeze model architecture to lock weights into ROM before silicon batch flashing.',
    status: 'pending',
    owner: 'Elena Rostova (CTO)',
    department: 'Development',
    impact: 'Critical',
    deadline: '2026-10-20'
  },
  {
    id: 'dec-3',
    title: 'Series A Institutional Capital Strategy',
    description: 'Finalize target valuation and data room audit ahead of global deeptech VC term sheet meetings.',
    status: 'pending',
    owner: 'David Sterling (CFO)',
    department: 'Finance',
    impact: 'High',
    deadline: '2026-11-01'
  }
];

export const REAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: 'Ceova Team Operating System v2.0 Live Deployment',
    content: 'Welcome to the unified Ceova Team OS. All departments are now synchronized in real-time across Supabase with role-based security, instant task dispatch, executive metrics, and waitlist clearance.',
    author_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
    author_name: 'Harshit',
    author_role: 'ceo',
    priority: 'urgent',
    target_role: 'all',
    target_department: 'All',
    pinned: true,
    created_at: '2026-10-04T08:00:00Z'
  },
  {
    id: 'anc-2',
    title: 'Pilot Assembly 500 Units Confirmed for Pune Facility',
    content: 'The operations and development teams have finalized test tooling for 500 Ceova CCTV smart units. Factory pilot testing commences on schedule.',
    author_id: '33333333-3333-3333-3333-333333333334',
    author_name: 'Aarav Singhania',
    author_role: 'coo',
    priority: 'high',
    target_role: 'all',
    target_department: 'Operations',
    pinned: false,
    created_at: '2026-10-03T14:30:00Z'
  }
];

export const REAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Access Clearance Request',
    message: 'Rohan Gupta has submitted a credential request for Development department.',
    category: 'approval',
    read: false,
    created_at: '2026-10-04T11:00:00Z',
    action_url: '/ceo'
  },
  {
    id: 'notif-2',
    title: 'Milestone Completed: INT8 Freezing',
    message: 'Elena Rostova marked Edge Neural Detection INT8 Freezing as completed.',
    category: 'task',
    read: false,
    created_at: '2026-10-04T10:35:00Z',
    action_url: '/projects'
  }
];

export const REAL_REQUESTS: MemberRequest[] = [
  {
    id: 'req-1',
    user_id: '33333333-3333-3333-3333-333333333335',
    user_name: 'Rahul Sharma',
    user_email: 'rahul.sharma@ceova.tech',
    type: 'equipment',
    subject: 'High-Temperature Thermal Imaging Camera for PCB Stress Test',
    description: 'Requires FLIR handheld thermal camera for inspecting NPU board heat dissipation during continuous inference cycles.',
    amount: '₹35,000',
    status: 'pending',
    created_at: '2026-10-04T10:15:00Z'
  }
];

export const REAL_ACTIVITY: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
    user_name: 'Harshit',
    role: 'ceo',
    action: 'Platform Deployment',
    details: 'Ceova Team Operating System connected live to production Supabase cloud database.',
    timestamp: '2026-10-04T12:00:00Z'
  },
  {
    id: 'log-2',
    user_id: '33333333-3333-3333-3333-333333333331',
    user_name: 'Elena Rostova',
    role: 'cto',
    action: 'Task Update',
    details: 'Completed low-latency RTSP to WebRTC bridge jitter buffer tuning.',
    timestamp: '2026-10-04T11:45:00Z'
  }
];

export const REAL_WAITLIST: WaitlistRequest[] = [
  {
    id: 'wl-101',
    full_name: 'Rohan Gupta',
    email: 'rohan.gupta@ceova.tech',
    requested_role: 'member',
    department: 'Development',
    reason: 'Senior Embedded Firmware Engineer joining CCTV edge pipeline team',
    status: 'pending',
    created_at: '2026-10-04T10:00:00Z'
  },
  {
    id: 'wl-102',
    full_name: 'Priya Nair',
    email: 'priya.nair@ceova.tech',
    requested_role: 'intern',
    department: 'Marketing & Design',
    reason: 'Motion Design Fellowship applicant submitting portoflio renders',
    status: 'pending',
    created_at: '2026-10-04T10:15:00Z'
  },
  {
    id: 'wl-103',
    full_name: 'Vikram Malhotra',
    email: 'vikram.m@ceova.tech',
    requested_role: 'member',
    department: 'Operations',
    reason: 'Quality assurance engineer overseeing factory supplier audits',
    status: 'pending',
    created_at: '2026-10-04T10:30:00Z'
  }
];
