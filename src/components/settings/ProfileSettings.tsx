import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface ProfileSettingsProps {
  currentUser: any;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser }) => {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
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
      }}>Profile information</h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
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
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
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

        {/* Address Section */}
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
            Street address
          </label>
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Enter street address"
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              marginBottom: '0.875rem'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-bg)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '0.375rem'
              }}>
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
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
            <div style={{ flex: '1 1 150px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '0.375rem'
              }}>
                State/Province
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state or province"
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
            <div style={{ flex: '1 1 120px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '0.375rem'
              }}>
                Postal code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter postal code"
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
          </div>
        </div>

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

export default ProfileSettings;

