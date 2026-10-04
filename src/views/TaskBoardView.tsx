import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  List,
  Columns,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  FolderGit2
} from 'lucide-react';
import { TaskStatus, TaskItem } from '../types';

interface TaskBoardViewProps {
  onOpenCreateTask: () => void;
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({ onOpenCreateTask }) => {
  const { user } = useAuth();
  const { tasks, updateTaskStatus, departments, projects } = usePortalData();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [deptFilter, setDeptFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);

  const columns: Array<{ id: TaskStatus; title: string; color: string }> = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'review', title: 'In Review', color: '#f59e0b' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
    { id: 'blocked', title: 'Blocked', color: '#ef4444' }
  ];

  const filteredTasks = tasks.filter((t) => {
    if (deptFilter !== 'all' && t.department !== deptFilter) return false;
    if (projectFilter !== 'all' && t.project_name !== projectFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (onlyMine && t.assigned_to_id !== user?.id && !t.assigned_to_name.includes(user?.full_name?.split(' ')[0] || '')) return false;
    return true;
  });

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'todo': return 'in_progress';
      case 'in_progress': return 'review';
      case 'review': return 'completed';
      case 'completed': return null;
      case 'blocked': return 'in_progress';
      default: return null;
    }
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'completed': return 'review';
      case 'review': return 'in_progress';
      case 'in_progress': return 'todo';
      case 'blocked': return 'todo';
      default: return null;
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header-row">
        <div>
          <h2>Task Management & Execution Engine</h2>
          <p className="view-subtitle">
            Track deliverable throughput, assign tasks to members or interns, and resolve blockers.
          </p>
        </div>

        <div className="view-actions-row">
          <div className="view-toggle-group">
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <Columns size={14} /> Kanban
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} /> List
            </button>
          </div>

          <button type="button" className="btn btn-primary" onClick={onOpenCreateTask}>
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <select
          className="select-field"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          className="select-field"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        <select
          className="select-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <button
          type="button"
          className={`btn btn-sm ${onlyMine ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setOnlyMine(!onlyMine)}
        >
          {onlyMine ? '✓ Showing My Tasks Only' : 'Assigned to Me'}
        </button>
      </div>

      {/* View Mode: Kanban vs List */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board-scroll">
          <div className="kanban-board-5col">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id || (col.id === 'completed' && t.status === 'done'));

              return (
                <div key={col.id} className="kanban-column">
                  <div className="kanban-header">
                    <div className="kanban-title">
                      <span className="lane-color-dot" style={{ background: col.color }} />
                      <span>{col.title}</span>
                    </div>
                    <span className="counter-pill">{colTasks.length}</span>
                  </div>

                  <div className="kanban-task-stack">
                    {colTasks.map((t) => {
                      const prev = getPrevStatus(t.status);
                      const next = getNextStatus(t.status);

                      return (
                        <div key={t.id} className={`kanban-task-card priority-${t.priority}`}>
                          <div className="task-card-header">
                            <span className={`priority-tag ${t.priority}`}>
                              {t.priority}
                            </span>
                            {t.project_name && (
                              <span className="task-project-pill">
                                {t.project_name}
                              </span>
                            )}
                          </div>

                          <h4 className="task-card-title">{t.title}</h4>

                          {t.description && (
                            <p className="task-card-desc">{t.description}</p>
                          )}

                          <div className="task-card-meta">
                            <span className="meta-assignee">
                              <User size={12} /> {t.assigned_to_name}
                            </span>
                            <span className="meta-due">
                              <Calendar size={12} /> {t.due_date}
                            </span>
                          </div>

                          {/* Quick stage transition buttons */}
                          <div className="task-card-actions">
                            {prev ? (
                              <button
                                type="button"
                                className="btn-tiny-nav"
                                onClick={() => updateTaskStatus(t.id, prev)}
                                title="Move back"
                              >
                                <ChevronLeft size={11} /> Back
                              </button>
                            ) : <div />}

                            {t.status !== 'blocked' ? (
                              <button 
                                className="btn-tiny-blocked"
                                onClick={() => updateTaskStatus(t.id, 'blocked')}
                                title="Mark as blocked"
                              >
                                Block
                              </button>
                            ) : (
                              <button 
                                className="btn-tiny-unblock"
                                onClick={() => updateTaskStatus(t.id, 'in_progress')}
                              >
                                Unblock
                              </button>
                            )}

                            {next && (
                              <button
                                type="button"
                                className="btn-tiny-nav"
                                onClick={() => updateTaskStatus(t.id, next)}
                                title="Move forward"
                              >
                                Next <ChevronRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="empty-lane-placeholder">
                        No tasks in this lane
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="task-list-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="table-task-title">{t.title}</div>
                    <div className="table-task-sub">{t.description}</div>
                  </td>
                  <td>
                    <span className={`status-pill status-${t.status}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-tag ${t.priority}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>{t.project_name || 'Ceova Core'}</td>
                  <td>{t.assigned_to_name}</td>
                  <td>{t.due_date}</td>
                  <td>
                    <select
                      className="task-status-select"
                      value={t.status}
                      onChange={(e) => updateTaskStatus(t.id, e.target.value as any)}
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
