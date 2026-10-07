import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PortalDataProvider } from './context/PortalDataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { useAuth } from './context/AuthContext';

// Views
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { MembersView } from './views/MembersView';
import { TasksView } from './views/TasksView';
import { AppDashboardView } from './views/AppDashboardView';
import { SavedItemsView } from './views/SavedItemsView';
import { CalendarView } from './views/CalendarView';
import { NotificationsView } from './views/NotificationsView';

// Modals
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './views/LoginPage';
import { PortalBackground } from './components/PortalBackground';
import { CompulsoryProfileSetupModal } from './components/CompulsoryProfileSetupModal';

const PortalMain: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedTaskScope, setSelectedTaskScope] = useState<'mine' | 'delegated' | 'all'>('mine');

  // Resize listener for responsive layout
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      // Auto-close drawer on mobile resize if open
      if (mobile && isSidebarVisible) {
        setIsSidebarVisible(false);
      } else if (!mobile && !isSidebarVisible) {
        setIsSidebarVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarVisible]);

  // Clear any legacy gateway lock from sessionStorage
  React.useEffect(() => {
    try {
      sessionStorage.removeItem('ceova_gateway_locked');
    } catch (_) {}
  }, []);

  // Modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleEnterPortal = () => {
    // Legacy support or extra effects on enter if needed
  };

  const { logout, user, isLoading } = useAuth();

  // Compulsory onboarding setup gate: only gate users who are explicitly 'pending'
  const isProfileIncomplete = Boolean(
    user && user.status === 'pending'
  );

  const handleSelectTab = (tab: NavTab, id?: string) => {
    setCurrentTab(tab);
    if (tab === 'app_dashboard' && id) {
      setSelectedAppId(id);
    }
    if (tab === 'tasks' && id && (id === 'mine' || id === 'delegated' || id === 'all')) {
      setSelectedTaskScope(id as 'mine' | 'delegated' | 'all');
    }
    // Automatically close the mobile sidebar upon choosing a section
    if (isMobileView) {
      setIsSidebarVisible(false);
    }
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'profile':
        return <ProfileView />;
      case 'members':
        return <MembersView onNavigate={handleSelectTab} />;
      case 'tasks':
        return <TasksView initialScope={selectedTaskScope} />;
      case 'calendar':
        return <CalendarView onNavigate={handleSelectTab} />;
      case 'notifications':
        return <NotificationsView onNavigate={handleSelectTab} />;
      case 'saved':
        return <SavedItemsView onNavigate={handleSelectTab} />;
      case 'app_dashboard':
        return <AppDashboardView appId={selectedAppId} onBack={() => handleSelectTab('dashboard')} />;
      case 'dashboard':
      default:
        return <DashboardView onNavigate={handleSelectTab} />;
    }
  };

  // If viewing the Login Gateway Screen first
  if (!user) {
    return (
      <div className="login-gateway-container">
        <LoginPage
          onLoginSuccess={handleEnterPortal}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigateToProfile={() => {
          setCurrentTab('profile');
          if (isMobileView) setIsSidebarVisible(false);
        }}
        onNavigateToNotifications={() => {
          setCurrentTab('notifications');
          if (isMobileView) setIsSidebarVisible(false);
        }}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
      />

      <div className="portal-body">
        {/* Mobile Backdrop Overlay */}
        {isMobileView && isSidebarVisible && (
          <div 
            className="sidebar-mobile-backdrop" 
            onClick={() => setIsSidebarVisible(false)}
            aria-label="Close menu"
          />
        )}

        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isMobileView={isMobileView}
          isOpenMobile={isSidebarVisible}
          onCloseMobile={() => setIsSidebarVisible(false)}
        />

        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleEnterPortal}
      />

      {/* Compulsory Onboarding Setup Gate for New Users */}
      {isProfileIncomplete && (
        <CompulsoryProfileSetupModal />
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PortalDataProvider>
          <PortalBackground />
          <PortalMain />
        </PortalDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
// Force Vite HMR
