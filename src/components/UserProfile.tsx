import React, { useState } from 'react';
import { X, User, Calendar, Settings } from 'lucide-react';
import { UserWithSubscriptions } from '../types/database';

interface UserProfileProps {
  user: UserWithSubscriptions;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: UserWithSubscriptions) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'activity'>('profile');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="profile-backdrop"
        onClick={onClose}
      />
      
      {/* Right-side Drawer */}
      <div className="profile-drawer">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <User size={24} className="profile-header-icon" />
            <h2>Profile Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="profile-close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            Profile
          </button>
          <button 
            className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Calendar size={16} />
            Activity
          </button>
          <button 
            className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Settings size={16} />
            Preferences
          </button>
        </div>

        {/* Content */}
        <div className="profile-content">

          {activeTab === 'profile' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <div className="coming-soon-section">
                  <User size={48} className="coming-soon-icon" />
                  <h4>Profile Settings</h4>
                  <p>Advanced profile customization features are coming soon!</p>
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <div className="coming-soon-section">
                  <Calendar size={48} className="coming-soon-icon" />
                  <h4>Activity Tracking</h4>
                  <p>Detailed activity analytics and insights are coming soon!</p>
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <div className="coming-soon-section">
                  <Settings size={48} className="coming-soon-icon" />
                  <h4>User Preferences</h4>
                  <p>Customizable settings for notifications, timezone, and more are coming soon!</p>
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <button
            onClick={onClose}
            className="profile-close-button-full"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default UserProfile;