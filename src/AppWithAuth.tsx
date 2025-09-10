import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

interface AuthState {
  user: any | null;
  loading: boolean;
  showLogin: boolean;
  showSignup: boolean;
}

const AppWithAuth: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    showLogin: false,
    showSignup: false
  });

  // Auth handlers
  const handleLoginSuccess = (user: any) => {
    setAuthState({
      user,
      loading: false,
      showLogin: false,
      showSignup: false
    });
  };

  const handleSignupSuccess = (user: any) => {
    setAuthState({
      user,
      loading: false,
      showLogin: false,
      showSignup: false
    });
  };

  const handleSwitchToSignup = () => {
    setAuthState(prev => ({
      ...prev,
      showLogin: false,
      showSignup: true
    }));
  };

  const handleSwitchToLogin = () => {
    setAuthState(prev => ({
      ...prev,
      showLogin: true,
      showSignup: false
    }));
  };

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState({
        user: session?.user || null,
        loading: false,
        showLogin: !session?.user,
        showSignup: false
      });
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthState({
        user: session?.user || null,
        loading: false,
        showLogin: !session?.user,
        showSignup: false
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authState.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: 'var(--primary-bg)' 
      }}>
        <div style={{ color: 'var(--primary-text)' }}>Loading...</div>
      </div>
    );
  }

  if (authState.showSignup) {
    return (
      <SignupPage
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    );
  }

  if (authState.showLogin) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    );
  }

  return (
    <div>
      <App 
        authUser={authState.user}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AppWithAuth;