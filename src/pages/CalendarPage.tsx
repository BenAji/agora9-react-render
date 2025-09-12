import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';

interface CalendarPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Calendar size={80} />
        </div>
        <h1>Calendar Coming Soon</h1>
        <p>We're working hard to bring you an amazing calendar experience. Stay tuned!</p>
        
        <div className="feature-preview">
          <h3>What to expect:</h3>
          <div className="feature-list">
            <div className="feature-item">
              <Clock size={20} />
              <span>Event scheduling and management</span>
            </div>
            <div className="feature-item">
              <Users size={20} />
              <span>Team collaboration tools</span>
            </div>
            <div className="feature-item">
              <Calendar size={20} />
              <span>Advanced calendar views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
