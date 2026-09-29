import React, { useState, useEffect } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { X, MessageSquareQuote } from 'lucide-react';
import { RequestType } from '../types';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({ isOpen, onClose }) => {
  const { submitRequest } = usePortalData();

  const [type, setType] = useState<RequestType>('leave');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

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
    if (!subject.trim()) return;

    await submitRequest({
      type,
      subject: subject.trim(),
      description: description.trim(),
    });

    onClose();
    setSubject('');
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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--success)'
              }}
            >
              <MessageSquareQuote size={18} />
            </div>
            <h3>Submit Request to Leads / Admin</h3>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Request Category</label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value as RequestType)}
              >
                <option value="leave">Time Off / Leave Request</option>
                <option value="equipment">Hardware / Equipment</option>
                <option value="1on1">1-on-1 Mentorship / Feedback Session</option>
                <option value="access">Access & Credentials Permissions</option>
                <option value="general">General Support / Operational</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of your request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Details / Explanation</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 110 }}
                placeholder="Provide dates, justification, or any relevant details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
