/**
 * AGORA Calendar Layout Component
 * 
 * PHASE 1, STEP 1.3: Basic Layout Component
 * Dependencies: calendar.ts types, mockCalendarData.ts
 * Purpose: Basic calendar grid structure
 * 
 * SAFETY: Uses mock data only, no API calls, no external dependencies
 */

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  CalendarState,
  CALENDAR_CONSTANTS,
  CalendarEventData,
  CompanyRow
} from '../../types/calendar';
import {
  getMockCalendarState,
  getMockCompanies,
  getMockEventCells
} from '../../services/mockCalendarData';
import EventCell from './EventCell';
import EventDetailsPanel from './EventDetailsPanel';

// =====================================================================================
// CALENDAR LAYOUT COMPONENT
// =====================================================================================

interface CalendarLayoutProps {
  className?: string;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ className = '' }) => {
  // State management using mock data
  const [calendarState, setCalendarState] = useState<CalendarState>(getMockCalendarState());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Event interaction state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [isEventDetailsVisible, setIsEventDetailsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load mock data on component mount
  useEffect(() => {
    const mockState = getMockCalendarState();
    setCalendarState(mockState);
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate week options for navigation
  const generateWeekOptions = () => {
    const today = new Date();
    const weeks = [];
    
    for (let i = 0; i < CALENDAR_CONSTANTS.GRID_SETTINGS.WEEKS_TO_SHOW; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      
      weeks.push({
        weekNumber: i + 1,
        label: `Week ${i + 1}`,
        startDate: weekStart,
        isSelected: i === 0
      });
    }
    
    return weeks;
  };

  const weekOptions = generateWeekOptions();

  // Generate day columns for the current week
  const generateDayColumns = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < CALENDAR_CONSTANTS.GRID_SETTINGS.DAYS_PER_WEEK; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dayName = dayNames[date.getDay()];
      const dayNumber = date.getDate();
      
      days.push({
        dayName,
        dayNumber,
        date,
        fullLabel: `${dayName} ${dayNumber}`
      });
    }
    
    return days;
  };

  const dayColumns = generateDayColumns();

  // Handle event filter toggle
  const handleEventFilterToggle = (filter: 'my_events' | 'all_events') => {
    setCalendarState(prev => ({
      ...prev,
      viewMode: {
        ...prev.viewMode,
        eventFilter: filter
      }
    }));
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCalendarState(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
  };

  // Event interaction handlers
  const handleEventClick = (event: CalendarEventData) => {
    setSelectedEvent(event);
    setIsEventDetailsVisible(true);
  };

  const handleEventHover = (event: CalendarEventData | null) => {
    // Right sidebar panel doesn't need hover - only click
    // Keeping this function for EventCell compatibility but not showing panel on hover
  };

  const handleCloseEventDetails = () => {
    setIsEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  const handleDateSelect = (date: Date) => {
    // Navigate main calendar to selected date
    // For now, just close the panel - full navigation will be implemented later
    setIsEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  // Get events for a specific company and date
  const getEventsForCell = (companyId: string, date: Date): CalendarEventData[] => {
    const mockEventCells = getMockEventCells();
    
    return mockEventCells
      .filter(eventCell => {
        const eventDate = new Date(eventCell.event.start_date);
        const isSameDate = eventDate.toDateString() === date.toDateString();
        const isForCompany = eventCell.event.companies.some((company: CompanyRow) => company.id === companyId);
        
        return isSameDate && isForCompany;
      })
      .map(eventCell => ({
        ...eventCell.event,
        rsvpStatus: eventCell.rsvpStatus,
        colorCode: eventCell.colorCode,
        isMultiCompany: eventCell.isMultiCompany,
        attendingCompanies: eventCell.attendingCompanies
      }));
  };

  return (
    <div className={`calendar-layout ${className}`} style={{ 
      backgroundColor: 'var(--primary-bg)', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
              {/* Calendar Grid with Integrated Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '150px repeat(7, 1.5fr)',
                minHeight: '100vh',
                width: '100%',
                backgroundColor: 'var(--primary-bg)'
              }}>
                {/* Header Navigation Row - Spans All Columns */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem 2rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--secondary-bg)'
                }}>
                  {/* Week Navigation */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '2rem' }}>
                    {weekOptions.map((week) => (
              <button
                key={week.weekNumber}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: week.isSelected ? 'var(--accent-bg)' : 'var(--tertiary-bg)',
                  color: week.isSelected ? 'var(--primary-bg)' : 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: week.isSelected ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!week.isSelected) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!week.isSelected) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                  }
                }}
              >
                {week.label}
              </button>
            ))}
          </div>

                  {/* Event Filter Toggle and Search */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Event Filter Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--tertiary-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => handleEventFilterToggle('my_events')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: calendarState.viewMode.eventFilter === 'my_events' 
                    ? 'var(--accent-bg)' : 'transparent',
                  color: calendarState.viewMode.eventFilter === 'my_events' 
                    ? 'var(--primary-bg)' : 'var(--primary-text)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                My Events
              </button>
              <button
                onClick={() => handleEventFilterToggle('all_events')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: calendarState.viewMode.eventFilter === 'all_events' 
                    ? 'var(--accent-bg)' : 'transparent',
                  color: calendarState.viewMode.eventFilter === 'all_events' 
                    ? 'var(--primary-bg)' : 'var(--primary-text)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                All Events
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--muted-text)' 
                }} 
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'var(--tertiary-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--primary-text)',
                  fontSize: '0.875rem',
                  width: '200px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>
          </div>
        </div>
        {/* Column Headers Row */}
        {/* Company Tickers Header */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--secondary-bg)',
          borderRight: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: '600',
          fontSize: '0.875rem',
          color: 'var(--primary-text)',
          display: 'flex',
          alignItems: 'center'
        }}>
          Tickers
        </div>

        {/* Day Column Headers */}
        {dayColumns.map((day, index) => (
          <div
            key={`day-header-${index}`}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRight: index < dayColumns.length - 1 ? '1px solid var(--border-color)' : 'none',
              borderBottom: '1px solid var(--border-color)',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: 'var(--primary-text)'
            }}
          >
            {day.fullLabel}
          </div>
        ))}

        {/* Company Rows */}
        {calendarState.companies.map((company, companyIndex) => (
          <React.Fragment key={`company-row-${company.id}`}>
            {/* Company Ticker Cell */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--tertiary-bg)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: companyIndex < calendarState.companies.length - 1 ? '1px solid var(--border-color)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                minHeight: '100px'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.backgroundColor = 'var(--tertiary-bg)';
              }}
            >
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '0.25rem'
              }}>
                {company.ticker_symbol}
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontStyle: 'italic',
                color: 'var(--muted-text)',
                lineHeight: '1.2'
              }}>
                {company.company_name}
              </div>
              {/* Subscription Status Indicator */}
              <div style={{
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: company.isSubscribed ? 'var(--status-accepted)' : 'var(--muted-text)'
                }} />
                <span style={{
                  fontSize: '0.625rem',
                  color: 'var(--muted-text)',
                  textTransform: 'uppercase'
                }}>
                  {company.subscriptionStatus}
                </span>
              </div>
            </div>

            {/* Event Cells for this Company */}
            {dayColumns.map((day, dayIndex) => (
              <div
                key={`cell-${company.id}-${dayIndex}`}
                style={{
                  minHeight: '100px',
                  padding: '0.5rem',
                  backgroundColor: 'var(--primary-bg)',
                  borderRight: dayIndex < dayColumns.length - 1 ? '1px solid var(--border-color)' : 'none',
                  borderBottom: companyIndex < calendarState.companies.length - 1 ? '1px solid var(--border-color)' : 'none',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {/* Event Cells */}
                {getEventsForCell(company.id, day.date).map((event, eventIndex) => (
                  <EventCell
                    key={`event-${event.id}-${eventIndex}`}
                    event={event}
                    onEventClick={handleEventClick}
                    onEventHover={handleEventHover}
                  />
                ))}
                
                {/* Show message if no events */}
                {getEventsForCell(company.id, day.date).length === 0 && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted-text)',
                    textAlign: 'center',
                    marginTop: '1rem',
                    opacity: 0.3
                  }}>
                    No events
                  </div>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Loading State */}
      {calendarState.loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.125rem'
        }}>
          Loading calendar...
        </div>
      )}

      {/* Error State */}
      {calendarState.error && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'var(--error-color)',
          color: 'white',
          padding: '1rem',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000
        }}>
          {calendarState.error}
        </div>
      )}

      {/* Event Details Panel */}
      <EventDetailsPanel
        event={selectedEvent}
        isVisible={isEventDetailsVisible}
        onClose={handleCloseEventDetails}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
};

export default CalendarLayout;
