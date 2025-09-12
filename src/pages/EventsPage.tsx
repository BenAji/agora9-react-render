import React from 'react';
import { Calendar, MapPin, Users, Star } from 'lucide-react';

interface EventsPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Calendar size={80} />
        </div>
        <h1>Events Coming Soon</h1>
        <p>We're building an incredible events platform. Get ready for something amazing!</p>
        
        <div className="feature-preview">
          <h3>What to expect:</h3>
          <div className="feature-list">
            <div className="feature-item">
              <MapPin size={20} />
              <span>Event discovery and filtering</span>
            </div>
            <div className="feature-item">
              <Users size={20} />
              <span>Networking and connections</span>
            </div>
            <div className="feature-item">
              <Star size={20} />
              <span>Personalized recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;

