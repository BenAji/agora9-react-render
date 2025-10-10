/**
 * Location Utility Functions
 * Handles parsing of location_details and virtual_details JSONB fields from database
 */

export interface ParsedLocation {
  displayText: string;
  type: 'physical' | 'virtual' | 'hybrid';
  details: {
    // Physical details
    city?: string;
    state?: string;
    venue?: string;
    room?: string;
    address?: string;
    // Virtual details
    platform?: string;
    meetingId?: string;
    dialIn?: string;
    webinarLink?: string;
  };
  weatherLocation?: string;
}

/**
 * Parses location information from database JSONB fields
 */
export function parseEventLocation(
  locationType: 'physical' | 'virtual' | 'hybrid',
  locationDetails?: Record<string, any> | null,
  virtualDetails?: Record<string, any> | null,
  weatherLocation?: string | null
): ParsedLocation {
  const details = {
    city: locationDetails?.city,
    state: locationDetails?.state,
    venue: locationDetails?.venue,
    room: locationDetails?.room,
    address: locationDetails?.address,
    platform: locationDetails?.platform || virtualDetails?.platform,
    meetingId: locationDetails?.meeting_id || virtualDetails?.meeting_id,
    dialIn: virtualDetails?.dial_in,
    webinarLink: virtualDetails?.webinar_link
  };

  let displayText = '';
  let type: 'physical' | 'virtual' | 'hybrid' = locationType;

  switch (locationType) {
    case 'physical':
      displayText = buildPhysicalLocationText(details);
      break;
    case 'virtual':
      displayText = buildVirtualLocationText(details);
      break;
    case 'hybrid':
      displayText = buildHybridLocationText(details);
      break;
    default:
      displayText = weatherLocation || 'Location TBD';
  }

  return {
    displayText,
    type,
    details,
    weatherLocation: weatherLocation || undefined
  };
}

/**
 * Builds display text for physical events
 */
function buildPhysicalLocationText(details: ParsedLocation['details']): string {
  const parts: string[] = [];
  
  // City, State
  if (details.city && details.state) {
    parts.push(`${details.city}, ${details.state}`);
  } else if (details.city) {
    parts.push(details.city);
  }
  
  // Venue
  if (details.venue) {
    parts.push(details.venue);
  }
  
  // Room
  if (details.room) {
    parts.push(details.room);
  }
  
  // Address (if no venue/room)
  if (!details.venue && !details.room && details.address) {
    parts.push(details.address);
  }
  
  return parts.length > 0 ? parts.join(' - ') : 'Physical Location TBD';
}

/**
 * Builds display text for virtual events
 */
function buildVirtualLocationText(details: ParsedLocation['details']): string {
  const parts: string[] = [];
  
  // Platform
  if (details.platform) {
    parts.push(details.platform);
  }
  
  // Meeting ID
  if (details.meetingId) {
    parts.push(details.meetingId);
  }
  
  // Additional info
  if (details.dialIn || details.webinarLink) {
    const additional = [];
    if (details.dialIn) additional.push('Dial-in Available');
    if (details.webinarLink) additional.push('Webinar Link Available');
    parts.push(`(${additional.join(', ')})`);
  }
  
  return parts.length > 0 ? parts.join(' - ') : 'Virtual Event TBD';
}

/**
 * Builds display text for hybrid events
 */
function buildHybridLocationText(details: ParsedLocation['details']): string {
  const physicalParts: string[] = [];
  const virtualParts: string[] = [];
  
  // Physical location parts
  if (details.city && details.state) {
    physicalParts.push(`${details.city}, ${details.state}`);
  } else if (details.city) {
    physicalParts.push(details.city);
  }
  
  if (details.venue) {
    physicalParts.push(details.venue);
  }
  
  if (details.room) {
    physicalParts.push(details.room);
  }
  
  // Virtual location parts
  if (details.platform) {
    virtualParts.push(details.platform);
  }
  
  if (details.meetingId) {
    virtualParts.push(details.meetingId);
  }
  
  // Combine physical and virtual
  const physicalText = physicalParts.length > 0 ? physicalParts.join(' - ') : '';
  const virtualText = virtualParts.length > 0 ? virtualParts.join(' - ') : '';
  
  if (physicalText && virtualText) {
    return `${physicalText} + ${virtualText}`;
  } else if (physicalText) {
    return physicalText;
  } else if (virtualText) {
    return virtualText;
  } else {
    return 'Hybrid Event TBD';
  }
}

/**
 * Gets location icon based on event type
 */
export function getLocationIcon(locationType: 'physical' | 'virtual' | 'hybrid'): string {
  switch (locationType) {
    case 'physical': return '📍';
    case 'virtual': return '🔗';
    case 'hybrid': return '🏢';
    default: return '📍';
  }
}

/**
 * Gets location type display text
 */
export function getLocationTypeText(locationType: 'physical' | 'virtual' | 'hybrid'): string {
  switch (locationType) {
    case 'physical': return 'In-Person Event';
    case 'virtual': return 'Virtual Event';
    case 'hybrid': return 'Hybrid Event';
    default: return 'Event';
  }
}

/**
 * Checks if location has virtual components
 */
export function hasVirtualComponents(parsedLocation: ParsedLocation): boolean {
  return parsedLocation.type === 'virtual' || 
         parsedLocation.type === 'hybrid' || 
         !!parsedLocation.details.platform;
}

/**
 * Checks if location has physical components
 */
export function hasPhysicalComponents(parsedLocation: ParsedLocation): boolean {
  return parsedLocation.type === 'physical' || 
         parsedLocation.type === 'hybrid' || 
         !!(parsedLocation.details.city || parsedLocation.details.venue);
}
