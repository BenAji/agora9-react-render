import React from 'react';
import { Calendar, MapPin, ExternalLink, Clock } from 'lucide-react';
import { CalendarEventData } from '../../types/calendar';

interface EventCardProps {
  event: CalendarEventData;
  onRSVPUpdate: (eventId: string, status: 'accepted' | 'declined' | 'pending') => void;
  onViewDetails: (event: CalendarEventData) => void;
  showSubsector?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onRSVPUpdate,
  onViewDetails,
  showSubsector = true
}) => {
  // Get RSVP status color and label
  const getRSVPStatus = () => {
    switch (event.rsvpStatus) {
      case 'accepted':
        return { color: '#10B981', label: 'Attending', bgColor: '#ECFDF5' };
      case 'declined':
        return { color: '#EF4444', label: 'Declined', bgColor: '#FEF2F2' };
      case 'pending':
        return { color: '#F59E0B', label: 'Pending', bgColor: '#FFFBEB' };
      default:
        return { color: '#6B7280', label: 'No Response', bgColor: '#F9FAFB' };
    }
  };

  // Get subsector badge info
  const getSubsectorBadge = () => {
    const subsectorMap: { [key: string]: { color: string; icon: string; label: string } } = {
      'Technology': { color: '#8B5CF6', icon: '💻', label: 'Technology' },
      'Healthcare': { color: '#06B6D4', icon: '🏥', label: 'Healthcare' },
      'Finance': { color: '#10B981', icon: '💰', label: 'Finance' },
      'Consumer': { color: '#F59E0B', icon: '🛍️', label: 'Consumer' },
      'Industrial': { color: '#6B7280', icon: '🏭', label: 'Industrial' }
    };

    // Get the first company's subsector
    const subsector = event.companies?.[0]?.gics_subsector || 'Technology';
    return subsectorMap[subsector] || subsectorMap['Technology'];
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const isToday = eventDate.toDateString() === now.toDateString();
    const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeStr = eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get location info
  const getLocationInfo = () => {
    if (event.parsed_location) {
      return { 
        type: event.parsed_location.type, 
        text: event.parsed_location.displayText, 
        icon: event.parsed_location.type === 'virtual' ? '🔗' : 
              event.parsed_location.type === 'hybrid' ? '🏢' : '📍'
      };
    }
    
    // Fallback to legacy location field
    if (event.location?.toLowerCase().includes('virtual')) {
      return { type: 'virtual', text: 'Virtual', icon: '🔗' };
    }
    return { type: 'physical', text: event.location || 'TBD', icon: '📍' };
  };

  const rsvpStatus = getRSVPStatus();
  const subsectorBadge = getSubsectorBadge();
  const locationInfo = getLocationInfo();

  return (
    <div 
      className="event-card"
      style={{
        backgroundColor: 'var(--secondary-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '12px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: Event Title + RSVP Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'var(--primary-text)',
          margin: 0,
          lineHeight: '1.3',
          flex: 1,
          marginRight: '12px'
        }}>
          {event.title}
        </h3>
        
        <div style={{
          backgroundColor: rsvpStatus.bgColor,
          color: rsvpStatus.color,
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '600',
          border: `1px solid ${rsvpStatus.color}20`,
          whiteSpace: 'nowrap'
        }}>
          {rsvpStatus.label}
        </div>
      </div>

      {/* Company + Date/Time + Location */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          color: 'var(--secondary-text)'
        }}>
          <span style={{ fontWeight: '500' }}>
            {event.companies?.[0]?.company_name || 'Unknown Company'}
          </span>
          <span>•</span>
          <span>{formatDateTime(event.start_date)}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--muted-text)'
        }}>
          <span>{locationInfo.icon}</span>
          <span>{locationInfo.text}</span>
          {locationInfo.type === 'virtual' && (
            <>
              <span>•</span>
              <span>Link Available</span>
            </>
          )}
        </div>
      </div>

      {/* Subsector Badge */}
      {showSubsector && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            backgroundColor: `${subsectorBadge.color}20`,
            color: subsectorBadge.color,
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: `1px solid ${subsectorBadge.color}40`
          }}>
            <span>{subsectorBadge.icon}</span>
            <span>{subsectorBadge.label}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* RSVP Buttons */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flex: 1
        }}>
          {event.rsvpStatus !== 'accepted' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRSVPUpdate(event.id, 'accepted');
              }}
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '36px',
                minWidth: '60px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              Accept
            </button>
          )}
          
          {event.rsvpStatus !== 'declined' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRSVPUpdate(event.id, 'declined');
              }}
              style={{
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '36px',
                minWidth: '60px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#EF4444';
              }}
            >
              Decline
            </button>
          )}

          {event.rsvpStatus !== 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRSVPUpdate(event.id, 'pending');
              }}
              style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '36px',
                minWidth: '60px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D97706';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F59E0B';
              }}
            >
              Maybe
            </button>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(event);
          }}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--accent-bg)',
            border: '1px solid var(--accent-bg)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
            e.currentTarget.style.color = 'var(--primary-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--accent-bg)';
          }}
        >
          Details
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
