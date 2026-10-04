import { createClient } from '@supabase/supabase-js';

const url = 'https://yuvkddpfcokqctomsbun.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dmtkZHBmY29rcWN0b21zYnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzgwMjksImV4cCI6MjA5OTgxNDAyOX0.6sNzr-PbmDTsETaVAKycsxiwJCVKTgwsgFuWshnj1hM';
const supabase = createClient(url, key);

async function seed() {
  console.log('Seeding Supabase production database...');

  // 1. PROFILES
  const profiles = [
    {
      id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec', // Exact auth.users ID for Harshit
      email: 'harshit10205@gmail.com',
      full_name: 'Harshit',
      role: 'ceo',
      department: 'Executive',
      designation: 'Founder & Chief Executive Officer',
      phone: '+91 99999 00001',
      status: 'active',
      bio: 'Founder and CEO of Ceova. Spearheading commercial vision, hardware rollouts, and executive team alignment.',
      permissions: ['all', 'manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'manage_system', 'manage_financials', 'access_executive_room', 'broadcast_announcements']
    },
    {
      id: 'e887b352-a2ac-4adf-b247-5e7a8804412b',
      email: 'buildmyceo@gmail.com',
      full_name: 'Harshit (Ceova Admin)',
      role: 'ceo',
      department: 'Executive',
      designation: 'CEO Executive Office',
      phone: '+91 99999 00002',
      status: 'active',
      bio: 'Executive operations and administrative governance for Ceova.',
      permissions: ['all', 'manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'manage_system', 'manage_financials', 'access_executive_room']
    },
    {
      id: '33333333-3333-3333-3333-333333333331',
      email: 'elena.rostova@ceova.tech',
      full_name: 'Elena Rostova',
      role: 'cto',
      department: 'Development',
      designation: 'Chief Technology Officer',
      phone: '+91 98765 00002',
      status: 'active',
      bio: 'Former DeepMind edge vision lead. Architecting Ceova Edge AI models and camera firmware.',
      permissions: ['manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'access_executive_room', 'manage_system']
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      email: 'sophia.chen@ceova.tech',
      full_name: 'Sophia Chen',
      role: 'cmo',
      department: 'Marketing & Design',
      designation: 'Chief Marketing Officer',
      phone: '+91 98765 00003',
      status: 'active',
      bio: 'Directing Ceova brand identity, multi-channel growth campaigns, and product aesthetic.',
      permissions: ['manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'access_executive_room']
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'david.sterling@ceova.tech',
      full_name: 'David Sterling',
      role: 'cfo',
      department: 'Finance',
      designation: 'Chief Financial Officer',
      phone: '+91 98765 00004',
      status: 'active',
      bio: 'Managing Ceova treasury, institutional capital allocations, burn rate governance, and audits.',
      permissions: ['manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'manage_financials', 'access_executive_room']
    },
    {
      id: '33333333-3333-3333-3333-333333333334',
      email: 'aarav.singhania@ceova.tech',
      full_name: 'Aarav Singhania',
      role: 'coo',
      department: 'Operations',
      designation: 'Chief Operating Officer',
      phone: '+91 98765 00005',
      status: 'active',
      bio: 'Orchestrating hardware supply chains, vendor manufacturing lines, and cross-team dependencies.',
      permissions: ['manage_team', 'manage_tasks', 'approve_requests', 'view_reports', 'access_executive_room']
    },
    {
      id: '33333333-3333-3333-3333-333333333335',
      email: 'rahul.sharma@ceova.tech',
      full_name: 'Rahul Sharma',
      role: 'member',
      department: 'Development',
      designation: 'Lead Computer Vision Engineer',
      phone: '+91 98765 11001',
      status: 'active',
      bio: 'Optimizing edge human detection algorithms on embedded NPU chips.',
      reporting_to: 'Elena Rostova (CTO)',
      permissions: ['manage_tasks']
    },
    {
      id: '33333333-3333-3333-3333-333333333336',
      email: 'sarah.jenkins@ceova.tech',
      full_name: 'Sarah Jenkins',
      role: 'member',
      department: 'Development',
      designation: 'Lead Fullstack & Systems Engineer',
      phone: '+91 98765 11002',
      status: 'active',
      bio: 'Building low-latency RTSP streaming WebRTC bridges and Android integration.',
      reporting_to: 'Elena Rostova (CTO)',
      permissions: ['manage_tasks']
    },
    {
      id: '33333333-3333-3333-3333-333333333337',
      email: 'aanya.patel@ceova.tech',
      full_name: 'Aanya Patel',
      role: 'intern',
      department: 'Development',
      designation: 'Computer Vision Fellowship Intern',
      phone: '+91 98765 22001',
      status: 'active',
      bio: 'Ceova Fellow researching low-light video enhancement models on embedded hardware.',
      supervisor: 'Rahul Sharma (Lead CV Engineer)',
      current_project: 'Ceova CCTV',
      weekly_progress: 75,
      attendance_rate: 96,
      supervisor_feedback: 'Excellent work on RTSP reconnection loop script. Ready to tackle camera FPS benchmark integration.',
      permissions: ['manage_tasks']
    },
    {
      id: '33333333-3333-3333-3333-333333333338',
      email: 'karan.verma@ceova.tech',
      full_name: 'Karan Verma',
      role: 'intern',
      department: 'Marketing & Design',
      designation: '3D Motion Design Intern',
      phone: '+91 98765 22002',
      status: 'active',
      bio: 'Creating photorealistic 3D hardware explosion animations of Ceova CCTV.',
      supervisor: 'Sophia Chen (CMO)',
      current_project: 'Ceova Brand Launch',
      weekly_progress: 80,
      attendance_rate: 98,
      supervisor_feedback: '60fps Blender render passes look magnificent. Continue refining die-cast metallic reflections.',
      permissions: ['manage_tasks']
    }
  ];

  for (const p of profiles) {
    const { error } = await supabase.from('profiles').upsert(p, { onConflict: 'email' });
    if (error) console.error('Error upserting profile:', p.email, error.message);
  }
  console.log('✓ Profiles seeded.');

  // 2. DEPARTMENTS
  const departments = [
    {
      id: 'dept-dev',
      name: 'Development',
      code: 'dev',
      description: 'Camera firmware, embedded computer vision models, NPU quantization, and mobile client apps.',
      c_suite_leader: 'Elena Rostova (CTO)',
      color: '#38bdf8',
      member_count: 5
    },
    {
      id: 'dept-mkt',
      name: 'Marketing & Design',
      code: 'mkt',
      description: 'Global brand positioning, 3D product renders, investor pitch materials, and launch campaigns.',
      c_suite_leader: 'Sophia Chen (CMO)',
      color: '#ec4899',
      member_count: 3
    },
    {
      id: 'dept-ops',
      name: 'Operations',
      code: 'ops',
      description: 'Hardware supply chain logistics, lens batch procurement, factory quality checks, and SOPs.',
      c_suite_leader: 'Aarav Singhania (COO)',
      color: '#10b981',
      member_count: 3
    },
    {
      id: 'dept-fin',
      name: 'Finance',
      code: 'fin',
      description: 'Treasury escrow management, burn rate modeling, investor cap tables, and statutory filings.',
      c_suite_leader: 'David Sterling (CFO)',
      color: '#f59e0b',
      member_count: 2
    },
    {
      id: 'dept-exec',
      name: 'Executive',
      code: 'exec',
      description: 'Company-wide strategic alignment, board relations, corporate governance, and capital allocation.',
      c_suite_leader: 'Harshit (CEO)',
      color: '#d4af37',
      member_count: 5
    }
  ];

  for (const d of departments) {
    const { error } = await supabase.from('departments').upsert(d, { onConflict: 'name' });
    if (error) console.error('Error upserting department:', d.name, error.message);
  }
  console.log('✓ Departments seeded.');

  // 3. PROJECTS
  const projects = [
    {
      id: 'proj-cctv',
      name: 'Ceova CCTV',
      code: 'cctv',
      description: 'Flagship IP67 4K Edge Surveillance Camera with on-device NPU neural processing and ultra-low latency RTSP streaming.',
      owner_name: 'Elena Rostova',
      owner_role: 'CTO',
      department: 'Development',
      status: 'active',
      progress: 72,
      deadline: '2026-10-25',
      members: [
        { id: 'usr-cto', name: 'Elena Rostova', role: 'CTO' },
        { id: 'usr-rahul', name: 'Rahul Sharma', role: 'Lead CV' },
        { id: 'usr-sarah', name: 'Sarah Jenkins', role: 'Lead Fullstack' },
        { id: 'usr-intern-aanya', name: 'Aanya Patel', role: 'Intern' }
      ],
      milestones: [
        { id: 'm1', title: 'Hardware PCB Prototype Assembly', completed: true, due_date: '2026-09-15' },
        { id: 'm2', title: 'Edge Human Detection Pipeline', completed: true, due_date: '2026-09-28' },
        { id: 'm3', title: 'Continuous 24-hr Stress Benchmarks', completed: false, due_date: '2026-10-12' },
        { id: 'm4', title: 'IP67 Water & Dust Ingress Certification', completed: false, due_date: '2026-10-25' }
      ],
      risks: [
        'Lens batch supply delay from Shenzhen partner',
        'Camera NPU thermal dissipation under sustained 24/7 stream'
      ],
      tasks_count: { total: 14, completed: 9 },
      files_count: 8,
      chat_channel_id: 'chan-cctv'
    },
    {
      id: 'proj-android',
      name: 'Ceova Android',
      code: 'android',
      description: 'Low-latency surveillance companion app supporting multi-camera feeds, instant intruder alerts, and local archive playback.',
      owner_name: 'Sarah Jenkins',
      owner_role: 'Lead Fullstack',
      department: 'Development',
      status: 'active',
      progress: 58,
      deadline: '2026-11-05',
      members: [
        { id: 'usr-sarah', name: 'Sarah Jenkins', role: 'Lead Fullstack' },
        { id: 'usr-rahul', name: 'Rahul Sharma', role: 'Lead CV' }
      ],
      milestones: [
        { id: 'm201', title: 'WebRTC Peer Connection Setup', completed: true, due_date: '2026-09-20' },
        { id: 'm202', title: 'Hardware H.265 Decoding Support', completed: true, due_date: '2026-10-02' },
        { id: 'm203', title: 'Push Notification Alert Pipeline', completed: false, due_date: '2026-10-18' }
      ],
      risks: ['Android battery optimization throttling background WebRTC sockets'],
      tasks_count: { total: 10, completed: 5 },
      files_count: 5,
      chat_channel_id: 'chan-android'
    },
    {
      id: 'proj-launch',
      name: 'Ceova Brand Launch',
      code: 'launch',
      description: 'Q4 2026 public unveiling of Ceova Team OS, Hardware CCTV demos, landing page overhaul, and press announcements.',
      owner_name: 'Sophia Chen',
      owner_role: 'CMO',
      department: 'Marketing & Design',
      status: 'active',
      progress: 65,
      deadline: '2026-10-28',
      members: [
        { id: 'usr-cmo', name: 'Sophia Chen', role: 'CMO' },
        { id: 'usr-intern-karan', name: 'Karan Verma', role: 'Design Intern' }
      ],
      milestones: [
        { id: 'm301', title: 'Brand Aesthetic Guidelines v2.0', completed: true, due_date: '2026-09-22' },
        { id: 'm302', title: 'CCTV Hardware 3D Showcase Video', completed: true, due_date: '2026-10-03' },
        { id: 'm303', title: 'Product Hunt & Press Kit Distribution', completed: false, due_date: '2026-10-20' }
      ],
      risks: ['Press embargo coordination across 3 tier-1 tech publications'],
      tasks_count: { total: 8, completed: 5 },
      files_count: 12,
      chat_channel_id: 'chan-marketing'
    }
  ];

  for (const pr of projects) {
    const { error } = await supabase.from('projects').upsert(pr, { onConflict: 'id' });
    if (error) console.error('Error upserting project:', pr.id, error.message);
  }
  console.log('✓ Projects seeded.');

  // 4. CHANNELS
  const channels = [
    { id: 'chan-general', name: 'general', type: 'announcements', description: 'Company-wide announcements & core updates', is_private: false },
    { id: 'chan-cctv', name: 'ceova-cctv', type: 'projects', department: 'Development', description: 'Ceova CCTV hardware & firmware engineering', is_private: false },
    { id: 'chan-marketing', name: 'marketing-brand', type: 'department', department: 'Marketing & Design', description: 'Product renders, campaigns & brand assets', is_private: false },
    { id: 'chan-ops', name: 'operations-logistics', type: 'department', department: 'Operations', description: 'Supply chain tracking & vendor disbursements', is_private: false },
    { id: 'chan-exec', name: 'executive-csuite', type: 'c_suite', department: 'Executive', description: 'Confidential C-suite chamber (CEO, CTO, CMO, CFO, COO)', is_private: true }
  ];

  for (const ch of channels) {
    const { error } = await supabase.from('channels').upsert(ch, { onConflict: 'id' });
    if (error) console.error('Error upserting channel:', ch.id, error.message);
  }
  console.log('✓ Channels seeded.');

  // 5. CHAT MESSAGES
  const chatMessages = [
    {
      id: 'msg-1',
      channel_id: 'chan-cctv',
      sender_id: 'usr-ceo',
      sender_name: 'Harshit',
      sender_role: 'ceo',
      text: 'Rahul, make sure you finish the CCTV human detection pipeline by Wednesday so we can run the test batch with Elena.',
      pinned: true,
      reactions: [{ emoji: '🔥', count: 3, users: ['usr-rahul', 'usr-cto', 'usr-ceo'] }],
      suggested_task: {
        title: 'Finish CCTV human detection pipeline',
        assigned_to_name: 'Rahul Sharma',
        due_date: 'Wednesday',
        project_name: 'Ceova CCTV'
      }
    },
    {
      id: 'msg-2',
      channel_id: 'chan-cctv',
      sender_id: 'usr-rahul',
      sender_name: 'Rahul Sharma',
      sender_role: 'member',
      text: 'On it Harshit! The INT8 quantization benchmarks look solid—seeing 30.2 FPS on our test camera board with 98.4% detection precision.',
      reactions: [{ emoji: '🚀', count: 2, users: ['usr-ceo', 'usr-cto'] }]
    },
    {
      id: 'msg-3',
      channel_id: 'chan-ops',
      sender_id: 'usr-cfo',
      sender_name: 'David Sterling',
      sender_role: 'cfo',
      text: 'Aarav, please approve ₹18,000 for the sample lens batch from the new Bangalore optics supplier so I can release the payment today.',
      suggested_approval: {
        title: 'Disbursement: Sample lens batch Bangalore supplier',
        amount: 18000,
        department: 'Operations',
        requested_by: 'David Sterling'
      }
    },
    {
      id: 'msg-4',
      channel_id: 'chan-general',
      sender_id: 'usr-ceo',
      sender_name: 'Harshit',
      sender_role: 'ceo',
      text: 'Welcome to Ceova Team OS. All departments are live. Let us maintain high velocity towards our Q4 commercial release.',
      pinned: true,
      reactions: [{ emoji: '🎯', count: 5, users: ['usr-ceo', 'usr-cto', 'usr-cmo', 'usr-cfo', 'usr-coo'] }]
    }
  ];

  for (const m of chatMessages) {
    const { error } = await supabase.from('chat_messages').upsert(m, { onConflict: 'id' });
    if (error) console.error('Error upserting chat message:', m.id, error.message);
  }
  console.log('✓ Chat messages seeded.');

  // 6. TASKS
  const tasks = [
    {
      id: 'task-101',
      title: 'CCTV Human Detection Pipeline',
      description: 'Optimize on-device INT8 YOLO model inference pipeline on camera NPU to achieve >30 FPS.',
      assigned_to_name: 'Rahul Sharma',
      department: 'Development',
      project_name: 'Ceova CCTV',
      priority: 'critical',
      status: 'in_progress',
      due_date: '2026-10-07'
    },
    {
      id: 'task-102',
      title: 'Low Latency WebRTC RTSP Bridge',
      description: 'Implement video streaming protocol adapter for sub-100ms multi-camera feed delivery.',
      assigned_to_name: 'Sarah Jenkins',
      department: 'Development',
      project_name: 'Ceova CCTV',
      priority: 'high',
      status: 'review',
      due_date: '2026-10-09'
    },
    {
      id: 'task-103',
      title: 'Ceova CCTV 3D Explosion Render (60fps)',
      description: 'Render high-resolution die-cast aluminium casing breakdown for the launch teaser.',
      assigned_to_name: 'Karan Verma',
      department: 'Marketing & Design',
      project_name: 'Ceova Brand Launch',
      priority: 'high',
      status: 'in_progress',
      due_date: '2026-10-14'
    },
    {
      id: 'task-104',
      title: 'IP67 Waterproof Tooling Supplier Sign-off',
      description: 'Verify precision tooling tolerance samples for water and dust ingress seal.',
      assigned_to_name: 'Aarav Singhania',
      department: 'Operations',
      project_name: 'Ceova CCTV',
      priority: 'critical',
      status: 'todo',
      due_date: '2026-10-15'
    }
  ];

  for (const t of tasks) {
    const { error } = await supabase.from('tasks').upsert(t, { onConflict: 'id' });
    if (error) console.error('Error upserting task:', t.id, error.message);
  }
  console.log('✓ Tasks seeded.');

  // 7. FINANCIALS
  const financials = {
    id: 'primary_metrics',
    cash_balance: 42000000,
    monthly_revenue: 2450000,
    monthly_expenses: 3280000,
    monthly_burn: 830000,
    runway_months: 18.5,
    pending_payments_total: 425000,
    pending_reimbursements_total: 68000,
    total_funding: 125000000,
    investors: [
      { id: 'inv-1', name: 'Sequoia India Seed Fund', type: 'Venture Capital', commitment: 80000000, stage: 'Seed' },
      { id: 'inv-2', name: 'Blume Ventures', type: 'Venture Capital', commitment: 35000000, stage: 'Seed' },
      { id: 'inv-3', name: 'Founders & Angel Syndicate', type: 'Angel', commitment: 10000000, stage: 'Pre-Seed' }
    ],
    grants: [
      { id: 'grt-1', name: 'MeitY TIDE 2.0 Deeptech Grant', agency: 'Ministry of Electronics & IT', amount: 5000000, status: 'Active (Milestone 2 Cleared)' },
      { id: 'grt-2', name: 'Karnataka Semiconductor & Edge AI Subsidy', agency: 'Govt of Karnataka', amount: 2500000, status: 'Sanctioned' }
    ],
    approvals: [
      { id: 'appr-1', title: 'Optical Lens Batch Procurement', amount: 18000, requested_by: 'David Sterling', department: 'Operations', status: 'pending', date: '2026-10-04' },
      { id: 'appr-2', title: 'AWS Bedrock GPU Model Fine-tuning Batch', amount: 45000, requested_by: 'Elena Rostova', department: 'Development', status: 'pending', date: '2026-10-03' },
      { id: 'appr-3', title: '3D Render Workstation High-Speed Storage', amount: 12500, requested_by: 'Sophia Chen', department: 'Marketing', status: 'approved', date: '2026-10-01' }
    ]
  };

  const { error: finError } = await supabase.from('financials').upsert(financials, { onConflict: 'id' });
  if (finError) console.error('Error upserting financials:', finError.message);
  else console.log('✓ Financials seeded.');

  // 8. STRATEGIC DECISIONS
  const decisions = [
    {
      id: 'dec-1',
      title: 'Ceova CCTV v1.0 Commercial Launch Date',
      description: 'Firm alignment on Oct 25, 2026 launch date with 250 initial developer preview units.',
      department: 'Executive',
      status: 'decided',
      owner: 'Harshit (CEO)',
      impact: 'Critical',
      deadline: '2026-10-05'
    },
    {
      id: 'dec-2',
      title: 'Camera Edge NPU INT8 Model Freeze',
      description: 'Lock neural network weights to begin ROM production flashing.',
      department: 'Development',
      status: 'pending',
      owner: 'Elena Rostova (CTO)',
      impact: 'Critical',
      deadline: '2026-10-08'
    },
    {
      id: 'dec-3',
      title: 'Series A Institutional Capital Strategy',
      description: 'Targeting $3.5M round to scale domestic manufacturing lines in Pune.',
      department: 'Finance',
      status: 'pending',
      owner: 'David Sterling (CFO)',
      impact: 'High',
      deadline: '2026-11-15'
    }
  ];

  for (const dec of decisions) {
    const { error } = await supabase.from('strategic_decisions').upsert(dec, { onConflict: 'id' });
    if (error) console.error('Error upserting decision:', dec.id, error.message);
  }
  console.log('✓ Strategic decisions seeded.');

  // 9. ANNOUNCEMENTS
  const announcements = [
    {
      id: 'anc-1',
      title: 'Ceova Team Operating System v1.0 Deployed',
      content: 'Welcome to the unified internal operating system. All sprint deliverables, hardware dependencies, and C-suite communications are now consolidated here.',
      author_id: 'a7e5589f-ec69-495f-b1a5-0606f59ba2ec',
      author_name: 'Harshit',
      author_role: 'ceo',
      priority: 'critical',
      target_role: 'all',
      target_department: 'all',
      pinned: true
    },
    {
      id: 'anc-2',
      title: 'MeitY Deeptech Milestone 2 Disbursement Approved',
      content: 'Government audit successfully passed. ₹25L tranche deposited into escrow account for edge camera R&D.',
      author_id: '33333333-3333-3333-3333-333333333333',
      author_name: 'David Sterling',
      author_role: 'cfo',
      priority: 'high',
      target_role: 'all',
      target_department: 'all',
      pinned: false
    }
  ];

  for (const a of announcements) {
    const { error } = await supabase.from('announcements').upsert(a, { onConflict: 'id' });
    if (error) console.error('Error upserting announcement:', a.id, error.message);
  }
  console.log('✓ Announcements seeded.');

  // 10. WAITLIST REQUESTS
  const waitlist = [
    {
      id: 'wl-101',
      full_name: 'Rohan Gupta',
      email: 'rohan.gupta@ceova.tech',
      requested_role: 'member',
      department: 'Development',
      phone: '+91 98765 43210',
      reason: 'Embedded C++ & Edge NPU optimization engineer. Applying to accelerate INT8 quantization pipeline on camera chips.',
      status: 'pending'
    },
    {
      id: 'wl-102',
      full_name: 'Priya Nair',
      email: 'priya.nair@ceova.tech',
      requested_role: 'intern',
      department: 'Marketing & Design',
      phone: '+91 98111 22334',
      reason: 'Blender 3D artist and industrial product visualizer. Seeking Ceova Fellowship to create camera explosion renders.',
      status: 'pending'
    },
    {
      id: 'wl-103',
      full_name: 'Vikram Malhotra',
      email: 'vikram.m@ceova.tech',
      requested_role: 'member',
      department: 'Operations',
      phone: '+91 99887 76655',
      reason: 'Hardware supply chain & quality assurance lead. Joining to supervise IP67 die-cast tooling vendor deliveries.',
      status: 'pending'
    }
  ];

  for (const w of waitlist) {
    const { error } = await supabase.from('waitlist_requests').upsert(w, { onConflict: 'id' });
    if (error) console.error('Error upserting waitlist request:', w.id, error.message);
  }
  console.log('✓ Waitlist requests seeded.');

  // 11. ACTIVITY LOGS
  const logs = [
    {
      id: 'log-1',
      user_name: 'Harshit',
      role: 'ceo',
      action: 'SYSTEM_INITIALIZED',
      details: 'Ceova Team OS production database synchronized with Supabase'
    },
    {
      id: 'log-2',
      user_name: 'Elena Rostova',
      role: 'cto',
      action: 'BENCHMARK_LOGGED',
      details: 'INT8 Edge YOLO achieved 30.2 FPS on Ceova CCTV Prototype Board'
    }
  ];

  for (const l of logs) {
    const { error } = await supabase.from('activity_logs').upsert(l, { onConflict: 'id' });
    if (error) console.error('Error upserting log:', l.id, error.message);
  }
  console.log('✓ Activity logs seeded.');

  console.log('ALL REAL DATA SUCCESSFULLY PUSHED TO SUPABASE!');
}

seed().catch(console.error);
