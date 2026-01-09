import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types/database';
import { useCalendarData } from '../hooks/useCalendarData';
import EventsPageHeader from '../components/events/EventsPageHeader';
import EventsTable from '../components/events/EventsTable';
import EventDetailsPanel from '../components/calendar/EventDetailsPanel';
import MobileEventsPage from '../components/events/MobileEventsPage';

interface EventsPageProps {
  currentUser: any;
  onLogout?: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ currentUser, onLogout }) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'upcoming' | 'need_response' | 'responded' | 'all_events'>('all_events');
  const [subsectorFilter, setSubsectorFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'subsector' | 'company' | 'status'>('date');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsVisible, setIsEventDetailsVisible] = useState(false);

  // Use calendar data hook
  const { events, loading, error, updateRSVP, refreshData } = useCalendarData();

  // Calculate event counts for filters (moved before conditional return)
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

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use mobile component for mobile devices
  if (isMobile) {
    return <MobileEventsPage events={events} loading={loading} error={error} onRSVPUpdate={updateRSVP} onRefresh={refreshData} />;
  }

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
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '1.25rem' 
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            color: 'var(--error-color)',
            textAlign: 'center',
            backgroundColor: 'var(--secondary-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h2>Error Loading Events</h2>
            <p>{error}</p>
            <button
              onClick={() => refreshData()}
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--primary-bg)',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
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

      {/* Content Container */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 2rem' 
      }}>
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
      </div>

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

