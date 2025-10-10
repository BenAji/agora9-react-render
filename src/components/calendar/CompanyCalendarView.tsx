/**
 * AGORA Company Calendar View Component
 * 
 * Displays a dedicated calendar view for a specific company
 * Shows all events related to that company (hosted and attended)
 * 
 * Features:
 * - Company header with info
 * - Event filtering (All, Hosted, Attended)
 * - Chronological event timeline
 * - Responsive design
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Building2, MapPin, Clock, Users } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isSameWeek, addWeeks } from 'date-fns';
import { CompanyRow } from '../../types/calendar';
import { CalendarEvent } from '../../types/database';

interface CompanyCalendarViewProps {
  company: CompanyRow;
  events: CalendarEvent[];
  onBack: () => void;
  onEventClick: (event: CalendarEvent) => void;
}

type EventFilter = 'all' | 'hosted' | 'attended' | 'upcoming' | 'past' | 'single_corp' | 'multi_corp' | 'non_company';

const CompanyCalendarView: React.FC<CompanyCalendarViewProps> = ({
  company,
  events,
  onBack,
  onEventClick
}) => {
  const [filterType, setFilterType] = useState<EventFilter>('all');

  // Filter events for this company
  const companyEvents = useMemo(() => {
    return events.filter(event => 
      event.companies.some(comp => comp.id === company.id)
    );
  }, [events, company.id]);

  // Separate hosted vs attended events using new hosting logic
  const hostedEvents = useMemo(() => {
    return companyEvents.filter(event => {
      if (!event.hosts || event.hosts.length === 0) return false;
      
      return event.hosts.some(host => {
        if (host.host_type === 'single_corp') {
          return host.host_id === company.id;
        } else if (host.host_type === 'multi_corp') {
          return host.companies_jsonb?.some((comp: any) => comp.id === company.id);
        }
        return false;
      });
    });
  }, [companyEvents, company.id]);

  const attendedEvents = useMemo(() => {
    return companyEvents.filter(event => {
      // Company is in event but not hosting
      const isAttending = event.companies.some(comp => comp.id === company.id);
      const isHosting = event.hosts && event.hosts.some(host => {
        if (host.host_type === 'single_corp') {
          return host.host_id === company.id;
        } else if (host.host_type === 'multi_corp') {
          return host.companies_jsonb?.some((comp: any) => comp.id === company.id);
        }
        return false;
      });
      
      return isAttending && !isHosting;
    });
  }, [companyEvents, company.id]);

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    let filtered = companyEvents;

    switch (filterType) {
      case 'hosted':
        filtered = hostedEvents;
        break;
      case 'attended':
        filtered = attendedEvents;
        break;
      case 'single_corp':
        filtered = companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'single_corp')
        );
        break;
      case 'multi_corp':
        filtered = companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'multi_corp')
        );
        break;
      case 'non_company':
        filtered = companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'non_company')
        );
        break;
      case 'upcoming':
        filtered = companyEvents.filter(event => new Date(event.start_date) > new Date());
        break;
      case 'past':
        filtered = companyEvents.filter(event => new Date(event.start_date) <= new Date());
        break;
      default:
        filtered = companyEvents;
    }

    // Sort by date
    return filtered.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }, [companyEvents, hostedEvents, attendedEvents, filterType]);

  // Get event count for each filter
  const getEventCount = (filter: EventFilter) => {
    switch (filter) {
      case 'hosted':
        return hostedEvents.length;
      case 'attended':
        return attendedEvents.length;
      case 'single_corp':
        return companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'single_corp')
        ).length;
      case 'multi_corp':
        return companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'multi_corp')
        ).length;
      case 'non_company':
        return companyEvents.filter(event => 
          event.hosts && event.hosts.some(host => host.host_type === 'non_company')
        ).length;
      case 'upcoming':
        return companyEvents.filter(event => new Date(event.start_date) > new Date()).length;
      case 'past':
        return companyEvents.filter(event => new Date(event.start_date) <= new Date()).length;
      default:
        return companyEvents.length;
    }
  };

  // Format date for display
  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    if (isSameWeek(date, addWeeks(new Date(), 1))) return `Next ${format(date, 'EEEE')}`;
    return format(date, 'MMM d, yyyy');
  };

  // Get RSVP status color
  const getRSVPColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#28a745';
      case 'declined': return '#ffc107';
      case 'pending': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: '#ffffff'
    }}>
      {/* Company Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderBottom: '2px solid #FFD700',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid #FFD700',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#FFD700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
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
            <ArrowLeft size={16} />
            Back to Calendar
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '60px',
            height: '60px'
          }}>
            <Building2 size={24} color="#000000" />
          </div>
          
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0',
              color: '#ffffff'
            }}>
              {company.company_name}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#b0b0b0'
            }}>
              <span style={{
                background: '#FFD700',
                color: '#000000',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {company.ticker_symbol}
              </span>
              <span>{company.gics_subsector}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Filters */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {(['all', 'hosted', 'attended', 'single_corp', 'multi_corp', 'non_company', 'upcoming', 'past'] as EventFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              style={{
                background: filterType === filter ? '#FFD700' : '#333333',
                color: filterType === filter ? '#000000' : '#ffffff',
                border: `1px solid ${filterType === filter ? '#FFD700' : '#555555'}`,
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (filterType !== filter) {
                  e.currentTarget.style.backgroundColor = '#555555';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== filter) {
                  e.currentTarget.style.backgroundColor = '#333333';
                }
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>
                {filter === 'all' ? 'All Events' : 
                 filter === 'hosted' ? 'Hosted' :
                 filter === 'attended' ? 'Attended' :
                 filter === 'single_corp' ? '🏢 Corporate' :
                 filter === 'multi_corp' ? '🏢🏢 Multi-Corp' :
                 filter === 'non_company' ? '🏛️ Regulatory' :
                 filter === 'upcoming' ? 'Upcoming' : 'Past'}
              </span>
              <span style={{
                background: filterType === filter ? 'rgba(0,0,0,0.2)' : '#555555',
                color: filterType === filter ? '#000000' : '#ffffff',
                padding: '0.125rem 0.5rem',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {getEventCount(filter)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Timeline */}
      <div style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#b0b0b0'
          }}>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>
              No events found
            </h3>
            <p>
              {filterType === 'all' ? 'This company has no events.' :
               filterType === 'hosted' ? 'This company is not hosting any events.' :
               filterType === 'attended' ? 'This company is not attending any events.' :
               filterType === 'upcoming' ? 'No upcoming events for this company.' :
               'No past events for this company.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {filteredEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFD700';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Event Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      margin: '0 0 0.5rem 0',
                      color: '#ffffff'
                    }}>
                      {event.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      color: '#b0b0b0',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        {formatEventDate(new Date(event.start_date))} at {format(new Date(event.start_date), 'h:mm a')}
                      </div>
                      {event.parsed_location?.displayText && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} />
                          {event.parsed_location.displayText}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {/* Host Type Badge */}
                    {event.hosts && event.hosts.length > 0 && (
                      <span style={{
                        background: event.hosts[0].host_type === 'single_corp' ? '#FFD700' : 
                                   event.hosts[0].host_type === 'multi_corp' ? '#FFA500' : '#87CEEB',
                        color: '#000000',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {event.hosts[0].host_type === 'single_corp' ? '🏢 Corporate' :
                         event.hosts[0].host_type === 'multi_corp' ? '🏢🏢 Multi-Corp' : '🏛️ Regulatory'}
                      </span>
                    )}
                    
                    {/* Event Type Badge */}
                    <span style={{
                      background: event.event_type === 'catalyst' ? '#FFD700' : '#6c757d',
                      color: event.event_type === 'catalyst' ? '#000000' : '#ffffff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {event.event_type}
                    </span>
                    
                    {/* RSVP Status */}
                    {event.rsvpStatus && (
                      <span style={{
                        background: getRSVPColor(event.rsvpStatus),
                        color: '#ffffff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {event.rsvpStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Description */}
                {event.description && (
                  <p style={{
                    color: '#b0b0b0',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    margin: '0 0 1rem 0'
                  }}>
                    {event.description}
                  </p>
                )}

                {/* Event Companies */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#b0b0b0',
                  fontSize: '0.875rem'
                }}>
                  <Users size={14} />
                  <span>Companies: </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {event.companies.map((comp, index) => {
                      // Check if this company is hosting
                      const isHosting = event.hosts && event.hosts.some(host => {
                        if (host.host_type === 'single_corp') {
                          return host.host_id === comp.id;
                        } else if (host.host_type === 'multi_corp') {
                          return host.companies_jsonb?.some((h: any) => h.id === comp.id);
                        }
                        return false;
                      });
                      
                      return (
                        <span
                          key={comp.id}
                          style={{
                            background: comp.id === company.id ? '#FFD700' : 
                                      isHosting ? '#FFA500' : '#333333',
                            color: comp.id === company.id || isHosting ? '#000000' : '#ffffff',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {comp.ticker_symbol}
                          {isHosting && ' (Host)'}
                          {comp.id === company.id && !isHosting && ' (You)'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyCalendarView;
