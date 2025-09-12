/**
 * AGORA Event Cell Component
 * 
 * PHASE 2, STEP 2.1: Event Cell Component
 * Dependencies: calendar.ts types, mockCalendarData.ts
 * Purpose: Render individual events in calendar cells
 * 
 * SAFETY: Uses mock data only, no API calls, no external dependencies
 */

import React, { useState } from 'react';
import { CalendarEventData } from '../../types/calendar';

interface EventCellProps {
  event: CalendarEventData;
  onEventClick?: (event: CalendarEventData) => void;
  onEventHover?: (event: CalendarEventData | null) => void;
  className?: string;
}

const EventCell: React.FC<EventCellProps> = ({ 
  event, 
  onEventClick, 
  onEventHover,
  className 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEventColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'accepted': return 'var(--status-accepted)'; // Green
      case 'declined': return 'var(--status-declined)'; // Yellow
      case 'pending': return 'var(--status-pending)';   // Grey
      default: return 'var(--status-pending)';
    }
  };

  const getEventBorderColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'accepted': return 'var(--status-accepted-border)';
      case 'declined': return 'var(--status-declined-border)';
      case 'pending': return 'var(--status-pending-border)';
      default: return 'var(--status-pending-border)';
    }
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    onEventHover?.(event);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onEventHover?.(null);
  };

  const handleClick = () => {
    onEventClick?.(event);
  };

  return (
    <div
      className={`event-cell ${className}`}
      style={{
        backgroundColor: getEventColor(event.rsvpStatus),
        border: `1px solid ${getEventBorderColor(event.rsvpStatus)}`,
        borderRadius: '4px',
        padding: '0.25rem 0.5rem',
        marginBottom: '0.25rem',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'var(--primary-text)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={`${event.title} - ${formatEventTime(event.start_date, event.end_date)}`}
    >
      {/* Event Title */}
      <div style={{
        fontWeight: '600',
        marginBottom: '0.125rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {event.title}
      </div>

      {/* Event Time */}
      <div style={{
        fontSize: '0.625rem',
        opacity: 0.8,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {formatEventTime(event.start_date, event.end_date)}
      </div>

      {/* RSVP Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '0.25rem',
        right: '0.25rem',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: event.rsvpStatus === 'accepted' ? 'var(--primary-bg)' : 
                        event.rsvpStatus === 'declined' ? 'var(--primary-bg)' : 
                        'var(--muted-text)',
        border: `1px solid ${getEventBorderColor(event.rsvpStatus)}`
      }} />

      {/* Multi-Company Indicator */}
      {event.isMultiCompany && (
        <div style={{
          position: 'absolute',
          bottom: '0.125rem',
          right: '0.25rem',
          fontSize: '0.5rem',
          fontWeight: '600',
          color: 'var(--muted-text)',
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '0.125rem 0.25rem',
          borderRadius: '2px'
        }}>
          {event.attendingCompanies.length}+
        </div>
      )}
    </div>
  );
};

export default EventCell;
