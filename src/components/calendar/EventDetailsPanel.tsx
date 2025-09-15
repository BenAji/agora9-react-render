/**
 * AGORA Event Details Panel Component - Office Add-in Optimized
 * 
 * PHASE 4: Enhanced UI with Office Add-in Requirements
 * Dependencies: calendar.ts types, mockCalendarData.ts
 * Purpose: Right sidebar for event details with compact, touch-friendly design
 * 
 * SAFETY: Uses mock data only, no API calls
 * OFFICE: Optimized for 320px+ width, touch targets 44px+
 */

import React from 'react';
import { CalendarEventData } from '../../types/calendar';
import { 
  MapPin, 
  Users, 
  Building2, 
  Calendar as CalendarIcon, 
  X, 
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Plus
} from 'lucide-react';
import MiniCalendar from './MiniCalendar';
import WeatherForecast from './WeatherForecast';

interface EventDetailsPanelProps {
  event: CalendarEventData | null;
  isVisible: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  onRSVPUpdate?: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
  className?: string;
}

const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({ 
  event, 
  isVisible, 
  onClose,
  onDateSelect,
  onRSVPUpdate,
  className 
}) => {
  if (!event || !isVisible) return null;

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (startDate: Date, endDate: Date) => {
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'earnings': return '#3B82F6'; // Blue
      case 'conference': return '#10B981'; // Green
      case 'webinar': return '#8B5CF6'; // Purple
      case 'catalyst': return '#F59E0B'; // Orange
      default: return '#6B7280'; // Gray
    }
  };

  const getRSVPStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={16} />;
      case 'declined': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getLocationTypeIcon = (locationType: string) => {
    switch (locationType) {
      case 'physical': return <MapPin size={16} />;
      case 'virtual': return <Globe size={16} />;
      case 'hybrid': return <Building2 size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  return (
    <div
      className={`event-details-panel ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(420px, max(320px, 25vw))', // Responsive width: 320px min, 420px max (increased for mini calendar dots)
        backgroundColor: 'var(--secondary-bg)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '44px', // Touch-friendly
            height: '44px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-text)',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>

        {/* Event Type Badge - Reduced Size */}
        <div style={{
          display: 'inline-block',
          padding: '0.2rem 0.5rem',
          backgroundColor: getEventTypeColor(event.event_type),
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.65rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          marginBottom: '0.75rem'
        }}>
          {event.event_type}
        </div>

        {/* Event Title */}
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem',
          lineHeight: '1.3',
          paddingRight: '2rem' // Space for close button
        }}>
          {event.title}
        </h2>

        {/* Event Description */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--muted-text)',
          lineHeight: '1.5',
          marginBottom: '1rem'
        }}>
          {event.description}
        </p>

        {/* Company Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <Building2 size={16} color="var(--accent-color)" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
              {event.companies[0]?.ticker_symbol}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              {event.companies[0]?.company_name}
            </div>
          </div>
        </div>
      </div>

      {/* Event Information Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Date & Time Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CalendarIcon size={14} color="var(--accent-color)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
              Date & Time
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.25rem' }}>
            {formatEventDate(event.start_date)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            {formatEventTime(event.start_date, event.end_date)}
          </div>
        </div>

        {/* Location Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {React.cloneElement(getLocationTypeIcon(event.location_type), { size: 14 })}
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
              Location
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.25rem' }}>
            {event.location_type === 'virtual' ? 'Virtual Event' : 
             event.location_type === 'hybrid' ? 'Hybrid Event' : 'In-Person Event'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            {event.location || 'Location details not available'}
          </div>
        </div>

        {/* Attendees Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={14} color="var(--accent-color)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
              Attendees
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
            {event.attendees?.length || 0} confirmed
          </div>
        </div>
      </div>

      {/* RSVP Section */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Shield size={14} color="var(--accent-color)" />
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
            Your Response
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ color: getRSVPStatusColor(event.rsvpStatus) }}>
            {React.cloneElement(getRSVPStatusIcon(event.rsvpStatus), { size: 14 })}
          </div>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: getRSVPStatusColor(event.rsvpStatus),
            textTransform: 'capitalize'
          }}>
            {event.rsvpStatus}
          </span>
        </div>

        {/* RSVP Action Buttons - Improved Colors */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => onRSVPUpdate?.(event.id, 'accepted')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: event.rsvpStatus === 'accepted' ? '#10B981' : '#374151',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: !onRSVPUpdate ? 0.6 : 1,
              minHeight: '44px', // Touch-friendly
              transition: 'all 0.2s ease'
            }}
          >
            Accept
          </button>
          <button 
            onClick={() => onRSVPUpdate?.(event.id, 'declined')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: event.rsvpStatus === 'declined' ? '#EF4444' : '#374151',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: !onRSVPUpdate ? 0.6 : 1,
              minHeight: '44px', // Touch-friendly
              transition: 'all 0.2s ease'
            }}
          >
            Decline
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.75rem' }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--primary-bg)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '36px', // Reduced from 44px
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Plus size={12} />
            Add to Calendar
          </button>
          <button style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: 'var(--tertiary-bg)',
            color: 'var(--primary-text)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '36px', // Reduced from 44px
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Share2 size={12} />
            Share
          </button>
        </div>
      </div>


      {/* Mini Calendar - As per PRD Step 3.2 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: 'var(--primary-text)', 
          marginBottom: '0.75rem' 
        }}>
          Calendar Navigation
        </h3>
        <MiniCalendar
          selectedDate={event.start_date}
          onDateSelect={onDateSelect}
        />
      </div>

      {/* Weather Forecast - As per PRD Step 3.3 */}
      <div style={{ marginBottom: '1rem' }}>
        <WeatherForecast
          eventDate={event.start_date}
          location={event.weather_location || event.location || 'Event Location'}
        />
      </div>
    </div>
  );
};

export default EventDetailsPanel;