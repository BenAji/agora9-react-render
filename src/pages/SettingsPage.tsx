import React, { useState } from 'react';
import SettingsSideNav from '../components/settings/SettingsSideNav';
import ProfileSettings from '../components/settings/ProfileSettings';
import AccountSecuritySettings from '../components/settings/AccountSecuritySettings';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import SubscriptionSettings from '../components/settings/SubscriptionSettings';


interface SettingsPageProps {
  currentUser: any;
}

type SettingsSection = 'profile' | 'account' | 'notifications' | 'subscriptions';

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings currentUser={currentUser} />;
      case 'account':
        return <AccountSecuritySettings currentUser={currentUser} />;
      case 'notifications':
        return <NotificationsSettings currentUser={currentUser} />;
      case 'subscriptions':
        return <SubscriptionSettings currentUser={currentUser} />;
      default:
        return <ProfileSettings currentUser={currentUser} />;
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--primary-bg)', 
      minHeight: '100vh', 
      color: 'var(--primary-text)',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem' 
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: 'bold', 
            color: 'var(--primary-text)', 
            marginBottom: '0.5rem' 
          }}>Settings</h1>
          <p style={{ 
            color: 'var(--muted-text)', 
            fontSize: '1.125rem'
          }}>Manage your account settings and preferences</p>
        </div>

        {/* Settings Layout */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          {/* Side Navigation */}
          <SettingsSideNav 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Content Area */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--secondary-bg)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
