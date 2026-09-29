import React, { useState, useEffect } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { X, Bell, AlertCircle } from 'lucide-react';
import { PriorityLevel } from '../types';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const { addAnnouncement, departments } = usePortalData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [targetRole, setTargetRole] = useState<'all' | 'admin' | 'head' | 'member'>('all');
  const [targetDepartment, setTargetDepartment] = useState('all');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      priority,
      target_role: targetRole,
      target_department: targetDepartment,
    });

    onClose();
    setTitle('');
    setContent('');
    setPriority('normal');
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
                background: 'rgba(236, 72, 153, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#ec4899'
              }}
            >
              <Bell size={18} />
            </div>
            <h3>Broadcast Notice</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Notice Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Q4 Townhall & Project Milestones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent / Pin at Top</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select
                  className="form-input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                >
                  <option value="all">Everyone in Organization</option>
                  <option value="member">Members Only</option>
                  <option value="head">Department Heads Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Department</label>
              <select
                className="form-input"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Announcement Content *</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 120 }}
                placeholder="Write the full details of this announcement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
