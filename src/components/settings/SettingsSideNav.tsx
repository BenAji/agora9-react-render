import React from 'react';
import { User, Shield, Bell, Building2 } from 'lucide-react';

interface SettingsSideNavProps {
  activeSection: 'profile' | 'account' | 'notifications' | 'subscriptions';
  onSectionChange: (section: 'profile' | 'account' | 'notifications' | 'subscriptions') => void;
}

const SettingsSideNav: React.FC<SettingsSideNavProps> = ({ activeSection, onSectionChange }) => {
  const navItems = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'account' as const, label: 'Account & security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'subscriptions' as const, label: 'Billing and subscriptions', icon: Building2 },
  ];

  return (
    <nav style={{
      width: '200px',
      backgroundColor: 'var(--secondary-bg)',
      borderRadius: '12px',
      padding: '0.875rem',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: '1.25rem'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.875rem',
              marginBottom: '0.375rem',
              backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
              color: isActive ? 'var(--primary-bg)' : 'var(--primary-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsSideNav;

