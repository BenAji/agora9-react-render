/**
 * Mobile-Friendly Subscription Card Component
 * 
 * Features:
 * - Card-based layout optimized for mobile
 * - Swipe actions for unsubscribe
 * - Bloomberg theme colors
 * - Touch-friendly buttons
 * - Company icons
 */

import React, { useState, useRef } from 'react';
import { Building2, Calendar, Trash2, Settings, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionCardProps {
  subscription: {
    id: string;
    subsector: string;
    sector: string;
    companyCount: number;
    companies: Array<{
      id: string;
      ticker_symbol: string;
      company_name: string;
    }>;
    expiresAt: string;
    paymentStatus: string;
  };
  onUnsubscribe: (subscriptionId: string) => void;
  onManage: (subscriptionId: string) => void;
}

const MobileSubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onUnsubscribe,
  onManage
}) => {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Company icon mapping
  const getCompanyIcon = (ticker: string) => {
    const iconMap: { [key: string]: string } = {
      'AAPL': '🍎',
      'MSFT': '🪟',
      'GOOGL': '🔍',
      'META': '📘',
      'TSLA': '🚗',
      'AMZN': '📦',
      'NVDA': '🎮',
      'NFLX': '🎬',
      'AMD': '💻',
      'INTC': '🔧'
    };
    return iconMap[ticker] || '🏢';
  };

  // Format expiration date
  const formatExpirationDate = (expiresAt: string) => {
    try {
      const date = new Date(expiresAt);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startX;
    setCurrentX(deltaX);
    
    // Limit swipe distance
    if (deltaX < -100) {
      setIsSwipeOpen(true);
    } else if (deltaX > 50) {
      setIsSwipeOpen(false);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setCurrentX(0);
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left mouse button pressed
      const deltaX = e.clientX - startX;
      setCurrentX(deltaX);
      
      if (deltaX < -100) {
        setIsSwipeOpen(true);
      } else if (deltaX > 50) {
        setIsSwipeOpen(false);
      }
    }
  };

  const handleMouseUp = () => {
    setCurrentX(0);
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        marginBottom: '12px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transform: `translateX(${currentX}px)`,
        transition: currentX === 0 ? 'transform 0.3s ease' : 'none',
        cursor: 'grab'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Main Card Content */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#1a1a1a',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '24px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#333333',
              borderRadius: '8px'
            }}>
              {getCompanyIcon(subscription.companies[0]?.ticker_symbol || '')}
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                margin: 0,
                marginBottom: '4px'
              }}>
                {subscription.subsector}
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#cccccc',
                margin: 0
              }}>
                {subscription.sector}
              </p>
            </div>
          </div>
          <ChevronRight size={16} color="#666666" />
        </div>

        {/* Company Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Building2 size={14} color="#FFD700" />
          <span style={{
            fontSize: '14px',
            color: '#FFFFFF'
          }}>
            {subscription.companyCount} companies
          </span>
          <span style={{
            fontSize: '12px',
            color: '#cccccc'
          }}>
            • {subscription.companies.slice(0, 3).map(c => c.ticker_symbol).join(', ')}
            {subscription.companies.length > 3 && ` +${subscription.companies.length - 3} more`}
          </span>
        </div>

        {/* Expiration Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <Calendar size={14} color="#FFD700" />
          <span style={{
            fontSize: '14px',
            color: '#FFFFFF'
          }}>
            Expires: {formatExpirationDate(subscription.expiresAt)}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => onManage(subscription.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#333333',
              color: '#FFFFFF',
              border: '1px solid #555555',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#444444';
              e.currentTarget.style.borderColor = '#FFD700';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
              e.currentTarget.style.borderColor = '#555555';
            }}
          >
            <Settings size={14} />
            Manage
          </button>
          <button
            onClick={() => onUnsubscribe(subscription.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#dc3545',
              color: '#FFFFFF',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
            }}
          >
            <Trash2 size={14} />
            Unsubscribe
          </button>
        </div>
      </div>

      {/* Swipe Actions Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '120px',
          backgroundColor: '#dc3545',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          transform: isSwipeOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: '#FFFFFF'
        }}>
          <Trash2 size={20} />
          <span style={{
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Unsubscribe
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileSubscriptionCard;
