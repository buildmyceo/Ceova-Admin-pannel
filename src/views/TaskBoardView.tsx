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
  Filter 
} from 'lucide-react';
import { TaskStatus, PriorityLevel, TaskItem } from '../types';

interface TaskBoardViewProps {
  onOpenCreateTask: () => void;
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({ onOpenCreateTask }) => {
  const { user, role } = useAuth();
  const { tasks, updateTaskStatus, departments } = usePortalData();

  const [deptFilter, setDeptFilter] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);

  const canCreate = role === 'admin' || role === 'head';

  const columns: Array<{ id: TaskStatus; title: string; color: string }> = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'review', title: 'In Review', color: '#f59e0b' },
    { id: 'done', title: 'Completed', color: '#10b981' },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (deptFilter !== 'all' && t.department !== deptFilter) return false;
    if (onlyMine && t.assigned_to_id !== user?.id) return false;
    return true;
  });

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'todo': return 'in_progress';
      case 'in_progress': return 'review';
      case 'review': return 'done';
      case 'done': return null;
    }
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'done': return 'review';
      case 'review': return 'in_progress';
      case 'in_progress': return 'todo';
      case 'todo': return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Tasks & Project Milestones</h2>
          <p>Supervise deliverable statuses across teams or track your individual assignments.</p>
        </div>

        <div className="page-actions">
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={onOpenCreateTask}>
              <Plus size={15} />
              Assign New Task
            </button>
          )}
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

        <button
          type="button"
          className={`btn btn-sm ${onlyMine ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setOnlyMine(!onlyMine)}
        >
          {onlyMine ? '✓ Showing My Tasks Only' : 'Filter: Assigned To Me'}
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-header">
                <div className="kanban-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span>{col.title}</span>
                </div>
                <span className="brand-pill" style={{ fontWeight: 700 }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {colTasks.map((t) => {
                  const prev = getPrevStatus(t.status);
                  const next = getNextStatus(t.status);

                  return (
                    <div key={t.id} className="kanban-task-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className={`tag-badge tag-priority-${t.priority}`}>
                          {t.priority}
                        </span>
                        <span className="brand-pill" style={{ fontSize: 10 }}>
                          {t.department}
                        </span>
                      </div>

                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, lineHeight: 1.35 }}>
                        {t.title}
                      </h4>

                      {t.description && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8 }}>
                          {t.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} />
                          {t.assigned_to_name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {t.due_date}
                        </span>
                      </div>

                      {/* Quick stage transition buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 4 }}>
                        {prev ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '3px 6px', fontSize: 10 }}
                            onClick={() => updateTaskStatus(t.id, prev)}
                            title="Move back"
                          >
                            <ChevronLeft size={11} /> Back
                          </button>
                        ) : <div />}

                        {next && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '3px 6px', fontSize: 10 }}
                            onClick={() => updateTaskStatus(t.id, next)}
                            title="Move next"
                          >
                            Next <ChevronRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 12 }}>
                    No tasks in this lane
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
