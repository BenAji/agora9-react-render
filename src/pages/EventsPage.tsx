import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, ChevronDown, X, Building2, Users } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { CalendarEvent, UserWithSubscriptions } from '../types/database';
import { format } from 'date-fns';

interface EventsPageProps {
  currentUser: UserWithSubscriptions | null;
}

interface EventFilter {
  type: 'upcoming' | 'need_response' | 'my_events' | 'all';
  label: string;
  count: number;
}

interface EventSortOption {
  value: string;
  label: string;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventFilter['type']>('my_events');
  const [sortBy, setSortBy] = useState('date');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const filters: EventFilter[] = [
    { type: 'upcoming', label: 'Upcoming', count: 0 },
    { type: 'need_response', label: 'Need Response', count: 0 },
    { type: 'my_events', label: 'My Events', count: 0 },
    { type: 'all', label: 'All', count: 0 }
  ];

  const sortOptions: EventSortOption[] = [
    { value: 'date', label: 'Date' },
    { value: 'company', label: 'Company' },
    { value: 'type', label: 'Event Type' },
    { value: 'status', label: 'Status' }
  ];

  // Load events data
  const loadEventsData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      const userSubsResponse = await apiClient.getUserSubscriptions(currentUser.id);
      if (!userSubsResponse.success) {
        throw new Error('Failed to load user subscriptions');
      }

      const subscribedSubsectors = userSubsResponse.data
        .filter(sub => sub.is_active && sub.payment_status === 'paid')
        .map(sub => sub.subsector);


      // Get all events
      const eventsResponse = await apiClient.getEvents({
        start_date: new Date('2024-01-01'),
        end_date: new Date('2025-12-31'),
        user_id: currentUser.id
      });

      if (!eventsResponse.success) {
        throw new Error('Failed to load events');
      }

      // Filter events to only show those from companies in subscribed subsectors
      const allEvents = eventsResponse.data.events;
      const filteredEvents = allEvents.filter(event => {
        // Check if any company in this event belongs to a subscribed subsector
        return event.companies.some(company => 
          subscribedSubsectors.includes(company.gics_subsector)
        );
      });


      setEvents(filteredEvents);
      setFilteredEvents(filteredEvents);

    } catch (error) {
      console.error('Failed to load events data:', error);
      setError('Failed to load events data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.companies.some(company => 
          company.company_name.toLowerCase().includes(query) ||
          company.ticker_symbol.toLowerCase().includes(query)
        )
      );
    }

    // Apply event type filter
    switch (activeFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start_date);
          const now = new Date();
          return eventDate > now;
        });
        break;
      case 'need_response':
        filtered = filtered.filter(event => 
          !event.user_response || event.user_response.response_status === 'pending'
        );
        break;
      case 'my_events':
        filtered = filtered.filter(event => 
          event.user_response && event.user_response.response_status !== 'pending'
        );
        break;
      case 'all':
        // No additional filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'company':
          return a.companies[0]?.company_name.localeCompare(b.companies[0]?.company_name || '');
        case 'type':
          return a.event_type.localeCompare(b.event_type);
        case 'status':
          const statusA = a.user_response?.response_status || 'pending';
          const statusB = b.user_response?.response_status || 'pending';
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, activeFilter, sortBy]);

  // Update filter counts
  useEffect(() => {
    // Filter counts could be used to update filter labels in the future
    // const now = new Date();
    // const upcomingCount = events.filter(event => new Date(event.start_date) > now).length;
    // const needResponseCount = events.filter(event => 
    //   !event.user_response || event.user_response.response_status === 'pending'
    // ).length;
    // const myEventsCount = events.filter(event => 
    //   event.user_response && event.user_response.response_status !== 'pending'
    // ).length;
  }, [events]);

  // Load data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadEventsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Only depend on the ID, ignore loadEventsData

  // Early return if no current user
  if (!currentUser) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        color: 'var(--primary-text)'
      }}>
        Loading user data...
      </div>
    );
  }

  const handleEventSelect = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(event => event.id)));
    }
  };

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(date));
  };

  const formatEventTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).format(new Date(date));
  };

  const getEventStatus = (event: CalendarEvent) => {
    if (!event.user_response) {
      return { text: 'Pending', icon: '?', color: 'var(--warning-color)' };
    }
    
    switch (event.user_response.response_status) {
      case 'accepted':
        return { text: 'Accepted', icon: '✓', color: 'var(--success-color)' };
      case 'declined':
        return { text: 'Declined', icon: '✗', color: 'var(--error-color)' };
      case 'pending':
        return { text: 'Tentative', icon: '?', color: 'var(--warning-color)' };
      default:
        return { text: 'Pending', icon: '?', color: 'var(--warning-color)' };
    }
  };

  const getLocationDisplay = (event: CalendarEvent) => {
    if (event.location_type === 'virtual') {
      return 'Virtual';
    } else if (event.location_type === 'physical' && event.location_details) {
      const details = event.location_details as any;
      return details.city || details.venue || 'Physical';
    }
    return 'TBD';
  };

  // Event modal handlers
  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleRSVP = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      setLoading(true);
      
      if (selectedEvent?.user_response) {
        // Update existing RSVP
        await apiClient.updateRSVP(selectedEvent.user_response.id, {
          response_status: status,
          notes: undefined
        });
      } else {
        // Create new RSVP
        await apiClient.createRSVP({
          user_id: currentUser.id,
          event_id: eventId,
          response_status: status,
          notes: undefined
        });
      }
      
      // Reload events to get updated RSVP status
      await loadEventsData();
      
      // Update selected event with new status
      if (selectedEvent) {
        const updatedEvent = events.find(e => e.id === eventId);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }
      
    } catch (error) {
      console.error('Failed to update RSVP:', error);
      setError('Failed to update RSVP status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'var(--primary-text)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading Events...</div>
          <div style={{ color: 'var(--muted-text)' }}>Fetching your investment events</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'var(--error-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error Loading Events</div>
          <div style={{ color: 'var(--muted-text)', marginBottom: '1rem' }}>{error}</div>
          <button 
            onClick={loadEventsData}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--primary-bg)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: 'var(--primary-bg)',
      minHeight: '100vh',
      color: 'var(--primary-text)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          color: 'var(--primary-text)'
        }}>
          Investment Events
        </h1>
        <div style={{ 
          fontSize: '1rem', 
          color: 'var(--muted-text)',
          marginBottom: '1.5rem'
        }}>
          {filteredEvents.length} of {events.length} events • {events.filter(e => !e.user_response || e.user_response.response_status === 'pending').length} need response
        </div>

        {/* Search Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '1rem', 
            color: 'var(--muted-text)',
            zIndex: 1
          }} />
          <input
            type="text"
            placeholder="Search events, companies, tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              backgroundColor: 'var(--secondary-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--primary-text)',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Filter Tabs and Sort */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {filters.map((filter) => (
              <button
                key={filter.type}
                onClick={() => setActiveFilter(filter.type)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: activeFilter === filter.type ? 'var(--accent-bg)' : 'transparent',
                  color: activeFilter === filter.type ? 'var(--primary-bg)' : 'var(--primary-text)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter.type) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter.type) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {filter.label} ({filter.type === 'upcoming' ? events.filter(e => new Date(e.start_date) > new Date()).length :
                  filter.type === 'need_response' ? events.filter(e => !e.user_response || e.user_response.response_status === 'pending').length :
                  filter.type === 'my_events' ? events.filter(e => e.user_response && e.user_response.response_status !== 'pending').length :
                  events.length})
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--secondary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--primary-text)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}
              <ChevronDown size={16} />
            </button>

            {showSortDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                backgroundColor: 'var(--secondary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 50,
                minWidth: '150px'
              }}>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      backgroundColor: sortBy === option.value ? 'var(--accent-bg)' : 'transparent',
                      color: sortBy === option.value ? 'var(--primary-bg)' : 'var(--primary-text)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (sortBy !== option.value) {
                        (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sortBy !== option.value) {
                        (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div style={{ backgroundColor: 'var(--secondary-bg)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 120px 120px 120px 150px 80px 80px 100px',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--secondary-text)'
        }}>
          <div>
            <input
              type="checkbox"
              checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div>Event</div>
          <div>Ticker</div>
          <div>Type</div>
          <div>Status</div>
          <div>Company</div>
          <div>Date</div>
          <div>Time</div>
          <div>Location</div>
        </div>

        {/* Event Rows */}
        {filteredEvents.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--muted-text)'
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No events found</div>
            <div>Try adjusting your search or filter criteria</div>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const primaryCompany = event.companies[0];
            
            return (
              <div
                key={event.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 120px 120px 120px 150px 80px 80px 100px',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-light)',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                {/* Checkbox */}
                <div>
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.id)}
                    onChange={() => handleEventSelect(event.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                {/* Event Title */}
                <div style={{ fontWeight: '500', color: 'var(--primary-text)' }}>
                  {event.title}
                </div>

                {/* Ticker */}
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--secondary-text)'
                  }}>
                    {primaryCompany?.ticker_symbol || 'N/A'}
                  </span>
                </div>

                {/* Event Type */}
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'var(--accent-bg)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--primary-bg)'
                  }}>
                    {event.event_type.toUpperCase()}
                  </span>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ color: status.color, fontSize: '0.875rem' }}>
                    {status.icon}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
                    {status.text}
                  </span>
                </div>

                {/* Company Name */}
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
                  {primaryCompany?.company_name || 'N/A'}
                </div>

                {/* Date */}
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
                  {formatEventDate(event.start_date)}
                </div>

                {/* Time */}
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
                  {formatEventTime(event.start_date)}
                </div>

                {/* Location */}
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
                  {getLocationDisplay(event)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={handleCloseEventModal}
        >
          <div
            style={{
              backgroundColor: 'var(--primary-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--primary-text)',
                margin: 0
              }}>Event Details</h2>
              <button
                onClick={handleCloseEventModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-text)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                  (e.target as HTMLButtonElement).style.color = 'var(--primary-text)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLButtonElement).style.color = 'var(--muted-text)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Event Title */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--primary-text)',
                  marginBottom: '0.5rem'
                }}>{selectedEvent.title}</h3>
                <p style={{
                  color: 'var(--muted-text)',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.5'
                }}>{selectedEvent.description || 'No description available'}</p>
              </div>

              {/* Event Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                {/* Date & Time */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--secondary-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <Calendar size={16} style={{ color: 'var(--accent-bg)' }} />
                    <span style={{
                      fontWeight: '500',
                      color: 'var(--primary-text)',
                      fontSize: '0.875rem'
                    }}>Date & Time</span>
                  </div>
                  <div style={{ color: 'var(--primary-text)' }}>
                    {format(new Date(selectedEvent.start_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div style={{ color: 'var(--muted-text)', fontSize: '0.875rem' }}>
                    {format(new Date(selectedEvent.start_date), 'h:mm a')} - {format(new Date(selectedEvent.end_date), 'h:mm a')}
                  </div>
                </div>

                {/* Location */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--secondary-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <MapPin size={16} style={{ color: 'var(--accent-bg)' }} />
                    <span style={{
                      fontWeight: '500',
                      color: 'var(--primary-text)',
                      fontSize: '0.875rem'
                    }}>Location</span>
                  </div>
                  <div style={{ color: 'var(--primary-text)' }}>
                    {getLocationDisplay(selectedEvent)}
                  </div>
                  {selectedEvent.location_type === 'virtual' && (
                    <div style={{ color: 'var(--muted-text)', fontSize: '0.875rem' }}>
                      Online meeting
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--secondary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <Building2 size={16} style={{ color: 'var(--accent-bg)' }} />
                  <span style={{
                    fontWeight: '500',
                    color: 'var(--primary-text)',
                    fontSize: '0.875rem'
                  }}>Company Information</span>
                </div>
                {selectedEvent.companies.map((company, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: index < selectedEvent.companies.length - 1 ? '0.5rem' : 0
                  }}>
                    <div>
                      <div style={{
                        fontWeight: '500',
                        color: 'var(--primary-text)'
                      }}>{company.company_name}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-text)'
                      }}>{company.gics_sector} • {company.gics_subsector}</div>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--tertiary-bg)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--accent-bg)'
                    }}>{company.ticker_symbol}</span>
                  </div>
                ))}
              </div>

              {/* RSVP Status & Actions */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--secondary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <Users size={16} style={{ color: 'var(--accent-bg)' }} />
                  <span style={{
                    fontWeight: '500',
                    color: 'var(--primary-text)',
                    fontSize: '0.875rem'
                  }}>RSVP Status</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: (() => {
                        const status = getEventStatus(selectedEvent);
                        if (status.text === 'Accepted') return 'rgba(40, 167, 69, 0.1)';
                        if (status.text === 'Declined') return 'rgba(220, 53, 69, 0.1)';
                        return 'rgba(255, 193, 7, 0.1)';
                      })(),
                      color: (() => {
                        const status = getEventStatus(selectedEvent);
                        if (status.text === 'Accepted') return '#28a745';
                        if (status.text === 'Declined') return '#dc3545';
                        return '#ffc107';
                      })()
                    }}>
                      {getEventStatus(selectedEvent).text}
                    </span>
                    {selectedEvent.user_response?.response_date && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-text)'
                      }}>
                        {format(new Date(selectedEvent.user_response.response_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  {/* RSVP Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => handleRSVP(selectedEvent.id, 'accepted')}
                      disabled={loading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#218838';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#28a745';
                        }
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRSVP(selectedEvent.id, 'declined')}
                      disabled={loading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRSVP(selectedEvent.id, 'pending')}
                      disabled={loading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#e0a800';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#ffc107';
                        }
                      }}
                    >
                      Tentative
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
