/**
 * GlobalHeader Component
 * App-wide header with navigation, search, notifications, and user menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LogOut, User, Settings, Bell, Menu, X } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import Notifications from './Notifications';

interface GlobalHeaderProps {
  currentUser: any;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onManageSubscriptionsClick?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ 
  currentUser, 
  onLogout, 
  onProfileClick,
  onManageSubscriptionsClick 
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Click outside detection for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleSearchResult = (result: any) => {
    // Handle search result navigation
  };

  const handleNotificationClick = (notification: any) => {
    // Handle notification navigation
  };

  const handleProfileClick = () => {
    onProfileClick?.();
    // Don't close dropdown - let user click outside to close
  };

  const handleManageSubscriptionsClick = () => {
    onManageSubscriptionsClick?.();
    // Don't close dropdown - let user click outside to close
  };

  return (
    <header className="app-header">
      {/* Left Side - Logo */}
      <div className="header-left">
        <Link to="/" className="logo-link">
          <Calendar className="header-icon" />
          <h1 className="header-logo">AGORA</h1>
        </Link>
      </div>

      {/* Center - Navigation */}
      <nav className="header-nav">
        <Link 
          to="/calendar" 
          className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
        >
          Calendar
        </Link>
        <Link 
          to="/events" 
          className={`nav-link ${isActive('/events') ? 'active' : ''}`}
        >
          Events
        </Link>
        <Link 
          to="/subscriptions" 
          className={`nav-link ${isActive('/subscriptions') ? 'active' : ''}`}
        >
          Subscriptions
        </Link>
      </nav>

      {/* Right Side - Search, Notifications, User Menu */}
      <div className="header-right">
        {/* Global Search */}
        <div className="header-search">
          <GlobalSearch onResultClick={handleSearchResult} />
        </div>

        {/* Notifications */}
        <div className="header-notifications">
          <Notifications onNotificationClick={handleNotificationClick} />
        </div>

        {/* User Menu */}
        <div className="user-menu" ref={dropdownRef}>
          <button 
            className="user-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="user-avatar">
              {currentUser?.full_name ? 
                currentUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                'U'
              }
            </div>
          </button>

          {showProfileDropdown && (
            <div className="dropdown-menu">
              <div className="user-profile-preview">
                <div className="user-avatar-large">
                  {currentUser?.full_name ? 
                    currentUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                    'U'
                  }
                </div>
                <div className="user-details">
                  <h4>{currentUser?.full_name || 'User'}</h4>
                  <p>{currentUser?.email || 'user@example.com'}</p>
                </div>
              </div>
              <hr />
              <button onClick={handleProfileClick}>
                <User size={16} />
                Profile Settings
              </button>
              <button onClick={handleManageSubscriptionsClick}>
                <Settings size={16} />
                Manage Subscriptions
              </button>
              <button>
                <Bell size={16} />
                Notifications
              </button>
              <hr />
              <button onClick={onLogout}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <nav className="mobile-nav">
              <Link 
                to="/calendar" 
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Calendar
              </Link>
              <Link 
                to="/events" 
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Events
              </Link>
              <Link 
                to="/subscriptions" 
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Subscriptions
              </Link>
            </nav>
            
            <div className="mobile-user-section">
              
              <div className="mobile-user-actions">
                <button onClick={handleProfileClick}>
                  <User size={16} />
                  Profile Settings
                </button>
                <button onClick={handleManageSubscriptionsClick}>
                  <Settings size={16} />
                  Manage Subscriptions
                </button>
                <button onClick={onLogout}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default GlobalHeader;
