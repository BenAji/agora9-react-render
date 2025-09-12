/**
 * AGORA Calendar Page
 * 
 * PHASE 1, STEP 1.3: Updated to use CalendarLayout
 * Dependencies: CalendarLayout component
 * Purpose: Main calendar page with layout integration
 * 
 * SAFETY: Uses CalendarLayout with mock data only
 */

import React from 'react';
import CalendarLayout from '../components/calendar/CalendarLayout';

interface CalendarPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser, onLogout }) => {
  return (
    <div style={{ 
      backgroundColor: 'var(--primary-bg)', 
      minHeight: '100vh' 
    }}>
      <CalendarLayout />
    </div>
  );
};

export default CalendarPage;

