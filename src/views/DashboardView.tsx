import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/Sidebar';
import { CEODashboardView } from './dashboards/CEODashboardView';
import { CTODashboardView } from './dashboards/CTODashboardView';
import { CMODashboardView } from './dashboards/CMODashboardView';
import { CFODashboardView } from './dashboards/CFODashboardView';
import { COODashboardView } from './dashboards/COODashboardView';
import { CoreMemberDashboardView } from './dashboards/CoreMemberDashboardView';
import { InternDashboardView } from './dashboards/InternDashboardView';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenInvite: () => void;
  onOpenAnnouncement: () => void;
  onOpenTask: () => void;
  onOpenRequest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenInvite,
  onOpenAnnouncement,
  onOpenTask,
  onOpenRequest,
}) => {
  const { user, role } = useAuth();

  // Intelligently render dashboard matching the user's role
  switch (role) {
    case 'ceo':
    case 'admin':
      return (
        <CEODashboardView
          onNavigate={onNavigate}
          onOpenTaskModal={onOpenTask}
          onOpenAnnouncementModal={onOpenAnnouncement}
        />
      );

    case 'cto':
      return (
        <CTODashboardView
          onNavigate={onNavigate}
          onOpenTaskModal={onOpenTask}
        />
      );

    case 'cmo':
      return (
        <CMODashboardView
          onNavigate={onNavigate}
          onOpenTaskModal={onOpenTask}
        />
      );

    case 'cfo':
      return (
        <CFODashboardView
          onNavigate={onNavigate}
        />
      );

    case 'coo':
      return (
        <COODashboardView
          onNavigate={onNavigate}
        />
      );

    case 'intern':
      return (
        <InternDashboardView
          onNavigate={onNavigate}
        />
      );

    case 'head':
      // Map department heads to their respective domain view if applicable
      if (user?.department?.toLowerCase().includes('development') || user?.department?.toLowerCase().includes('engineering')) {
        return <CTODashboardView onNavigate={onNavigate} onOpenTaskModal={onOpenTask} />;
      }
      if (user?.department?.toLowerCase().includes('marketing') || user?.department?.toLowerCase().includes('design')) {
        return <CMODashboardView onNavigate={onNavigate} onOpenTaskModal={onOpenTask} />;
      }
      return <CoreMemberDashboardView onNavigate={onNavigate} onOpenTaskModal={onOpenTask} />;

    case 'member':
    default:
      return (
        <CoreMemberDashboardView
          onNavigate={onNavigate}
          onOpenTaskModal={onOpenTask}
        />
      );
  }
};
