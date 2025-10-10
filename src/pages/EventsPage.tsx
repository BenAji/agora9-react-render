import React, { useState } from 'react';
import { CalendarEvent } from '../types/database';
import { useCalendarData } from '../hooks/useCalendarData';
import EventsPageHeader from '../components/events/EventsPageHeader';
import EventsTable from '../components/events/EventsTable';
import EventDetailsPanel from '../components/calendar/EventDetailsPanel';

interface EventsPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser, onLogout }) => {
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'upcoming' | 'need_response' | 'responded' | 'all_events'>('all_events');
  const [subsectorFilter, setSubsectorFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'subsector' | 'company' | 'status'>('date');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsVisible, setIsEventDetailsVisible] = useState(false);

  // Use calendar data hook
  const { events, loading, error, updateRSVP, refreshData } = useCalendarData();

  // Calculate event counts for filters
  const eventCounts = React.useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.start_date) >= now).length;
    const needResponse = events.filter(event => event.rsvpStatus === 'pending').length;
    const responded = events.filter(event => 
      event.rsvpStatus === 'accepted' || event.rsvpStatus === 'declined'
    ).length;

    return {
      upcoming,
      need_response: needResponse,
      responded,
      all_events: events.length
    };
  }, [events]);

  // Get available subsectors from events
  const availableSubsectors = React.useMemo(() => {
    const subsectors = new Set<string>();
    events.forEach(event => {
      event.companies?.forEach(company => {
        if (company.gics_subsector) {
          subsectors.add(company.gics_subsector);
        }
      });
    });
    return Array.from(subsectors).sort();
  }, [events]);

  // Handle RSVP updates
  const handleRSVPUpdate = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      await updateRSVP(eventId, status);
      // Refresh data to get updated counts
      await refreshData();
    } catch (error) {
    }
  };

  // Handle event details view
  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsVisible(true);
  };

  // Handle event details close
  const handleCloseDetails = () => {
    setIsEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  // Handle date selection from event details panel
  const handleDateSelect = (date: Date) => {
    // For now, just close the panel
    // In the future, this could navigate to calendar view for that date
    handleCloseDetails();
  };

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: 'var(--error-color)',
        textAlign: 'center'
      }}>
        <h2>Error Loading Events</h2>
        <p>{error}</p>
        <button
          onClick={() => refreshData()}
          style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--primary-bg)',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      position: 'relative'
    }}>
      {/* Header */}
      <EventsPageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        subsectorFilter={subsectorFilter}
        onSubsectorFilterChange={setSubsectorFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        eventCounts={eventCounts}
        availableSubsectors={availableSubsectors}
      />

      {/* Events Table */}
      <EventsTable
        events={events}
        onViewEvent={handleViewDetails}
        onRSVPUpdate={handleRSVPUpdate}
        searchQuery={searchQuery}
        filterBy={filterBy}
        subsectorFilter={subsectorFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isLoading={loading}
      />

      {/* Event Details Panel */}
      {isEventDetailsVisible && selectedEvent && (
        <EventDetailsPanel
          event={selectedEvent}
          isVisible={isEventDetailsVisible}
          onClose={handleCloseDetails}
          onRSVPUpdate={handleRSVPUpdate}
          onDateSelect={handleDateSelect}
          events={events}
        />
      )}
    </div>
  );
};

export default EventsPage;

