/**
 * AGORA Investment Calendar - Main App Component
 * 
 * Bloomberg-style dark theme investment calendar with company-centric view
 * Uses database-aligned mock data that seamlessly transitions to real data
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, getWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Filter, Search, Settings, GripVertical, LogOut, ChevronDown, User, Bell } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { CalendarEvent, CompanyWithEvents } from './types/database';
import { apiClient } from './utils/apiClient';
// mockData imports removed - using Supabase API only
import { UserWithSubscriptions } from './types/database';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import EventsPage from './pages/EventsPage';
import UserProfile from './components/UserProfile';
import NotificationsDrawer from './components/NotificationsDrawer';

interface AppProps {
  authUser?: {
    id: string;
    email: string;
    created_at: string;
    user_metadata?: {
      full_name?: string;
      role?: string;
    };
  } | null;
  onLogout?: () => void;
}

interface AppState {
  currentDate: Date;
  selectedView: 'week' | 'month';
  calendarView: 'week' | 'month';
  eventFilter: 'all' | 'my';
  events: CalendarEvent[];
  companies: CompanyWithEvents[];
  selectedEvent: CalendarEvent | null;
  selectedCompany: CompanyWithEvents | null;
  showCompanyCalendar: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  lastUpdated?: number;
  eventTypeFilter: 'all' | 'standard' | 'catalyst';
  locationTypeFilter: 'all' | 'physical' | 'virtual' | 'hybrid';
  rsvpStatusFilter: 'all' | 'accepted' | 'declined' | 'pending';
  currentPage: 'calendar' | 'events' | 'subscriptions';
  isExecutiveAssistant: boolean;
  managedUsers: UserWithSubscriptions[];
  selectedManagedUser: UserWithSubscriptions | null;
  showUserProfile: boolean;
  showProfileDropdown: boolean;
  currentUser: UserWithSubscriptions | null;
  subscriptionCount: number;
  showEventsDropdown: boolean;
  showFiltersDropdown: boolean;
  showViewDropdown: boolean;
  showNotificationsDrawer: boolean;
  isReordering: boolean;
}

// Props interface for SortableCompanyCalendarRow
interface SortableCompanyCalendarRowProps {
  company: CompanyWithEvents;
  weekDays: Date[];
  onCompanyClick: (company: CompanyWithEvents) => void;
  onEventClick: (event: CalendarEvent) => void;
  getEventsForCompany: (companyId: string, date: Date) => CalendarEvent[];
  formatEventTime: (event: CalendarEvent) => string;
}

// Sortable Company Calendar Row Component
const SortableCompanyCalendarRow = React.memo<SortableCompanyCalendarRowProps>(({ 
  company, 
  weekDays, 
  onCompanyClick, 
  onEventClick, 
  getEventsForCompany, 
  formatEventTime 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEventClick = useCallback((event: React.MouseEvent<HTMLDivElement>, eventData: CalendarEvent) => {
    event.stopPropagation();
    onEventClick(eventData);
  }, [onEventClick]);

  const handleCompanyClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onCompanyClick(company);
  }, [onCompanyClick, company]);

  return (
    <div
      ref={setNodeRef}
      className={`calendar-grid ${isDragging ? 'dragging' : ''}`}
      style={{ 
        gridTemplateColumns: `200px repeat(7, 1fr)`,
        ...style
      }}
    >
      {/* Company Name Cell with Drag Handle */}
      <div 
        className="calendar-cell company-row"
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem'
        }}
      >
        <div
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{ marginRight: '0.5rem' }}
        >
          <GripVertical size={16} />
        </div>
        <div onClick={(e) => handleCompanyClick(e)} style={{ flex: 1 }}>
          <div className="company-ticker" style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--secondary-text)' }}>
            ({company.ticker_symbol})
          </div>
          <div className="company-name" style={{ fontSize: '0.75rem', color: 'var(--primary-text)' }}>
            {company.company_name}
          </div>
        </div>
      </div>

      {/* Event Cells for Each Day */}
      {weekDays.map((day: Date) => {
        const dayEvents: CalendarEvent[] = getEventsForCompany(company.id, day);
        return (
          <div key={`${company.id}-${day.toISOString()}`} className="calendar-cell" style={{ minHeight: '80px', padding: '0.5rem' }}>
            <div className="calendar-events" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {dayEvents.map((event: CalendarEvent) => (
                <div
                  key={event.id}
                  className={`event-block status-${event.user_response?.response_status || 'pending'}`}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => handleEventClick(e, event)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="event-title" style={{ fontSize: '0.75rem', fontWeight: '600' }}>{event.title}</div>
                  <div className="event-time" style={{ fontSize: '0.625rem', opacity: 0.8 }}>{formatEventTime(event)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

const App: React.FC<AppProps> = ({ authUser, onLogout }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const saveCompanyOrderRef = useRef<NodeJS.Timeout | null>(null);
  const prevCompaniesRef = useRef<CompanyWithEvents[]>([]);
  const [state, setState] = useState<AppState>({
    currentDate: new Date(),
    selectedView: 'week',
    calendarView: 'week',
    eventFilter: 'all',
    events: [],
    companies: [],
    selectedEvent: null,
    selectedCompany: null,
    showCompanyCalendar: false,
    loading: true,
    error: null,
    searchQuery: '',
    lastUpdated: undefined,
    eventTypeFilter: 'all',
    locationTypeFilter: 'all',
    rsvpStatusFilter: 'all',
    currentPage: 'calendar',
    isExecutiveAssistant: false,
    managedUsers: [],
    selectedManagedUser: null,
    showUserProfile: false,
    showProfileDropdown: false,
    currentUser: null,
    subscriptionCount: 0,
    showEventsDropdown: false,
    showFiltersDropdown: false,
    showViewDropdown: false,
    isReordering: false,
    showNotificationsDrawer: false
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get current user from state
  const currentUser = state.currentUser;
  
  // Reset state when authUser changes (user switch/logout/login)
  useEffect(() => {
    if (!authUser) {
      // User logged out - reset everything
      setState(prev => ({
        ...prev,
        currentUser: null,
        events: [],
        companies: [],
        selectedEvent: null,
        selectedCompany: null,
        showCompanyCalendar: false,
        subscriptionCount: 0,
        loading: false,
        error: null
      }));
      return;
    } else {
      // New user logged in - reset data to show loading state
      setState(prev => ({
        ...prev,
        currentUser: null, // Will be loaded by loadCurrentUser
        events: [],
        companies: [],
        selectedEvent: null,
        selectedCompany: null,
        showCompanyCalendar: false,
        subscriptionCount: 0,
        loading: true, // Show loading while new user data loads
        error: null
      }));
    }
  }, [authUser]); // Trigger when authUser changes

  // Load current user data when authUser changes
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (authUser?.id) {
        try {
          const userResponse = await apiClient.getUserSubscriptions(authUser.id);
          if (userResponse.success) {
            const user: UserWithSubscriptions = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email || '',
              role: (authUser.user_metadata?.role as 'investment_analyst' | 'executive_assistant') || 'investment_analyst',
              is_active: true,
              created_at: new Date(authUser.created_at),
              updated_at: new Date(),
              preferences: {},
              subscriptions: userResponse.data
            };
      
      setState(prev => ({
        ...prev,
              currentUser: user,
              subscriptionCount: userResponse.data.filter(sub => sub.is_active && sub.payment_status === 'paid').length
            }));
          }
        } catch (error) {
          console.error('Failed to load current user:', error);
        }
      }
    };

    loadCurrentUser();
  }, [authUser]);
  
  // TODO: Re-implement EA functionality with real API
  // Temporarily disabled to test events functionality

  const loadSubscriptionCount = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      const response = await apiClient.getUserSubscriptions(currentUser.id);
      if (response.success) {
        const activeSubscriptions = response.data.filter(sub => sub.is_active && sub.payment_status === 'paid');
      setState(prev => ({
        ...prev,
          subscriptionCount: activeSubscriptions.length,
          currentUser: prev.currentUser ? {
            ...prev.currentUser,
            subscriptions: response.data
          } : null
        }));
      }
    } catch (error) {
      console.error('Failed to load subscription count:', error);
    }
  }, [currentUser]);

  const reloadData = () => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      // Force re-render by updating currentDate slightly
      currentDate: new Date(prev.currentDate.getTime() + 1)
    }));
    // Also reload subscription count
    loadSubscriptionCount();
  };

  // Load calendar data function
  const loadCalendarData = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      // Only fetch if we don't have data or if the data is stale
      const shouldFetch = state.companies.length === 0 || 
                        state.events.length === 0 || 
                        Date.now() - (state.lastUpdated || 0) > 5 * 60 * 1000; // 5 minutes

      if (!shouldFetch) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

        setState(prev => ({ ...prev, loading: true, error: null }));

      // Load events and companies in parallel
      const [eventsResponse, companiesResponse] = await Promise.all([
        apiClient.getEvents({
          start_date: new Date('2024-01-01'),
          end_date: new Date('2025-12-31'),
          user_id: currentUser.id
        }),
        apiClient.getCompanies({
          user_id: currentUser.id
        })
      ]);

      let companies = companiesResponse.data.companies;

      // Load custom order if available
      try {
        const orderedResponse = await apiClient.getUserOrderedCompanies(currentUser.id);
        if (orderedResponse.success && orderedResponse.data.length > 0) {
          const orderMap = new Map();
          orderedResponse.data.forEach((company, index) => {
            orderMap.set(company.id, index);
          });
          
          companies = companies.sort((a, b) => {
            const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
          });
        }
      } catch (error) {
        console.warn('Failed to load custom company order, using default:', error);
        }

        setState(prev => ({
          ...prev,
        events: eventsResponse.data.events,
        companies: companies,
        loading: false,
        lastUpdated: Date.now()
        }));

      } catch (error) {
        console.error('Failed to load calendar data:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load calendar data',
          loading: false
        }));
      }
  }, [currentUser, state.companies.length, state.events.length, state.lastUpdated]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    // Don't load data if no current user
    if (!currentUser) {
      setState(prev => ({ ...prev, loading: false, companies: [], events: [] }));
      return;
    }

    loadCalendarData();
  }, [state.currentDate, state.eventFilter, currentUser, state.subscriptionCount, loadCalendarData]);

  // Add cleanup for timeouts
  useEffect(() => {
    return () => {
      if (saveCompanyOrderRef.current) {
        clearTimeout(saveCompanyOrderRef.current);
      }
    };
  }, []);

  // Load subscription count on mount
  useEffect(() => {
    if (currentUser) {
      loadSubscriptionCount();
    }
  }, [currentUser, loadSubscriptionCount]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside profile dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setState(prev => ({ 
          ...prev, 
          showProfileDropdown: false
        }));
      }
      
      // Check if click is outside view dropdown
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(target)) {
        setState(prev => ({ 
          ...prev, 
          showViewDropdown: false
        }));
      }
      
      // Close other dropdowns if click is outside any dropdown area
      if (!dropdownRef.current?.contains(target) && !viewDropdownRef.current?.contains(target)) {
        setState(prev => ({ 
          ...prev, 
          showEventsDropdown: false,
          showFiltersDropdown: false
        }));
      }
    };

    if (state.showProfileDropdown || state.showEventsDropdown || state.showFiltersDropdown || state.showViewDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [state.showProfileDropdown, state.showEventsDropdown, state.showFiltersDropdown, state.showViewDropdown]);

  const handlePreviousWeek = () => {
    setState(prev => ({
      ...prev,
      currentDate: addDays(prev.currentDate, -7)
    }));
  };

  const handleNextWeek = () => {
    setState(prev => ({
      ...prev,
      currentDate: addDays(prev.currentDate, 7)
    }));
  };

  const handlePreviousMonth = () => {
    setState(prev => ({
      ...prev,
      currentDate: new Date(prev.currentDate.getFullYear(), prev.currentDate.getMonth() - 1, 1)
    }));
  };

  const handleNextMonth = () => {
    setState(prev => ({
      ...prev,
      currentDate: new Date(prev.currentDate.getFullYear(), prev.currentDate.getMonth() + 1, 1)
    }));
  };




  const handleEventClick = useCallback((event: CalendarEvent) => {
    setState(prev => ({ ...prev, selectedEvent: event }));
  }, []);

  const saveCompanyOrder = async (companies: CompanyWithEvents[], userId: string) => {
    try {
      const newOrder = companies.map((company, index) => ({
        company_id: company.id,
        display_order: index
      }));

      const response = await apiClient.updateCompanyOrder({
        user_id: userId,
        company_orders: newOrder
      });

      if (!response.success) {
        throw new Error('Failed to update company order');
      }
    } catch (error) {
      console.error('Failed to save company order:', error);
      throw error; // Re-throw to handle in the caller
    }
  };

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event;
    setIsDragging(false);

    if (active.id !== over?.id && currentUser) {
      try {
        setState(prev => ({ ...prev, isReordering: true }));
        
        // Store current companies for potential rollback
        setState(prev => {
          prevCompaniesRef.current = [...prev.companies];
          return prev;
        });
        
        // Calculate the new order using current state
      setState(prev => {
        const oldIndex = prev.companies.findIndex(company => company.id === active.id);
        const newIndex = prev.companies.findIndex(company => company.id === over.id);
          const newCompanies = arrayMove(prev.companies, oldIndex, newIndex);
          
          // Clear any pending saves
          if (saveCompanyOrderRef.current) {
            clearTimeout(saveCompanyOrderRef.current);
          }

          // Debounced save
          saveCompanyOrderRef.current = setTimeout(async () => {
            try {
              const newOrder = newCompanies.map((company, index) => ({
                company_id: company.id,
                display_order: index
              }));

              await apiClient.updateCompanyOrder({
                user_id: currentUser.id,
                company_orders: newOrder
              });
            } catch (error) {
              console.error('Failed to save company order:', error);
              // Revert to previous state on error
              setState(prevState => ({
                ...prevState,
                companies: prevCompaniesRef.current
              }));
            } finally {
              setState(prevState => ({ ...prevState, isReordering: false }));
            }
          }, 300); // 300ms debounce
        
        return {
          ...prev,
            companies: newCompanies
        };
      });

      } catch (error) {
        console.error('Error during reorder:', error);
        setState(prev => ({ ...prev, isReordering: false }));
      }
    }
  }, [currentUser]);

  // Create stable drag handlers object to prevent useLayoutEffect dependency changes
  const dragHandlers = useMemo(() => ({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd
  }), [handleDragStart, handleDragEnd]);

  const handleCompanyClick = useCallback((company: CompanyWithEvents) => {
    setState(prev => ({
      ...prev,
      selectedCompany: company,
      showCompanyCalendar: true
    }));
  }, []);

  const handleBackToMainCalendar = () => {
    setState(prev => ({
      ...prev,
      selectedCompany: null,
      showCompanyCalendar: false
    }));
  };

  const getEventColor = (responseStatus: string): string => {
    switch (responseStatus) {
      case 'accepted': return 'green';
      case 'declined': return 'yellow';
      case 'pending': return 'grey';
      default: return 'grey';
    }
  };

  const handleCloseUserProfile = () => {
    setState(prev => ({ ...prev, showUserProfile: false, showProfileDropdown: false }));
  };

  const handleToggleProfileDropdown = () => {
    setState(prev => ({ ...prev, showProfileDropdown: !prev.showProfileDropdown }));
  };

  const handleOpenUserProfile = () => {
    setState(prev => ({ ...prev, showUserProfile: true, showProfileDropdown: false }));
  };

  const handleUserUpdate = (updatedUser: UserWithSubscriptions) => {
    // Update the current user and refresh events if subscriptions changed
    
    // Force a complete reload by resetting the loading state and updating dependencies
    setState(prev => ({ 
      ...prev, 
      showUserProfile: false,
      loading: true,
      error: null,
      // Clear current data to force fresh fetch
      events: [],
      companies: [],
      // Increment date by 1ms to trigger useEffect dependency
      currentDate: new Date(prev.currentDate.getTime() + 1)
    }));
  };


  const handleRSVPUpdate = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      if (!currentUser) {
        console.error('No current user found for RSVP update');
        return;
      }

      
      // Use updateRSVPByEventAndUser which handles both update and create scenarios
      const response = await (apiClient as any).updateRSVPByEventAndUser(eventId, currentUser.id, status);
      
      if (response.success) {
        
        // Update the selected event's user_response in state
        setState(prev => ({
          ...prev,
          selectedEvent: prev.selectedEvent ? {
            ...prev.selectedEvent,
            user_response: response.data
          } : null,
          events: prev.events.map(event => 
            event.id === eventId 
              ? {
                  ...event,
                  user_response: response.data,
                  color_code: getEventColor(status)
                }
              : event
          )
        }));

        // Show success message briefly
        setState(prev => ({ ...prev, error: null }));
        
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };


  const getEventsForCompany = useCallback((companyId: string, date: Date) => {
    // Calculate current week for filtering
    const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(state.currentDate, { weekStartsOn: 1 });
    
    return state.events.filter(event => {
      // Basic company and date matching
      const matchesCompany = event.companies.some(c => c.id === companyId);
      const matchesDate = isSameDay(new Date(event.start_date), date);
      
      // Filter by current week
      const eventDate = new Date(event.start_date);
      const matchesWeek = eventDate >= weekStart && eventDate <= weekEnd;
      
      if (!matchesCompany || !matchesDate || !matchesWeek) return false;
      
      // Search query filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.companies.some(c => 
            c.company_name.toLowerCase().includes(query) ||
            c.ticker_symbol.toLowerCase().includes(query)
          );
        if (!matchesSearch) return false;
      }
      
      // Event type filter
      if (state.eventTypeFilter !== 'all' && event.event_type !== state.eventTypeFilter) {
        return false;
      }
      
      // Location type filter
      if (state.locationTypeFilter !== 'all' && event.location_type !== state.locationTypeFilter) {
        return false;
      }
      
      // RSVP status filter
      if (state.rsvpStatusFilter !== 'all') {
        const userResponse = event.user_response?.response_status || 'pending';
        if (userResponse !== state.rsvpStatusFilter) return false;
      }
      
      // Event filter (All Events vs My Events)
      if (state.eventFilter === 'my') {
        // Only show events where user has responded (not pending)
        const hasResponse = event.user_response && event.user_response.response_status !== 'pending';
        if (!hasResponse) return false;
      }
      
      return true;
    });
  }, [state.events, state.searchQuery, state.eventTypeFilter, state.locationTypeFilter, state.rsvpStatusFilter, state.eventFilter]);

  const formatEventTime = useCallback((event: CalendarEvent) => {
    const startTime = format(new Date(event.start_date), 'HH:mm');
    return startTime;
  }, []);

  if (state.loading) {
    return (
      <div className="app">
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <Calendar className="mx-auto mb-4" size={48} color="var(--secondary-text)" />
            <h2>Loading AGORA Calendar...</h2>
            <p className="text-muted">Setting up your investment calendar</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="app">
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <h2 style={{ color: '#dc3545' }}>Error Loading Calendar</h2>
            <p className="text-muted">{state.error}</p>
            <button className="btn btn-primary" onClick={reloadData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();

  // Helper function to generate current week navigation data
  const getCurrentWeekData = () => {
    const currentWeekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 });
    const weekNumber = getWeek(currentWeekStart);
    const today = new Date();
    const isActuallyCurrentWeek = isSameDay(startOfWeek(today, { weekStartsOn: 1 }), currentWeekStart);
    
    return {
      start: currentWeekStart,
      weekNumber: weekNumber,
      label: `Week ${weekNumber}`,
      month: format(currentWeekStart, 'MMM'),
      year: currentWeekStart.getFullYear(),
      isCurrentWeek: isActuallyCurrentWeek
    };
  };

  // Helper function to get month calendar days (only current month days)
  const getMonthDays = () => {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const dayDate = new Date(currentDate);
      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        weekNumber: getWeek(dayDate),
        isToday: isSameDay(dayDate, new Date())
      });
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };

  // Helper function to get weeks of the current month
  const getMonthWeeks = () => {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks = [];
    let currentWeekStart = startOfWeek(firstDay, { weekStartsOn: 1 }); // Start on Monday
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = addDays(currentWeekStart, 6);
      const weekDays = [];
      
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(currentWeekStart, i);
        weekDays.push({
          date: dayDate,
          dayNumber: dayDate.getDate(),
          weekNumber: getWeek(dayDate),
          isToday: isSameDay(dayDate, new Date()),
          isCurrentMonth: dayDate.getMonth() === month
        });
      }
      
      weeks.push({
        start: currentWeekStart,
        end: weekEnd,
        weekNumber: getWeek(currentWeekStart),
        days: weekDays
      });
      
      currentWeekStart = addDays(currentWeekStart, 7);
    }
    
    return weeks;
  };

  // Helper function to determine event badge type
  const getEventBadge = (event: CalendarEvent, companyId: string) => {
    const eventCompanies = event.companies;
    const isMultiCompany = eventCompanies.length > 1;
    
    // For now, we'll use simple logic - can be enhanced with actual host/attend data
    const isHosting = eventCompanies[0]?.id === companyId; // First company is host
    
    if (isMultiCompany) {
      return { type: 'multi', label: 'Multi Corp', icon: '🔶' };
    } else if (isHosting) {
      return { type: 'host', label: 'Host', icon: '🎯' };
    } else {
      return { type: 'attend', label: 'Attend', icon: '👥' };
    }
  };

  // Company Calendar Blow-up View
  if (state.showCompanyCalendar && state.selectedCompany) {
    // Calculate current week for filtering
    const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(state.currentDate, { weekStartsOn: 1 });
    
    const companyEvents = state.events.filter(event => {
      const matchesCompany = event.companies.some(c => c.id === state.selectedCompany!.id);
      const eventDate = new Date(event.start_date);
      const matchesWeek = eventDate >= weekStart && eventDate <= weekEnd;
      return matchesCompany && matchesWeek;
    });
    
    const monthDays = getMonthDays();
    const currentMonth = state.currentDate.getMonth();

    return (
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button 
              className="btn btn-ghost"
              onClick={handleBackToMainCalendar}
            >
              ← Back to All Companies
            </button>
            <h1 className="header-logo">
              {state.selectedCompany.company_name} ({state.selectedCompany.ticker_symbol})
            </h1>
          </div>
          
          <div className="header-actions">
            <div className="text-sm text-muted">
              {companyEvents.length} events • {state.selectedCompany.gics_sector}
            </div>
          </div>
        </header>

        {/* Company Calendar Content */}
        <main className="main-content">
          <div className="content-area">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost" onClick={handlePreviousMonth}>
                    <ChevronLeft size={16} />
                  </button>
                  <h2 className="calendar-title">
                    {format(state.currentDate, 'MMMM yyyy')}
                  </h2>
                  <button className="btn btn-ghost" onClick={handleNextMonth}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Company Calendar View</span>
              </div>
            </div>

            {/* Enhanced Month Calendar Grid for Company */}
            <div className="calendar-container">
              {/* Calendar Header with Day Names */}
              <div 
                className="calendar-grid"
                style={{ 
                  gridTemplateColumns: `repeat(7, 1fr)`,
                  borderBottom: '2px solid var(--border-color)'
                }}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                  <div 
                    key={dayName}
                    className="calendar-cell"
                    style={{ 
                      backgroundColor: 'var(--calendar-header)', 
                      textAlign: 'center', 
                      padding: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Month Calendar Grid with Events */}
              <div
                className="calendar-grid"
                style={{ 
                  gridTemplateColumns: `repeat(7, 1fr)`,
                  gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, 120px)`
                }}
              >
                {monthDays.map(day => {
                  const dayEvents = companyEvents.filter(event => 
                    isSameDay(new Date(event.start_date), day.date)
                  );
                  const isCurrentMonth = day.date.getMonth() === currentMonth;
                  const isToday = isSameDay(day.date, new Date());
                  
                  return (
                    <div 
                      key={day.date.toISOString()} 
                      className={`calendar-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                      style={{ 
                        minHeight: '120px',
                        opacity: isCurrentMonth ? 1 : 0.3,
                        position: 'relative'
                      }}
                    >
                      {/* Day Number */}
                      <div className="day-number" style={{ 
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        color: isToday ? 'var(--accent-color)' : 'var(--primary-text)'
                      }}>
                        {format(day.date, 'd')}
                      </div>
                      
                      {/* Events */}
                      <div className="calendar-events" style={{ 
                        marginTop: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {dayEvents.map(event => {
                          const badge = getEventBadge(event, state.selectedCompany!.id);
                          return (
                            <div
                              key={event.id}
                              className={`event-block status-${event.user_response?.response_status || 'pending'}`}
                              onClick={() => handleEventClick(event)}
                              style={{ 
                                cursor: 'pointer',
                                position: 'relative',
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              {/* Event Badge */}
                              <div className="event-badge" style={{
                                position: 'absolute',
                                top: '-0.25rem',
                                right: '-0.25rem',
                                fontSize: '0.625rem',
                                backgroundColor: badge.type === 'host' ? '#28a745' : 
                                                badge.type === 'multi' ? '#ffc107' : '#6c757d',
                                color: 'white',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '0.25rem',
                                fontWeight: 'bold'
                              }}>
                                {badge.icon} {badge.label}
                              </div>
                              
                              <div className="event-title" style={{ fontWeight: '600' }}>
                                {event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title}
                              </div>
                              <div className="event-time" style={{ opacity: 0.8 }}>
                                {formatEventTime(event)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Company Details */}
            <div className="mt-4 p-4 card">
              <h3 className="text-accent mb-2">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Sector:</strong> {state.selectedCompany.gics_sector}
                </div>
                <div>
                  <strong>Subsector:</strong> {state.selectedCompany.gics_subsector}
                </div>
                <div>
                  <strong>Industry:</strong> {state.selectedCompany.gics_industry || 'N/A'}
                </div>
                <div>
                  <strong>Total Events:</strong> {companyEvents.length}
                </div>
              </div>
            </div>

            {/* Event Details Overlay for Company Calendar */}
            {state.selectedEvent && (
              <>
                {/* Backdrop */}
                <div 
                  className="event-details-backdrop"
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999
                  }}
                  onClick={() => setState(prev => ({ ...prev, selectedEvent: null }))}
                />
                
                {/* Sidebar Panel */}
                <div className="event-details-sidebar-overlay" style={{ 
                  position: 'fixed',
                  top: '0',
                  right: '0',
                  width: '400px',
                  height: '100vh',
                  backgroundColor: 'var(--secondary-bg)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '0',
                  padding: '1rem',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-accent">Event Details</h3>
                    <button 
                      className="btn btn-ghost"
                      onClick={() => setState(prev => ({ ...prev, selectedEvent: null }))}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="event-details-content">
                    <h4 className="text-primary-text mb-2">{state.selectedEvent.title}</h4>
                    <p className="text-muted mb-4">
                      {format(new Date(state.selectedEvent.start_date), 'EEEE, MMMM d, yyyy')} • {' '}
                      {format(new Date(state.selectedEvent.start_date), 'HH:mm')} - {format(new Date(state.selectedEvent.end_date), 'HH:mm')}
                    </p>

                    {/* Event Description */}
                    {state.selectedEvent.description && (
                      <div className="mb-4">
                        <h5 className="text-primary-text mb-2">Description</h5>
                        <p className="text-muted text-sm">{state.selectedEvent.description}</p>
                      </div>
                    )}

                    {/* Location Details */}
                    <div className="mb-4">
                      <h5 className="text-primary-text mb-2">Location</h5>
                      <div className="text-muted text-sm">
                        <div><strong>Type:</strong> {state.selectedEvent.location_type}</div>
                        {state.selectedEvent.location_type === 'physical' && state.selectedEvent.location_details && (
                          <div className="mt-1">
                            <div>{(state.selectedEvent.location_details as any).venue}</div>
                            <div>{(state.selectedEvent.location_details as any).address}</div>
                          </div>
                        )}
                        {state.selectedEvent.location_type === 'virtual' && state.selectedEvent.virtual_details && (
                          <div className="mt-1">
                            <div><strong>Platform:</strong> {(state.selectedEvent.virtual_details as any).platform}</div>
                            {(state.selectedEvent.virtual_details as any).webinar_link && (
                              <a href={(state.selectedEvent.virtual_details as any).webinar_link} 
                                 className="text-accent" target="_blank" rel="noopener noreferrer">
                                Join Meeting
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TODO: Re-implement Weather Information with real API */}

                    {/* Participating Companies */}
                    <div className="mb-4">
                      <h5 className="text-primary-text mb-2">Companies</h5>
                      <div className="flex flex-wrap gap-1">
                        {state.selectedEvent.companies.map(company => (
                          <span 
                            key={company.id}
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: 'var(--tertiary-bg)', border: '1px solid var(--border-color)' }}
                          >
                            {company.ticker_symbol}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* RSVP Status & Actions */}
                    <div className="mb-4">
                      <h5 className="text-primary-text mb-2">RSVP Status</h5>
                      <div className="mb-3">
                        <span 
                          className={`px-2 py-1 rounded text-sm status-${state.selectedEvent.user_response?.response_status || 'pending'}`}
                        >
                          {state.selectedEvent.user_response?.response_status === 'accepted' ? 'Attending' :
                           state.selectedEvent.user_response?.response_status === 'declined' ? 'Not Attending' : 'Pending Response'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRSVPUpdate(state.selectedEvent!.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleRSVPUpdate(state.selectedEvent!.id, 'declined')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        {/* Left: Logo */}
        <div className="flex items-center">
          <a href="/" className="header-logo">AGORA</a>
        </div>
        
        {/* Center: Navigation */}
        <nav className="header-nav" style={{
          display: 'flex',
          justifyContent: 'center',
          flex: 1
        }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button 
              className={state.currentPage === 'calendar' ? 'active' : ''}
              onClick={() => setState(prev => ({ ...prev, currentPage: 'calendar', showCompanyCalendar: false }))}
            >
              Calendar
            </button>
            <button 
              className={state.currentPage === 'events' ? 'active' : ''}
              onClick={() => setState(prev => ({ ...prev, currentPage: 'events' }))}
            >
              Events
            </button>
            <button 
              className={state.currentPage === 'subscriptions' ? 'active' : ''}
              onClick={() => setState(prev => ({ ...prev, currentPage: 'subscriptions' }))}
            >
              Subscriptions
            </button>
        </div>
        </nav>
        
        {/* Right: Profile */}
        <div className="header-actions">
          <div className="flex items-center">
            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="btn btn-ghost"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--primary-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleToggleProfileDropdown}
                title="Profile Menu"
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
              >
                <User size={16} />
                <ChevronDown 
                  size={12} 
                  style={{ 
                    transition: 'transform 0.2s ease',
                    transform: state.showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} 
                />
              </button>
              
              {state.showProfileDropdown && currentUser && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  marginTop: '0.5rem', 
                  width: '16rem', 
                  backgroundColor: 'var(--secondary-bg)', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', 
                  border: '1px solid var(--border-color)', 
                  zIndex: 50 
                }}>
                  <div style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--border-color)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '2.5rem', 
                        height: '2.5rem', 
                        backgroundColor: 'var(--accent-bg)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--primary-bg)', 
                        fontWeight: '600' 
                      }}>
                        {currentUser.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--primary-text)' 
                        }}>
                          {currentUser.full_name}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted-text)' 
                        }}>
                          {currentUser.role} • {state.subscriptionCount} subscriptions
                        </div>
                        {authUser && (
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--faded-text)',
                            marginTop: '0.25rem'
                          }}>
                            Logged in as: {authUser.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '0.5rem 0' }}>
                    <button
                      onClick={handleOpenUserProfile}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        textAlign: 'left', 
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--primary-text)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                    >
                      <Settings size={16} style={{ color: 'var(--muted-text)' }} />
                      <div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: 'var(--primary-text)' 
                        }}>Profile Settings</div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted-text)' 
                        }}>Manage your account</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, currentPage: 'subscriptions', showProfileDropdown: false }));
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        textAlign: 'left', 
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--primary-text)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                    >
                      <Calendar size={16} style={{ color: 'var(--muted-text)' }} />
                      <div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: 'var(--primary-text)' 
                        }}>Manage Subscriptions</div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted-text)' 
                        }}>View and modify your subscriptions</div>
                      </div>
                    </button>

                    {/* Notifications */}
                    <button
                      onClick={() => {
                        setState(prev => ({ 
                          ...prev, 
                          showNotificationsDrawer: true, 
                          showProfileDropdown: false 
                        }));
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        textAlign: 'left', 
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--primary-text)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                    >
                      <Bell size={16} style={{ color: 'var(--muted-text)' }} />
                      <div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: 'var(--primary-text)' 
                        }}>Notifications</div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted-text)' 
                        }}>Manage notification preferences</div>
                      </div>
                    </button>
                    
                    <div style={{ 
                      borderTop: '1px solid var(--border-color)', 
                      margin: '0.5rem 0' 
                    }}></div>
                    
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, showProfileDropdown: false }));
                        if (onLogout) {
                          onLogout();
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        textAlign: 'left', 
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={16} />
                      <div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500' 
                        }}>Sign Out</div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted-text)' 
                        }}>Log out of your account</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Executive Assistant User Switcher */}
            {state.isExecutiveAssistant && state.managedUsers.length > 0 && (
              <div className="ea-user-switcher" style={{ 
                backgroundColor: 'var(--tertiary-bg)', 
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: '0.5rem'
              }}>
                <div className="text-xs text-muted mb-1">Managing for:</div>
                <select 
                  className="form-select"
                  style={{ minWidth: '150px', fontSize: '0.75rem' }}
                  value={state.selectedManagedUser?.id || ''}
                  onChange={(e) => {
                    const selectedUser = state.managedUsers.find(u => u.id === e.target.value);
                    setState(prev => ({ ...prev, selectedManagedUser: selectedUser || null }));
                  }}
                >
                  {state.managedUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Main Content */}
      {state.currentPage === 'subscriptions' ? (
        <SubscriptionManagementPage 
          currentUser={currentUser} 
          onSubscriptionChange={() => {
            // Refresh subscription count and calendar data when subscriptions change
            if (currentUser) {
              loadSubscriptionCount();
            }
          }}
        />
      ) : state.currentPage === 'events' ? (
        <EventsPage 
          currentUser={currentUser} 
          events={state.events}
          loading={state.loading}
          error={state.error}
        />
      ) : (
        <main className="main-content" style={{ 
          flexDirection: 'column', 
          padding: '1rem',
          minHeight: '100vh',
          overflow: 'hidden'
        }}>
        {/* Calendar Controls - Centered Layout */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0 2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* Navigation with Arrows */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem'
            }}>
              {/* Previous Arrow */}
              <button 
                className="btn btn-ghost" 
                onClick={state.calendarView === 'week' ? handlePreviousWeek : handlePreviousMonth}
                style={{ 
                  padding: '0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Navigation Content */}
              {state.calendarView === 'week' ? (
                /* Week Navigation - Single Week Display */
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'var(--tertiary-bg)',
                  borderRadius: '8px',
                  padding: '0.5rem'
                }}>
                  {/* Current Week Display */}
                  {(() => {
                    const currentWeek = getCurrentWeekData();
                    return (
                      <div
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          backgroundColor: currentWeek.isCurrentWeek ? 'var(--accent-bg)' : 'transparent',
                          color: currentWeek.isCurrentWeek ? 'var(--primary-bg)' : 'var(--primary-text)',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textAlign: 'center',
                          minWidth: '80px'
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {currentWeek.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          opacity: 0.8,
                          marginTop: '0.125rem',
                          fontStyle: 'italic'
                        }}>
                          {currentWeek.month} {currentWeek.year}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Month Name and Year */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                  backgroundColor: 'var(--primary-bg)',
                  color: 'var(--primary-text)',
                  position: 'relative' // For notification positioning
                }}>
                  {/* Reordering Indicator */}
                  {state.isReordering && (
                    <div style={{
                      position: 'fixed',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--accent-color)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      zIndex: 1000,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                      fontWeight: '600',
                      lineHeight: '1.2'
                    }}>
                      {format(state.currentDate, 'MMMM')}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontStyle: 'italic',
                        color: 'var(--muted-text)',
                        marginLeft: '4px'
                      }}>
                        {format(state.currentDate, 'yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Next Arrow */}
              <button 
                className="btn btn-ghost" 
                onClick={state.calendarView === 'week' ? handleNextWeek : handleNextMonth}
                style={{ 
                  padding: '0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--tertiary-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Compact Dropdown Groups */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {/* Events Dropdown */}
              <div style={{ position: 'relative' }}>
              <button 
                  onClick={() => setState(prev => ({ ...prev, showEventsDropdown: !prev.showEventsDropdown }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
                >
                  <Calendar size={14} />
                  {state.eventFilter === 'all' ? 'All Events' : 'My Events'}
                  <ChevronDown size={12} />
                </button>
                
                {state.showEventsDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--secondary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 50,
                    minWidth: '140px'
                  }}>
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, eventFilter: 'all', showEventsDropdown: false }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        backgroundColor: state.eventFilter === 'all' ? 'var(--accent-bg)' : 'transparent',
                        color: state.eventFilter === 'all' ? 'var(--primary-bg)' : 'var(--primary-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (state.eventFilter !== 'all') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (state.eventFilter !== 'all') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }
                      }}
              >
                All Events
              </button>
              <button 
                      onClick={() => {
                        setState(prev => ({ ...prev, eventFilter: 'my', showEventsDropdown: false }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        backgroundColor: state.eventFilter === 'my' ? 'var(--accent-bg)' : 'transparent',
                        color: state.eventFilter === 'my' ? 'var(--primary-bg)' : 'var(--primary-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (state.eventFilter !== 'my') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (state.eventFilter !== 'my') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }
                      }}
              >
                My Events
              </button>
            </div>
                )}
          </div>

              {/* Filters Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setState(prev => ({ ...prev, showFiltersDropdown: !prev.showFiltersDropdown }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
                >
                  <Filter size={14} />
                  Filters
                  <ChevronDown size={12} />
                </button>
                
                {state.showFiltersDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--secondary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 50,
                    minWidth: '200px',
                    padding: '0.5rem'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem', display: 'block' }}>
                        Event Type
                      </label>
              <select 
                className="form-select"
                value={state.eventTypeFilter}
                onChange={(e) => setState(prev => ({ ...prev, eventTypeFilter: e.target.value as any }))}
                        style={{ width: '100%', fontSize: '0.875rem' }}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="catalyst">Catalyst</option>
              </select>
                    </div>
              
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem', display: 'block' }}>
                        Location
                      </label>
              <select 
                className="form-select"
                value={state.locationTypeFilter}
                onChange={(e) => setState(prev => ({ ...prev, locationTypeFilter: e.target.value as any }))}
                        style={{ width: '100%', fontSize: '0.875rem' }}
              >
                <option value="all">All Locations</option>
                <option value="physical">Physical</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
                    </div>
              
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem', display: 'block' }}>
                        RSVP Status
                      </label>
              <select 
                className="form-select"
                value={state.rsvpStatusFilter}
                onChange={(e) => setState(prev => ({ ...prev, rsvpStatusFilter: e.target.value as any }))}
                        style={{ width: '100%', fontSize: '0.875rem' }}
              >
                <option value="all">All RSVP</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="pending">Pending</option>
              </select>
                    </div>
                  </div>
                )}
              </div>

              {/* View Dropdown */}
              <div style={{ position: 'relative' }} ref={viewDropdownRef}>
                <button
                  onClick={() => setState(prev => ({ ...prev, showViewDropdown: !prev.showViewDropdown }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)'}
                >
                  {state.calendarView === 'week' ? 'Week' : 'Month'}
                  <ChevronDown size={12} />
                </button>
                
                {state.showViewDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--secondary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 50,
                    minWidth: '100px'
                  }}>
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, calendarView: 'week', showViewDropdown: false }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        backgroundColor: state.calendarView === 'week' ? 'var(--accent-bg)' : 'transparent',
                        color: state.calendarView === 'week' ? 'var(--primary-bg)' : 'var(--primary-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (state.calendarView !== 'week') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (state.calendarView !== 'week') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, calendarView: 'month', showViewDropdown: false }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        backgroundColor: state.calendarView === 'month' ? 'var(--accent-bg)' : 'transparent',
                        color: state.calendarView === 'month' ? 'var(--primary-bg)' : 'var(--primary-text)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (state.calendarView !== 'month') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (state.calendarView !== 'month') {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      Month
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--tertiary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}>
                <Search size={16} style={{ color: 'var(--muted-text)' }} />
                <input 
                  type="text" 
                  placeholder="Search events, companies..." 
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--primary-text)',
                    fontSize: '0.875rem',
                    width: '200px',
                    padding: '0.25rem 0'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company-Centric Calendar Grid Layout */}
        <div className="calendar-layout" style={{ 
          position: 'relative', 
          flex: 1,
          height: 'calc(100vh - 200px)', // Adjust for header and controls
          overflow: 'hidden'
        }}>
          {/* Main Calendar Grid */}
          <div className="calendar-main" style={{ 
            width: '100%',
            height: '100%',
            position: 'relative'
          }}>
            <div className="calendar-container">
              {state.calendarView === 'week' ? (
                <>
                  {/* Week View Header */}
              <div 
                className="calendar-grid"
                style={{ 
                  gridTemplateColumns: `200px repeat(7, 1fr)`,
                  borderBottom: '2px solid var(--border-color)'
                }}
              >
                {/* Company Column Header */}
                <div className="calendar-cell" style={{ backgroundColor: 'var(--calendar-header)', padding: '1rem' }}>
                  <strong>Companies</strong>
                  <div className="text-sm text-muted">Drag to reorder</div>
                </div>
                
                {/* Day headers */}
                {weekDays.map(day => (
                  <div 
                    key={day.toISOString()} 
                    className={`calendar-cell ${isSameDay(day, new Date()) ? 'today' : ''}`}
                    style={{ backgroundColor: 'var(--calendar-header)', textAlign: 'center', padding: '1rem' }}
                  >
                    <div className="font-semibold">{format(day, 'EEE')}</div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </div>
                ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Month View - Properly Aligned Grid */}
                  <div style={{ 
                    display: 'flex',
                    height: '100%',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    {/* Sticky Company Column */}
                    <div style={{ 
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      backgroundColor: 'var(--primary-bg)',
                      width: '200px',
                      borderRight: '2px solid var(--border-color)',
                      flexShrink: 0
                    }}>
                      {/* Company Header */}
                      <div style={{ 
                        backgroundColor: 'var(--calendar-header)',
                        padding: '1rem',
                        borderBottom: '2px solid var(--border-color)'
                      }}>
                        <strong>Companies</strong>
                        <div className="text-sm text-muted">Drag to reorder</div>
              </div>
                      
                      {/* Company List */}
                      {state.companies.map((company) => (
                        <div 
                          key={company.id}
                          className="calendar-cell company-row"
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            minHeight: '80px',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: 'var(--primary-bg)'
                          }}
                          onClick={() => handleCompanyClick(company)}
                        >
                          <div className="company-ticker" style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--secondary-text)' }}>
                            {company.ticker_symbol}
                          </div>
                          <div className="company-name" style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginLeft: '0.5rem' }}>
                            {company.company_name}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Scrollable Calendar Grid */}
                    <div style={{ 
                      flex: 1,
                      overflowX: 'auto',
                      overflowY: 'hidden'
                    }}>
                      <div style={{ 
                        minWidth: `${getMonthWeeks().length * 7 * 120}px`
                      }}>
                        {/* Scrollable Day Headers */}
                        <div 
                          className="calendar-grid"
                          style={{ 
                            gridTemplateColumns: `repeat(${getMonthWeeks().length * 7}, 120px)`,
                            borderBottom: '2px solid var(--border-color)',
                            backgroundColor: 'var(--calendar-header)'
                          }}
                        >
                          {getMonthWeeks().map((week) => 
                            week.days.map((day) => (
                              <div 
                                key={day.date.toISOString()} 
                                className={`calendar-cell ${day.isToday ? 'today' : ''}`}
                                style={{ 
                                  backgroundColor: 'var(--calendar-header)', 
                                  textAlign: 'center', 
                                  padding: '0.5rem',
                                  minWidth: '120px',
                                  opacity: day.isCurrentMonth ? 1 : 0.3
                                }}
                              >
                                <div style={{ 
                                  fontSize: '0.65rem', 
                                  fontStyle: 'italic', 
                                  opacity: 0.6,
                                  marginBottom: '0.25rem',
                                  color: 'var(--muted-text)'
                                }}>
                                  W{day.weekNumber}
                                </div>
                                <div className="font-semibold" style={{ fontSize: '0.875rem' }}>
                                  {format(day.date, 'EEE')}
                                </div>
                                <div className="text-lg" style={{ fontSize: '1rem' }}>
                                  {day.dayNumber}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Event Rows */}
                        {state.companies.map((company) => (
                          <div
                            key={company.id}
                            className="calendar-grid"
                            style={{ 
                              gridTemplateColumns: `repeat(${getMonthWeeks().length * 7}, 120px)`,
                              minHeight: '80px',
                              borderBottom: '1px solid var(--border-color)'
                            }}
                          >
                            {getMonthWeeks().map((week) => 
                              week.days.map((day) => {
                                const dayEvents = getEventsForCompany(company.id, day.date);
                                return (
                                  <div 
                                    key={`${company.id}-${day.date.toISOString()}`} 
                                    className="calendar-cell" 
                                    style={{ 
                                      minHeight: '80px', 
                                      padding: '0.25rem',
                                      minWidth: '120px',
                                      borderRight: '1px solid var(--border-light)',
                                      position: 'relative',
                                      opacity: day.isCurrentMonth ? 1 : 0.3
                                    }}
                                  >
                                    <div className="calendar-events" style={{ 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: '0.125rem',
                                      height: '100%'
                                    }}>
                                      {dayEvents.map(event => (
                                        <div
                                          key={event.id}
                                          className="calendar-event"
                                          style={{
                                            backgroundColor: event.color_code || 'var(--accent-bg)',
                                            color: 'var(--primary-bg)',
                                            padding: '0.125rem 0.25rem',
                                            borderRadius: '3px',
                                            fontSize: '0.625rem',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                          onClick={() => handleEventClick(event)}
                                          title={`${event.title} - ${formatEventTime(event)}`}
                                        >
                                          {event.title}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Draggable Company Rows with Events */}
              <div className={isDragging ? 'dnd-context-dragging' : ''}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                  {...dragHandlers}
              >
                <SortableContext
                  items={state.companies.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {state.calendarView === 'week' ? (
                    <>
                      {/* Week View Company Rows */}
                  {state.companies.map((company) => (
                    <SortableCompanyCalendarRow
                      key={company.id}
                      company={company}
                      weekDays={weekDays}
                      onCompanyClick={handleCompanyClick}
                      onEventClick={handleEventClick}
                      getEventsForCompany={getEventsForCompany}
                      formatEventTime={formatEventTime}
                    />
                  ))}
                    </>
                  ) : null}
                </SortableContext>
              </DndContext>
              </div>
            </div>
          </div>

          {/* Overlay Event Details Panel */}
          {state.selectedEvent && (
            <>
              {/* Backdrop */}
              <div 
                className="event-details-backdrop"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 999
                }}
                onClick={() => setState(prev => ({ ...prev, selectedEvent: null }))}
              />
              
              {/* Sidebar Panel */}
              <div className="event-details-sidebar-overlay" style={{ 
                position: 'fixed',
                top: '0',
                right: '0',
                width: '400px',
                height: '100vh',
                backgroundColor: 'var(--secondary-bg)', 
                border: '1px solid var(--border-color)',
                borderRadius: '0',
                padding: '1rem',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-accent">Event Details</h3>
                  <button 
                    className="btn btn-ghost"
                    onClick={() => setState(prev => ({ ...prev, selectedEvent: null }))}
                  >
                    ✕
                  </button>
                </div>

                <div className="event-details-content">
                  <h4 className="text-primary-text mb-2">{state.selectedEvent.title}</h4>
                  <p className="text-muted mb-4">
                    {format(new Date(state.selectedEvent.start_date), 'EEEE, MMMM d, yyyy')} • {' '}
                    {format(new Date(state.selectedEvent.start_date), 'HH:mm')} - {format(new Date(state.selectedEvent.end_date), 'HH:mm')}
                  </p>

                  {/* Event Description */}
                  {state.selectedEvent.description && (
                    <div className="mb-4">
                      <h5 className="text-primary-text mb-2">Description</h5>
                      <p className="text-muted text-sm">{state.selectedEvent.description}</p>
                    </div>
                  )}

                  {/* Location Details */}
                  <div className="mb-4">
                    <h5 className="text-primary-text mb-2">Location</h5>
                    <div className="text-muted text-sm">
                      <div><strong>Type:</strong> {state.selectedEvent.location_type}</div>
                      {state.selectedEvent.location_type === 'physical' && state.selectedEvent.location_details && (
                        <div className="mt-1">
                          <div>{(state.selectedEvent.location_details as any).venue}</div>
                          <div>{(state.selectedEvent.location_details as any).address}</div>
                        </div>
                      )}
                      {state.selectedEvent.location_type === 'virtual' && state.selectedEvent.virtual_details && (
                        <div className="mt-1">
                          <div><strong>Platform:</strong> {(state.selectedEvent.virtual_details as any).platform}</div>
                          {(state.selectedEvent.virtual_details as any).webinar_link && (
                            <a href={(state.selectedEvent.virtual_details as any).webinar_link} 
                               className="text-accent" target="_blank" rel="noopener noreferrer">
                              Join Meeting
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TODO: Re-implement Weather Information with real API */}

                  {/* Participating Companies */}
                  <div className="mb-4">
                    <h5 className="text-primary-text mb-2">Companies</h5>
                    <div className="flex flex-wrap gap-1">
                      {state.selectedEvent.companies.map(company => (
                        <span 
                          key={company.id}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: 'var(--tertiary-bg)', border: '1px solid var(--border-color)' }}
                        >
                          {company.ticker_symbol}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* RSVP Status & Actions */}
                  <div className="mb-4">
                    <h5 className="text-primary-text mb-2">RSVP Status</h5>
                    <div className="mb-3">
                      <span 
                        className={`px-2 py-1 rounded text-sm status-${state.selectedEvent.user_response?.response_status || 'pending'}`}
                      >
                        {state.selectedEvent.user_response?.response_status === 'accepted' ? 'Attending' :
                         state.selectedEvent.user_response?.response_status === 'declined' ? 'Not Attending' : 'Pending Response'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        className={`btn btn-sm ${state.selectedEvent?.user_response?.response_status === 'accepted' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleRSVPUpdate(state.selectedEvent!.id, 'accepted')}
                      >
                        ✓ Accept
                      </button>
                      <button 
                        className={`btn btn-sm ${state.selectedEvent?.user_response?.response_status === 'declined' ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => handleRSVPUpdate(state.selectedEvent!.id, 'declined')}
                      >
                        ✗ Decline
                      </button>
                      <button 
                        className={`btn btn-sm ${state.selectedEvent?.user_response?.response_status === 'pending' ? 'btn-accent' : 'btn-outline'}`}
                        onClick={() => handleRSVPUpdate(state.selectedEvent!.id, 'pending')}
                      >
                        ? Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      )}

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfile
          user={currentUser}
          isOpen={state.showUserProfile}
          onClose={handleCloseUserProfile}
          onUserUpdate={handleUserUpdate}
        />
      )}

      {/* Drawer Components */}
      <NotificationsDrawer
        isOpen={state.showNotificationsDrawer}
        onClose={() => setState(prev => ({ ...prev, showNotificationsDrawer: false }))}
      />

    </div>
  );
};

export default App;