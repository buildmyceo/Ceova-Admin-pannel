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

import { AuthModal } from './components/AuthModal';
import { LoginPage } from './views/LoginPage';
import { PortalBackground } from './components/PortalBackground';
import { CompulsoryProfileSetupModal } from './components/CompulsoryProfileSetupModal';
import { SetPasswordModal } from './components/SetPasswordModal';
import { BlockedAccountView } from './components/BlockedAccountView';
import { InAppNotificationBanner } from './components/InAppNotificationBanner';
import { initRealtimeNotifications } from './lib/notificationsService';

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

  const { logout, user, isLoading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  // Listen to live realtime notifications across team members and devices
  React.useEffect(() => {
    initRealtimeNotifications(user);
  }, [user]);

  // Compulsory onboarding setup gate: photo and phone number are strictly mandatory
  const isProfileIncomplete = Boolean(
    user && (
      user.status === 'pending' ||
      !user.avatar_url ||
      !user.avatar_url.trim() ||
      !user.phone ||
      user.phone.replace(/\D/g, '').length < 7
    )
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

  // Elegant splash screen during initial authentication/PKCE token exchange
  if (isLoading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080b11',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            background: '#161618',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            marginBottom: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <img
            src="/ceovaimage.png"
            alt="CEOVA Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'invert(1)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff', marginBottom: 6 }}>
          CEOVA PORTAL
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Verifying workspace session...
        </div>
      </div>
    );
  }

  // If viewing the Login Gateway Screen first
  if (!user) {
    return (
      <div className="login-gateway-container">
        <LoginPage
          onLoginSuccess={handleEnterPortal}
        />
        {isPasswordRecovery && (
          <SetPasswordModal
            isOpen={isPasswordRecovery}
            onClose={() => setIsPasswordRecovery(false)}
          />
        )}
      </div>
    );
  }

  // If account has been blocked or paused by administrator, lock screen immediately
  if (user && (user.status === 'blocked' || user.status === 'paused')) {
    return <BlockedAccountView />;
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

      {/* Set Password / Account Activation Gate */}
      {isPasswordRecovery && (
        <SetPasswordModal
          isOpen={isPasswordRecovery}
          onClose={() => setIsPasswordRecovery(false)}
        />
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
          <InAppNotificationBanner />
        </PortalDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
// Force Vite HMR
