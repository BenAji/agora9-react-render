/**
 * AGORA Investment Calendar - Main App Component
 * Modular page-based architecture with React Router
 */

import React, { useState, useEffect } from 'react';
import { HashRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

// Components
import GlobalHeader from './components/GlobalHeader';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import CalendarPage from './pages/CalendarPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SettingsPage from './pages/SettingsPage';
import UserProfile from './components/UserProfile';
import { OutlookLayout, HideInOutlook } from './components/OutlookLayout';

// Context
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { useOfficeContext } from './outlook/OfficeContext';

// Utils
import { supabase } from './lib/supabase';

interface AppProps {
  authUser?: any;
  onLogout?: () => void;
}

const App: React.FC<AppProps> = ({ authUser, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { isOutlook, isInitialized: officeInitialized } = useOfficeContext();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email || '',
          role: user.user_metadata?.role || 'user',
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at || user.created_at),
          is_active: true,
          preferences: {},
          subscriptions: [],
          managed_users: []
        });
      }
      setLoadingUser(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          created_at: new Date(session.user.created_at),
          updated_at: new Date(session.user.updated_at || session.user.created_at),
          is_active: true,
          preferences: {},
          subscriptions: [],
          managed_users: []
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const redirectToCalendar = () => {
    // Always land on calendar after auth
    // For MemoryRouter in Outlook, we'll handle this via route state
    // For HashRouter in web, use hash navigation
    if (!isOutlook) {
      if (window.location.hash !== '#/calendar') {
        window.location.hash = '#/calendar';
      }
    }
    // MemoryRouter navigation is handled by React Router internally
  };

  const handleLoginSuccess = (user: any) => {
    // Set user immediately and send to calendar
    if (user) {
      setCurrentUser({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || '',
        role: user.user_metadata?.role || 'user',
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at || user.created_at),
        is_active: true,
        preferences: {},
        subscriptions: [],
        managed_users: []
      });
    }
    redirectToCalendar();
  };

  const handleSignupSuccess = () => {
    redirectToCalendar();
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  if (loadingUser) {
    return <div className="loading-state">Loading user session...</div>;
  }

  // Use MemoryRouter in Outlook (no History API usage, perfect for iframes)
  // Use HashRouter for regular web browsers (still works without History API issues)
  // MemoryRouter stores routes in memory only, no URL changes, perfect for Outlook
  const RouterComponent = isOutlook ? MemoryRouter : HashRouter;

  // Custom redirect component that uses hash navigation (avoids Navigate which may use replaceState)
  const HashRedirect: React.FC<{ to: string }> = ({ to }) => {
    useEffect(() => {
      // Remove leading # if present, then add it back to ensure consistent format
      const cleanPath = to.startsWith('#') ? to.slice(1) : to;
      const targetHash = `#${cleanPath}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }, [to]);
    return null;
  };

  if (!currentUser) {
    return isOutlook ? (
      <MemoryRouter initialEntries={['/login']} initialIndex={0}>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
            <Route path="*" element={<HashRedirect to="/login" />} />
          </Routes>
        </div>
      </MemoryRouter>
    ) : (
      <HashRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
            <Route path="*" element={<HashRedirect to="/login" />} />
          </Routes>
        </div>
      </HashRouter>
    );
  }

  return isOutlook ? (
    <MemoryRouter initialEntries={['/calendar']} initialIndex={0}>
      <OutlookLayout>
      <div className="app-container">
          {/* Hide GlobalHeader in Outlook - Outlook provides its own navigation */}
          <HideInOutlook>
        <GlobalHeader 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onProfileClick={() => setShowProfile(true)}
          onManageSubscriptionsClick={() => {
            // Navigate to subscriptions page
            if (!isOutlook) {
              window.location.hash = '#/subscriptions';
            }
            // For MemoryRouter in Outlook, this will need to use navigate hook
          }}
        />
          </HideInOutlook>
        
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<HashRedirect to="/calendar" />} />
            <Route 
              path="/subscriptions" 
              element={
                <SubscriptionManagementPage 
                  currentUser={currentUser}
                />
              } 
            />
              <Route 
                path="/settings" 
                element={
                  <SettingsPage 
                    currentUser={currentUser}
                  />
                } 
              />
            <Route 
              path="/calendar" 
              element={
                <CalendarPage 
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/events" 
              element={
                <EventsPage 
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
          </Routes>
        </SubscriptionProvider>

          {/* User Profile Drawer - Hide in Outlook */}
        {currentUser && (
            <HideInOutlook>
          <UserProfile
            user={currentUser}
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onUserUpdate={handleUserUpdate}
          />
            </HideInOutlook>
        )}
      </div>
      </OutlookLayout>
    </MemoryRouter>
  ) : (
    <HashRouter>
      <OutlookLayout>
      <div className="app-container">
          {/* Hide GlobalHeader in Outlook - Outlook provides its own navigation */}
          <HideInOutlook>
        <GlobalHeader 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onProfileClick={() => setShowProfile(true)}
          onManageSubscriptionsClick={() => {
            // Navigate to subscriptions page
            if (!isOutlook) {
              window.location.hash = '#/subscriptions';
            }
            // For MemoryRouter in Outlook, this will need to use navigate hook
          }}
        />
          </HideInOutlook>
        
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<HashRedirect to="/calendar" />} />
            <Route 
              path="/subscriptions" 
              element={
                <SubscriptionManagementPage 
                  currentUser={currentUser}
                />
              } 
            />
              <Route 
                path="/settings" 
                element={
                  <SettingsPage 
                    currentUser={currentUser}
                  />
                } 
              />
            <Route 
              path="/calendar" 
              element={
                <CalendarPage 
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/events" 
              element={
                <EventsPage 
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              } 
            />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
          </Routes>
        </SubscriptionProvider>

          {/* User Profile Drawer - Hide in Outlook */}
        {currentUser && (
            <HideInOutlook>
          <UserProfile
            user={currentUser}
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onUserUpdate={handleUserUpdate}
          />
            </HideInOutlook>
        )}
      </div>
      </OutlookLayout>
    </HashRouter>
  );
};

export default App;
