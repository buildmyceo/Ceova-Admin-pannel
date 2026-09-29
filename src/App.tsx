import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalDataProvider } from './context/PortalDataContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { MembersView } from './views/MembersView';
import { AdminRolesView } from './views/AdminRolesView';
import { DepartmentHubView } from './views/DepartmentHubView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { TaskBoardView } from './views/TaskBoardView';
import { RequestsView } from './views/RequestsView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { ProfileView } from './views/ProfileView';

import { AuthModal } from './components/AuthModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { CreateAnnouncementModal } from './components/CreateAnnouncementModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { SubmitRequestModal } from './components/SubmitRequestModal';

const PortalMain: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // If a role changes and the user was on an admin-only tab, safely switch to dashboard
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'roles' && role !== 'admin') {
      setCurrentTab('dashboard');
      return;
    }
    if (tab === 'department' && role !== 'admin' && role !== 'head') {
      setCurrentTab('dashboard');
      return;
    }
    setCurrentTab(tab);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
      case 'members':
        return (
          <MembersView onOpenInvite={() => setIsInviteOpen(true)} />
        );
      case 'roles':
        return role === 'admin' ? (
          <AdminRolesView onOpenInvite={() => setIsInviteOpen(true)} />
        ) : (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
      case 'department':
        return (role === 'admin' || role === 'head') ? (
          <DepartmentHubView
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
          />
        ) : (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsView onOpenCreate={() => setIsAnnouncementOpen(true)} />
        );
      case 'tasks':
        return (
          <TaskBoardView onOpenCreateTask={() => setIsTaskOpen(true)} />
        );
      case 'requests':
        return (
          <RequestsView onOpenSubmit={() => setIsRequestOpen(true)} />
        );
      case 'logs':
        return (role === 'admin' || role === 'head') ? (
          <ActivityLogsView />
        ) : (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => setIsTaskOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onNavigateToProfile={() => setCurrentTab('profile')}
      />

      <div className="portal-body">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenConfig={() => setIsConfigOpen(true)}
        />

        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <CreateAnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
      />

      <CreateTaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
      />

      <SubmitRequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PortalDataProvider>
        <PortalMain />
      </PortalDataProvider>
    </AuthProvider>
  );
}

export default App;
