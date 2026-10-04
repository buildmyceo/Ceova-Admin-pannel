import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Layers, 
  MessageSquare, 
  Calendar, 
  Award, 
  Sparkles, 
  UserCheck, 
  ChevronRight,
  Send,
  TrendingUp,
  Star,
  CheckSquare
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface InternDashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const InternDashboardView: React.FC<InternDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { tasks, projects, submitRequest } = usePortalData();

  // Intern checklist state
  const [todayTasks, setTodayTasks] = useState([
    { id: 1, text: 'Run RTSP reconnect loop test across 20 simulated drops', done: true },
    { id: 2, text: 'Benchmark camera NPU FPS with low light test clips', done: false },
    { id: 3, text: 'Submit weekly internship progress report to supervisor', done: true },
    { id: 4, text: 'Attend CCTV demo prep meeting at 4:30 PM with Rahul', done: false }
  ]);

  const [oneOnOneRequested, setOneOnOneRequested] = useState(false);

  const toggleTask = (id: number) => {
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleRequest1on1 = async () => {
    await submitRequest({
      type: '1on1',
      subject: `1-on-1 Mentorship Request from ${user?.full_name}`,
      description: `Requesting 30 minutes with supervisor ${user?.supervisor || 'Lead'} to review benchmark results.`
    });
    setOneOnOneRequested(true);
  };

  const weeklyProgress = user?.weekly_progress || 75;
  const attendance = user?.attendance_rate || 96;
  const supervisor = user?.supervisor || 'Rahul Sharma (Lead CV Engineer)';
  const currentProjectName = user?.current_project || 'Ceova CCTV';
  const latestFeedback = user?.supervisor_feedback || 'Excellent work on RTSP reconnection script. Ready to tackle camera FPS benchmark integration.';

  const curriculum = [
    { phase: 'Phase I', title: 'Edge Surveillance & Video Streaming', status: 'Completed', period: 'Weeks 1-4' },
    { phase: 'Phase II', title: 'Camera NPU Quantization & INT8 Pipeline', status: 'In Progress', period: 'Weeks 5-8' },
    { phase: 'Phase III', title: 'Production Camera Deployment & Field Testing', status: 'Upcoming', period: 'Weeks 9-12' }
  ];

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">TIROCINIUM ET DISCIPLINA • FELLOWSHIP WORKSPACE</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Fellowship & Intern Deck
          </h2>
          <p className="view-subtitle">
            Welcome, {user?.full_name || 'Aanya'} • {user?.department} • Mentored by <strong>{supervisor}</strong> on <strong>{currentProjectName}</strong>.
          </p>
        </div>

        <div className="view-actions-row">
          <button 
            className="neu-pill-btn"
            disabled={oneOnOneRequested}
            onClick={handleRequest1on1}
          >
            <UserCheck size={14} style={{ color: 'var(--neo-gold)' }} />
            <span>{oneOnOneRequested ? '✓ Request Submitted' : 'Request 1-on-1'}</span>
          </button>
          <button className="neu-pill-btn primary" onClick={() => onNavigate('chat')}>
            <MessageSquare size={14} />
            <span>Fellowship Chat</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Fellowship Mentorship & Weekly Progress (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="badge-gold">
              <GraduationCap size={12} /> Ceova Fellowship Program 2026
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> Mentorship Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Welcome, {user?.full_name}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 540 }}>
                You are contributing directly to <strong>{currentProjectName}</strong>. Your latest code commits and benchmark runs have been logged for review.
              </p>
            </div>

            {/* Designated Supervisor Highlight Box */}
            <div className="neu-inset-box" style={{ padding: '12px 18px', minWidth: 240 }}>
              <div style={{ fontSize: 11, color: 'var(--neo-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Designated Supervisor
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '4px 0 2px' }}>
                {supervisor}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Weekly 1-on-1: Thursdays at 4:00 PM
              </div>
            </div>
          </div>

          {/* Neumorphic Inset Execution Progress Bar */}
          <div className="neu-inset-box" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Weekly Fellowship Milestone Completion</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-serif)' }}>{weeklyProgress}% DELIVERED</strong>
            </div>
            <div className="mini-progress-bar" style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)' }}>
              <div 
                className="mini-bar-fill" 
                style={{ 
                  width: `${weeklyProgress}%`, 
                  background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #d4af37 100%)',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* 4 Mini Neumorphic Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Project</span>
                <Layers size={13} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentProjectName}
              </div>
              <div style={{ fontSize: 10.5, color: '#38bdf8', marginTop: 3 }}>Core assignment</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sprint Sync</span>
                <Clock size={13} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{attendance}%</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>Attendance record</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks Done</span>
                <CheckCircle2 size={13} style={{ color: 'var(--neo-gold)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>8 Completed</div>
              <div style={{ fontSize: 10.5, color: 'var(--neo-gold)', marginTop: 3 }}>This month</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fellowship Term</span>
                <Award size={13} style={{ color: '#c084fc' }} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>Cohort Fall '26</div>
              <div style={{ fontSize: 10.5, color: '#c084fc', marginTop: 3 }}>Mid-review Oct 28</div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Supervisor Evaluation & Guidance (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">I • SUPERVISOR EVALUATION</span>
            <Sparkles size={16} style={{ color: 'var(--neo-gold)' }} />
          </div>

          <div className="neu-inset-box" style={{ padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--neo-gold)', marginBottom: 8 }}>
              <Star size={14} fill="var(--neo-gold)" />
              <Star size={14} fill="var(--neo-gold)" />
              <Star size={14} fill="var(--neo-gold)" />
              <Star size={14} fill="var(--neo-gold)" />
              <Star size={14} fill="var(--neo-gold)" />
              <span style={{ fontSize: 11.5, color: 'var(--text-main)', marginLeft: 6, fontWeight: 600 }}>5.0 Rating</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
              "{latestFeedback}"
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'right' }}>
              — {supervisor}
            </div>
          </div>

          <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Next Scheduled Milestone
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              Ceova Camera RTSP Demo Review
            </div>
            <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>
              Wednesday • 3:30 PM with Engineering Team
            </div>
          </div>
        </div>

        {/* Bento Box 3: Daily Sprint Checklist (Span 7) */}
        <div className="bento-card bento-col-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">II • DAILY EXECUTION CHECKLIST</span>
            </div>
            <span className="badge-gold">
              {todayTasks.filter(t => t.done).length}/{todayTasks.length} Completed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayTasks.map((task) => (
              <div 
                key={task.id} 
                className="neu-inset-box" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '12px 16px',
                  cursor: 'pointer',
                  opacity: task.done ? 0.75 : 1
                }}
                onClick={() => toggleTask(task.id)}
              >
                <input 
                  type="checkbox" 
                  checked={task.done} 
                  onChange={() => toggleTask(task.id)}
                  style={{ accentColor: '#10b981', width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ 
                  fontSize: 13, 
                  color: task.done ? 'var(--text-muted)' : '#fff',
                  textDecoration: task.done ? 'line-through' : 'none',
                  flex: 1 
                }}>
                  {task.text}
                </span>
                {task.done && (
                  <span style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>DELIVERED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 4: Fellowship Learning Roadmap (Span 5) */}
        <div className="bento-card bento-col-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">III • FELLOWSHIP CURRICULUM</span>
            <Award size={16} style={{ color: '#c084fc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {curriculum.map((c, idx) => (
              <div key={idx} className="neu-inset-box" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--neo-gold)', fontWeight: 600 }}>{c.phase} • {c.period}</span>
                  <span className={`status-pill status-${c.status === 'Completed' ? 'completed' : c.status === 'In Progress' ? 'in_progress' : 'review'}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {c.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
