/**
 * AGORA Calendar Types & Interfaces
 * 
 * PHASE 1, STEP 1.1: Foundation Types
 * Dependencies: NONE (pure TypeScript)
 * Purpose: Define all calendar-related interfaces
 * 
 * SAFETY: No external dependencies, no API calls, no runtime code
 */

// =====================================================================================
// CALENDAR VIEW & STATE TYPES
// =====================================================================================

export interface CalendarViewMode {
  type: 'company_rows' | 'standard' | 'company_specific';
  eventFilter: 'my_events' | 'all_events';
}

export interface CalendarState {
  companies: CompanyRow[];
  events: EventCell[];
  selectedDate: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  viewMode: CalendarViewMode;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

// =====================================================================================
// COMPANY ROW TYPES
// =====================================================================================

export interface CompanyRow {
  id: string;
  ticker_symbol: string;
  company_name: string;
  gics_sector: string;
  gics_subsector: string;
  order: number;
  isSubscribed: boolean;
  subscriptionStatus: 'active' | 'expired' | 'pending' | 'none';
  eventCount: number;
}

export interface CompanyRowDragState {
  isDragging: boolean;
  draggedCompanyId: string | null;
  dropTargetIndex: number | null;
}

// =====================================================================================
// EVENT CELL TYPES
// =====================================================================================

export interface EventCell {
  id: string;
  event: CalendarEventData;
  rsvpStatus: 'accepted' | 'declined' | 'pending';
  colorCode: 'green' | 'yellow' | 'grey';
  isMultiCompany: boolean;
  attendingCompanies: string[];
  position: {
    companyRowId: string;
    date: Date;
    startTime: string;
    endTime: string;
  };
}

export interface CalendarEventData {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  location_type: 'physical' | 'virtual' | 'hybrid';
  location?: string; // Legacy field - will be replaced by parsed_location
  location_details: Record<string, any>; // Raw JSONB from database
  virtual_details: Record<string, any>; // Raw JSONB from database
  weather_location?: string; // Weather location string
  parsed_location?: {
    displayText: string;
    type: 'physical' | 'virtual' | 'hybrid';
    details: {
      city?: string;
      state?: string;
      venue?: string;
      room?: string;
      address?: string;
      platform?: string;
      meetingId?: string;
      dialIn?: string;
      webinarLink?: string;
    };
    weatherLocation?: string;
  };
  event_type: 'standard' | 'catalyst';
  speakers: EventSpeaker[];
  agenda: string[];
  tags: string[];
  access_info: {
    is_free: boolean;
    registration_required: boolean;
    registration_link?: string;
    contact_email?: string;
  };
  // Added properties for event display
  companies: CompanyRow[];
  hostingCompanies: CompanyRow[];
  rsvpStatus: 'accepted' | 'declined' | 'pending';
  colorCode: 'green' | 'yellow' | 'grey';
  isMultiCompany: boolean;
  attendingCompanies: string[];
  attendees?: EventAttendee[];
}

export interface EventSpeaker {
  name: string;
  title: string;
  company: string;
  bio?: string;
}

// =====================================================================================
// MINI CALENDAR TYPES
// =====================================================================================

export interface MiniCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  eventCount: number;
  attendingCount: number;
  pendingCount: number;
  declinedCount: number;
  eventDots: EventDot[];
}

export interface EventDot {
  color: 'green' | 'yellow' | 'grey';
  count: number;
  tooltip: string;
}

export interface MiniCalendarState {
  currentMonth: Date;
  selectedDate: Date;
  days: MiniCalendarDay[];
  isNavigating: boolean;
}

// =====================================================================================
// WEATHER FORECAST TYPES
// =====================================================================================

export interface WeatherForecast {
  date: Date;
  temperature: {
    high: number;
    low: number;
    current: number;
    unit: 'F' | 'C';
  };
  condition: string;
  conditionCode: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  isEventDay: boolean;
  location: string;
  timezone: string;
}

export interface WeatherForecastState {
  forecasts: WeatherForecast[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// =====================================================================================
// ATTENDEE & RSVP TYPES
// =====================================================================================

export interface EventAttendee {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  rsvp_status: 'accepted' | 'declined' | 'pending';
  response_date: Date;
  notes?: string;
}

export interface RSVPAction {
  eventId: string;
  userId: string;
  status: 'accepted' | 'declined' | 'pending';
  notes?: string;
  timestamp: Date;
}

// =====================================================================================
// EVENT DETAILS PANEL TYPES
// =====================================================================================

export interface EventDetailsState {
  isOpen: boolean;
  selectedEvent: CalendarEventData | null;
  attendees: EventAttendee[];
  userRSVP: RSVPAction | null;
  weatherForecast: WeatherForecast[];
  miniCalendar: MiniCalendarState;
  loading: boolean;
  error: string | null;
}

// =====================================================================================
// CALENDAR NAVIGATION TYPES
// =====================================================================================

export interface CalendarNavigation {
  currentWeek: number;
  currentMonth: Date;
  selectedDateRange: {
    start: Date;
    end: Date;
  };
  weekOptions: WeekOption[];
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
}

export interface WeekOption {
  weekNumber: number;
  label: string;
  startDate: Date;
  endDate: Date;
  isSelected: boolean;
  eventCount: number;
}

// =====================================================================================
// SEARCH & FILTER TYPES
// =====================================================================================

export interface CalendarSearchState {
  query: string;
  filters: {
    companies: string[];
    eventTypes: string[];
    rsvpStatus: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
  };
  results: SearchResult[];
  isSearching: boolean;
}

export interface SearchResult {
  type: 'event' | 'company';
  id: string;
  title: string;
  subtitle: string;
  date?: Date;
  relevanceScore: number;
}

// =====================================================================================
// ERROR & LOADING STATES
// =====================================================================================

export interface CalendarError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface LoadingState {
  calendar: boolean;
  events: boolean;
  companies: boolean;
  eventDetails: boolean;
  weather: boolean;
  rsvp: boolean;
}

// =====================================================================================
// RESPONSIVE & MOBILE TYPES
// =====================================================================================

export interface ResponsiveState {
  screenSize: 'mobile' | 'tablet' | 'desktop';
  isOfficeAddin: boolean;
  taskPaneWidth: number;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  target: string;
  data?: any;
}

// =====================================================================================
// CONSTANTS & ENUMS
// =====================================================================================

export const CALENDAR_CONSTANTS = {
  // Color coding for RSVP status
  RSVP_COLORS: {
    accepted: 'green',
    declined: 'yellow', 
    pending: 'grey'
  } as const,
  
  // Calendar view modes
  VIEW_MODES: {
    COMPANY_ROWS: 'company_rows',
    STANDARD: 'standard',
    COMPANY_SPECIFIC: 'company_specific'
  } as const,
  
  // Event filters
  EVENT_FILTERS: {
    MY_EVENTS: 'my_events',
    ALL_EVENTS: 'all_events'
  } as const,
  
  // Office add-in constraints
  OFFICE_CONSTRAINTS: {
    MIN_WIDTH: 320,
    MAX_WIDTH: 450,
    OPTIMAL_WIDTH: 375
  } as const,
  
  // Calendar grid settings
  GRID_SETTINGS: {
    DAYS_PER_WEEK: 7,
    WEEKS_TO_SHOW: 4,
    MAX_EVENTS_PER_CELL: 3
  } as const,
  
  // Animation durations (in milliseconds)
  ANIMATIONS: {
    PANEL_SLIDE: 300,
    EVENT_HOVER: 150,
    DRAG_DROP: 200,
    LOADING_FADE: 250
  } as const
} as const;

// =====================================================================================
// TYPE GUARDS & UTILITIES
// =====================================================================================

export const isValidRSVPStatus = (status: string): status is 'accepted' | 'declined' | 'pending' => {
  return ['accepted', 'declined', 'pending'].includes(status);
};

export const isValidColorCode = (color: string): color is 'green' | 'yellow' | 'grey' => {
  return ['green', 'yellow', 'grey'].includes(color);
};

export const isValidEventType = (type: string): type is 'standard' | 'catalyst' => {
  return ['standard', 'catalyst'].includes(type);
};

export const isValidLocationType = (type: string): type is 'physical' | 'virtual' | 'hybrid' => {
  return ['physical', 'virtual', 'hybrid'].includes(type);
};

// =====================================================================================
// ALL TYPES EXPORTED ABOVE WITH 'export interface' DECLARATIONS
// =====================================================================================
