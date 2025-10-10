/**
 * AGORA Calendar Page
 * 
 * PHASE 4: Calendar page with error boundary protection
 * Dependencies: CalendarLayout component, ErrorBoundary
 * Purpose: Main calendar page with API integration and error handling
 * 
 * SAFETY: Uses ErrorBoundary to prevent crashes, API with fallbacks
 */

import React from 'react';
import CalendarLayout from '../components/calendar/CalendarLayout';
import ErrorBoundary from '../components/ErrorBoundary';

interface CalendarPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser, onLogout }) => {
  const handleCalendarError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, you might want to send this to an error tracking service
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--primary-bg)', 
      minHeight: '100vh' 
    }}>
      <ErrorBoundary 
        onError={handleCalendarError}
        fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem'
          }}>
            <div style={{
              textAlign: 'center',
              backgroundColor: 'var(--secondary-bg)',
              padding: '3rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              maxWidth: '500px'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: 'var(--primary-text)'
              }}>
                Calendar Temporarily Unavailable
              </h2>
              <p style={{ 
                color: 'var(--muted-text)', 
                marginBottom: '2rem',
                lineHeight: '1.5'
              }}>
                We're having trouble loading your calendar. This might be due to a network issue or temporary service interruption.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--primary-bg)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reload Calendar
              </button>
            </div>
          </div>
        }
      >
        <CalendarLayout />
      </ErrorBoundary>
    </div>
  );
};

export default CalendarPage;

