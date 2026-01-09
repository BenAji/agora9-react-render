import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginForm>>({});

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<LoginForm> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Update last login in our users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);

        if (updateError) {
          // Non-critical error, don't block login
        }

        onLoginSuccess(authData.user);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--primary-bg)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '320px',
        backgroundColor: 'var(--secondary-bg)',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--accent-color)',
            marginBottom: '0.5rem'
          }}>
            AGORA
          </div>
          <h1 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--primary-text)',
            margin: '0 0 0.5rem 0'
          }}>
            Welcome back
          </h1>
          <p style={{
            color: 'var(--secondary-text)',
            fontSize: '11px',
            margin: 0
          }}>
            Sign in to access your investment events
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-color)',
            padding: '0.625rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '12px',
            border: '1px solid var(--error-color)'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.375rem'
            }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)'
                }}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.625rem 0.625rem 2.25rem',
                  border: `1px solid ${validationErrors.email ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  if (!validationErrors.email) {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.email) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              />
            </div>
            {validationErrors.email && (
              <p style={{
                color: 'var(--error-color)',
                fontSize: '11px',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.375rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.625rem 2.25rem 0.625rem 2.25rem',
                  border: `1px solid ${validationErrors.password ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  if (!validationErrors.password) {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.password) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-text)',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validationErrors.password && (
              <p style={{
                color: 'var(--error-color)',
                fontSize: '11px',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div style={{ 
            textAlign: 'right', 
            marginBottom: '1.25rem' 
          }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.75rem'
              }}
              onClick={() => {
                // TODO: Implement forgot password functionality
                // For now, show a proper message or redirect to support
                window.location.href = 'mailto:support@agora.com?subject=Forgot Password Request';
              }}
            >
              Forgot your password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: loading ? 'var(--disabled-bg)' : 'var(--accent-color)',
              color: loading ? 'var(--disabled-text)' : 'var(--primary-bg)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-color)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={14} />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '12px'
        }}>
          <span style={{ color: 'var(--secondary-text)' }}>
            Don't have an account?{' '}
          </span>
          <button
            onClick={onSwitchToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit'
            }}
          >
            Sign up here
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
