/**
 * AGORA Calendar Layout Component
 * 
 * PHASE 4: Fixed Grid Height with Sticky Headers
 * Features: Responsive design, subscription filtering, smooth scrolling
 * 
 * SAFETY: Uses API data with mock fallbacks, error boundaries
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, RefreshCw } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, getWeek, getYear, addDays, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, parse, isValid, startOfDay } from 'date-fns';
import {
  CompanyRow
} from '../../types/calendar';
import { CalendarEvent } from '../../types/database';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useOutlookCalendarSync } from '../../hooks/useOutlookCalendarSync';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../utils/apiClient';
import EventCell from './EventCell';
import EventDetailsPanel from './EventDetailsPanel';
import CompanyOrderPanel from './CompanyOrderPanel';
import CompanyCalendarView from './CompanyCalendarView';

// =====================================================================================
// CALENDAR LAYOUT COMPONENT
// =====================================================================================

interface CalendarLayoutProps {
  className?: string;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ 
  className = ''
}) => {
  // API data hook
  const {
    companies,
    events,
    loading,
    error,
    updateRSVP,
    updateCompanyOrder,
    refreshData
  } = useCalendarData({ 
    enableRealtime: true
  });

  // Outlook calendar sync hook
  const {
    selectedDate: outlookSelectedDate,
    visibleRange: outlookVisibleRange,
    isOutlook: isOutlookContext,
  } = useOutlookCalendarSync({
    onDateChange: (date) => {
      // Sync AGORA calendar to Outlook's selected date
      setCurrentWeek(date);
    },
    onDateRangeChange: (range) => {
      // Optionally adjust view to match Outlook's visible range
      // This could change the view mode or date range
    },
    syncInterval: 5000, // Sync every 5 seconds when in Outlook
  });

  // Local state for UI interactions
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsVisible, setIsEventDetailsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Search state for calendar filtering
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calendar view mode state (week, month, 2month, 3month) with localStorage persistence
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month' | '2month' | '3month'>(() => {
    // Load from localStorage on initial render
    const savedViewMode = localStorage.getItem('agora-calendar-view-mode');
    if (savedViewMode && ['week', 'month', '2month', '3month'].includes(savedViewMode)) {
      return savedViewMode as 'week' | 'month' | '2month' | '3month';
    }
    return 'week'; // Default to week view
  });
  
  // Company calendar view state
  const [viewMode, setViewMode] = useState<'main' | 'company'>('main');
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  
  // Company reordering state
  const [companyOrder, setCompanyOrder] = useState<string[]>([]);
  const [isCompanyOrderPanelVisible, setIsCompanyOrderPanelVisible] = useState(false);
  
  // Refs for scroll synchronization
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowsScrollRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Mobile detection and viewport height recalculation
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Recalculate rows when window size changes
  useEffect(() => {
    const handleResize = () => {
      // Force re-render to recalculate rows for new viewport size
      setCurrentWeek(prev => new Date(prev.getTime() + 1));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force re-render when companies change to recalculate empty rows
  useEffect(() => {
    // This will trigger a re-render when companies change
  }, [companies.length]);

  // Persist calendar view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('agora-calendar-view-mode', calendarViewMode);
  }, [calendarViewMode]);

  // Load company order from database and localStorage on mount
  useEffect(() => {
    const loadCompanyOrder = async () => {
      try {
        // First try to load from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Load from database
          const response = await apiClient.getUserOrderedCompanies(user.id);
          if (response.success && response.data) {
            const dbOrder = response.data.map(company => company.id);
            setCompanyOrder(dbOrder);
            // Also save to localStorage for offline access
            localStorage.setItem('agora-company-order', JSON.stringify(dbOrder));
            return;
          }
        }
      } catch (error) {
        }

      // Fallback to localStorage
      const savedOrder = localStorage.getItem('agora-company-order');
      if (savedOrder) {
        try {
          setCompanyOrder(JSON.parse(savedOrder));
        } catch (error) {
          }
      }
    };

    loadCompanyOrder();
  }, []);

  // Computed ordered companies based on saved order
  const orderedCompanies = useMemo(() => {
    if (companyOrder.length === 0) {
      return companies;
    }
    
    // Create a map for quick lookup
    const orderMap = new Map(companyOrder.map((id, index) => [id, index]));
    
    return [...companies].sort((a, b) => {
      const aOrder = orderMap.get(a.id) ?? 999;
      const bOrder = orderMap.get(b.id) ?? 999;
      return aOrder - bOrder;
    });
  }, [companies, companyOrder]);

  // Generate date range based on view mode
  function getDateRangeForViewMode(viewMode: 'week' | 'month' | '2month' | '3month', baseDate: Date) {
    if (viewMode === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday start
      return { start, end: addDays(start, 6) };
    } else {
      // For month views, start from the first day of the first month
      const start = startOfMonth(baseDate);
      let end: Date;
      
      if (viewMode === 'month') {
        end = endOfMonth(baseDate);
      } else if (viewMode === '2month') {
        end = endOfMonth(addMonths(baseDate, 1));
      } else { // 3month
        end = endOfMonth(addMonths(baseDate, 2));
      }
      
      return { start, end };
    }
  }

  // Filtered ticker data based on search query
  const filteredTickerData = useMemo(() => {
    // If no search query, return all ordered companies
    if (!searchQuery.trim()) {
      return orderedCompanies;
    }
    
    const queryLower = searchQuery.toLowerCase().trim();
    const { start, end } = getDateRangeForViewMode(calendarViewMode, currentWeek);
    const startDay = startOfDay(start);
    const endDay = startOfDay(end);
    
    return orderedCompanies.filter((company) => {
      // Condition 1: Ticker symbol or company name match
      const tickerMatch = company.ticker_symbol?.toLowerCase().includes(queryLower);
      const nameMatch = company.company_name?.toLowerCase().includes(queryLower);
      
      if (tickerMatch || nameMatch) {
        return true;
      }
      
      // Condition 2: Event match (check events in current date range)
      const hasMatchingEvent = events.some((event) => {
        // Check if event is for this company
        const isForCompany = event.companies.some((comp: any) => comp.id === company.id);
        if (!isForCompany) return false;
        
        // Check if event is in current date range
        const eventDate = new Date(event.start_date);
        const eventDay = startOfDay(eventDate);
        const isInRange = eventDay >= startDay && eventDay <= endDay;
        if (!isInRange) return false;
        
        // Check if event title or description matches query
        const titleMatch = event.title?.toLowerCase().includes(queryLower);
        const descriptionMatch = event.description?.toLowerCase().includes(queryLower);
        
        return titleMatch || descriptionMatch;
      });
      
      return hasMatchingEvent;
    });
  }, [orderedCompanies, events, searchQuery, calendarViewMode, currentWeek]);

  // Generate day columns based on view mode
  const generateDayColumns = (): Array<{ dayName: string; dayNumber: number; date: Date; fullLabel: string }> => {
    const { start, end } = getDateRangeForViewMode(calendarViewMode, currentWeek);
    const allDates = eachDayOfInterval({ start, end });
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    return allDates.map((date: Date) => {
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      const dayNumber = date.getDate();
      
      return {
        dayName,
        dayNumber,
        date,
        fullLabel: `${dayName} ${dayNumber}`
      };
      });
  };

  const dayColumns = generateDayColumns();

  // Date parsing utility functions
  const parseDateQuery = (query: string): Date | null => {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check for relative dates
    if (normalizedQuery === 'today') {
      return startOfDay(new Date());
    }
    if (normalizedQuery === 'tomorrow') {
      return startOfDay(addDays(new Date(), 1));
    }
    if (normalizedQuery === 'yesterday') {
      return startOfDay(addDays(new Date(), -1));
    }
    if (normalizedQuery.startsWith('next ')) {
      const dayName = normalizedQuery.replace('next ', '');
      const dayMap: { [key: string]: number } = {
        'monday': 1, 'mon': 1,
        'tuesday': 2, 'tue': 2, 'tues': 2,
        'wednesday': 3, 'wed': 3,
        'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
        'friday': 5, 'fri': 5,
        'saturday': 6, 'sat': 6,
        'sunday': 0, 'sun': 0
      };
      const targetDay = dayMap[dayName];
      if (targetDay !== undefined) {
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = (targetDay - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // Next week if today
        return startOfDay(addDays(today, daysToAdd));
      }
    }
    
    // Check for date formats: MM/DD, MM-DD, M/D, Dec 31, December 31
    const dateFormats = [
      'MM/dd/yyyy', 'MM-dd-yyyy', 'M/d/yyyy', 'M-dd-yyyy',
      'MMM dd', 'MMMM dd', 'MMM dd yyyy', 'MMMM dd yyyy',
      'MM/dd', 'M/d', 'MM-dd', 'M-dd'
    ];
    
    for (const formatStr of dateFormats) {
      try {
        const parsed = parse(normalizedQuery, formatStr, new Date());
        if (isValid(parsed)) {
          // If no year specified, use current year
          if (!formatStr.includes('yyyy')) {
            const currentYear = new Date().getFullYear();
            parsed.setFullYear(currentYear);
          }
          return startOfDay(parsed);
        }
      } catch (e) {
        // Continue to next format
      }
    }
    
    return null;
  };

  // Global search handler with intent detection
  const handleGlobalSearch = (query: string) => {
    const trimmedQuery = query.trim();
    setSearchQuery(trimmedQuery);
    
    // If empty, clear search
    if (!trimmedQuery) {
      return;
    }
    
    // Check for date intent
    const parsedDate = parseDateQuery(trimmedQuery);
    if (parsedDate) {
      // Navigate calendar to the parsed date
      setCurrentWeek(parsedDate);
      // Clear search query after navigation
      setSearchQuery('');
      return;
    }
    
    // Ticker and text filtering will be handled by getFilteredTickerData
    // The searchQuery state will trigger the filtering automatically
  };

  // Listen for global search events from GlobalSearch component
  useEffect(() => {
    const handleGlobalSearchEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      handleGlobalSearch(customEvent.detail || '');
    };

    window.addEventListener('global-search', handleGlobalSearchEvent as EventListener);
    return () => window.removeEventListener('global-search', handleGlobalSearchEvent as EventListener);
  }, []);

  // Handle event filter toggle
  const handleEventFilterToggle = (filter: 'my_events' | 'all_events') => {
    setShowMyEventsOnly(filter === 'my_events');
  };

  // Handle company ticker click
  const handleCompanyTickerClick = (company: CompanyRow) => {
    setSelectedCompany(company);
    setViewMode('company');
  };

  // Handle back to main calendar
  const handleBackToMainCalendar = () => {
    setViewMode('main');
    setSelectedCompany(null);
  };


  // Navigation handlers for different view modes
  const handlePreviousPeriod = () => {
    if (calendarViewMode === 'week') {
    setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(subMonths(currentWeek, 1));
    }
  };

  const handleNextPeriod = () => {
    if (calendarViewMode === 'week') {
    setCurrentWeek(addWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addMonths(currentWeek, 1));
    }
  };

  const getCurrentPeriodInfo = () => {
    if (calendarViewMode === 'week') {
    const weekNumber = getWeek(currentWeek, { weekStartsOn: 1 });
    const year = getYear(currentWeek);
    const month = format(currentWeek, 'MMM');
    
    return {
        label: `Week ${weekNumber}`,
        subLabel: `${month} ${year}`,
        type: 'week' as const
      };
    } else {
      const { start, end } = getDateRangeForViewMode(calendarViewMode, currentWeek);
      const startMonth = format(start, 'MMM');
      const startYear = format(start, 'yyyy');
      const endMonth = format(end, 'MMM');
      const endYear = format(end, 'yyyy');
      
      let label = '';
      if (calendarViewMode === 'month') {
        label = `${startMonth} ${startYear}`;
      } else if (calendarViewMode === '2month') {
        if (startMonth === endMonth && startYear === endYear) {
          label = `${startMonth} ${startYear}`;
        } else {
          label = `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
      } else { // 3month
        label = `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
      }
      
      return {
        label,
        subLabel: '',
        type: 'month' as const
      };
    }
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
    }
  };

  // Company reordering handlers
  const handleCompanyOrderChange = async (newOrder: CompanyRow[]) => {
    const newOrderIds = newOrder.map(company => company.id);
    setCompanyOrder(newOrderIds);
    
    // Save to localStorage
    localStorage.setItem('agora-company-order', JSON.stringify(newOrderIds));
    
    // Save to database
    try {
      // Prepare company order data
      const companyOrders = newOrder.map((company, index) => ({
        company_id: company.id,
        display_order: index
      }));

      // Save to database via API
      await updateCompanyOrder(companyOrders);
    } catch (error) {
      // Don't throw error - localStorage backup is still working
    }
  };

  const handleOpenCompanyOrderPanel = () => {
    setIsCompanyOrderPanelVisible(true);
  };

  // Get events for a specific company and date
  const getEventsForCell = (companyId: string, date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      const isSameDate = eventDate.toDateString() === date.toDateString();
      const isForCompany = event.companies.some((company: any) => company.id === companyId);
      
      // Apply event filter (my events only)
      const matchesEventFilter = !showMyEventsOnly || 
        event.user_response?.response_status === 'accepted';
      
      return isSameDate && isForCompany && matchesEventFilter;
    });
  };


  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (isMobile) {
      return {
        headerHeight: '50px', // Reduced from 60px
        rowHeight: '75px', // Slightly increased for better space utilization
        controlSize: '1.0' // Normal size
      };
    }
    return {
      headerHeight: '60px', // Reduced from 80px
      rowHeight: '90px', // Slightly increased for better space utilization
      controlSize: '1.0' // Normal size
    };
  };

  const dimensions = getResponsiveDimensions();

  // Simplified viewport height using CSS calc() for reliability
  const getViewportHeight = () => {
    return 'calc(100vh - 100px)'; // Reduced from 120px to 100px for tighter fit
  };

  // Responsive row calculation based on viewport height
  const getRequiredRows = () => {
    const viewportHeight = window.innerHeight;
    const headerHeight = 200; // Approximate height of headers and controls
    const availableHeight = viewportHeight - headerHeight;
    const rowHeight = 60; // Approximate height per row
    
    // Calculate how many rows can fit in the viewport
    const maxRowsForViewport = Math.floor(availableHeight / rowHeight);
    
    // Use the larger of: actual companies, minimum 4 rows, or viewport-filling rows
    const minRows = Math.min(4, filteredTickerData.length); // Reduced minimum for small screens
    const viewportRows = Math.max(minRows, maxRowsForViewport - 2); // Leave some padding
    
    return Math.max(viewportRows, filteredTickerData.length);
  };

  // Generate empty rows to maintain consistent layout
  const generateEmptyRows = () => {
    const requiredRows = getRequiredRows();
    const actualCompanies = filteredTickerData.length;
    const emptyRowsNeeded = Math.max(0, requiredRows - actualCompanies);
    
    return Array.from({ length: emptyRowsNeeded }, (_, index) => ({
      id: `empty-${index}`,
      isEmpty: true
    }));
  };

  const emptyRows = generateEmptyRows();
  const allRows = [...filteredTickerData, ...emptyRows];

  // Type guard to check if row is empty
  const isEmptyRow = (row: any): row is { id: string; isEmpty: boolean } => {
    return row && typeof row === 'object' && 'isEmpty' in row && row.isEmpty === true;
  };

  // Render company calendar view if selected
  if (viewMode === 'company' && selectedCompany) {
    return (
      <CompanyCalendarView
        company={selectedCompany}
        events={events}
        onBack={handleBackToMainCalendar}
        onEventClick={handleEventClick}
      />
    );
  }

  // Empty state when no companies are subscribed
  if (orderedCompanies.length === 0 && !loading) {
    return (
      <div className={`calendar-layout ${className}`} style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'var(--secondary-bg)',
          padding: '3rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          maxWidth: '600px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📅</div>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            color: 'var(--primary-text)',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome to AGORA Calendar
          </h2>
          <p style={{ 
            color: 'var(--muted-text)', 
            marginBottom: '2rem',
            lineHeight: '1.6',
            fontSize: '1.1rem'
          }}>
            To get started, you need to subscribe to companies you want to track. 
            This will populate your calendar with their earnings calls, conferences, and other important events.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={() => window.location.href = '/subscriptions'}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--primary-bg)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.3)';
              }}
            >
              Manage Subscriptions
            </button>
            <p style={{
              color: 'var(--muted-text)',
              fontSize: '0.9rem',
              margin: 0
            }}>
              Choose from 100+ companies across different sectors
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <div 
        className="calendar-container"
        style={{
        height: getViewportHeight(),
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '300px' // Reduced minimum height to eliminate excess space
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
                onClick={handlePreviousPeriod}
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
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--primary-bg)',
                borderRadius: '4px',
                minWidth: `${80 * parseFloat(dimensions.controlSize)}px`,
                transform: `scale(${dimensions.controlSize})`
              }}>
                <div style={{ fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`, fontWeight: '600' }}>
                  {getCurrentPeriodInfo().label}
                </div>
                {getCurrentPeriodInfo().subLabel && (
                <div style={{ fontSize: `${0.75 * parseFloat(dimensions.controlSize)}rem`, fontStyle: 'italic', opacity: 0.8 }}>
                    {getCurrentPeriodInfo().subLabel}
                </div>
                )}
              </div>
              
              <button
                onClick={handleNextPeriod}
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

            {/* View Mode Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--tertiary-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginRight: '2rem',
              transform: `scale(${dimensions.controlSize})`
            }}>
              {(['week', 'month', '2month', '3month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCalendarViewMode(mode)}
                  style={{
                    padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                    backgroundColor: calendarViewMode === mode 
                      ? 'var(--accent-bg)' : 'transparent',
                    color: calendarViewMode === mode 
                      ? 'var(--primary-bg)' : 'var(--primary-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {mode === 'week' ? 'Week' : mode === 'month' ? '1M' : mode === '2month' ? '2M' : '3M'}
                </button>
              ))}
            </div>

            {/* Event Filter Toggle and Reorder Button */}
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


              {/* Reorder Companies Button */}
              <button
                onClick={handleOpenCompanyOrderPanel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                  backgroundColor: 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                }}
                title="Reorder companies"
              >
                <GripVertical size={16} />
                Reorder
              </button>

              {/* Refresh Data Button */}
              <button
                onClick={refreshData}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: `${0.5 * parseFloat(dimensions.controlSize)}rem ${1 * parseFloat(dimensions.controlSize)}rem`,
                  backgroundColor: loading ? 'var(--muted-text)' : 'var(--tertiary-bg)',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: `${0.875 * parseFloat(dimensions.controlSize)}rem`,
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                  }
                }}
                title="Refresh calendar data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Day Headers - Support for scrolling in month views */}
          {calendarViewMode === 'week' ? (
            // Week view: Original grid layout
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

              {/* Day Column Headers */}
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
          ) : (
            // Month views: Fixed TICKERS column + scrollable day columns
            <div style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              height: dimensions.headerHeight
            }}>
              {/* Fixed TICKERS Header */}
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
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#1a1a1a'
              }}>
                Tickers
              </div>

              {/* Scrollable Day Headers Container */}
              <div 
                ref={headerScrollRef}
                className="month-view-scrollable"
                onScroll={(e) => {
                  // Sync scroll with rows container
                  const scrollLeft = e.currentTarget.scrollLeft;
                  rowsScrollRefs.current.forEach((ref) => {
                    if (ref) ref.scrollLeft = scrollLeft;
                  });
                }}
                style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollbarWidth: 'none', // Firefox - hide scrollbar
                  msOverflowStyle: 'none' // IE/Edge - hide scrollbar
                }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${dayColumns.length}, 100px)`,
                  minWidth: `${dayColumns.length * 100}px`,
                  height: '100%'
                }}>
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
                        position: 'relative',
                        minWidth: '100px'
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
            </div>
          )}
        </div>

        {/* Scrollable Company Rows - Fill viewport with actual companies + empty rows */}
        <div 
          className="calendar-scroll"
          style={{
            flex: 1,
            overflowY: orderedCompanies.length > 0 ? 'auto' : 'hidden', // Always allow scroll when there are companies
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}>
          <style>
            {`
              .calendar-scroll::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera */
              }
              
              /* Hide scrollbars for month view horizontal scrolling - cross-browser support */
              .month-view-scrollable::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera, newer Edge - hide scrollbars */
                width: 0;
                height: 0;
              }
              
              /* Fix ticker text background - ensure no grey background */
              .ticker-text, .company-name-text {
                background: none !important;
                background-color: transparent !important;
              }
              
              /* Mobile responsive adjustments */
              @media (max-width: 768px) {
                .calendar-container {
                  height: calc(100vh - 80px) !important; /* Smaller header on mobile */
                }
              }
              
              /* Very small screens */
              @media (max-height: 600px) {
                .calendar-container {
                  height: calc(100vh - 60px) !important; /* Even smaller header */
                }
              }
            `}
          </style>
          {calendarViewMode === 'week' ? (
            // Week view: Original grid layout
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompanyTickerClick(company);
                    }}
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
                  <div 
                    className="ticker-text"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.125rem',
                      letterSpacing: '0.5px'
                    }}>
                    {company.ticker_symbol}
                  </div>
                  <div 
                    className="company-name-text"
                    style={{
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                      color: '#b0b0b0',
                      lineHeight: '1.2',
                      fontWeight: '400'
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
                    
                    {/* Subtle placeholder if no events - maintains row height */}
                    {getEventsForCell(company.id, day.date).length === 0 && (
                      <div style={{
                        height: '2rem',
                        minHeight: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.08
                      }}>
                        <div style={{
                          width: '20px',
                          height: '1px',
                          backgroundColor: 'var(--primary-text)',
                          borderRadius: '1px'
                        }} />
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
              );
            })}
          </div>
          ) : (
            // Month views: Fixed TICKERS column + single scrollable container for all rows
            <div style={{
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              minHeight: '100%'
            }}>
              {/* Fixed TICKERS Column */}
              <div style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                {allRows.map((row, rowIndex) => {
                  if (isEmptyRow(row)) {
                    return (
                      <div
                        key={`empty-ticker-${row.id}`}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'transparent',
                          height: dimensions.rowHeight,
                          minHeight: dimensions.rowHeight,
                          borderBottom: rowIndex < allRows.length - 1 ? '1px solid #333' : 'none'
                        }}
                      />
                    );
                  }
                  const company = row as CompanyRow;
                  return (
                    <div
                      key={`ticker-${company.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompanyTickerClick(company);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#0a0a0a',
                        borderRight: '1px solid #333',
                        borderBottom: rowIndex < allRows.length - 1 ? '1px solid #333' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: dimensions.rowHeight,
                        minHeight: dimensions.rowHeight,
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
                      <div 
                        className="ticker-text"
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.125rem',
                          letterSpacing: '0.5px'
                        }}>
                        {company.ticker_symbol}
                      </div>
                      <div 
                        className="company-name-text"
                        style={{
                          fontSize: '0.7rem',
                          fontStyle: 'italic',
                          color: '#b0b0b0',
                          lineHeight: '1.2',
                          fontWeight: '400'
                        }}>
                        {company.company_name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Single Scrollable Container for All Rows */}
              <div 
                ref={(el) => {
                  if (el) rowsScrollRefs.current.set(0, el);
                }}
                className="month-view-scrollable"
                onScroll={(e) => {
                  // Sync scroll with header
                  const scrollLeft = e.currentTarget.scrollLeft;
                  if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = scrollLeft;
                  }
                }}
                style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  scrollbarWidth: 'none', // Firefox - hide scrollbar
                  msOverflowStyle: 'none' // IE/Edge - hide scrollbar
                }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${dayColumns.length}, 100px)`,
                  gridTemplateRows: `repeat(${allRows.length}, ${dimensions.rowHeight})`,
                  minWidth: `${dayColumns.length * 100}px`
                }}>
                  {allRows.map((row, rowIndex) => {
                    if (isEmptyRow(row)) {
                      return dayColumns.map((day, dayIndex) => (
                        <div
                          key={`empty-cell-${row.id}-${dayIndex}`}
                          style={{
                            height: dimensions.rowHeight,
                            minHeight: dimensions.rowHeight,
                            padding: '0.25rem',
                            background: 'transparent',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            overflow: 'hidden',
                            borderRight: dayIndex < dayColumns.length - 1 ? '1px solid #333' : 'none',
                            borderBottom: rowIndex < allRows.length - 1 ? '1px solid #333' : 'none'
                          }}
                        />
                      ));
                    }

                    const company = row as CompanyRow;
                    return dayColumns.map((day, dayIndex) => (
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
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                          minWidth: '100px'
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
                        
                        {/* Subtle placeholder if no events - maintains row height */}
                        {getEventsForCell(company.id, day.date).length === 0 && (
                          <div style={{
                            height: '2rem',
                            minHeight: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.08
                          }}>
                            <div style={{
                              width: '20px',
                              height: '1px',
                              backgroundColor: 'var(--primary-text)',
                              borderRadius: '1px'
                            }} />
                          </div>
                        )}
                      </div>
                    ));
                  })}
                </div>
              </div>
            </div>
          )}
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
              Connecting to API...
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
            Connection Error
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
        onDateSelect={handleDateSelect}
        onRSVPUpdate={handleRSVPUpdate}
        events={events}
      />

      {/* Company Order Panel */}
      <CompanyOrderPanel
        companies={orderedCompanies}
        onOrderChange={handleCompanyOrderChange}
        isVisible={isCompanyOrderPanelVisible}
        onClose={() => setIsCompanyOrderPanelVisible(false)}
      />
    </div>
  );
};

export default CalendarLayout;