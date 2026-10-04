import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  GitMerge, 
  Layers, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  BookOpen, 
  Users, 
  ChevronRight,
  TrendingUp,
  Settings,
  Sparkles,
  Truck,
  Activity,
  Workflow
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface COODashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const COODashboardView: React.FC<COODashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { projects, departments, tasks, members, strategicDecisions } = usePortalData();

  const operationalRisks = [
    {
      id: 'risk-1',
      title: 'Optical Lens Batch Supply Chain Delay',
      department: 'Operations & Dev',
      impact: 'High',
      mitigation: 'Alternate local supplier engaged with expedited 2-day delivery.',
      status: 'Mitigating'
    },
    {
      id: 'risk-2',
      title: 'Camera NPU Thermal Dissipation under 24/7 continuous stream',
      department: 'Development',
      impact: 'Medium',
      mitigation: 'Die-cast aluminium casing heatsink ribs extended by 4mm.',
      status: 'Resolved'
    },
    {
      id: 'risk-3',
      title: 'Multi-camera WebRTC peer latency variance on mobile cellular',
      department: 'Development & Mobile',
      impact: 'Medium',
      mitigation: 'Adaptive bitrate switching enabled on mobile stream player.',
      status: 'Monitoring'
    }
  ];

  const crossDeptDependencies = [
    {
      from: 'Marketing',
      to: 'Development',
      item: 'Final 3D CAD step files for CCTV launch teaser video',
      status: 'Completed',
      owner: 'Elena Rostova → Sophia Chen'
    },
    {
      from: 'Development',
      to: 'Operations',
      item: 'Sample lens batch approval (₹18,000 disbursement)',
      status: 'Pending Signature',
      owner: 'Aarav Singhania → David Sterling'
    },
    {
      from: 'Operations',
      to: 'Executive',
      item: 'IP67 die-cast tooling vendor contract sign-off',
      status: 'In Review',
      owner: 'Aarav Singhania → Harshit'
    }
  ];

  const sops = [
    { title: 'Hardware Vendor Sourcing & Procurement SOP', category: 'Supply Chain', version: 'v1.4' },
    { title: 'Incident Response & Camera RTSP Stream Failover', category: 'Infrastructure', version: 'v2.1' },
    { title: 'Intern Onboarding & Mentorship Framework', category: 'HR & Talent', version: 'v1.2' },
    { title: 'Bi-weekly Sprint Retrospective & Cross-Dept Sync', category: 'Execution', version: 'v1.0' }
  ];

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">OPERATIO ET EXECUTIONIS • CROSS-DEPARTMENTAL COMMAND</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Operations & Execution Deck
          </h2>
          <p className="view-subtitle">
            Chief Operating Officer • Aarav Singhania • Cross-team dependencies, hardware logistics throughput, and SOP governance.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn" onClick={() => onNavigate('projects')}>
            <Workflow size={14} style={{ color: 'var(--neo-gold)' }} />
            <span>Project Radar</span>
          </button>
          <button className="neu-pill-btn primary" onClick={() => onNavigate('tasks')}>
            <Layers size={14} />
            <span>Master Task Board</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Operations Command & Telemetry (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="badge-gold">
              <Settings size={12} /> Office of the Chief Operating Officer
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> 99.2% SLA Target Met
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Operational Throughput & Sync
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
            Hardware prototyping cycles are running at <strong>12-day sprint iterations</strong>. Supply chain transit times between Bengaluru engineering labs and tooling partners are within SLA parameters.
          </p>

          {/* Neumorphic Inset Execution Gauge */}
          <div className="neu-inset-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cross-Department Delivery Velocity</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>88% ON SCHEDULE</strong>
            </div>
            <div className="mini-progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="mini-bar-fill" 
                style={{ 
                  width: '88%', 
                  background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #d4af37 100%)',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* 4 Mini Neumorphic Operational Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supply Chain</span>
                <Truck size={13} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>4 Batches</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>Tooling & lenses</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dependencies</span>
                <GitMerge size={13} style={{ color: 'var(--neo-gold)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>3 Monitored</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>0 blocking deadlocks</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cross-Handoffs</span>
                <TrendingUp size={13} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>12 Closed</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>This week</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Company SOPs</span>
                <BookOpen size={13} style={{ color: '#c084fc' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>16 Active</div>
              <div style={{ fontSize: 10.5, color: '#c084fc', marginTop: 3 }}>All certified</div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Department Alignment Radar (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">I • DEPARTMENT VELOCITY</span>
            <Activity size={16} style={{ color: '#10b981' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {departments.map((dept) => (
              <div key={dept.id} className="neu-inset-box" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{dept.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--neo-gold)', fontWeight: 600 }}>{dept.c_suite_leader || dept.head_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>{projects.filter(p => p.department === dept.name).length} Active Projects</span>
                  <span>{dept.member_count || members.filter(m => m.department === dept.name).length} Members</span>
                </div>
                <div className="mini-progress-bar" style={{ height: 4 }}>
                  <div 
                    className="mini-bar-fill" 
                    style={{ 
                      width: dept.name.includes('Dev') ? '92%' : dept.name.includes('Mark') ? '85%' : '88%',
                      background: 'var(--accent-gradient)'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 3: Cross-Department Dependencies (Span 7) */}
        <div className="bento-card bento-col-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitMerge size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">II • CROSS-DEPARTMENT DEPENDENCY GRAPH</span>
            </div>
            <span className="badge-gold">Live Synced</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {crossDeptDependencies.map((dep, idx) => (
              <div key={idx} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
                    <span style={{ color: '#38bdf8' }}>{dep.from}</span>
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: '#c084fc' }}>{dep.to}</span>
                  </div>
                  <span className={`status-pill status-${dep.status === 'Completed' ? 'completed' : 'in_progress'}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                    {dep.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>{dep.item}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Handoff: {dep.owner}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 4: Active Risk Register & Mitigations (Span 5) */}
        <div className="bento-card bento-col-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">III • ACTIVE RISK REGISTER</span>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {operationalRisks.map((risk) => (
              <div key={risk.id} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{risk.title}</span>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    background: risk.impact === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: risk.impact === 'High' ? '#ef4444' : '#f59e0b'
                  }}>
                    {risk.impact} Impact
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 6px', lineHeight: 1.4 }}>
                  {risk.mitigation}
                </p>
                <div style={{ fontSize: 10.5, color: risk.status === 'Resolved' ? '#10b981' : 'var(--neo-gold)', fontWeight: 600 }}>
                  Status: {risk.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 5: Company SOPs & Process Standards (Span 12) */}
        <div className="bento-card bento-col-12">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} style={{ color: '#c084fc' }} />
              <span className="neo-sub-roman">IV • OPERATIONAL STANDARDS & COMPLIANCE PROTOCOLS</span>
            </div>
            <button className="neu-pill-btn" onClick={() => onNavigate('files')}>
              <FileText size={13} />
              <span>Full Repository</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {sops.map((sop, idx) => (
              <div key={idx} className="neu-inset-box" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {sop.category} • {sop.version}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                    {sop.title}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--neo-gold)', marginTop: 12, cursor: 'pointer' }} onClick={() => onNavigate('files')}>
                  <span>View Protocol</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
