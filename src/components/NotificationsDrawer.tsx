import React, { useState } from 'react';
import { X, Bell, Mail, Smartphone, Calendar, Settings as SettingsIcon } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    weeklyDigest: false
  });

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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
            <Bell size={24} style={{ color: 'var(--accent-bg)' }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              margin: 0
            }}>Notifications</h2>
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
          {/* Notification Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Email Notifications */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={20} style={{ color: 'var(--muted-text)' }} />
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--primary-text)' 
                  }}>Email Notifications</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--muted-text)' 
                  }}>Receive notifications via email</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleSettingChange('emailNotifications')}
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  accentColor: 'var(--accent-bg)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Push Notifications */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Smartphone size={20} style={{ color: 'var(--muted-text)' }} />
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--primary-text)' 
                  }}>Push Notifications</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--muted-text)' 
                  }}>Receive push notifications in browser</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={() => handleSettingChange('pushNotifications')}
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  accentColor: 'var(--accent-bg)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Event Reminders */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={20} style={{ color: 'var(--muted-text)' }} />
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--primary-text)' 
                  }}>Event Reminders</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--muted-text)' 
                  }}>Get reminded before events start</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.eventReminders}
                onChange={() => handleSettingChange('eventReminders')}
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  accentColor: 'var(--accent-bg)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Weekly Digest */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <SettingsIcon size={20} style={{ color: 'var(--muted-text)' }} />
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--primary-text)' 
                  }}>Weekly Digest</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--muted-text)' 
                  }}>Receive weekly summary of events</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.weeklyDigest}
                onChange={() => handleSettingChange('weeklyDigest')}
                style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  accentColor: 'var(--accent-bg)',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: 'var(--tertiary-bg)', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Bell size={16} style={{ color: 'var(--accent-bg)' }} />
              <span style={{ 
                fontWeight: '600', 
                color: 'var(--primary-text)',
                fontSize: '0.875rem'
              }}>
                Features Coming Soon
              </span>
            </div>
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--muted-text)', 
              margin: 0,
              lineHeight: '1.5'
            }}>
              💡 Advanced notification settings including custom timing, 
              event type filtering, and mobile app notifications will be 
              available in future updates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--secondary-bg)'
        }}>
          <button
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--accent-bg)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#d4af37';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-bg)';
            }}
            onClick={() => {
              // TODO: Save notification preferences
              onClose();
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationsDrawer;
