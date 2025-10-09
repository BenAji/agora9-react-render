/**
 * AGORA Calendar Layout Component
 * 
 * PHASE 4: Fixed Grid Height with Sticky Headers
 * Features: Responsive design, subscription filtering, smooth scrolling
 * 
 * SAFETY: Uses API data with mock fallbacks, error boundaries
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, getWeek, getYear, addDays } from 'date-fns';
import {
  CalendarEventData,
  CompanyRow
} from '../../types/calendar';
import { CalendarEvent } from '../../types/database';
import { useCalendarData } from '../../hooks/useCalendarData';
import EventCell from './EventCell';
import EventDetailsPanel from './EventDetailsPanel';
import MiniCalendar from './MiniCalendar';

// =====================================================================================
// CALENDAR LAYOUT COMPONENT
// =====================================================================================

interface CalendarLayoutProps {
  className?: string;
  useMockData?: boolean;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ 
  className = '', 
  useMockData = false
}) => {
  // API data hook with fallbacks
  const {
    companies,
    events,
    loading,
    error,
    isUsingMockData,
    updateRSVP
  } = useCalendarData({ 
    useMockData, 
    enableRealtime: true
  });

  // Local state for UI interactions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsVisible, setIsEventDetailsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  
  // Ref for week box positioning
  const weekBoxRef = useRef<HTMLDivElement>(null);

  // Mobile detection and viewport height recalculation
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force re-render when companies change to recalculate empty rows
  useEffect(() => {
    // This will trigger a re-render when companies change
  }, [companies.length]);

  // Generate day columns for the current week
  const generateDayColumns = () => {
    const startOfCurrentWeek = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfCurrentWeek, i);
      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const dayName = dayNames[i];
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
    setShowMyEventsOnly(filter === 'my_events');
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Week navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const getCurrentWeekInfo = () => {
    const weekNumber = getWeek(currentWeek, { weekStartsOn: 1 });
    const year = getYear(currentWeek);
    const month = format(currentWeek, 'MMM');
    const yearShort = format(currentWeek, 'yyyy'); // Full year instead of day
    
    return {
      weekNumber,
      year,
      month,
      yearShort
    };
  };

  // Event interaction handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsVisible(true);
  };

  const handleEventHover = (event: CalendarEvent | null) => {
    // Right sidebar panel doesn't need hover - only click
  };

  const handleCloseEventDetails = () => {
    setIsEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  const handleDateSelect = (date: Date) => {
    setIsEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  const handleRSVPUpdate = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      await updateRSVP(eventId, status);
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(prev => prev ? {
          ...prev,
          rsvpStatus: status,
          colorCode: status === 'accepted' ? 'green' : 
                    status === 'declined' ? 'yellow' : 'grey'
        } : null);
      }
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  // Get events for a specific company and date
  const getEventsForCell = (companyId: string, date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      const isSameDate = eventDate.toDateString() === date.toDateString();
      const isForCompany = event.companies.some((company) => company.id === companyId);
      
      // Apply search filter
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply event filter (my events only)
      const matchesEventFilter = !showMyEventsOnly || 
        event.rsvpStatus === 'accepted';
      
      return isSameDate && isForCompany && matchesSearch && matchesEventFilter;
    });
  };

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (isMobile) {
      return {
        headerHeight: '50px', // Reduced from 60px
        rowHeight: '70px', // Reduced from 80px
        controlSize: '1.0' // Normal size
      };
    }
    return {
      headerHeight: '60px', // Reduced from 80px
      rowHeight: '85px', // Reduced from 100px
      controlSize: '1.0' // Normal size
    };
  };

  const dimensions = getResponsiveDimensions();

  // Calculate viewport height minus header for full coverage
  const getViewportHeight = () => {
    const headerHeight = parseFloat(dimensions.headerHeight);
    const availableHeight = window.innerHeight - headerHeight - 20; // Reduced from 40px to 20px
    return `${Math.max(availableHeight, 400)}px`; // Increased minimum from 300px to 400px
  };

  // Calculate how many rows we need to fill the viewport
  const getRequiredRows = () => {
    const viewportHeight = parseFloat(getViewportHeight());
    const rowHeight = parseFloat(dimensions.rowHeight);
    return Math.ceil(viewportHeight / rowHeight);
  };

  // Generate empty rows to fill the viewport
  const generateEmptyRows = () => {
    const requiredRows = getRequiredRows();
    const actualCompanies = companies.length;
    const emptyRowsNeeded = Math.max(0, requiredRows - actualCompanies);
    
    return Array.from({ length: emptyRowsNeeded }, (_, index) => ({
      id: `empty-${index}`,
      isEmpty: true
    }));
  };

  const emptyRows = generateEmptyRows();
  const allRows = [...companies, ...emptyRows];

  // Type guard to check if row is empty
  const isEmptyRow = (row: any): row is { id: string; isEmpty: boolean } => {
    return row && typeof row === 'object' && 'isEmpty' in row && row.isEmpty === true;
  };

  return (
    <div className={`calendar-layout ${className}`} style={{ 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Full Viewport Calendar Grid with Sticky Headers */}
      <div style={{
        height: getViewportHeight(),
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Sticky Header - Week Navigation + Day Headers */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--primary-bg)',
          borderBottom: '2px solid var(--border-color)'
        }}>
          {/* Week Navigation - 30% smaller */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${parseFloat(dimensions.headerHeight) * 0.3}px 2rem`,
            backgroundColor: 'var(--secondary-bg)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: `${0.5 * parseFloat(dimensions.controlSize)}rem`, 
              marginRight: '2rem' 
            }}>
              <button
                onClick={handlePreviousWeek}
                style={{
                  padding: `${0.5 * parseFloat(dimensions.controlSize)}rem`,
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: `scale(${dimensions.controlSize})`
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div 
                ref={weekBoxRef}
                onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--primary-bg)',
                  borderRadius: '4px',
                  minWidth: `${80 * parseFloat(dimensions.controlSize)}px`,
                  transform: `scale(${dimensions.controlSize})`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: showMiniCalendar ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `scale(${parseFloat(dimensions.controlSize) * 1.05})`;
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(184, 134, 11, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `scale(${dimensions.controlSize})`;
                  e.currentTarget.style.boxShadow = showMiniCalendar ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`, fontWeight: '600' }}>
                  Week {getCurrentWeekInfo().weekNumber}
                </div>
                <div style={{ fontSize: `${0.75 * parseFloat(dimensions.controlSize)}rem`, fontStyle: 'italic', opacity: 0.8 }}>
                  {getCurrentWeekInfo().month} {getCurrentWeekInfo().yearShort}
                </div>
              </div>
              
              <button
                onClick={handleNextWeek}
                style={{
                  padding: `${0.5 * parseFloat(dimensions.controlSize)}rem`,
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: `scale(${dimensions.controlSize})`
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Event Filter Toggle and Search - 30% smaller */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: `${2 * parseFloat(dimensions.controlSize)}rem`,
              transform: `scale(${dimensions.controlSize})`
            }}>
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
                    padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                    backgroundColor: showMyEventsOnly 
                      ? 'var(--accent-bg)' : 'transparent',
                    color: showMyEventsOnly 
                      ? 'var(--primary-bg)' : 'var(--primary-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  My Events
                </button>
                <button
                  onClick={() => handleEventFilterToggle('all_events')}
                  style={{
                    padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                    backgroundColor: !showMyEventsOnly 
                      ? 'var(--accent-bg)' : 'transparent',
                    color: !showMyEventsOnly 
                      ? 'var(--primary-bg)' : 'var(--primary-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
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
                  size={18 * parseFloat(dimensions.controlSize)} 
                  style={{ 
                    position: 'absolute', 
                    left: `${0.75 * parseFloat(dimensions.controlSize)}rem`, 
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
                    paddingLeft: `${2.5 * parseFloat(dimensions.controlSize)}rem`,
                    paddingRight: `${1 * parseFloat(dimensions.controlSize)}rem`,
                    paddingTop: `${0.5 * parseFloat(dimensions.controlSize)}rem`,
                    paddingBottom: `${0.5 * parseFloat(dimensions.controlSize)}rem`,
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
                    width: `${200 * parseFloat(dimensions.controlSize)}px`,
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

          {/* Day Headers - 30% smaller, darker, fancy styling */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px repeat(7, 1fr)',
            height: dimensions.headerHeight
          }}>
            {/* Company Tickers Header */}
            <div style={{
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRight: '1px solid #444',
              fontWeight: '700',
              fontSize: `${0.8 * parseFloat(dimensions.controlSize)}rem`,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #444',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              Tickers
            </div>

            {/* Day Column Headers - Professional styling */}
            {dayColumns.map((day, index) => (
              <div
                key={`day-header-${index}`}
                style={{
                  padding: '0.75rem 0.5rem',
                  background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                  borderRight: index < dayColumns.length - 1 ? '1px solid #444' : 'none',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: `${0.8 * parseFloat(dimensions.controlSize)}rem`,
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderBottom: '1px solid #444',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.3px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: `${0.75 * parseFloat(dimensions.controlSize)}rem`, fontWeight: '800' }}>
                  {day.dayName}
                </div>
                <div style={{ fontSize: `${0.6 * parseFloat(dimensions.controlSize)}rem`, opacity: 0.8 }}>
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Company Rows - Fill viewport with actual companies + empty rows */}
        <div style={{
          flex: 1,
          overflowY: allRows.length > getRequiredRows() ? 'auto' : 'hidden', // Only scroll when needed
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}>
          <style>
            {`
              .calendar-scroll::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera */
              }
            `}
          </style>
          <div className="calendar-scroll" style={{
            display: 'grid',
            gridTemplateColumns: '150px repeat(7, 1fr)',
            minHeight: '100%'
          }}>
            {/* All Rows - Actual companies + empty rows to fill viewport */}
            {allRows.map((row, rowIndex) => {
              // Skip if this is an empty row
              if (isEmptyRow(row)) {
                return (
                  <React.Fragment key={`empty-row-${row.id}`}>
                    {/* Empty Company Ticker Cell - No borders */}
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent', // Completely transparent - no background
                        height: dimensions.rowHeight,
                        minHeight: dimensions.rowHeight
                      }}
                    />
                    {/* Empty Event Cells - No borders */}
                    {dayColumns.map((day, dayIndex) => (
                      <div
                        key={`empty-cell-${row.id}-${dayIndex}`}
                        style={{
                          height: dimensions.rowHeight,
                          minHeight: dimensions.rowHeight,
                          padding: '0.25rem',
                          background: 'transparent', // Completely transparent - no background
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          overflow: 'hidden'
                        }}
                      />
                    ))}
                  </React.Fragment>
                );
              }

              // Render actual company row
              const company = row as CompanyRow;
              return (
              <React.Fragment key={`company-row-${company.id}`}>
                  {/* Company Ticker Cell */}
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#0a0a0a !important', // Completely dark background, override CSS variables
                      borderRight: '1px solid #333',
                      borderBottom: rowIndex < allRows.length - 1 ? '1px solid #333' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      height: dimensions.rowHeight,
                      minHeight: dimensions.rowHeight,
                      position: 'relative',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.01)'
                    }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLDivElement).style.backgroundColor = '#1a1a1a';
                    (e.target as HTMLDivElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLDivElement).style.backgroundColor = '#0a0a0a';
                    (e.target as HTMLDivElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.01)';
                  }}
                >
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '0.125rem',
                    letterSpacing: '0.5px',
                    backgroundColor: 'transparent'
                  }}>
                    {company.ticker_symbol}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    color: '#b0b0b0',
                    lineHeight: '1.2',
                    fontWeight: '400',
                    backgroundColor: 'transparent'
                  }}>
                    {company.company_name}
                  </div>
                </div>

                  {/* Event Cells for this Company */}
                  {dayColumns.map((day, dayIndex) => (
                    <div
                      key={`cell-${company.id}-${dayIndex}`}
                      style={{
                        height: dimensions.rowHeight,
                        minHeight: dimensions.rowHeight,
                        padding: '0.25rem',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                        borderRight: dayIndex < dayColumns.length - 1 ? '1px solid #333' : 'none',
                        borderBottom: rowIndex < allRows.length - 1 ? '1px solid #333' : 'none',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--primary-bg)',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Loading Calendar...
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted-text)' }}>
              {isUsingMockData ? 'Loading mock data' : 'Connecting to API'}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'var(--error-color)',
          color: 'white',
          padding: '1rem',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {isUsingMockData ? 'Offline Mode' : 'Connection Error'}
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            {error}
          </div>
        </div>
      )}


      {/* Event Details Panel */}
      <EventDetailsPanel
        event={selectedEvent}
        isVisible={isEventDetailsVisible}
        onClose={handleCloseEventDetails}
        onRSVPUpdate={handleRSVPUpdate}
      />

      {/* Mini Calendar Popover */}
      {showMiniCalendar && weekBoxRef.current && (
        <>
          {/* Backdrop - click to close */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: 999
            }}
            onClick={() => setShowMiniCalendar(false)}
          />
          
          {/* Popover */}
          <div
            style={{
              position: 'fixed',
              top: (() => {
                const rect = weekBoxRef.current!.getBoundingClientRect();
                const popoverHeight = 450; // Increased height for bigger calendar
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                
                // If not enough space below, show above
                if (spaceBelow < popoverHeight + 20 && rect.top > popoverHeight) {
                  return `${rect.top - popoverHeight - 8}px`;
                }
                // Otherwise show below
                return `${rect.bottom + 8}px`;
              })(),
              left: (() => {
                const rect = weekBoxRef.current!.getBoundingClientRect();
                const popoverWidth = 420; // Increased width for bigger calendar
                const viewportWidth = window.innerWidth;
                
                // Center on mobile
                if (isMobile) {
                  return '50%';
                }
                
                // Desktop: Position relative to week box
                let leftPos = rect.left - (popoverWidth / 2) + (rect.width / 2);
                
                // Keep within viewport
                if (leftPos < 10) leftPos = 10;
                if (leftPos + popoverWidth > viewportWidth - 10) {
                  leftPos = viewportWidth - popoverWidth - 10;
                }
                
                return `${leftPos}px`;
              })(),
              transform: isMobile ? 'translateX(-50%)' : 'none',
              zIndex: 1000,
              backgroundColor: 'var(--secondary-bg)',
              border: '2px solid var(--accent-bg)',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              padding: '1.5rem', // Increased padding
              animation: 'slideDown 0.2s ease-out',
              minWidth: isMobile ? '90vw' : '420px',
              maxWidth: isMobile ? '90vw' : '500px'
            }}
          >
            <MiniCalendar
              selectedDate={currentWeek}
              events={events}
              onDateSelect={(date) => {
                setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }));
                setShowMiniCalendar(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarLayout;