import React from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, Video, AlertCircle, Plus } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

export const CalendarView: React.FC = () => {
  const { projects, tasks } = usePortalData();

  const events = [
    {
      id: 'e1',
      title: 'Ceova CCTV Edge Detection Sprint Demo',
      time: 'Wednesday, 5:00 PM - 6:00 PM',
      type: 'Demo',
      host: 'Elena Rostova & Rahul Sharma',
      department: 'Development',
      color: '#6366f1'
    },
    {
      id: 'e2',
      title: 'C-Suite Executive Board Strategy Sync',
      time: 'Thursday, 4:00 PM - 5:30 PM',
      type: 'Executive',
      host: 'Harshit (CEO)',
      department: 'Executive',
      color: '#a855f7'
    },
    {
      id: 'e3',
      title: 'Optical Lens Procurement Review with Supplier',
      time: 'Friday, 11:30 AM - 12:15 PM',
      type: 'Operations',
      host: 'Aarav Singhania (COO)',
      department: 'Operations',
      color: '#f59e0b'
    },
    {
      id: 'e4',
      title: 'Intern Fellowship Mid-Term Check-in',
      time: 'Monday, 2:00 PM - 2:45 PM',
      type: 'Mentorship',
      host: 'Rahul Sharma & Aanya Patel',
      department: 'Development',
      color: '#06b6d4'
    }
  ];

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>Company Calendar & Milestones Radar</h2>
          <p className="view-subtitle">
            Synchronized sprint reviews, board syncs, project deadlines, and release dates across Ceova.
          </p>
        </div>
      </div>

      <div className="calendar-layout-grid">
        {/* Left: Schedule Feed */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <CalendarIcon size={18} className="panel-icon blue" />
              <h3>Upcoming Scheduled Sessions & Milestones</h3>
            </div>
            <span className="badge-subtle">October 2026</span>
          </div>

          <div className="events-stream-list">
            {events.map((evt) => (
              <div key={evt.id} className="event-stream-card">
                <div className="event-color-strip" style={{ backgroundColor: evt.color }} />
                <div className="event-details">
                  <div className="event-title-line">
                    <h4>{evt.title}</h4>
                    <span className="event-type-badge">{evt.type}</span>
                  </div>
                  <div className="event-time-line">
                    <Clock size={13} /> {evt.time}
                  </div>
                  <div className="event-host-line">
                    Lead: <strong>{evt.host}</strong> • {evt.department}
                  </div>
                </div>
                <button className="btn-tiny-secondary">
                  <Video size={13} /> Join Room
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Project Deadlines Radar */}
        <div className="panel-card-stack">
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <Clock size={18} className="panel-icon orange" />
                <h3>Project Deliverable Deadlines</h3>
              </div>
            </div>

            <div className="deadlines-radar-list">
              {projects.map((p) => (
                <div key={p.id} className="deadline-radar-item">
                  <div>
                    <div className="deadline-proj-name">{p.name}</div>
                    <div className="deadline-proj-sub">Progress: {p.progress}% • {p.department}</div>
                  </div>
                  <div className="deadline-date-pill">{p.deadline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
