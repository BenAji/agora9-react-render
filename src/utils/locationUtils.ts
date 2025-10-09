/**
 * Location Utilities for AGORA Calendar
 * 
 * Handles parsing and formatting of location data from JSONB fields
 * in the events table (location_details and virtual_details)
 */

export interface PhysicalLocationDetails {
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  accessibility_info?: string;
  parking_info?: string;
  additional_notes?: string;
}

export interface VirtualLocationDetails {
  platform?: string;
  meeting_url?: string;
  meeting_id?: string;
  passcode?: string;
  dial_in_number?: string;
  additional_instructions?: string;
}

export interface ParsedLocation {
  displayText: string;
  type: 'physical' | 'virtual' | 'hybrid';
  details: PhysicalLocationDetails | VirtualLocationDetails | null;
}

/**
 * Parse location details for display in the EventDetailsPanel
 */
export const parseLocationForDisplay = (
  locationType: 'physical' | 'virtual' | 'hybrid',
  locationDetails?: Record<string, any>,
  virtualDetails?: Record<string, any>
): string => {
  switch (locationType) {
    case 'physical':
      return parsePhysicalLocation(locationDetails);
    case 'virtual':
      return parseVirtualLocation(virtualDetails);
    case 'hybrid':
      return parseHybridLocation(locationDetails, virtualDetails);
    default:
      return 'Location details not available';
  }
};

/**
 * Parse physical location details
 */
const parsePhysicalLocation = (locationDetails?: Record<string, any>): string => {
  if (!locationDetails) {
    return 'Physical location details not available';
  }

  const venue = locationDetails.venue;
  const address = locationDetails.address;
  const city = locationDetails.city;
  const state = locationDetails.state;
  const country = locationDetails.country;

  // Build address string
  const addressParts = [];
  if (venue) addressParts.push(venue);
  if (address) addressParts.push(address);
  if (city) addressParts.push(city);
  if (state) addressParts.push(state);
  if (country) addressParts.push(country);

  if (addressParts.length > 0) {
    return addressParts.join(', ');
  }

  return 'Physical location details not available';
};

/**
 * Parse virtual location details
 */
const parseVirtualLocation = (virtualDetails?: Record<string, any>): string => {
  if (!virtualDetails) {
    return 'Virtual meeting details not available';
  }

  const platform = virtualDetails.platform;
  const meetingUrl = virtualDetails.meeting_url;
  const meetingId = virtualDetails.meeting_id;

  if (platform && meetingUrl) {
    return `${platform} - ${meetingUrl}`;
  } else if (platform && meetingId) {
    return `${platform} (ID: ${meetingId})`;
  } else if (platform) {
    return platform;
  } else if (meetingUrl) {
    return meetingUrl;
  }

  return 'Virtual meeting details not available';
};

/**
 * Parse hybrid location details (both physical and virtual)
 */
const parseHybridLocation = (
  locationDetails?: Record<string, any>,
  virtualDetails?: Record<string, any>
): string => {
  const physical = parsePhysicalLocation(locationDetails);
  const virtual = parseVirtualLocation(virtualDetails);

  // Remove the "not available" suffix if we have actual details
  const physicalClean = physical.includes('not available') ? 'Physical location' : physical;
  const virtualClean = virtual.includes('not available') ? 'Virtual access' : virtual;

  return `${physicalClean} / ${virtualClean}`;
};

/**
 * Get location type icon
 */
export const getLocationTypeIcon = (locationType: string): string => {
  switch (locationType) {
    case 'physical': return '📍';
    case 'virtual': return '🌐';
    case 'hybrid': return '🏢';
    default: return '📍';
  }
};

/**
 * Get detailed location information for tooltips or expanded views
 */
export const getDetailedLocationInfo = (
  locationType: 'physical' | 'virtual' | 'hybrid',
  locationDetails?: Record<string, any>,
  virtualDetails?: Record<string, any>
): ParsedLocation => {
  return {
    displayText: parseLocationForDisplay(locationType, locationDetails, virtualDetails),
    type: locationType,
    details: locationType === 'physical' ? (locationDetails || null) : (virtualDetails || null)
  };
};
