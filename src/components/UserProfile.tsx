import React, { useState, useEffect } from 'react';
import { X, User, Settings, Bell, CreditCard, Trash2 } from 'lucide-react';
import { UserWithSubscriptions } from '../types/database';
import { apiClient } from '../utils/apiClient';

interface UserProfileProps {
  user: UserWithSubscriptions;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: UserWithSubscriptions) => void;
}

interface SubscriptionData {
  id: string;
  subsector: string;
  payment_status: string;
  is_active: boolean;
  created_at: Date;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'notifications'>('profile');
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [availableSubsectors, setAvailableSubsectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user.full_name,
    email: user.email
  });

  useEffect(() => {
    if (isOpen) {
      loadUserSubscriptions();
      loadAvailableSubsectors();
    }
  }, [isOpen, user.id]);

  const loadUserSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserSubscriptions(user.id);
      if (response.success) {
        setSubscriptions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSubsectors = async () => {
    try {
      const response = await apiClient.getCompanies();
      if (response.success) {
        const companies = response.data.companies || [];
        const uniqueSubsectors = Array.from(new Set(companies.map((company: any) => company.gics_subsector)));
        setAvailableSubsectors(uniqueSubsectors);
      }
    } catch (error) {
      console.error('Failed to load subsectors:', error);
    }
  };

  const handleAddSubscription = async (subsector: string) => {
    try {
      setLoading(true);
      const response = await apiClient.createSubscription({
        user_id: user.id,
        gics_subsector: subsector
      } as any);
      
      if (response.success) {
        await loadUserSubscriptions();
        setError(null);
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
      setError('Failed to add subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.deleteSubscription(subscriptionId);
      
      if (response.success) {
        await loadUserSubscriptions();
        setError(null);
      }
    } catch (error) {
      console.error('Failed to remove subscription:', error);
      setError('Failed to remove subscription');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to update profile:', error);
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
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-400"
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Current Subscriptions</h3>
                  
                  {subscriptions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No subscriptions found.</p>
                  ) : (
                    <div className="space-y-2">
                      {subscriptions.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {subscription.subsector}
                            </span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${
                              subscription.payment_status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {subscription.payment_status}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveSubscription(subscription.id)}
                            disabled={loading}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Add New Subscription</h3>
                  <div className="space-y-2">
                    {availableSubsectors
                      .filter(subsector => !subscriptions.some(sub => sub.subsector === subsector))
                      .map((subsector) => (
                        <div
                          key={subsector}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <span className="text-gray-900 dark:text-white">{subsector}</span>
                          <button
                            onClick={() => handleAddSubscription(subsector)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Notification Preferences</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Notification settings will be implemented in a future update.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
