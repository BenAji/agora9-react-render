import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Eye } from 'lucide-react';
import { CalendarEvent } from '../../types/database';

interface EventsTableProps {
  events: CalendarEvent[];
  onViewEvent: (event: CalendarEvent) => void;
  onRSVPUpdate: (eventId: string, status: 'accepted' | 'declined' | 'pending') => void;
  searchQuery?: string;
  filterBy?: 'upcoming' | 'need_response' | 'responded' | 'all_events';
  subsectorFilter?: string;
  sortBy?: 'date' | 'subsector' | 'company' | 'status';
  onSortChange?: (sort: 'date' | 'subsector' | 'company' | 'status') => void;
  isLoading?: boolean;
}

interface EventRow {
  id: string;
  title: string;
  ticker: string;
  eventType: string;
  status: 'done' | 'pending' | 'upcoming';
  rsvpStatus: 'accepted' | 'declined' | 'tentative' | 'pending';
  companyName: string;
  subsector: string;
  date: string;
  time: string;
  location: string;
  isSelected: boolean;
}

const EventsTable: React.FC<EventsTableProps> = ({
  events,
  onViewEvent,
  onRSVPUpdate,
  searchQuery = '',
  filterBy = 'all_events',
  subsectorFilter = 'all',
  sortBy = 'date',
  onSortChange,
  isLoading = false
}) => {
  const [selectedEvents] = useState<string[]>([]);

  // Process events into table rows
  const eventRows = useMemo(() => {
    let processed = events.map(event => {
      const eventDate = new Date(event.start_date);
      const now = new Date();
      const isPast = eventDate < now;
      const isToday = eventDate.toDateString() === now.toDateString();
      
      // Determine status
      let status: 'done' | 'pending' | 'upcoming';
      if (isPast) {
        status = 'done';
      } else if (isToday) {
        status = 'pending';
      } else {
        status = 'upcoming';
      }

      // Get subsector from first company
      const subsector = event.companies?.[0]?.gics_subsector || 'Unknown';

      return {
        id: event.id,
        title: event.title,
        ticker: event.companies?.[0]?.ticker_symbol || 'N/A',
        eventType: event.event_type?.toUpperCase() || 'EVENT',
        status,
        rsvpStatus: event.rsvpStatus || 'pending',
        companyName: event.companies?.[0]?.company_name || 'Unknown Company',
        subsector,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: eventDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        location: event.parsed_location?.displayText || 'TBD',
        isSelected: selectedEvents.includes(event.id)
      } as EventRow;
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(row => 
        row.title.toLowerCase().includes(query) ||
        row.companyName.toLowerCase().includes(query) ||
        row.ticker.toLowerCase().includes(query) ||
        row.eventType.toLowerCase().includes(query) ||
        row.subsector.toLowerCase().includes(query) ||
        row.location.toLowerCase().includes(query)
      );
    }

    // Apply response status filter
    if (filterBy !== 'all_events') {
      switch (filterBy) {
        case 'upcoming':
          processed = processed.filter(row => row.status === 'upcoming');
          break;
        case 'need_response':
          processed = processed.filter(row => row.rsvpStatus === 'pending');
          break;
        case 'responded':
          processed = processed.filter(row => 
            row.rsvpStatus === 'accepted' || row.rsvpStatus === 'declined'
          );
          break;
      }
    }

    // Apply subsector filter
    if (subsectorFilter !== 'all') {
      processed = processed.filter(row => row.subsector === subsectorFilter);
    }

    // Apply sorting
    processed.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'subsector':
          return a.subsector.localeCompare(b.subsector);
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'status':
          return a.rsvpStatus.localeCompare(b.rsvpStatus);
        default:
          return 0;
      }
    });

    return processed;
  }, [events, searchQuery, filterBy, subsectorFilter, sortBy, selectedEvents]);

  // Get RSVP status display with Bloomberg colors
  const getRSVPDisplay = (status: string, rsvpStatus: string) => {
    const statusConfig = {
      done: {
        accepted: { text: 'Done', rsvp: 'Accepted', color: '#00C851', icon: '✅' },
        declined: { text: 'Done', rsvp: 'Declined', color: '#FF4444', icon: '❌' },
        tentative: { text: 'Done', rsvp: 'Tentative', color: '#FFBB33', icon: '❓' },
        pending: { text: 'Done', rsvp: 'No Response', color: '#B3B3B3', icon: '⏳' }
      },
      pending: {
        accepted: { text: 'Pending', rsvp: 'Accepted', color: '#33B5E5', icon: '📅' },
        declined: { text: 'Pending', rsvp: 'Declined', color: '#FF4444', icon: '❌' },
        tentative: { text: 'Pending', rsvp: 'Tentative', color: '#FFBB33', icon: '❓' },
        pending: { text: 'Pending', rsvp: 'No Response', color: '#B3B3B3', icon: '⏳' }
      },
      upcoming: {
        accepted: { text: 'Upcoming', rsvp: 'Accepted', color: '#33B5E5', icon: '📅' },
        declined: { text: 'Upcoming', rsvp: 'Declined', color: '#FF4444', icon: '❌' },
        tentative: { text: 'Upcoming', rsvp: 'Tentative', color: '#FFBB33', icon: '❓' },
        pending: { text: 'Upcoming', rsvp: 'No Response', color: '#B3B3B3', icon: '⏳' }
      }
    };

    return statusConfig[status as keyof typeof statusConfig]?.[rsvpStatus as keyof typeof statusConfig.done] || 
           statusConfig.done.pending;
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: 'var(--muted-text)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-bg)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p>Loading events...</p>
      </div>
    );
  }

  // Empty state
  if (eventRows.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center',
        color: 'var(--muted-text)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📅</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--secondary-text)' }}>
          No events found
        </h3>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '300px' }}>
          {searchQuery ? 'Try adjusting your search terms' : 'No events match your current filters'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Desktop Table */}
      <div style={{ display: 'none' }} className="desktop-table">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #333333'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#333333' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Event
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Ticker
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Type
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Company
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Subsector
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Date
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Time
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Location
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#FFFFFF', borderBottom: '2px solid #FFD700' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {eventRows.map((row) => {
              const rsvpDisplay = getRSVPDisplay(row.status, row.rsvpStatus);
              return (
                <tr 
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #333333',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: '#1A1A1A'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1A1A1A';
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: '500', color: '#FFFFFF' }}>
                    {row.title}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: '#FFD700',
                      color: '#000000',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid #FFD700'
                    }}>
                      {row.ticker}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: '#333333',
                      color: '#FFFFFF',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      border: '1px solid #555555'
                    }}>
                      {row.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                        {rsvpDisplay.text}
                      </span>
                      <span style={{ color: rsvpDisplay.color }}>
                        {rsvpDisplay.icon}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: rsvpDisplay.color, fontWeight: '600' }}>
                        {rsvpDisplay.rsvp}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#FFFFFF' }}>
                    {row.companyName}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#FFFFFF' }}>
                    {row.subsector}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="#FFD700" />
                      {row.date}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="#FFD700" />
                      {row.time}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#FFD700" />
                      {row.location}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEvent(events.find(e => e.id === row.id)!);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#FFD700',
                        border: '1px solid #FFD700',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFD700';
                        e.currentTarget.style.color = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#FFD700';
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Condensed Table */}
      <div style={{ display: 'block' }} className="mobile-table">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {eventRows.map((row) => {
            const rsvpDisplay = getRSVPDisplay(row.status, row.rsvpStatus);
            return (
              <div
                key={row.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1A1A1A';
                }}
                onClick={() => onViewEvent(events.find(e => e.id === row.id)!)}
              >
                {/* Row 1: Title, Ticker, Status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: 0,
                    flex: 1,
                    marginRight: '12px'
                  }}>
                    {row.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#FFD700',
                      color: '#000000',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid #FFD700'
                    }}>
                      {row.ticker}
                    </span>
                    <span style={{ color: rsvpDisplay.color }}>
                      {rsvpDisplay.icon}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: rsvpDisplay.color, fontWeight: '600' }}>
                      {rsvpDisplay.rsvp}
                    </span>
                  </div>
                </div>

                {/* Row 2: Company, Date, Time, Location, View Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    flex: 1
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#FFFFFF',
                      fontWeight: '500'
                    }}>
                      {row.companyName}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.8rem',
                      color: '#FFFFFF'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#FFD700" />
                        {row.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="#FFD700" />
                        {row.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#FFD700" />
                        {row.location}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewEvent(events.find(e => e.id === row.id)!);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#FFD700',
                      border: '1px solid #FFD700',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '60px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFD700';
                      e.currentTarget.style.color = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#FFD700';
                    }}
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS for responsive behavior */}
      <style>
        {`
          @media (min-width: 1024px) {
            .desktop-table { display: block !important; }
            .mobile-table { display: none !important; }
          }
          @media (max-width: 1023px) {
            .desktop-table { display: none !important; }
            .mobile-table { display: block !important; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EventsTable;
