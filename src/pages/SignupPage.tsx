import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'investment_analyst' | 'executive_assistant';
}

interface SignupPageProps {
  onSignupSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'investment_analyst'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<SignupForm>>({});

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<SignupForm> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            is_active: true,
            preferences: {},
            last_login: new Date().toISOString()
          });

        if (profileError) {
          // Note: User is created in auth but profile creation failed
          // You might want to handle this case differently
        }

        onSignupSuccess(authData.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
        maxWidth: '480px',
        backgroundColor: 'var(--secondary-bg)',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--accent-color)',
            marginBottom: '0.5rem'
          }}>
            AGORA
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--primary-text)',
            margin: '0 0 0.5rem 0'
          }}>
            Create Your Account
          </h1>
          <p style={{
            color: 'var(--secondary-text)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Join AGORA to access premium investment events and insights
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-color)',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            border: '1px solid var(--error-color)'
          }}>
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup}>
          {/* Full Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)'
                }}
              />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  border: `1px solid ${validationErrors.fullName ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  if (!validationErrors.fullName) {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.fullName) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              />
            </div>
            {validationErrors.fullName && (
              <p style={{
                color: 'var(--error-color)',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
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
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  border: `1px solid ${validationErrors.email ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
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
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              Role
            </label>
            <div style={{ position: 'relative' }}>
              <Briefcase
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)',
                  zIndex: 1
                }}
              />
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value as 'investment_analyst' | 'executive_assistant')}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="investment_analyst">Investment Analyst</option>
                <option value="executive_assistant">Executive Assistant</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                  border: `1px solid ${validationErrors.password ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
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
                  right: '12px',
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
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.password && (
              <p style={{
                color: 'var(--error-color)',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--secondary-text)'
                }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                  border: `1px solid ${validationErrors.confirmPassword ? 'var(--error-color)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  if (!validationErrors.confirmPassword) {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.confirmPassword) {
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p style={{
                color: 'var(--error-color)',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: loading ? 'var(--disabled-bg)' : 'var(--accent-color)',
              color: loading ? 'var(--disabled-text)' : 'var(--primary-bg)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
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
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <span style={{ color: 'var(--secondary-text)' }}>
            Already have an account?{' '}
          </span>
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit'
            }}
          >
            Sign in here
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

export default SignupPage;
