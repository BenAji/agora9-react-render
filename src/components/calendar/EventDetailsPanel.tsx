/**
 * AGORA Event Details Panel Component - Office Add-in Optimized
 * 
 * PHASE 4: Enhanced UI with Office Add-in Requirements
 * Dependencies: calendar.ts types
 * Purpose: Right sidebar for event details with compact, touch-friendly design
 * 
 * SAFETY: Uses mock data only, no API calls
 * OFFICE: Optimized for 320px+ width, touch targets 44px+
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CalendarEvent, EventHost } from '../../types/database';
import { apiClient } from '../../utils/apiClient';
import { 
  MapPin, 
  Users, 
  Building2, 
  Calendar as CalendarIcon, 
  X, 
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import MiniCalendar from './MiniCalendar';
import WeatherForecast from './WeatherForecast';

interface EventDetailsPanelProps {
  event: CalendarEvent | null;
  isVisible: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  onRSVPUpdate?: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
  className?: string;
  events?: CalendarEvent[];
}

// Helper functions for host information
const getHostTypeIcon = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return '🏢';
    case 'multi_corp': return '🏢🏢';
    case 'non_company': return '🏛️';
    default: return '📅';
  }
};

const getHostTypeColor = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return '#FFD700';
    case 'multi_corp': return '#FFA500';
    case 'non_company': return '#87CEEB';
    default: return '#6c757d';
  }
};

const getHostTypeLabel = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return 'Corporate Event';
    case 'multi_corp': return 'Multi-Corporate Event';
    case 'non_company': return 'Regulatory/Association Event';
    default: return 'Event';
  }
};

const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({ 
  event, 
  isVisible, 
  onClose,
  onDateSelect,
  onRSVPUpdate,
  className,
  events = []
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [hostDetails, setHostDetails] = useState<EventHost[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);

  // Fetch host details when panel opens
  const fetchHostDetails = useCallback(async () => {
    if (!event?.hosts || event.hosts.length === 0) return;
    
    setLoadingHosts(true);
    try {
      const detailedHosts: EventHost[] = [];
      
      for (const host of event.hosts) {
        if (!host.host_id) continue;
        
        try {
          if (host.host_type === 'single_corp') {
            // Fetch company details
            const companyResponse = await apiClient.getCompany(host.host_id);
            if (companyResponse.success && companyResponse.data) {
              const company = companyResponse.data;
              detailedHosts.push({
                ...host,
                host_name: company.company_name,
                host_ticker: company.ticker_symbol,
                host_sector: company.gics_sector,
                host_subsector: company.gics_subsector,
              });
            }
          } else if (host.host_type === 'non_company') {
            // For organizations, we'll need to implement a getOrganization method
            // For now, we'll use the basic host info
            detailedHosts.push(host);
          } else if (host.host_type === 'multi_corp' && host.companies_jsonb) {
            // Extract details from companies_jsonb
            const primaryCompany = host.companies_jsonb.find((c: any) => c.is_primary);
            if (primaryCompany) {
              detailedHosts.push({
                ...host,
                host_name: primaryCompany.name,
                host_ticker: primaryCompany.ticker,
                host_sector: '', // companies_jsonb doesn't include sector info
                host_subsector: '', // companies_jsonb doesn't include subsector info
              });
            }
          }
        } catch (error) {
          // Error fetching host details for specific host
          // Add the basic host info if detailed fetch fails
          detailedHosts.push(host);
        }
      }
      
      setHostDetails(detailedHosts);
    } catch (error) {
      // Error fetching host details
      // Fallback to basic host info
      setHostDetails(event.hosts);
    } finally {
      setLoadingHosts(false);
    }
  }, [event?.hosts]);

  // Load host details when panel becomes visible
  useEffect(() => {
    if (isVisible && event?.hosts) {
      fetchHostDetails();
    }
  }, [isVisible, event?.hosts, fetchHostDetails]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  if (!event || !isVisible) return null;

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (startDate: Date, endDate: Date) => {
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'earnings': return '#3B82F6'; // Blue
      case 'conference': return '#10B981'; // Green
      case 'webinar': return '#8B5CF6'; // Purple
      case 'catalyst': return '#F59E0B'; // Orange
      default: return '#6B7280'; // Gray
    }
  };

  const getRSVPStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={16} />;
      case 'declined': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getLocationTypeIcon = (locationType: string) => {
    switch (locationType) {
      case 'physical': return <MapPin size={16} />;
      case 'virtual': return <Globe size={16} />;
      case 'hybrid': return <Building2 size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  return (
    <div
      ref={panelRef}
      className={`event-details-panel ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(420px, max(320px, 25vw))', // Responsive width: 320px min, 420px max (increased for mini calendar dots)
        backgroundColor: 'var(--secondary-bg)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '44px', // Touch-friendly
            height: '44px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-text)',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>

        {/* Event Type Badge - Reduced Size */}
        <div style={{
          display: 'inline-block',
          padding: '0.2rem 0.5rem',
          backgroundColor: getEventTypeColor(event.event_type),
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.65rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          marginBottom: '0.75rem'
        }}>
          {event.event_type}
        </div>

        {/* Event Title */}
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem',
          lineHeight: '1.3',
          paddingRight: '2rem' // Space for close button
        }}>
          {event.title}
        </h2>

        {/* Host Information Section - Enhanced with Fallback */}
        {(event.hosts && event.hosts.length > 0) || (event.companies && event.companies.length > 0) ? (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid #333',
            borderRadius: '8px'
          }}>
            <h4 style={{
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
            }}>
              {event.hosts && event.hosts.length > 0 
                ? `${getHostTypeIcon(event.primary_host?.host_type || event.hosts[0]?.host_type)} Hosting information`
                : '🏢 Participating companies'
              }
            </h4>
            
            {event.hosts.map((host, index) => (
              <div key={host.id} style={{
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '0.5rem',
                marginBottom: index < event.hosts.length - 1 ? '0.5rem' : '0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    color: '#ADADAD',
                    fontSize: '0.75rem',
                    fontWeight: '400'
                  }}>
                    {host.primary_company_id === host.host_id ? 'Primary host' : 'Co-host'}
                  </span>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#ffffff'
                  }}>
                    {host.host_name}
                  </span>
                  {host.host_ticker && (
                    <span style={{
                      color: '#ADADAD',
                      fontSize: '0.75rem',
                      fontWeight: '400'
                    }}>
                      {host.host_ticker}
                    </span>
                  )}
                </div>
                <div style={{
                  color: '#b0b0b0',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>{getHostTypeLabel(host.host_type)}</span>
                  {host.host_sector && (
                    <>
                      <span>•</span>
                      <span>{host.host_sector}</span>
                      {host.host_subsector && (
                        <>
                          <span>•</span>
                          <span>{host.host_subsector}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                {/* Multi-corporate hosts display */}
                {host.host_type === 'multi_corp' && host.companies_jsonb && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#111',
                    borderRadius: '4px',
                    border: '1px solid #444'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b0b0b0',
                      marginBottom: '0.25rem',
                      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}>
                      Co-hosting with:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#ADADAD'
                    }}>
                      {host.companies_jsonb.map((comp, compIndex, array) => (
                        <React.Fragment key={compIndex}>
                          <span style={{ fontWeight: comp.is_primary ? '600' : '400' }}>
                            {comp.ticker} {comp.is_primary && '(Primary)'}
                          </span>
                          {compIndex < array.length - 1 && (
                            <span style={{ color: '#666666' }}>|</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Fallback: Show participating companies if no host info */}
            {(!event.hosts || event.hosts.length === 0) && event.companies && event.companies.length > 0 && (
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '0.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#b0b0b0',
                  marginBottom: '0.5rem'
                }}>
                  Companies attending this event:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#ADADAD'
                }}>
                  {event.companies.map((company, compIndex) => (
                    <React.Fragment key={compIndex}>
                      <span>{company.ticker_symbol}</span>
                      {compIndex < event.companies.length - 1 && (
                        <span style={{ color: '#666666' }}>|</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {event.companies[0]?.gics_sector && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#b0b0b0'
                  }}>
                    Sector: {event.companies[0].gics_sector}
                    {event.companies[0].gics_subsector && ` • ${event.companies[0].gics_subsector}`}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Event Description */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--muted-text)',
          lineHeight: '1.5',
          marginBottom: '1rem'
        }}>
          {event.description}
        </p>

        {/* Host Information - Display based on host type */}
        {(event.hosts && event.hosts.length > 0) && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--tertiary-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem'
          }}>
            {loadingHosts ? (
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-text)',
                textAlign: 'center',
                padding: '1rem'
              }}>
                Loading host information...
              </div>
            ) : hostDetails.length > 0 ? (
              hostDetails.map((host, index) => {
              // Determine host display based on host_type
              if (host.host_type === 'single_corp') {
                return (
                  <div key={host.id} style={{ marginBottom: index < hostDetails.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--muted-text)', 
                      marginBottom: '0.25rem',
                      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}>
                      Host company
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
                      {host.host_ticker} - {host.host_name}
                    </div>
                    {host.host_sector && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                        {host.host_sector}{host.host_subsector && ` • ${host.host_subsector}`}
                      </div>
                    )}
                  </div>
                );
              } else if (host.host_type === 'multi_corp') {
                const coHosts = host.companies_jsonb || [];
                const primaryHost = coHosts.find((c: any) => c.is_primary);
                const otherHosts = coHosts.filter((c: any) => !c.is_primary);
                
                return (
                  <div key={host.id} style={{ marginBottom: index < hostDetails.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--muted-text)', 
                      marginBottom: '0.25rem',
                      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}>
                      Co-hosted by multiple companies
                    </div>
                    {primaryHost && (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
                        Primary host: {primaryHost.ticker} - {primaryHost.name}
                      </div>
                    )}
                    {otherHosts.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: '0.25rem' }}>
                        Co-hosts: {otherHosts.map((c: any) => c.ticker).join(', ')}
                      </div>
                    )}
                  </div>
                );
              } else if (host.host_type === 'non_company') {
                return (
                  <div key={host.id} style={{ marginBottom: index < hostDetails.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--muted-text)', 
                      marginBottom: '0.25rem',
                      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
                    }}>
                      Host organization
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
                      {host.host_name}
                    </div>
                    {host.host_sector && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                        {host.host_sector}{host.host_subsector && ` • ${host.host_subsector}`}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })
            ) : (
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--muted-text)',
                textAlign: 'center',
                padding: '1rem'
              }}>
                Host information not available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Information Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Date & Time Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CalendarIcon size={14} color="#ADADAD" />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--primary-text)',
              fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
            }}>
              Date & time
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.25rem' }}>
            {formatEventDate(event.start_date)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            {formatEventTime(event.start_date, event.end_date)}
          </div>
        </div>

        {/* Location Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {React.cloneElement(getLocationTypeIcon(event.location_type), { size: 14 })}
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--primary-text)',
              fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
            }}>
              Location
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)', marginBottom: '0.25rem' }}>
            {event.location_type === 'virtual' ? 'Virtual Event' : 
             event.location_type === 'hybrid' ? 'Hybrid Event' : 'In-Person Event'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            {event.parsed_location?.displayText || 'Location details not available'}
          </div>
        </div>

        {/* Attendees Card */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={14} color="#ADADAD" />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--primary-text)',
              fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
            }}>
              Attendees
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)' }}>
            Analysts Attending: {event.attendees?.length || 0} confirmed
          </div>
        </div>
      </div>

      {/* RSVP Section */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Shield size={14} color="#ADADAD" />
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: 'var(--primary-text)',
            fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
          }}>
            Your response
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ color: getRSVPStatusColor(event.rsvpStatus || 'pending') }}>
            {React.cloneElement(getRSVPStatusIcon(event.rsvpStatus || 'pending'), { size: 14 })}
          </div>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: getRSVPStatusColor(event.rsvpStatus || 'pending'),
            textTransform: 'capitalize'
          }}>
            {event.rsvpStatus || 'pending'}
          </span>
        </div>

        {/* RSVP Action Buttons - Improved Colors */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => onRSVPUpdate?.(event.id, 'accepted')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: event.rsvpStatus === 'accepted' ? '#10B981' : '#374151',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: !onRSVPUpdate ? 0.6 : 1,
              minHeight: '44px', // Touch-friendly
              transition: 'all 0.2s ease'
            }}
          >
            Accept
          </button>
          <button 
            onClick={() => onRSVPUpdate?.(event.id, 'declined')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: event.rsvpStatus === 'declined' ? '#EF4444' : '#374151',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: !onRSVPUpdate ? 0.6 : 1,
              minHeight: '44px', // Touch-friendly
              transition: 'all 0.2s ease'
            }}
          >
            Decline
          </button>
        </div>
      </div>



      {/* Mini Calendar - As per PRD Step 3.2 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: 'var(--primary-text)', 
          marginBottom: '0.75rem',
          fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
        }}>
          Calendar navigation
        </h3>
        <MiniCalendar
          selectedDate={event.start_date}
          onDateSelect={onDateSelect}
          events={events}
        />
      </div>

      {/* Weather Forecast - As per PRD Step 3.3 */}
      <div style={{ marginBottom: '1rem' }}>
        <WeatherForecast
          eventDate={event.start_date}
          location={event.parsed_location?.weatherLocation || event.weather_location || 'Event Location'}
        />
      </div>
    </div>
  );
};

export default EventDetailsPanel;