import React, { useState, useMemo } from 'react';
import { CalendarEventData } from '../../types/calendar';
import EventCard from './EventCard';

interface EventsListProps {
  events: CalendarEventData[];
  onRSVPUpdate: (eventId: string, status: 'accepted' | 'declined' | 'pending') => void;
  onViewDetails: (event: CalendarEventData) => void;
  searchQuery?: string;
  filterBy?: 'upcoming' | 'need_response' | 'responded' | 'all_events';
  subsectorFilter?: string;
  isLoading?: boolean;
}

interface DateGroup {
  id: string;
  label: string;
  events: CalendarEventData[];
  priority: number;
}

const EventsList: React.FC<EventsListProps> = ({
  events,
  onRSVPUpdate,
  onViewDetails,
  searchQuery = '',
  filterBy = 'all_events',
  subsectorFilter = 'all',
  isLoading = false
}) => {
  // Filter and group events
  const { filteredEvents, dateGroups } = useMemo(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.companies?.some(company => 
          company.company_name.toLowerCase().includes(query) ||
          company.ticker_symbol.toLowerCase().includes(query)
        ) ||
        event.parsed_location?.displayText?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.companies?.[0]?.gics_subsector?.toLowerCase().includes(query)
      );
    }

    // Apply response status filter
    if (filterBy !== 'all_events') {
      switch (filterBy) {
        case 'upcoming':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.start_date);
            const now = new Date();
            return eventDate >= now;
          });
          break;
        case 'need_response':
          filtered = filtered.filter(event => event.rsvpStatus === 'pending');
          break;
        case 'responded':
          filtered = filtered.filter(event => 
            event.rsvpStatus === 'accepted' || event.rsvpStatus === 'declined'
          );
          break;
      }
    }

    // Apply subsector filter
    if (subsectorFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.companies?.some(company => 
          company.gics_subsector === subsectorFilter
        )
      );
    }

    // Group events by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const groups: DateGroup[] = [
      { id: 'today', label: 'Today', events: [], priority: 1 },
      { id: 'tomorrow', label: 'Tomorrow', events: [], priority: 2 },
      { id: 'this_week', label: 'This Week', events: [], priority: 3 },
      { id: 'next_week', label: 'Next Week', events: [], priority: 4 },
      { id: 'later', label: 'Later', events: [], priority: 5 }
    ];

    filtered.forEach(event => {
      const eventDate = new Date(event.start_date);
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      if (eventDateOnly.getTime() === today.getTime()) {
        groups[0].events.push(event);
      } else if (eventDateOnly.getTime() === tomorrow.getTime()) {
        groups[1].events.push(event);
      } else if (eventDateOnly >= today && eventDateOnly < nextWeek) {
        groups[2].events.push(event);
      } else if (eventDateOnly >= nextWeek && eventDateOnly < new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
        groups[3].events.push(event);
      } else {
        groups[4].events.push(event);
      }
    });

    // Sort events within each group by time
    groups.forEach(group => {
      group.events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });

    // Filter out empty groups
    const nonEmptyGroups = groups.filter(group => group.events.length > 0);

    return {
      filteredEvents: filtered,
      dateGroups: nonEmptyGroups
    };
  }, [events, searchQuery, filterBy, subsectorFilter]);

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
  if (filteredEvents.length === 0) {
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
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          opacity: 0.5
        }}>
          📅
        </div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--secondary-text)'
        }}>
          No events found
        </h3>
        <p style={{
          fontSize: '0.9rem',
          lineHeight: '1.5',
          maxWidth: '300px'
        }}>
          {searchQuery ? 'Try adjusting your search terms' : 'No events match your current filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="events-list" style={{
      padding: '0 1rem 1rem 1rem'
    }}>
      {dateGroups.map(group => (
        <div key={group.id} style={{ marginBottom: '2rem' }}>
          {/* Date Group Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📅</span>
              {group.label} ({group.events.length} event{group.events.length !== 1 ? 's' : ''})
            </h2>
          </div>

          {/* Events in this group */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {group.events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onRSVPUpdate={onRSVPUpdate}
                onViewDetails={onViewDetails}
                showSubsector={true}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Add CSS for loading animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EventsList;
