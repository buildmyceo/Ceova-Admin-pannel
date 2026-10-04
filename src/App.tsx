import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalDataProvider } from './context/PortalDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';

// Views
import { DashboardView } from './views/DashboardView';
import { TaskBoardView } from './views/TaskBoardView';
import { ProjectsView } from './views/ProjectsView';
import { CalendarView } from './views/CalendarView';
import { MembersView } from './views/MembersView';
import { ChatView } from './views/ChatView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { FilesView } from './views/FilesView';
import { ExecutiveRoomView } from './views/ExecutiveRoomView';
import { DepartmentHubView } from './views/DepartmentHubView';
import { CFODashboardView } from './views/dashboards/CFODashboardView';
import { CoreMemberDashboardView } from './views/dashboards/CoreMemberDashboardView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { AdminRolesView } from './views/AdminRolesView';
import { RequestsView } from './views/RequestsView';
import { ProfileView } from './views/ProfileView';

// Modals
import { AuthModal } from './components/AuthModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { CreateAnnouncementModal } from './components/CreateAnnouncementModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { SubmitRequestModal } from './components/SubmitRequestModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { WaitlistModal } from './components/WaitlistModal';
import { LoginPage } from './views/LoginPage';

const PortalMain: React.FC = () => {
  const { user, role, isCSuite } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Gateway / Login Page State: Show login page first until session has entered portal
  const [showLoginPage, setShowLoginPage] = useState<boolean>(() => {
    return sessionStorage.getItem('ceova_portal_entered') !== 'true';
  });

  // Modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<any>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const handleEnterPortal = () => {
    sessionStorage.setItem('ceova_portal_entered', 'true');
    setShowLoginPage(false);
  };

  const handleLockGateway = () => {
    sessionStorage.removeItem('ceova_portal_entered');
    setShowLoginPage(true);
  };

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
  };

  const handleOpenTaskWithPrefill = (prefilled?: any) => {
    setTaskInitialData(prefilled || null);
    setIsTaskOpen(true);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => handleOpenTaskWithPrefill()}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );

      case 'tasks':
        return (
          <TaskBoardView 
            onOpenCreateTask={() => handleOpenTaskWithPrefill()} 
          />
        );

      case 'projects':
        return (
          <ProjectsView 
            onNavigateToChat={() => setCurrentTab('chat')}
            onOpenCreateProject={() => handleOpenTaskWithPrefill()}
          />
        );

      case 'calendar':
        return <CalendarView />;

      case 'team':
        return (
          <MembersView 
            onOpenInvite={() => setIsInviteOpen(true)} 
            onNavigateToChat={() => setCurrentTab('chat')}
          />
        );

      case 'chat':
        return (
          <ChatView 
            onOpenCreateTaskModal={(prefill) => handleOpenTaskWithPrefill(prefill)}
          />
        );

      case 'announcements':
        return (
          <AnnouncementsView 
            onOpenCreate={() => setIsAnnouncementOpen(true)} 
          />
        );

      case 'files':
        return <FilesView />;

      case 'executive_room':
        return (
          <ExecutiveRoomView 
            onNavigate={handleSelectTab} 
          />
        );

      case 'department':
        return (
          <DepartmentHubView
            onOpenTask={() => handleOpenTaskWithPrefill()}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
          />
        );

      case 'reports':
        return (
          <CFODashboardView 
            onNavigate={handleSelectTab} 
          />
        );

      case 'performance':
        return (
          <CoreMemberDashboardView 
            onNavigate={handleSelectTab}
            onOpenTaskModal={() => handleOpenTaskWithPrefill()}
          />
        );

      case 'roles':
        return isCSuite ? (
          <AdminRolesView onOpenInvite={() => setIsInviteOpen(true)} />
        ) : (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => handleOpenTaskWithPrefill()}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );

      case 'requests':
        return (
          <RequestsView 
            onOpenSubmit={() => setIsRequestOpen(true)} 
          />
        );

      case 'logs':
        return <ActivityLogsView />;

      case 'profile':
        return <ProfileView />;

      default:
        return (
          <DashboardView
            onNavigate={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenAnnouncement={() => setIsAnnouncementOpen(true)}
            onOpenTask={() => handleOpenTaskWithPrefill()}
            onOpenRequest={() => setIsRequestOpen(true)}
          />
        );
    }
  };

  // If viewing the Login Gateway Screen first
  if (showLoginPage) {
    return (
      <div className="login-gateway-container">
        <LoginPage
          onLoginSuccess={handleEnterPortal}
          onOpenWaitlist={() => setIsWaitlistOpen(true)}
        />

        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          onSwitchToCEO={() => {
            handleEnterPortal();
            setCurrentTab('dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onNavigateToProfile={() => setCurrentTab('profile')}
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        onLockGateway={handleLockGateway}
      />

      <div className="portal-body">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleEnterPortal}
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
        onClose={() => {
          setIsTaskOpen(false);
          setTaskInitialData(null);
        }}
        initialData={taskInitialData}
      />

      <SubmitRequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToTab={handleSelectTab}
      />

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        onSwitchToCEO={() => setCurrentTab('dashboard')}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PortalDataProvider>
          <PortalMain />
        </PortalDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
