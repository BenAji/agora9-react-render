import React from 'react';
import { User, Shield, Bell, Building2 } from 'lucide-react';

interface SettingsSideNavProps {
  activeSection: 'profile' | 'account' | 'notifications' | 'subscriptions';
  onSectionChange: (section: 'profile' | 'account' | 'notifications' | 'subscriptions') => void;
}

const SettingsSideNav: React.FC<SettingsSideNavProps> = ({ activeSection, onSectionChange }) => {
  const navItems = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'account' as const, label: 'Account & Security', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'subscriptions' as const, label: 'Billing and Subscriptions', icon: Building2 },
  ];

  return (
    <nav style={{
      width: '240px',
      backgroundColor: 'var(--secondary-bg)',
      borderRadius: '12px',
      padding: '1rem',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: '2rem'
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
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
              color: isActive ? 'var(--primary-bg)' : 'var(--primary-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9375rem',
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
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsSideNav;

