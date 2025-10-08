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
import { MiniCalendarDay } from '../../types/calendar';
import { CalendarEvent } from '../../types/database';
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
  events: CalendarEvent[];  // NEW: Real events from parent
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
  events,
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [eventCounts, setEventCounts] = useState<EventCountByDate>({});

  // Calculate event counts from real events
  useEffect(() => {
    const counts: EventCountByDate = {};

    events.forEach((event: CalendarEvent) => {
      const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
      
      if (!counts[dateKey]) {
        counts[dateKey] = { attending: 0, declined: 0, pending: 0 };
      }

      const rsvpStatus = event.rsvpStatus || event.user_response?.response_status || 'pending';
      
      switch (rsvpStatus) {
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
  }, [events]);

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
    
    if (!counts || (counts.attending === 0 && counts.pending === 0 && counts.declined === 0)) {
      return null;
    }

    const dots = [];
    let totalShown = 0;
    const maxDots = 3;
    
    // Priority order: Green (accepted) → Yellow (pending) → Red (declined)
    
    // Green dots for accepted events (highest priority)
    for (let i = 0; i < counts.attending && totalShown < maxDots; i++) {
      dots.push(
        <div
          key={`accepted-${i}`}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981', // Green for accepted
            margin: '0 2px',
            display: 'inline-block'
          }}
        />
      );
      totalShown++;
    }
    
    // Yellow dots for pending events (medium priority)
    for (let i = 0; i < counts.pending && totalShown < maxDots; i++) {
      dots.push(
        <div
          key={`pending-${i}`}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#f59e0b', // Yellow for pending
            margin: '0 2px',
            display: 'inline-block'
          }}
        />
      );
      totalShown++;
    }
    
    // Red dots for declined events (lowest priority)
    for (let i = 0; i < counts.declined && totalShown < maxDots; i++) {
      dots.push(
        <div
          key={`declined-${i}`}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ef4444', // Red for declined
            margin: '0 2px',
            display: 'inline-block'
          }}
        />
      );
      totalShown++;
    }

    // Show "+" if there are more events than we can display
    const totalEvents = counts.attending + counts.pending + counts.declined;
    if (totalEvents > maxDots) {
      dots.push(
        <div
          key="more"
          style={{
            fontSize: '10px',
            color: 'var(--muted-text)',
            fontWeight: '600',
            marginLeft: '3px',
            display: 'inline-block',
            verticalAlign: 'middle'
          }}
        >
          +
        </div>
      );
    }

    return dots.length > 0 ? (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '2px',
        minHeight: '12px'
      }}>
        {dots}
      </div>
    ) : null;
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
                    ? '#000000' // Black text for current day
                    : 'var(--primary-text)',
                backgroundColor: isSelected(date) 
                  ? 'var(--accent-bg)' 
                  : isToday(date) 
                    ? '#FFD700' // Gold background for current day
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>{format(date, 'd')}</span>
                {eventDots}
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default MiniCalendar;
