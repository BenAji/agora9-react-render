/**
 * Mobile-Friendly Events Page
 * 
 * Features:
 * - Compact list layout with expandable cards
 * - Simplified search and filter
 * - Event type badges
 * - Host information display
 * - Bloomberg theme
 * - Quick RSVP actions
 */

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CalendarEvent } from '../../types/database';
import MobileEventCard from './MobileEventCard';

interface MobileEventsPageProps {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  onRSVPUpdate: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
  onRefresh: () => Promise<void>;
}

const MobileEventsPage: React.FC<MobileEventsPageProps> = ({
  events,
  loading,
  error,
  onRSVPUpdate,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'upcoming' | 'pending' | 'responded'>('all');

  // Calculate event counts
  const eventCounts = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.start_date) >= now).length;
    const pending = events.filter(event => 
      (event.rsvpStatus || event.user_rsvp_status) === 'pending'
    ).length;
    const responded = events.filter(event => {
      const status = event.rsvpStatus || event.user_rsvp_status;
      return status === 'accepted' || status === 'declined';
    }).length;

    return {
      all: events.length,
      upcoming,
      pending,
      responded
    };
  }, [events]);

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply filter
    const now = new Date();
    switch (filterBy) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.start_date) >= now);
        break;
      case 'pending':
        filtered = filtered.filter(event => 
          (event.rsvpStatus || event.user_rsvp_status) === 'pending'
        );
        break;
      case 'responded':
        filtered = filtered.filter(event => {
          const status = event.rsvpStatus || event.user_rsvp_status;
          return status === 'accepted' || status === 'declined';
        });
        break;
      default:
        // Show all
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        // Search in title
        if (event.title.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (event.description?.toLowerCase().includes(query)) return true;
        
        // Search in host name/ticker
        if (event.hosts?.some(host => 
          host.host_name?.toLowerCase().includes(query) ||
          host.host_ticker?.toLowerCase().includes(query)
        )) return true;
        
        // Search in companies
        if (event.companies?.some(company =>
          company.company_name.toLowerCase().includes(query) ||
          company.ticker_symbol.toLowerCase().includes(query)
        )) return true;
        
        return false;
      });
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return filtered;
  }, [events, filterBy, searchQuery]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        backgroundColor: '#000000',
        color: '#FFFFFF'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            📅
          </div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        backgroundColor: '#000000',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333333'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            ⚠️
          </div>
          <h3 style={{
            color: '#FFD700',
            marginBottom: '1rem'
          }}>
            Error Loading Events
          </h3>
          <p style={{
            color: '#cccccc',
            marginBottom: '1rem'
          }}>
            {error}
          </p>
          <button
            onClick={onRefresh}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FFD700',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Events
        </h1>
        <p style={{
          color: '#cccccc',
          fontSize: '14px',
          margin: 0
        }}>
          View and manage your event calendar
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '1rem'
      }}>
        <Search 
          size={20} 
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666666'
          }}
        />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '16px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#FFD700';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#333333';
          }}
        />
      </div>

      {/* Filter Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'all', label: 'All', count: eventCounts.all },
          { id: 'upcoming', label: 'Upcoming', count: eventCounts.upcoming },
          { id: 'pending', label: 'Need Response', count: eventCounts.pending },
          { id: 'responded', label: 'Responded', count: eventCounts.responded }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterBy(filter.id as any)}
            style={{
              padding: '8px 16px',
              backgroundColor: filterBy === filter.id ? '#FFD700' : '#333333',
              color: filterBy === filter.id ? '#000000' : '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {filter.label}
            <span style={{
              backgroundColor: filterBy === filter.id ? 'rgba(0,0,0,0.2)' : '#555555',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Events Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333333',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFD700',
            marginBottom: '4px'
          }}>
            {eventCounts.upcoming}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#cccccc',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Upcoming
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333333',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFD700',
            marginBottom: '4px'
          }}>
            {eventCounts.pending}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#cccccc',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Need Response
          </div>
        </div>
      </div>

      {/* Events List */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#cccccc',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            {searchQuery && ' found'}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#666666'
          }}>
            Tap to expand details
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div>
            {filteredEvents.map(event => (
              <MobileEventCard
                key={event.id}
                event={event}
                onRSVPUpdate={onRSVPUpdate}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333333'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📅
            </div>
            <h3 style={{
              color: '#FFFFFF',
              marginBottom: '0.5rem'
            }}>
              No Events Found
            </h3>
            <p style={{
              color: '#cccccc',
              fontSize: '14px'
            }}>
              {searchQuery 
                ? 'Try adjusting your search query or filters'
                : 'No events match the selected filter'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEventsPage;
