/**
 * AGORA Investment Calendar - Main App Component
 * Modular page-based architecture with React Router
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import GlobalHeader from './components/GlobalHeader';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import CalendarPage from './pages/CalendarPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserProfile from './components/UserProfile';

// Context
import { SubscriptionProvider } from './contexts/SubscriptionContext';

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

  const handleLoginSuccess = () => {};
  const handleSignupSuccess = () => {};
  
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

  if (!currentUser) {
    return (
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => {}} />} />
            <Route path="/signup" element={<SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => {}} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <GlobalHeader 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onProfileClick={() => setShowProfile(true)}
          onManageSubscriptionsClick={() => {
            // Navigate to subscriptions page
            window.location.href = '/subscriptions';
          }}
        />
        
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

        {/* User Profile Drawer */}
        {currentUser && (
          <UserProfile
            user={currentUser}
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>
    </Router>
  );
};

export default App;
