import React, { useState } from 'react';

interface NotificationsSettingsProps {
  currentUser: any;
}

const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({ currentUser }) => {
  const [dailyEmail, setDailyEmail] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const handleToggle = (type: 'daily' | 'weekly' | 'sms') => {
    switch (type) {
      case 'daily':
        setDailyEmail(!dailyEmail);
        break;
      case 'weekly':
        setWeeklySummary(!weeklySummary);
        break;
      case 'sms':
        setSmsAlerts(!smsAlerts);
        break;
    }
  };

  return (
    <div>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--primary-text)',
        marginBottom: '1.5rem'
      }}>Notification Preferences</h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Daily Email Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.25rem'
            }}>Daily Email</div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--muted-text)'
            }}>Receive daily email updates about your events</div>
          </div>
          <button
            onClick={() => handleToggle('daily')}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: dailyEmail ? 'var(--accent-bg)' : 'var(--border-color)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '2px',
              left: dailyEmail ? '26px' : '2px',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }} />
          </button>
        </div>

        {/* Weekly Summary Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.25rem'
            }}>Weekly Summary Email</div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--muted-text)'
            }}>Receive a weekly summary of all events</div>
          </div>
          <button
            onClick={() => handleToggle('weekly')}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: weeklySummary ? 'var(--accent-bg)' : 'var(--border-color)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '2px',
              left: weeklySummary ? '26px' : '2px',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }} />
          </button>
        </div>

        {/* SMS Alerts Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.25rem'
            }}>Text/SMS Alerts</div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--muted-text)'
            }}>Receive text message alerts for important events</div>
          </div>
          <button
            onClick={() => handleToggle('sms')}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: smsAlerts ? 'var(--accent-bg)' : 'var(--border-color)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '2px',
              left: smsAlerts ? '26px' : '2px',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;

