import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  Sparkles, 
  Megaphone, 
  Palette, 
  Share2, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Video, 
  Eye, 
  ArrowUpRight,
  Plus,
  MessageSquare,
  Flame,
  Award
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface CMODashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenTaskModal: () => void;
}

export const CMODashboardView: React.FC<CMODashboardViewProps> = ({
  onNavigate,
  onOpenTaskModal,
}) => {
  const { user } = useAuth();
  const { members, tasks, projects } = usePortalData();

  const mktMembers = members.filter(m => m.department === 'Marketing & Design');
  const mktTasks = tasks.filter(t => t.department === 'Marketing & Design');

  const campaigns = [
    {
      id: 'c1',
      title: 'Ceova CCTV Public Launch & Teaser Video',
      channel: 'YouTube, LinkedIn, X',
      status: 'Active',
      progress: 65,
      reach: '24.2k views',
      deadline: '2026-10-20'
    },
    {
      id: 'c2',
      title: 'Enterprise Smart Security Early Pilot Program',
      channel: 'Direct B2B Outreach',
      status: 'Active',
      progress: 80,
      reach: '45 enterprise leads',
      deadline: '2026-10-28'
    },
    {
      id: 'c3',
      title: 'Founder Tech Story & Deeptech Vision Article',
      channel: 'Medium & Substack',
      status: 'In Review',
      progress: 50,
      reach: 'Drafted',
      deadline: '2026-10-15'
    }
  ];

  const contentPipeline = [
    { title: 'Ceova CCTV 3D Explosion Render (60fps)', type: 'Video', author: 'Karan Verma (Intern)', status: 'Rendering' },
    { title: 'Whitepaper: Edge NPU vs Cloud Streaming Latency', type: 'Technical Doc', author: 'Liam O’Connor', status: 'Drafting' },
    { title: 'Landing Page v2.0 Dark Mode Visuals', type: 'Design', author: 'Sophia Chen (CMO)', status: 'Approved' },
    { title: 'Press Release: Ceova Closes Seed Capital & MeitY Grant', type: 'PR', author: 'Liam O’Connor', status: 'Embargoed' }
  ];

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">FAMA ET AESTHETICA • BRAND & MARKET COMMAND</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Brand & Marketing Deck
          </h2>
          <p className="view-subtitle">
            Chief Marketing Officer • Sophia Chen • Global brand identity, 3D hardware renders, launch campaigns, and enterprise acquisition.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn primary" onClick={onOpenTaskModal}>
            <Plus size={14} />
            <span>New Campaign Task</span>
          </button>
          <button className="neu-pill-btn" onClick={() => onNavigate('chat')}>
            <MessageSquare size={14} style={{ color: '#ec4899' }} />
            <span>Creative Chat (#brand)</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Brand & Campaign Traction (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="badge-gold">
              <Sparkles size={12} /> Office of the Chief Marketing Officer
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> +42% Brand Impressions MoM
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Brand Positioning & Demand Generation
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
            Ceova CCTV hardware launch visuals are entering final rendering passes. Pre-launch enterprise pipeline has secured <strong>45 pilot inquiries</strong> across logistics and industrial surveillance sectors.
          </p>

          {/* Neumorphic Inset Campaign Progress Gauge */}
          <div className="neu-inset-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Commercial Launch Milestone Completion</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>65% COMPLETED</strong>
            </div>
            <div className="mini-progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="mini-bar-fill" 
                style={{ 
                  width: '65%', 
                  background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #d4af37 100%)',
                  boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* 4 Mini Neumorphic Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Impressions</span>
                <Eye size={13} style={{ color: '#ec4899' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>128k</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>+42% this month</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enterprise Leads</span>
                <TrendingUp size={13} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>45 Pilots</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>B2B waitlist</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>3D Assets</span>
                <Video size={13} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>8 Rendered</div>
              <div style={{ fontSize: 10.5, color: '#38bdf8', marginTop: 3 }}>60fps clips</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Creative Tasks</span>
                <CheckCircle2 size={13} style={{ color: 'var(--neo-gold)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{mktTasks.length} Active</div>
              <div style={{ fontSize: 10.5, color: 'var(--neo-gold)', marginTop: 3 }}>Sprint 14</div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Creative Roster & Mentorship (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">I • CREATIVE ROSTER</span>
            <Users size={16} style={{ color: '#ec4899' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mktMembers.map((member) => (
              <div key={member.id} className="neu-inset-box" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(236,72,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 12 }}>
                  {member.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.full_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.designation}</div>
                </div>
                <span className={`status-pill role-${member.role}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                  {member.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Mentorship Fellowship:</span>
              <strong style={{ color: 'var(--neo-gold)' }}>Karan Verma (Intern)</strong>
            </div>
          </div>
        </div>

        {/* Bento Box 3: Active Growth & Launch Campaigns (Span 7) */}
        <div className="bento-card bento-col-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">II • MULTI-CHANNEL LAUNCH CAMPAIGNS</span>
            </div>
            <span className="badge-gold">{campaigns.length} In Flight</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map((camp) => (
              <div key={camp.id} className="neu-inset-box" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{camp.title}</span>
                  <span className={`status-pill status-${camp.status === 'Active' ? 'in_progress' : 'review'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                    {camp.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>Channels: <strong style={{ color: 'var(--text-main)' }}>{camp.channel}</strong></span>
                  <span>Reach: <strong style={{ color: '#10b981' }}>{camp.reach}</strong></span>
                </div>
                <div className="mini-progress-bar" style={{ height: 6 }}>
                  <div 
                    className="mini-bar-fill" 
                    style={{ 
                      width: `${camp.progress}%`, 
                      background: 'linear-gradient(90deg, #ec4899 0%, #d4af37 100%)' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 4: Content & 3D Render Pipeline (Span 5) */}
        <div className="bento-card bento-col-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">III • CONTENT & RENDERS PIPELINE</span>
            <Palette size={16} style={{ color: '#38bdf8' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contentPipeline.map((item, idx) => (
              <div key={idx} className="neu-inset-box" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{item.title}</span>
                  <span style={{ 
                    fontSize: 9.5, 
                    fontWeight: 600, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    background: item.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: item.status === 'Approved' ? '#10b981' : '#38bdf8'
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Type: {item.type}</span>
                  <span>{item.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
