import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';

interface SubscriptionSettingsProps {
  currentUser: any;
}

const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({ currentUser }) => {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [billingEmail, setBillingEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Hook up to billing API
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--primary-text)',
        marginBottom: '0.75rem'
      }}>Billing</h2>
      <p style={{
        color: 'var(--muted-text)',
        marginBottom: '1.5rem'
      }}>
        Add or update your billing credentials used for subscriptions.
      </p>

      {/* Billing Credentials Card */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.4rem'
            }}>Cardholder Name</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.4rem'
            }}>Card Number</label>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="•••• •••• •••• ••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.4rem'
            }}>Expiry</label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.4rem'
            }}>CVC</label>
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="123"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '0.4rem'
            }}>Billing Email</label>
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-bg)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: isSaving ? 'var(--disabled-bg)' : 'var(--accent-bg)',
              color: isSaving ? 'var(--disabled-text)' : 'var(--primary-bg)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9375rem',
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
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Billing'}
          </button>
        </div>
      </div>

      {/* Link to existing subscriptions page */}
      <div style={{
        padding: '1.25rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <p style={{
          color: 'var(--muted-text)',
          marginBottom: '1.5rem'
        }}>
          Need to manage subscription plans and preferences?
        </p>
        <Link
          to="/subscriptions"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--primary-bg)',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: '600',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Go to Subscriptions
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionSettings;

