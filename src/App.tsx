/**
 * AGORA Investment Calendar - Main App Component
 * Modular page-based architecture with React Router
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

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
    if (window.location.pathname !== '/calendar') {
      window.location.replace('/calendar');
    }
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

  // Use HashRouter in Outlook (iframe context) to avoid History API restrictions
  // BrowserRouter works fine in regular web context
  const RouterComponent = isOutlook ? HashRouter : BrowserRouter;

  if (!currentUser) {
    return (
      <RouterComponent>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </RouterComponent>
    );
  }

  return (
    <RouterComponent>
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
            window.location.href = '/subscriptions';
          }}
        />
          </HideInOutlook>
        
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
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
    </RouterComponent>
  );
};

export default App;
