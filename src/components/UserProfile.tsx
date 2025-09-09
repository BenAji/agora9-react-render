import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { UserWithSubscriptions } from '../types/database';
import { apiClient } from '../utils/apiClient';

interface UserProfileProps {
  user: UserWithSubscriptions;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: UserWithSubscriptions) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user.full_name,
    email: user.email
  });

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.updateUser(user.id, {
        full_name: profileForm.full_name
      } as any);
      
      if (response.success) {
        onUserUpdate(response.data as any);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40
        }}
        onClick={onClose}
      />
      
      {/* Right-side Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '480px',
        backgroundColor: 'var(--primary-bg)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--secondary-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={24} style={{ color: 'var(--accent-bg)' }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              margin: 0
            }}>Profile Settings</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--muted-text)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
              (e.target as HTMLButtonElement).style.color = 'var(--primary-text)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.target as HTMLButtonElement).style.color = 'var(--muted-text)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          backgroundColor: 'var(--primary-bg)'
        }}>
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid #dc3545',
              color: '#dc3545',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Profile Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--primary-text)',
                marginBottom: '0.25rem'
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--accent-bg)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--border-color)';
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--primary-text)',
                marginBottom: '0.25rem'
              }}>
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--muted-text)',
                  fontSize: '0.875rem',
                  cursor: 'not-allowed'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--muted-text)',
                marginTop: '0.25rem',
                marginBottom: 0
              }}>
                Email cannot be changed
              </p>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--primary-text)',
                marginBottom: '0.25rem'
              }}>
                Role
              </label>
              <input
                type="text"
                value={user.role}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--muted-text)',
                  fontSize: '0.875rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--secondary-bg)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: 'var(--primary-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--accent-bg)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#d4af37';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-bg)';
              }
            }}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
};

export default UserProfile;