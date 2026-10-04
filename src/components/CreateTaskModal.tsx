import React, { useState, useEffect } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { X, CheckSquare, Calendar, User, Flag, Layers } from 'lucide-react';
import { TaskItem } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartment?: string;
  initialData?: {
    title?: string;
    assignee?: string;
    project?: string;
    department?: string;
    priority?: string;
    deadline?: string;
  };
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose,
  defaultDepartment,
  initialData 
}) => {
  const { addTask, members, departments, projects } = usePortalData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [projectName, setProjectName] = useState('Ceova CCTV');
  const [department, setDepartment] = useState(defaultDepartment || 'Development');
  const [priority, setPriority] = useState<TaskItem['priority']>('high');
  const [dueDate, setDueDate] = useState('');

  // Handle prefilled data
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.project) setProjectName(initialData.project);
      if (initialData.department) setDepartment(initialData.department);
      if (initialData.priority) setPriority(initialData.priority.toLowerCase() as any);
      if (initialData.assignee) {
        const found = members.find(m => m.full_name.toLowerCase().includes(initialData.assignee!.toLowerCase()));
        if (found) setAssignedToId(found.id);
      }
    }
  }, [initialData, members]);

  // Auto-select first member when opened if none selected
  useEffect(() => {
    if (members.length > 0 && !assignedToId) {
      setAssignedToId(members[0].id);
    }
  }, [members, assignedToId]);

  // Set default due date to 7 days in future
  useEffect(() => {
    if (!dueDate) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [dueDate]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredMembers = department && department !== 'All' 
    ? members.filter(m => m.department === department)
    : members;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId) return;

    await addTask({
      title: title.trim(),
      description: description.trim(),
      assigned_to_id: assignedToId,
      department,
      project_name: projectName,
      priority,
      due_date: dueDate,
    });

    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}
            >
              <CheckSquare size={18} />
            </div>
            <h3>Assign New Task / Milestone</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CCTV Human Detection Pipeline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  <option value="General Operations">General Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Assign To Member *</label>
                <select
                  className="form-input"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  required
                >
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.designation})
                      </option>
                    ))
                  ) : (
                    members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.department})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description & Acceptance Criteria</label>
              <textarea
                className="form-textarea"
                placeholder="Key expectations, links to specs, or technical deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
