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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (authState.showLogin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-6">
              <span className="text-black font-bold text-2xl">A</span>
            </div>
            <h1 className="text-white text-4xl font-bold mb-2">AGORA</h1>
            <h2 className="text-yellow-500 text-lg font-medium tracking-wide">EVENT COORDINATION PLATFORM</h2>
            <p className="text-gray-400 text-sm mt-2">Professional event coordination platform for investment analysts</p>
          </div>

          {/* Login Form Container */}
          <div className="bg-gray-800 rounded-lg shadow-xl">
            {/* Tab Headers */}
            <div className="flex">
              <button className="flex-1 bg-yellow-500 text-black py-3 px-4 rounded-tl-lg font-medium">
                Login
              </button>
              <button className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-tr-lg font-medium">
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <h3 className="text-white text-xl font-medium mb-6">Welcome Back</h3>
              
              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && (
                  <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-300 text-sm">{loginError}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    disabled={isLoggingIn}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter your password"
                      disabled={isLoggingIn}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoggingIn ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          <div className="text-center mt-8">
            <div className="flex items-center justify-center text-gray-500 text-sm">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2 flex items-center justify-center">
                <span className="text-black font-bold text-xs">A</span>
              </div>
              © 2026 AGORA. All rights reserved.
            </div>
          </div>

          {/* Quick Login Section */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-yellow-500 font-medium mb-3 text-center">💻 Quick Login - Database Accounts</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setLoginForm({ email: 'analyst1@agora.com', password: 'password123' })}
                className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm font-medium">👨‍💼 John Smith (Analyst)</div>
                    <div className="text-gray-400 text-xs">analyst1@agora.com</div>
                  </div>
                  <div className="text-yellow-500 text-xs font-medium">Click to use</div>
                </div>
              </button>
              
              <button
                onClick={() => setLoginForm({ email: 'analyst2@agora.com', password: 'password123' })}
                className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm font-medium">👩‍💼 Sarah Johnson (Analyst)</div>
                    <div className="text-gray-400 text-xs">analyst2@agora.com</div>
                  </div>
                  <div className="text-yellow-500 text-xs font-medium">Click to use</div>
                </div>
              </button>

              <button
                onClick={() => setLoginForm({ email: 'ea1@agora.com', password: 'password123' })}
                className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm font-medium">👩‍💻 Emma Wilson (EA)</div>
                    <div className="text-gray-400 text-xs">ea1@agora.com</div>
                  </div>
                  <div className="text-yellow-500 text-xs font-medium">Click to use</div>
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
      {authState.user && (
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <span className="text-white text-sm">
            {authState.user.email === 'demo-mode' ? 'Demo Mode (Mock Data)' : `Logged in as: ${authState.user.email}`}
          </span>
          <button
            onClick={authState.user.email === 'demo-mode' ? () => setAuthState(prev => ({ ...prev, showLogin: true, user: null })) : handleLogout}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            {authState.user.email === 'demo-mode' ? 'Back to Login' : 'Logout'}
          </button>
        </div>
      )}
      <App />
    </div>
  );
};

export default AppWithAuth;