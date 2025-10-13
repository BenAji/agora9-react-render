/**
 * AGORA Event Details Panel Component - Office Add-in Optimized
 * 
 * Rebuilt from scratch based on EventDetailsPanel_Documentation.md
 * Purpose: Fixed-position right sidebar with touch-friendly design
 * 
 * Features:
 * - Host Information Section (single_corp, multi_corp, non_company)
 * - Event Information Cards (Date, Location, Attendees)
 * - RSVP Section with status indicators
 * - Weather Forecast integration
 * - Click-outside-to-close functionality
 */

import React, { useRef, useEffect, useState } from 'react';
import { CalendarEvent, EventHost } from '../../types/database';
import { supabaseService } from '../../lib/supabase';
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

// Helper functions for event type colors
const getEventTypeColor = (eventType: string) => {
  switch (eventType) {
    case 'earnings': return '#3B82F6'; // Blue
    case 'conference': return '#10B981'; // Green
    case 'webinar': return '#8B5CF6'; // Purple
    case 'catalyst': return '#F59E0B'; // Orange
    default: return '#6B7280'; // Gray
  }
};

// Helper functions for date formatting
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

// Helper functions for RSVP status
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

// Helper functions for location type icons
const getLocationTypeIcon = (locationType: string) => {
  switch (locationType) {
    case 'physical': return <MapPin size={16} />;
    case 'virtual': return <Globe size={16} />;
    case 'hybrid': return <Building2 size={16} />;
    default: return <MapPin size={16} />;
  }
};

// Helper functions for host type display
const getHostTypeLabel = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return 'Host Company';
    case 'multi_corp': return 'Co-Hosted by Multiple Companies';
    case 'non_company': return 'Host Organization';
    default: return 'Host Information';
  }
};

const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({
  event,
  isVisible,
  onClose,
  onDateSelect,
  onRSVPUpdate,
  className,
  events
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [enrichedHosts, setEnrichedHosts] = useState<EventHost[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);

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

  // Fetch host details when panel opens
  useEffect(() => {
    const fetchHostDetails = async () => {
      if (!event || !isVisible) {
        setEnrichedHosts([]);
        return;
      }

      if (!event.hosts || event.hosts.length === 0) {
        setEnrichedHosts([]);
        return;
      }

      // Check if hosts already have detailed information
      const hasDetailedInfo = event.hosts.some(host => host.host_name && host.host_name !== '');
      if (hasDetailedInfo) {
        setEnrichedHosts(event.hosts);
        return;
      }

      setLoadingHosts(true);
      try {
        // Fetch detailed host information for each host
        const enrichedHostsPromises = event.hosts.map(async (host) => {
          if (!host.host_id) return host;

          try {
            if (host.host_type === 'single_corp') {
              // Fetch company details
              const { data: companyData, error: companyError } = await supabaseService
                .from('companies')
                .select('id, ticker_symbol, company_name, gics_sector, gics_subsector')
                .eq('id', host.host_id)
                .single();

              if (!companyError && companyData) {
                return {
                  ...host,
                  host_name: companyData.company_name,
                  host_ticker: companyData.ticker_symbol,
                  host_sector: companyData.gics_sector,
                  host_subsector: companyData.gics_subsector,
                };
              }
            } else if (host.host_type === 'non_company') {
              // Fetch organization details
              const { data: orgData, error: orgError } = await supabaseService
                .from('organizations')
                .select('id, name, type, sector, subsector')
                .eq('id', host.host_id)
                .single();

              if (!orgError && orgData) {
                return {
                  ...host,
                  host_name: orgData.name,
                  host_ticker: '', // Organizations don't have tickers
                  host_sector: orgData.sector,
                  host_subsector: orgData.subsector,
                };
              }
            } else if (host.host_type === 'multi_corp' && host.companies_jsonb) {
              // For multi-corp, extract details from companies_jsonb
              const primaryCompany = host.companies_jsonb.find((c: any) => c.is_primary);
              if (primaryCompany) {
                return {
                  ...host,
                  host_name: primaryCompany.name,
                  host_ticker: primaryCompany.ticker,
                  host_sector: '', // Multi-corp companies_jsonb doesn't include sector info
                  host_subsector: '', // Multi-corp companies_jsonb doesn't include subsector info
                };
              }
            }
          } catch (error) {
            console.error('Error fetching host details:', error);
          }

          return host; // Return original host if fetching fails
        });

        const enrichedHosts = await Promise.all(enrichedHostsPromises);
        setEnrichedHosts(enrichedHosts);
      } catch (error) {
        console.error('Error fetching host details:', error);
        setEnrichedHosts(event.hosts); // Fallback to original hosts
      } finally {
        setLoadingHosts(false);
      }
    };

    fetchHostDetails();
  }, [event, isVisible]);

  if (!event || !isVisible) return null;

  return (
    <div
      ref={panelRef}
      className={`event-details-panel ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(420px, max(320px, 25vw))',
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
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
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
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--primary-text)',
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

        {/* Event Type Badge */}
        <div style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: getEventTypeColor(event.event_type),
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1rem'
        }}>
          {event.event_type}
        </div>

        {/* Event Title */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--primary-text)',
          margin: '0 0 0.75rem 0',
          lineHeight: '1.3'
        }}>
          {event.title}
        </h2>

        {/* Event Description */}
        {event.description && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--muted-text)',
            lineHeight: '1.5',
            margin: '0 0 1rem 0'
          }}>
            {event.description}
          </p>
        )}

        {/* Host Information - Display based on host type */}
        {(enrichedHosts && enrichedHosts.length > 0) || (event.hosts && event.hosts.length > 0) ? (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--tertiary-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem'
          }}>
            {loadingHosts && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--muted-text)',
                marginBottom: '0.5rem',
                fontStyle: 'italic'
              }}>
                Loading host information...
              </div>
            )}
            {(enrichedHosts.length > 0 ? enrichedHosts : event.hosts || []).map((host, index) => {
              const hostsToShow = enrichedHosts.length > 0 ? enrichedHosts : event.hosts || [];
              
              // Determine host display based on host_type
              if (host.host_type === 'single_corp') {
                return (
                  <div key={host.id} style={{ marginBottom: index < hostsToShow.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem' }}>
                      {getHostTypeLabel(host.host_type)}
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
                  <div key={host.id} style={{ marginBottom: index < hostsToShow.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem' }}>
                      {getHostTypeLabel(host.host_type)}
                    </div>
                    {primaryHost && (
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
                        Primary Host: {primaryHost.ticker} - {primaryHost.name}
                      </div>
                    )}
                    {otherHosts.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: '0.25rem' }}>
                        Co-Hosts: {otherHosts.map((c: any) => c.ticker).join(', ')}
                      </div>
                    )}
                  </div>
                );
              } else if (host.host_type === 'non_company') {
                return (
                  <div key={host.id} style={{ marginBottom: index < hostsToShow.length - 1 ? '0.5rem' : '0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.25rem' }}>
                      {getHostTypeLabel(host.host_type)}
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
            })}
          </div>
        ) : null}

        {/* Show message when no host information is available */}
        {(!enrichedHosts || enrichedHosts.length === 0) && event.hosts && event.hosts.length > 0 && !loadingHosts && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--tertiary-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
              Host Information Not Available
            </div>
          </div>
        )}
      </div>

      {/* Participating Companies Section */}
      <div style={{
        padding: '0.75rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginBottom: '0.5rem' }}>
          🏢 Participating Companies
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--primary-text)', marginBottom: '0.25rem' }}>
          Companies attending this event: {event.companies.map((c: any) => c.ticker_symbol).join(', ') || 'None'}
        </div>
        {event.companies.length > 0 && event.companies[0].gics_sector && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
            Sector: {event.companies[0].gics_sector}{event.companies[0].gics_subsector && ` • ${event.companies[0].gics_subsector}`}
          </div>
        )}
      </div>

      {/* Event Information Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Date & Time Card */}
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CalendarIcon size={14} color="var(--accent-color)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
              Date & Time
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
          padding: '0.75rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {React.cloneElement(getLocationTypeIcon(event.location_type), { size: 14, color: 'var(--accent-color)' })}
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
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
          padding: '0.75rem',
          backgroundColor: 'var(--tertiary-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={14} color="var(--accent-color)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
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
        padding: '0.75rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Shield size={14} color="var(--accent-color)" />
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-text)' }}>
            Your Response
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

        {/* RSVP Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onRSVPUpdate?.(event.id, 'accepted')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: onRSVPUpdate ? 1 : 0.5,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (onRSVPUpdate) {
                (e.target as HTMLButtonElement).style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (onRSVPUpdate) {
                (e.target as HTMLButtonElement).style.opacity = '1';
              }
            }}
          >
            Accept
          </button>
          <button
            onClick={() => onRSVPUpdate?.(event.id, 'declined')}
            disabled={!onRSVPUpdate}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: onRSVPUpdate ? 'pointer' : 'not-allowed',
              opacity: onRSVPUpdate ? 1 : 0.5,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (onRSVPUpdate) {
                (e.target as HTMLButtonElement).style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (onRSVPUpdate) {
                (e.target as HTMLButtonElement).style.opacity = '1';
              }
            }}
          >
            Decline
          </button>
        </div>
      </div>

      {/* Weather Forecast */}
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