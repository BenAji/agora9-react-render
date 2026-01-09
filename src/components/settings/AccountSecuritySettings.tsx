import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface AccountSecuritySettingsProps {
  currentUser: any;
}

const AccountSecuritySettings: React.FC<AccountSecuritySettingsProps> = ({ currentUser }) => {
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save logic
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div>
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--primary-text)',
        marginBottom: '1rem'
      }}>Account & security</h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Update Email */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '0.375rem'
          }}>
            Update email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-bg)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>

        {/* Change Password */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '0.375rem'
          }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '0.625rem',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-bg)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-bg)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>

        {/* Save Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.875rem'
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.25rem',
              backgroundColor: isSaving ? 'var(--disabled-bg)' : 'var(--accent-bg)',
              color: isSaving ? 'var(--disabled-text)' : 'var(--primary-bg)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                (e.target as HTMLButtonElement).style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                (e.target as HTMLButtonElement).style.opacity = '1';
              }
            }}
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSecuritySettings;

