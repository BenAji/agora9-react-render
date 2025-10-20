/**
 * Mobile-Friendly Event Card Component
 * 
 * Features:
 * - Compact list layout for maximum events visible
 * - Expandable detail view
 * - Host information display
 * - Event type badges (Single Corp / Multi Corp / Non-Company)
 * - Swipe actions for quick RSVP
 * - Bloomberg theme colors
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent } from '../../types/database';

interface MobileEventCardProps {
  event: CalendarEvent;
  onRSVPUpdate?: (eventId: string, status: 'accepted' | 'declined' | 'pending') => void;
  onViewDetails?: (event: CalendarEvent) => void;
}

const MobileEventCard: React.FC<MobileEventCardProps> = ({
  event,
  onRSVPUpdate,
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format date and time
  const formatEventDate = (date: Date) => {
    try {
      return format(new Date(date), 'MMM dd • h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Get event type badge info
  const getEventTypeBadge = () => {
    if (!event.hosts || event.hosts.length === 0) {
      return { icon: '🏢', text: 'Unknown', color: '#666666' };
    }

    const primaryHost = event.hosts[0];
    
    switch (primaryHost.host_type) {
      case 'single_corp':
        return { icon: '🏢', text: 'Single Corp', color: '#FFD700' };
      case 'multi_corp':
        return { icon: '🏢🏢', text: 'Multi Corp', color: '#FFA500' };
      case 'non_company':
        return { icon: '🏛️', text: 'Non-Company', color: '#87CEEB' };
      default:
        return { icon: '🏢', text: 'Unknown', color: '#666666' };
    }
  };

  // Get host display text
  const getHostDisplayText = () => {
    if (!event.hosts || event.hosts.length === 0) {
      return 'No host specified';
    }

    const primaryHost = event.hosts[0];
    
    if (primaryHost.host_type === 'single_corp') {
      return `${primaryHost.host_ticker || primaryHost.host_name || 'Unknown'}`;
    } else if (primaryHost.host_type === 'multi_corp') {
      const companies = primaryHost.companies_jsonb || [];
      if (companies.length === 0) return 'Multiple Companies';
      
      const tickers = companies.slice(0, 2).map(c => c.ticker).join(', ');
      const moreCount = companies.length > 2 ? ` +${companies.length - 2}` : '';
      return `${tickers}${moreCount}`;
    } else {
      return primaryHost.host_name || 'Non-Company Host';
    }
  };

  // Get RSVP status display
  const getRSVPStatus = () => {
    const status = event.rsvpStatus || event.user_rsvp_status || 'pending';
    
    switch (status) {
      case 'accepted':
        return { icon: '✅', text: 'Accepted', color: '#28a745' };
      case 'declined':
        return { icon: '❌', text: 'Declined', color: '#dc3545' };
      case 'pending':
      default:
        return { icon: '⏳', text: 'Pending', color: '#FFD700' };
    }
  };

  // Get location type icon
  const getLocationIcon = () => {
    switch (event.location_type) {
      case 'virtual':
        return '💻';
      case 'physical':
        return '📍';
      case 'hybrid':
        return '🌐';
      default:
        return '📍';
    }
  };

  const eventTypeBadge = getEventTypeBadge();
  const hostText = getHostDisplayText();
  const rsvpStatus = getRSVPStatus();
  const locationIcon = getLocationIcon();

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        border: `1px solid ${isExpanded ? '#FFD700' : '#333333'}`,
        borderRadius: '8px',
        marginBottom: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Compact Header - Always Visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {/* Date & Time Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#FFD700',
            fontWeight: '600'
          }}>
            📅 {formatEventDate(event.start_date)}
          </div>
          {isExpanded ? <ChevronUp size={16} color="#FFD700" /> : <ChevronDown size={16} color="#666666" />}
        </div>

        {/* Event Title */}
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {event.title}
        </div>

        {/* Host & Event Type Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#cccccc',
          marginBottom: '6px',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {eventTypeBadge.icon} {hostText}
          </span>
          <span style={{
            padding: '2px 8px',
            backgroundColor: eventTypeBadge.color + '20',
            color: eventTypeBadge.color,
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {eventTypeBadge.text}
          </span>
        </div>

        {/* Location & Status Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#cccccc'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {locationIcon} {event.location_type === 'virtual' ? 'Virtual' : event.location_type === 'hybrid' ? 'Hybrid' : 'Physical'}
          </span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            backgroundColor: rsvpStatus.color + '20',
            color: rsvpStatus.color,
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {rsvpStatus.icon} {rsvpStatus.text}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid #333333',
          padding: '12px',
          backgroundColor: '#0f0f0f'
        }}>
          {/* Detailed Host Information */}
          <div style={{
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#FFD700',
              fontWeight: '600',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🏢 Host Information
            </div>
            <div style={{
              fontSize: '13px',
              color: '#FFFFFF',
              marginBottom: '4px'
            }}>
              {event.hosts && event.hosts[0] ? (
                <>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>{event.hosts[0].host_name || 'Unknown Host'}</strong>
                    {event.hosts[0].host_ticker && (
                      <span style={{ color: '#FFD700', marginLeft: '6px' }}>
                        ({event.hosts[0].host_ticker})
                      </span>
                    )}
                  </div>
                  {event.hosts[0].host_sector && (
                    <div style={{ fontSize: '12px', color: '#cccccc' }}>
                      {event.hosts[0].host_sector}
                      {event.hosts[0].host_subsector && ` • ${event.hosts[0].host_subsector}`}
                    </div>
                  )}
                  {event.hosts[0].host_type === 'multi_corp' && event.hosts[0].companies_jsonb && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#cccccc' }}>
                      <strong>Participating Companies:</strong>
                      <div style={{ marginTop: '4px' }}>
                        {event.hosts[0].companies_jsonb.map((company, idx) => (
                          <div key={idx} style={{ marginLeft: '8px' }}>
                            • {company.name} ({company.ticker})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                'No host information available'
              )}
            </div>
          </div>

          {/* Time Details */}
          <div style={{
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#FFD700',
              fontWeight: '600',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⏰ Time
            </div>
            <div style={{
              fontSize: '13px',
              color: '#FFFFFF'
            }}>
              {format(new Date(event.start_date), 'MMMM dd, yyyy • h:mm a')}
              {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
            </div>
          </div>

          {/* Location Details */}
          <div style={{
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#FFD700',
              fontWeight: '600',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📍 Location
            </div>
            <div style={{
              fontSize: '13px',
              color: '#FFFFFF'
            }}>
              {event.location_type === 'virtual' && 'Virtual Event'}
              {event.location_type === 'physical' && (event.parsed_location?.displayText || 'Physical Location')}
              {event.location_type === 'hybrid' && 'Hybrid Event (Virtual + Physical)'}
            </div>
            {event.parsed_location?.meetingUrl && (
              <a
                href={event.parsed_location.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  color: '#FFD700',
                  fontSize: '12px',
                  textDecoration: 'none'
                }}
              >
                Join Meeting <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div style={{
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#FFD700',
                fontWeight: '600',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                📝 Description
              </div>
              <div style={{
                fontSize: '13px',
                color: '#cccccc',
                lineHeight: '1.5'
              }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px'
          }}>
            {rsvpStatus.text === 'Pending' ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRSVPUpdate?.(event.id, 'accepted');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#28a745',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                  }}
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRSVPUpdate?.(event.id, 'declined');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#dc3545',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }}
                >
                  <X size={14} /> Decline
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRSVPUpdate?.(event.id, 'pending');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#333333',
                  color: '#FFFFFF',
                  border: '1px solid #555555',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#444444';
                  e.currentTarget.style.borderColor = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333';
                  e.currentTarget.style.borderColor = '#555555';
                }}
              >
                Change RSVP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEventCard;
