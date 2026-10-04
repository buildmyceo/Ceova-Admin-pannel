import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FolderGit2
} from 'lucide-react';
import { Project } from '../types';
import { NavTab } from '../components/Sidebar';

interface ProjectsViewProps {
  onNavigateToChat?: () => void;
  onOpenCreateProject?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  onNavigateToChat,
  onOpenCreateProject 
}) => {
  const { isCSuite } = useAuth();
  const { projects, toggleMilestone } = usePortalData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-cctv');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h2>Project Portfolio & Milestones</h2>
          <p className="view-subtitle">
            Enterprise roadmap execution, milestone deliverable checklists, and risk radars across Ceova.
          </p>
        </div>
        {isCSuite && (
          <button className="btn btn-primary" onClick={onOpenCreateProject}>
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {/* Projects Grid / Selector */}
      <div className="projects-grid-overview">
        {projects.map((proj) => (
          <div 
            key={proj.id}
            className={`project-portfolio-card ${selectedProject?.id === proj.id ? 'active' : ''}`}
            onClick={() => setSelectedProjectId(proj.id)}
          >
            <div className="proj-card-top">
              <div>
                <span className="proj-dept-tag">{proj.department}</span>
                <h4>{proj.name}</h4>
              </div>
              <div className="proj-progress-circle">
                <span>{proj.progress}%</span>
              </div>
            </div>

            <p className="proj-card-desc">{proj.description}</p>

            <div className="mini-progress-bar" style={{ margin: '10px 0' }}>
              <div className="mini-bar-fill" style={{ width: `${proj.progress}%`, background: 'var(--accent-gradient)' }} />
            </div>

            <div className="proj-card-bottom">
              <span className="proj-owner">Owner: {proj.owner_name} ({proj.owner_role})</span>
              <span className="proj-deadline">Due: {proj.deadline}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Project View */}
      {selectedProject && (
        <div className="project-detail-panel">
          <div className="detail-panel-header">
            <div className="header-identity">
              <span className="proj-code-badge">{selectedProject.code.toUpperCase()}</span>
              <div>
                <h3>{selectedProject.name}</h3>
                <p>{selectedProject.description}</p>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={onNavigateToChat}
              >
                <MessageSquare size={14} /> Open Project Chat
              </button>
            </div>
          </div>

          <div className="detail-panel-body">
            {/* Milestones Column */}
            <div className="detail-column">
              <div className="column-title-row">
                <CheckCircle2 size={16} className="text-cyan" />
                <h4>Milestone Deliverables ({selectedProject.milestones.filter(m => m.completed).length}/{selectedProject.milestones.length})</h4>
              </div>

              <div className="milestones-checklist">
                {selectedProject.milestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className={`milestone-interactive-item ${milestone.completed ? 'completed' : ''}`}
                    onClick={() => toggleMilestone(selectedProject.id, milestone.id)}
                  >
                    <div className={`checkbox-custom ${milestone.completed ? 'checked' : ''}`}>
                      {milestone.completed && <CheckCircle2 size={14} />}
                    </div>
                    <div className="milestone-content">
                      <div className="milestone-title-text">{milestone.title}</div>
                      <div className="milestone-date-sub">Target: {milestone.due_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team & Risks Column */}
            <div className="detail-column">
              {/* Project Members */}
              <div className="column-title-row">
                <Users size={16} className="text-purple" />
                <h4>Project Team Members ({selectedProject.members.length})</h4>
              </div>

              <div className="project-members-roster">
                {selectedProject.members.map((m) => (
                  <div key={m.id} className="proj-member-pill">
                    <span className="avatar-chip-small">{m.name.charAt(0)}</span>
                    <span className="proj-member-name">{m.name}</span>
                    <span className="proj-member-role">({m.role})</span>
                  </div>
                ))}
              </div>

              {/* Risks & Mitigations */}
              <div className="column-title-row" style={{ marginTop: 24 }}>
                <AlertTriangle size={16} className="text-orange" />
                <h4>Flagged Risks & Blockers</h4>
              </div>

              <div className="project-risks-list">
                {selectedProject.risks.length > 0 ? (
                  selectedProject.risks.map((risk, idx) => (
                    <div key={idx} className="project-risk-card">
                      <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                      <span>{risk}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-risks-card">
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span>No critical operational risks logged.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
