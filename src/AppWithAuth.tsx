import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import App from './App';

interface AuthState {
  user: any | null;
  loading: boolean;
  showLogin: boolean;
}

const AppWithAuth: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    showLogin: false
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState({
        user: session?.user || null,
        loading: false,
        showLogin: !session?.user
      });
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthState({
        user: session?.user || null,
        loading: false,
        showLogin: !session?.user
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });
      
      if (error) {
        setLoginError(error.message);
      } else if (data.user) {
        // Success - the auth state change will be handled by the listener
        console.log('Login successful for:', data.user.email);
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSkipAuth = () => {
    setAuthState(prev => ({ ...prev, showLogin: false, user: { email: 'demo-mode' } }));
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

  if (authState.showLogin) {
    return (
      <div className="login-form-container">
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          {/* Header Section */}
          <div className="login-header">
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              backgroundColor: 'var(--accent-bg)', 
              borderRadius: '50%', 
              margin: '0 auto 1rem auto', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ color: 'var(--primary-bg)', fontWeight: 'bold', fontSize: '1.5rem' }}>A</span>
            </div>
            <h1>AGORA</h1>
            <h2 style={{ color: 'var(--secondary-text)', fontSize: '1.125rem', fontWeight: '500', letterSpacing: '0.05em' }}>
              EVENT COORDINATION PLATFORM
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Professional event coordination platform for investment analysts
            </p>
          </div>

          {/* Login Form Container */}
          <div className="login-form">
            {/* Tab Headers */}
            <div style={{ display: 'flex', marginBottom: '2rem' }}>
              <button style={{ 
                flex: 1, 
                backgroundColor: 'var(--accent-bg)', 
                color: 'var(--primary-bg)', 
                padding: '0.75rem 1rem', 
                borderTopLeftRadius: '8px',
                border: 'none',
                fontWeight: '500'
              }}>
                Login
              </button>
              <button style={{ 
                flex: 1, 
                backgroundColor: 'var(--tertiary-bg)', 
                color: 'var(--muted-text)', 
                padding: '0.75rem 1rem', 
                borderTopRightRadius: '8px',
                border: 'none',
                fontWeight: '500'
              }}>
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div>
              <h3 style={{ color: 'var(--primary-text)', fontSize: '1.25rem', fontWeight: '500', marginBottom: '1.5rem' }}>Welcome Back</h3>
              
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {loginError && (
                  <div className="error-message">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: '#dc3545', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{loginError}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    placeholder="Enter your email"
                    disabled={isLoggingIn}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="form-input"
                      style={{ paddingRight: '3rem' }}
                      placeholder="Enter your password"
                      disabled={isLoggingIn}
                      required
                    />
                    <button
                      type="button"
                      style={{ 
                        position: 'absolute', 
                        right: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--faded-text)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer' 
                      }}
                    >
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn btn-primary btn-full"
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <svg style={{ 
                        width: '1.25rem', 
                        height: '1.25rem', 
                        animation: 'spin 1s linear infinite' 
                      }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faded-text)', fontSize: '0.875rem' }}>
              <div style={{ 
                width: '1rem', 
                height: '1rem', 
                backgroundColor: 'var(--accent-bg)', 
                borderRadius: '50%', 
                marginRight: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ color: 'var(--primary-bg)', fontWeight: 'bold', fontSize: '0.75rem' }}>A</span>
              </div>
              © 2026 AGORA. All rights reserved.
            </div>
          </div>

          {/* Quick Login Section */}
          <div className="demo-credentials" style={{ marginTop: '2rem' }}>
            <h4 style={{ color: 'var(--accent-bg)', fontWeight: '500', marginBottom: '0.75rem', textAlign: 'center' }}>
              💻 Quick Login - Database Accounts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setLoginForm({ email: 'analyst1@agora.com', password: 'password123' })}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--tertiary-bg)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--primary-text)', fontSize: '0.875rem', fontWeight: '500' }}>👨‍💼 John Smith (Analyst)</div>
                    <div style={{ color: 'var(--muted-text)', fontSize: '0.75rem' }}>analyst1@agora.com</div>
                  </div>
                  <div style={{ color: 'var(--accent-bg)', fontSize: '0.75rem', fontWeight: '500' }}>Click to use</div>
                </div>
              </button>
              
              <button
                onClick={() => setLoginForm({ email: 'analyst2@agora.com', password: 'password123' })}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--tertiary-bg)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--primary-text)', fontSize: '0.875rem', fontWeight: '500' }}>👩‍💼 Sarah Johnson (Analyst)</div>
                    <div style={{ color: 'var(--muted-text)', fontSize: '0.75rem' }}>analyst2@agora.com</div>
                  </div>
                  <div style={{ color: 'var(--accent-bg)', fontSize: '0.75rem', fontWeight: '500' }}>Click to use</div>
                </div>
              </button>

              <button
                onClick={() => setLoginForm({ email: 'ea1@agora.com', password: 'password123' })}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--tertiary-bg)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--primary-text)', fontSize: '0.875rem', fontWeight: '500' }}>👩‍💻 Emma Wilson (EA)</div>
                    <div style={{ color: 'var(--muted-text)', fontSize: '0.75rem' }}>ea1@agora.com</div>
                  </div>
                  <div style={{ color: 'var(--accent-bg)', fontSize: '0.75rem', fontWeight: '500' }}>Click to use</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
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