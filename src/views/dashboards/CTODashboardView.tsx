import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  Cpu, 
  Terminal, 
  Layers, 
  Bug, 
  Users, 
  CheckSquare, 
  GitBranch, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  ChevronRight,
  Server,
  Zap,
  Activity,
  Code2
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface CTODashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenTaskModal: () => void;
}

export const CTODashboardView: React.FC<CTODashboardViewProps> = ({
  onNavigate,
  onOpenTaskModal,
}) => {
  const { user } = useAuth();
  const { projects, tasks, members, updateTaskStatus } = usePortalData();

  const devProjects = projects.filter(p => p.department === 'Development');
  const devMembers = members.filter(m => m.department === 'Development' && m.role !== 'intern');
  const devInterns = members.filter(m => m.department === 'Development' && m.role === 'intern');
  const devTasks = tasks.filter(t => t.department === 'Development');
  const criticalBugs = devTasks.filter(t => t.priority === 'critical' || t.status === 'blocked');

  const roadmapMilestones = [
    { quarter: 'Q4 2026', title: 'Ceova CCTV v1.0 Commercial Release', status: 'In Progress', progress: 70 },
    { quarter: 'Q4 2026', title: 'Edge INT8 Quantization Engine', status: 'Testing', progress: 85 },
    { quarter: 'Q1 2027', title: 'Ceova Android v2.0 Multi-camera Matrix', status: 'Planning', progress: 30 },
    { quarter: 'Q1 2027', title: 'Autonomous Drone Perimeter Patrol Model', status: 'Research', progress: 15 }
  ];

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">ARCHITECTURA ET SCIENTIA • TECHNOLOGY COMMAND</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Technology & Engineering Deck
          </h2>
          <p className="view-subtitle">
            Chief Technology Officer • Elena Rostova • Edge surveillance models, distributed camera pipelines, and mobile runtimes.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn primary" onClick={onOpenTaskModal}>
            <Plus size={14} />
            <span>Assign Dev Task</span>
          </button>
          <button className="neu-pill-btn" onClick={() => onNavigate('chat')}>
            <MessageSquare size={14} style={{ color: '#818cf8' }} />
            <span>Dev Chat (#cctv)</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Engineering Telemetry & CTO Hero (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="badge-role-cto">
              <Cpu size={12} /> Technology Core
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> Sub-35ms Inference Latency
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Engineering Command • Elena Rostova
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
            Overseeing <strong>{devProjects.length} core engineering initiatives</strong>, <strong>{devMembers.length} senior engineers</strong>, and <strong>{devInterns.length} development interns</strong>. Camera NPU driver integration is 85% verified.
          </p>

          {/* Neumorphic Inset Telemetry Gauges */}
          <div className="neu-inset-box" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Camera FPS</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                30.2 <span style={{ fontSize: 13, color: '#818cf8' }}>fps</span>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloud API Uptime</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                99.98%
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Build</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                v0.9.4
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="neu-pill-btn" onClick={() => onNavigate('tasks')}>
              <CheckSquare size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Dev Kanban Board</span>
            </button>
            <button className="neu-pill-btn" onClick={() => onNavigate('projects')}>
              <Terminal size={14} style={{ color: '#06b6d4' }} />
              <span>Code Repos & Specs</span>
            </button>
          </div>
        </div>

        {/* Bento Box 2: Technical Roadmap Capsule (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="neo-sub-roman">ROADMAP • MILESTONES</div>
            <GitBranch size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>

          <div className="roadmap-list">
            {roadmapMilestones.map((item, idx) => (
              <div key={idx} className="roadmap-item" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{item.title}</span>
                  <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>{item.quarter}</span>
                </div>
                <div className="mini-progress-bar" style={{ height: 5 }}>
                  <div className="mini-bar-fill" style={{ width: `${item.progress}%`, background: 'var(--accent-gradient)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 3: Metric - Active Projects (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Dev Projects</span>
            <div className="metric-icon-wrap blue"><Layers size={16} /></div>
          </div>
          <div className="metric-value">{devProjects.length}</div>
          <div className="metric-footer neutral">CCTV • Android • AI Core</div>
        </div>

        {/* Bento Box 4: Metric - Developers (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('team')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Senior Developers</span>
            <div className="metric-icon-wrap purple"><Users size={16} /></div>
          </div>
          <div className="metric-value">{devMembers.length}</div>
          <div className="metric-footer neutral">Rahul, Sarah, Devon</div>
        </div>

        {/* Bento Box 5: Metric - Interns (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('team')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Dev Interns</span>
            <div className="metric-icon-wrap cyan"><Users size={16} /></div>
          </div>
          <div className="metric-value">{devInterns.length}</div>
          <div className="metric-footer positive">Supervised by Rahul Sharma</div>
        </div>

        {/* Bento Box 6: Metric - Critical Bugs (Span 3) */}
        <div className="bento-card bento-col-3" onClick={() => onNavigate('tasks')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span className="metric-label">Critical Issues</span>
            <div className="metric-icon-wrap red"><Bug size={16} /></div>
          </div>
          <div className="metric-value">{criticalBugs.length}</div>
          <div className="metric-footer warning">NPU SPI timeout flagged</div>
        </div>

        {/* Bento Box 7: Active Dev Projects Portfolio (Span 7) */}
        <div className="bento-card bento-col-7">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <Terminal size={16} className="panel-icon blue" />
              <h3 className="neo-serif-title" style={{ fontSize: 16 }}>Development Projects Portfolio</h3>
            </div>
            <button className="btn-link" onClick={() => onNavigate('projects')}>
              View All <ChevronRight size={13} />
            </button>
          </div>

          <div className="cto-projects-list">
            {devProjects.map((project) => (
              <div key={project.id} className="cto-project-card" style={{ marginBottom: 12 }}>
                <div className="project-card-header">
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{project.name}</h4>
                    <p className="project-subtext">{project.description}</p>
                  </div>
                  <div className="project-progress-badge">
                    <span>{project.progress}%</span>
                  </div>
                </div>

                <div className="mini-progress-bar" style={{ margin: '10px 0 14px' }}>
                  <div className="mini-bar-fill" style={{ width: `${project.progress}%`, background: 'var(--accent-gradient)' }} />
                </div>

                <div className="project-milestones-preview">
                  <div className="milestones-chips">
                    {project.milestones.slice(0, 3).map((m) => (
                      <div key={m.id} className={`milestone-chip ${m.completed ? 'completed' : 'pending'}`}>
                        {m.completed ? <CheckCircle2 size={12} /> : <div className="mini-bullet" />}
                        <span>{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 8: Bug Reports & Open Tasks (Span 5) */}
        <div className="bento-card bento-col-5">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <Bug size={16} className="panel-icon red" />
              <h3 className="neo-serif-title" style={{ fontSize: 16 }}>Open Tasks & Bug Queue</h3>
            </div>
            <span className="badge-danger-soft">{criticalBugs.length} High Priority</span>
          </div>

          <div className="cto-task-list">
            {devTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="neu-inset-box" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{task.title}</span>
                  <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Assignee: <strong>{task.assigned_to_name}</strong></span>
                  <select
                    className="task-status-select"
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
