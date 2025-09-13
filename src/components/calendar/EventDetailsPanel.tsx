/**
 * AGORA Event Details Panel Component
 * 
 * PHASE 2, STEP 2.3: Event Details Panel
 * Dependencies: calendar.ts types
 * Purpose: Right sidebar for event details
 * 
 * SAFETY: Uses mock data only, no API calls, no external dependencies
 */

import React from 'react';
import { CalendarEventData } from '../../types/calendar';
import { MapPin, Users, Building2, Calendar as CalendarIcon, X } from 'lucide-react';
import MiniCalendar from './MiniCalendar';
import WeatherForecast from './WeatherForecast';

interface EventDetailsPanelProps {
  event: CalendarEventData | null;
  isVisible: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({ 
  event, 
  isVisible, 
  onClose,
  onDateSelect,
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

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'var(--status-accepted)';
      case 'declined': return 'var(--status-declined)';
      case 'pending': return 'var(--status-pending)';
      default: return 'var(--status-pending)';
    }
  };

  const getRSVPStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Attending';
      case 'declined': return 'Declined';
      case 'pending': return 'Pending Response';
      default: return 'Pending Response';
    }
  };

  return (
    <div
      className={`event-details-panel ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--border-color)',
        borderRight: 'none',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
        padding: '1.5rem',
        overflowY: 'auto',
        zIndex: 1000,
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'none',
          border: 'none',
          color: 'var(--muted-text)',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '4px',
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

      {/* Event Header */}
      <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--primary-text)',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.3',
          paddingRight: '2rem'
        }}>
          {event.title}
        </h2>
        
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--muted-text)',
          margin: '0',
          lineHeight: '1.4'
        }}>
          {event.description}
        </p>
      </div>

      {/* Event Details Grid */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Date & Time */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <CalendarIcon size={18} color="var(--muted-text)" style={{ marginTop: '0.125rem' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
              {formatEventDate(event.start_date)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              {formatEventTime(event.start_date, event.end_date)}
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <MapPin size={18} color="var(--muted-text)" style={{ marginTop: '0.125rem' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
              {event.location_type === 'virtual' ? 'Virtual Event' : 'In-Person Event'}
            </div>
            {event.location && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                {event.location}
              </div>
            )}
          </div>
        </div>

        {/* Companies */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Building2 size={18} color="var(--muted-text)" style={{ marginTop: '0.125rem' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
              {event.companies.length === 1 ? 'Company' : 'Companies'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              {event.companies.map(c => c.ticker_symbol).join(', ')}
            </div>
          </div>
        </div>

        {/* Attendees Count */}
        {event.attendees && event.attendees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Users size={18} color="var(--muted-text)" style={{ marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
                Attendees
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                {event.attendees.length} confirmed
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Speakers and Agenda Information */}
      {event.speakers && event.speakers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.75rem' }}>
            Speakers
          </h3>
          {event.speakers.map((speaker, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
                {speaker.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                {speaker.title}, {speaker.company}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RSVP Status and Action Buttons */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: `1px solid ${getRSVPStatusColor(event.rsvpStatus)}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
              Your Response
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: getRSVPStatusColor(event.rsvpStatus),
              fontWeight: '600'
            }}>
              {getRSVPStatusText(event.rsvpStatus)}
            </div>
          </div>
          
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getRSVPStatusColor(event.rsvpStatus)
          }} />
        </div>

        {/* RSVP Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: event.rsvpStatus === 'accepted' ? 'var(--status-accepted)' : 'var(--tertiary-bg)',
            color: event.rsvpStatus === 'accepted' ? 'var(--primary-bg)' : 'var(--primary-text)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Accept
          </button>
          <button style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: event.rsvpStatus === 'declined' ? 'var(--status-declined)' : 'var(--tertiary-bg)',
            color: event.rsvpStatus === 'declined' ? 'var(--primary-bg)' : 'var(--primary-text)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Decline
          </button>
        </div>
      </div>

      {/* Attendee List */}
      {event.attendees && event.attendees.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.75rem' }}>
            Attendee List
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {event.attendees.map((attendee, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.5rem 0',
                borderBottom: index < event.attendees!.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary-text)' }}>
                    {attendee.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                    {attendee.title}, {attendee.company}
                  </div>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getRSVPStatusColor(attendee.rsvp_status)
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact and Access Information */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.75rem' }}>
          Access Information
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)', marginBottom: '0.5rem' }}>
          Registration: {event.access_info.registration_required ? 'Required' : 'Not Required'}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)', marginBottom: '0.5rem' }}>
          Cost: {event.access_info.is_free ? 'Free' : 'Paid'}
        </div>
        {event.access_info.contact_email && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            Contact: {event.access_info.contact_email}
          </div>
        )}
      </div>

      {/* Tags Display */}
      {event.tags && event.tags.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.75rem' }}>
            Tags
          </h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem' 
          }}>
            {event.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--primary-bg)',
                  borderRadius: '16px',
                  fontWeight: '500'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mini Calendar - As per PRD Step 3.2 */}
      <div style={{ marginTop: '1.5rem' }}>
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
      <div style={{ marginTop: '1.5rem' }}>
        <WeatherForecast
          eventDate={event.start_date}
          location={event.weather_location || event.location || 'Event Location'}
        />
      </div>
    </div>
  );
};

export default EventDetailsPanel;
