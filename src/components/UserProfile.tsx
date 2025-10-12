import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Users, Settings, Camera, Check } from 'lucide-react';
import { UserWithSubscriptions } from '../types/database';
import { apiClient } from '../utils/apiClient';

interface UserProfileProps {
  user: UserWithSubscriptions;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: UserWithSubscriptions) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'activity'>('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user.full_name,
    email: user.email
  });

  // Real activity stats from API
  const [activityStats, setActivityStats] = useState({
    subscriptions: user.subscriptions?.length || 0,
    eventsAttended: 0,
    memberSince: new Date(user.created_at || Date.now())
  });

  // Load real activity stats
  useEffect(() => {
    const loadActivityStats = async () => {
      try {
        // Get user's accepted event responses and subscription summary
        const [eventsResponse, subscriptionResponse] = await Promise.all([
          apiClient.getEvents(),
          apiClient.getSubscriptionSummary(user.id)
        ]);
        
        if (eventsResponse.success) {
          const acceptedEvents = eventsResponse.data.events.filter(event => 
            event.user_rsvp_status === 'accepted'
          );
          setActivityStats(prev => ({
            ...prev,
            eventsAttended: acceptedEvents.length
          }));
        }

        if (subscriptionResponse.success) {
          setActivityStats(prev => ({
            ...prev,
            subscriptions: subscriptionResponse.data.active_subscriptions
          }));
        }
      } catch (error) {
        console.error('Failed to load activity stats:', error);
      }
    };

    loadActivityStats();
  }, [user.id]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.updateUser(user.id, {
        full_name: profileForm.full_name
      } as any);
      
      if (response.success) {
        onUserUpdate(response.data as any);
        setError(null);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
          {error && (
            <div className="profile-error">
              {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-tab-content">
              {/* Profile Header Section */}
              <div className="profile-section">
                <div className="profile-avatar-section">
                  <div className="profile-avatar-large">
                    {user.full_name ? 
                      user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                      'U'
                    }
                  </div>
                  <button className="change-avatar-button">
                    <Camera size={16} />
                    Change Photo
                    <span className="coming-soon-badge">Coming Soon</span>
                  </button>
                </div>
                <div className="profile-info">
                  <h3>{user.full_name}</h3>
                  <p>{user.email}</p>
                  <span className="user-role-badge">{user.role}</span>
                  <p className="member-since">
                    Member since {activityStats.memberSince.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="profile-section">
                <h4>Personal Information</h4>
                <div className="profile-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="profile-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="profile-input disabled"
                    />
                    <p className="input-help">Email cannot be changed</p>
                  </div>
                  
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user.role}
                      disabled
                      className="profile-input disabled"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <h4>Activity Stats</h4>
                <div className="activity-stats">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Users size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{activityStats.subscriptions}</div>
                      <div className="stat-label">Subscriptions</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{activityStats.eventsAttended}</div>
                      <div className="stat-label">Events Attended</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <User size={24} />
                    </div>
                    <div className="stat-content">
                  <div className="stat-text">
                    {activityStats.memberSince.toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                      <div className="stat-label">Member Since</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <h4>Preferences</h4>
                <div className="preferences-content">
                  <div className="coming-soon-section">
                    <Settings size={32} />
                    <h5>Preferences Coming Soon</h5>
                    <p>We're working on bringing you customizable preferences for notifications, timezone, and more.</p>
                  </div>
                  
                  <div className="preference-item disabled">
                    <div className="preference-info">
                      <h6>Email Notifications</h6>
                      <p>Receive email updates about events and subscriptions</p>
                    </div>
                    <div className="preference-toggle disabled">
                      <input type="checkbox" disabled />
                    </div>
                  </div>
                  
                  <div className="preference-item disabled">
                    <div className="preference-info">
                      <h6>Timezone</h6>
                      <p>Set your preferred timezone for event times</p>
                    </div>
                    <div className="preference-select disabled">
                      <select disabled>
                        <option>UTC-5 (EST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <button
            onClick={onClose}
            className="profile-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="profile-save-button"
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Updating...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default UserProfile;