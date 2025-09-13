/**
 * AGORA Mini Calendar Component
 * 
 * PHASE 3, STEP 3.1: Mini Calendar Component
 * Dependencies: calendar.ts types, mockCalendarData.ts
 * Purpose: Month calendar with event count dots
 * 
 * SAFETY: Uses mock data only, no API calls, no external dependencies
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEventData, MiniCalendarDay } from '../../types/calendar';
import { getMockEvents } from '../../services/mockCalendarData';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

interface MiniCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

interface EventCountByDate {
  [dateKey: string]: {
    attending: number;
    declined: number;
    pending: number;
  };
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
  selectedDate = new Date(), 
  onDateSelect,
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [eventCounts, setEventCounts] = useState<EventCountByDate>({});

  // Load mock events and calculate counts
  useEffect(() => {
    const mockEvents = getMockEvents();
    const counts: EventCountByDate = {};

    mockEvents.forEach((event: CalendarEventData) => {
      const dateKey = format(event.start_date, 'yyyy-MM-dd');
      
      if (!counts[dateKey]) {
        counts[dateKey] = { attending: 0, declined: 0, pending: 0 };
      }

      switch (event.rsvpStatus) {
        case 'accepted':
          counts[dateKey].attending++;
          break;
        case 'declined':
          counts[dateKey].declined++;
          break;
        case 'pending':
          counts[dateKey].pending++;
          break;
      }
    });

    setEventCounts(counts);
  }, []);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const getEventDotsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const counts = eventCounts[dateKey];
    
    if (!counts) return null;

    const dots = [];
    
    // Green dots for attending events
    for (let i = 0; i < Math.min(counts.attending, 3); i++) {
      dots.push(
        <div
          key={`attending-${i}`}
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-accepted)',
            margin: '0 1px'
          }}
        />
      );
    }
    
    // Yellow dots for declined events
    for (let i = 0; i < Math.min(counts.declined, 3); i++) {
      dots.push(
        <div
          key={`declined-${i}`}
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-declined)',
            margin: '0 1px'
          }}
        />
      );
    }
    
    // Grey dots for pending events
    for (let i = 0; i < Math.min(counts.pending, 3); i++) {
      dots.push(
        <div
          key={`pending-${i}`}
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-pending)',
            margin: '0 1px'
          }}
        />
      );
    }

    // Show "+" if more than 3 total events
    const totalEvents = counts.attending + counts.declined + counts.pending;
    if (totalEvents > 3) {
      dots.push(
        <div
          key="more"
          style={{
            fontSize: '8px',
            color: 'var(--muted-text)',
            fontWeight: '600',
            marginLeft: '2px'
          }}
        >
          +
        </div>
      );
    }

    return dots;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);
  const isCurrentMonth = (date: Date) => isSameMonth(date, currentMonth);

  return (
    <div className={`mini-calendar ${className}`} style={{
      backgroundColor: 'var(--primary-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1rem',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      width: '100%',
      maxWidth: '300px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <button
          onClick={handlePreviousMonth}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted-text)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <ChevronLeft size={16} />
        </button>
        
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--primary-text)',
          margin: 0
        }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted-text)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        marginBottom: '0.5rem'
      }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <div
            key={index}
            style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: 'var(--muted-text)',
              textAlign: 'center',
              padding: '0.25rem'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px'
      }}>
        {calendarDays.map((date, index) => {
          const eventDots = getEventDotsForDate(date);
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                minHeight: '32px',
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: isToday(date) ? '600' : '400',
                color: !isCurrentMonth(date) 
                  ? 'var(--disabled-text)' 
                  : isToday(date) 
                    ? 'var(--accent-text)' 
                    : 'var(--primary-text)',
                backgroundColor: isSelected(date) 
                  ? 'var(--accent-bg)' 
                  : isToday(date) 
                    ? 'var(--accent-bg-light)' 
                    : 'transparent',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected(date) && !isToday(date)) {
                  (e.target as HTMLElement).style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected(date) && !isToday(date)) {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{format(date, 'd')}</span>
              
              {/* Event Dots */}
              {eventDots && eventDots.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  minHeight: '6px'
                }}>
                  {eventDots}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Event Count Legend */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem'
        }}>
          Event Legend
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-accepted)'
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              Attending
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-declined)'
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              Declined
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-pending)'
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
