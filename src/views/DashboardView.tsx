import React from 'react';
import { NavTab } from '../components/Sidebar';
import { CEODashboardView } from './dashboards/CEODashboardView';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, id?: string) => void;
  onOpenInvite?: () => void;
  onOpenAnnouncement?: () => void;
  onOpenTask?: () => void;
  onOpenRequest?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
}) => {
  return <CEODashboardView onNavigate={onNavigate} />;
};
