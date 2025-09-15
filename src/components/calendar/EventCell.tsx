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

  const getEventBackgroundColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'accepted': return 'rgba(16, 185, 129, 0.15)'; // Green with 15% opacity
      case 'declined': return 'rgba(239, 68, 68, 0.15)';  // Red with 15% opacity
      case 'pending': return 'rgba(245, 158, 11, 0.15)';  // Yellow/Orange with 15% opacity
      default: return 'rgba(245, 158, 11, 0.15)';         // Default to pending
    }
  };

  const getEventBorderColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'accepted': return '#10b981'; // Green
      case 'declined': return '#ef4444'; // Red
      case 'pending': return '#f59e0b';  // Yellow/Orange
      default: return '#f59e0b';         // Default to pending
    }
  };

  const getStatusIcon = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'accepted': return '✓';
      case 'declined': return '✗';
      case 'pending': return '⏳';
      default: return '?';
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
        backgroundColor: getEventBackgroundColor(event.rsvpStatus),
        borderLeft: `3px solid ${getEventBorderColor(event.rsvpStatus)}`,
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        padding: '0.25rem 0.5rem',
        marginBottom: '0.25rem',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#ffffff',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={`${event.title} - ${formatEventTime(event.start_date, event.end_date)} - Status: ${event.rsvpStatus}`}
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

      {/* RSVP Status Icon */}
      <div style={{
        position: 'absolute',
        top: '0.25rem',
        right: '0.25rem',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: getEventBorderColor(event.rsvpStatus),
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}>
        {getStatusIcon(event.rsvpStatus)}
      </div>

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
