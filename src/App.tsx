/**
 * AGORA Investment Calendar - Main App Component
 * 
 * Bloomberg-style dark theme investment calendar with company-centric view
 * Uses database-aligned mock data that seamlessly transitions to real data
 */

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Filter, Search, Settings, GripVertical, LogOut } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { CalendarEvent, CompanyWithEvents } from './types/database';
import { apiClient } from './utils/apiClient';
// mockData imports removed - using Supabase API only
import { UserWithSubscriptions } from './types/database';
import SubscriptionPage from './pages/SubscriptionPage';

interface AppState {
  currentDate: Date;
  selectedView: 'week' | 'month';
  eventFilter: 'all' | 'my';
  events: CalendarEvent[];
  companies: CompanyWithEvents[];
  selectedEvent: CalendarEvent | null;
  selectedCompany: CompanyWithEvents | null;
  showCompanyCalendar: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  eventTypeFilter: 'all' | 'standard' | 'catalyst';
  locationTypeFilter: 'all' | 'physical' | 'virtual' | 'hybrid';
  rsvpStatusFilter: 'all' | 'accepted' | 'declined' | 'pending';
  currentPage: 'calendar' | 'events' | 'subscriptions';
  isExecutiveAssistant: boolean;
  managedUsers: UserWithSubscriptions[];
  selectedManagedUser: UserWithSubscriptions | null;
}

// Sortable Company Calendar Row Component
const SortableCompanyCalendarRow: React.FC<{
  company: CompanyWithEvents;
  weekDays: Date[];
  onCompanyClick: (company: CompanyWithEvents) => void;
  onEventClick: (event: CalendarEvent) => void;
  getEventsForCompany: (companyId: string, date: Date) => CalendarEvent[];
  formatEventTime: (event: CalendarEvent) => string;
}> = ({ company, weekDays, onCompanyClick, onEventClick, getEventsForCompany, formatEventTime }) => {
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
        <div onClick={() => onCompanyClick(company)} style={{ flex: 1 }}>
          <div className="company-ticker" style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--secondary-text)' }}>
            ({company.ticker_symbol})
          </div>
          <div className="company-name" style={{ fontSize: '0.75rem', color: 'var(--primary-text)' }}>
            {company.company_name}
          </div>
        </div>
      </div>

      {/* Event Cells for Each Day */}
      {weekDays.map(day => {
        const dayEvents = getEventsForCompany(company.id, day);
        return (
          <div key={`${company.id}-${day.toISOString()}`} className="calendar-cell" style={{ minHeight: '80px', padding: '0.5rem' }}>
            <div className="calendar-events" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className={`event-block status-${event.user_response?.response_status || 'pending'}`}
                  onClick={() => onEventClick(event)}
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
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentDate: new Date(),
    selectedView: 'week',
    eventFilter: 'all',
    events: [],
    companies: [],
    selectedEvent: null,
    selectedCompany: null,
    showCompanyCalendar: false,
    loading: true,
    error: null,
    searchQuery: '',
    eventTypeFilter: 'all',
    locationTypeFilter: 'all',
    rsvpStatusFilter: 'all',
    currentPage: 'calendar',
    isExecutiveAssistant: false,
    managedUsers: [],
    selectedManagedUser: null
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // TODO: Replace with real current user from API
  const currentUser = { 
    id: 'temp-user', 
    role: 'investment_analyst' as const,
    full_name: 'Demo User',
    subscriptions: []
  };
  
  // TODO: Re-implement EA functionality with real API
  // Temporarily disabled to test events functionality

  const reloadData = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    // Trigger useEffect by updating a dependency
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Calculate date range for current week
        const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(state.currentDate, { weekStartsOn: 1 });

        // Load events and companies using API
        console.log('📅 App.tsx: Loading events for week:', weekStart.toLocaleDateString(), 'to', weekEnd.toLocaleDateString(), '(v2.0)');
        const eventsResponse = await apiClient.getEvents({
          start_date: weekStart,
          end_date: weekEnd,
          user_id: currentUser?.id
        });

        const companiesResponse = await apiClient.getCompanies({
          user_id: currentUser?.id
        });

        // Filter events based on selected filter
        let filteredEvents = eventsResponse.data.events;
        if (state.eventFilter === 'my') {
          filteredEvents = filteredEvents.filter(event => event.user_response);
        }

        setState(prev => ({
          ...prev,
          events: filteredEvents,
          companies: companiesResponse.data.companies,
          loading: false
        }));

      } catch (error) {
        console.error('Failed to load calendar data:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load calendar data',
          loading: false
        }));
      }
    };

    loadCalendarData();
  }, [state.currentDate, state.eventFilter, currentUser?.id]);

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

  const handleEventClick = (event: CalendarEvent) => {
    setState(prev => ({ ...prev, selectedEvent: event }));
    console.log('Event clicked:', event.title, event); // Debug logging
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setState(prev => {
        const oldIndex = prev.companies.findIndex(company => company.id === active.id);
        const newIndex = prev.companies.findIndex(company => company.id === over.id);
        
        return {
          ...prev,
          companies: arrayMove(prev.companies, oldIndex, newIndex)
        };
      });
    }
  };

  const handleCompanyClick = (company: CompanyWithEvents) => {
    setState(prev => ({
      ...prev,
      selectedCompany: company,
      showCompanyCalendar: true
    }));
    console.log('Company clicked:', company.ticker_symbol, company); // Debug logging
  };

  const handleBackToMainCalendar = () => {
    setState(prev => ({
      ...prev,
      selectedCompany: null,
      showCompanyCalendar: false
    }));
  };

  const handleRSVPUpdate = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      if (!currentUser) return;

      await apiClient.createRSVP({
        user_id: currentUser.id,
        event_id: eventId,
        response_status: status
      });

      // Reload data to reflect changes by updating state
      setState(prev => ({ ...prev, loading: true }));
      
      setState(prev => ({ ...prev, selectedEvent: null }));
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(state.currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };


  const getEventsForCompany = (companyId: string, date: Date) => {
    return state.events.filter(event => {
      // Basic company and date matching
      const matchesCompany = event.companies.some(c => c.id === companyId);
      const matchesDate = isSameDay(new Date(event.start_date), date);
      
      if (!matchesCompany || !matchesDate) return false;
      
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
  };

  const formatEventTime = (event: CalendarEvent) => {
    const startTime = format(new Date(event.start_date), 'HH:mm');
    return startTime;
  };

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

  // Helper function to get month calendar days
  const getMonthDays = () => {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = startOfWeek(firstDay, { weekStartsOn: 0 }); // Start on Sunday
    const endDate = endOfWeek(lastDay, { weekStartsOn: 0 });
    
    const days = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
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
    const companyEvents = state.events.filter(event => 
      event.companies.some(c => c.id === state.selectedCompany!.id)
    );
    
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
                  <button className="btn btn-ghost" onClick={handlePreviousWeek}>
                    <ChevronLeft size={16} />
                  </button>
                  <h2 className="calendar-title">
                    {format(state.currentDate, 'MMMM yyyy')}
                  </h2>
                  <button className="btn btn-ghost" onClick={handleNextWeek}>
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
                    isSameDay(new Date(event.start_date), day)
                  );
                  const isCurrentMonth = day.getMonth() === currentMonth;
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toISOString()} 
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
                        {format(day, 'd')}
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
        <div className="flex items-center gap-4">
          <a href="/" className="header-logo">AGORA</a>
          <nav className="header-nav">
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
          </nav>
        </div>
        
        <div className="header-actions">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search events, companies..." 
                className="form-input"
                style={{ width: '200px' }}
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
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

            {/* User Info */}
            {currentUser && (
              <div className="user-info">
                <div className="text-sm">
                  <div className="text-primary-text font-semibold">
                    {currentUser.full_name}
                    {state.isExecutiveAssistant && (
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-600 text-white">EA</span>
                    )}
                  </div>
                  <div className="text-muted text-xs">
                    {currentUser.role} • {currentUser.subscriptions?.length || 0} subscriptions
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="user-avatar">
                    {currentUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <button className="btn btn-ghost btn-sm" title="Logout">
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Settings */}
            <button className="btn btn-ghost">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {state.currentPage === 'subscriptions' ? (
        <SubscriptionPage />
      ) : state.currentPage === 'events' ? (
        <div className="events-page" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 className="text-xl text-primary-text">Events Page</h2>
          <p className="text-muted">Coming soon - comprehensive event management and search</p>
        </div>
      ) : (
        <main className="main-content" style={{ flexDirection: 'column', padding: '1rem' }}>
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" onClick={handlePreviousWeek}>
                <ChevronLeft size={16} />
              </button>
              <h2 className="calendar-title">
                {format(state.currentDate, 'MMMM yyyy')}
              </h2>
              <button className="btn btn-ghost" onClick={handleNextWeek}>
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className={`btn ${state.eventFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setState(prev => ({ ...prev, eventFilter: 'all' }))}
              >
                All Events
              </button>
              <button 
                className={`btn ${state.eventFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setState(prev => ({ ...prev, eventFilter: 'my' }))}
              >
                My Events
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <select 
                className="form-select"
                value={state.eventTypeFilter}
                onChange={(e) => setState(prev => ({ ...prev, eventTypeFilter: e.target.value as any }))}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="catalyst">Catalyst</option>
              </select>
              
              <select 
                className="form-select"
                value={state.locationTypeFilter}
                onChange={(e) => setState(prev => ({ ...prev, locationTypeFilter: e.target.value as any }))}
              >
                <option value="all">All Locations</option>
                <option value="physical">Physical</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
              
              <select 
                className="form-select"
                value={state.rsvpStatusFilter}
                onChange={(e) => setState(prev => ({ ...prev, rsvpStatusFilter: e.target.value as any }))}
              >
                <option value="all">All RSVP</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Company-Centric Calendar Grid Layout */}
        <div className="calendar-layout" style={{ position: 'relative', flex: 1 }}>
          {/* Main Calendar Grid */}
          <div className="calendar-main" style={{ width: '100%' }}>
            <div className="calendar-container">
              {/* Calendar Header with Days */}
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

              {/* Draggable Company Rows with Events */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={state.companies.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
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
                </SortableContext>
              </DndContext>
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
      )}

    </div>
  );
};

export default App;