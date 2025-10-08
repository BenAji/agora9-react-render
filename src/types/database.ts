/**
 * AGORA Database-Aligned TypeScript Interfaces
 * 
 * CRITICAL: These interfaces MUST match the PostgreSQL database schema exactly.
 * All field names, types, and constraints are derived from consolidated_migration_complete.sql
 * 
 * Key Requirements:
 * - Use exact database field names (user_id NOT userId, ticker_symbol NOT ticker)
 * - RSVP status values: 'accepted' | 'declined' | 'pending' (NOT 'attending'/'not_attending')
 * - JSONB fields as Record<string, any>
 * - All IDs are UUID strings
 * - Timestamps as Date objects
 */

// =====================================================================================
// CORE ENTITY INTERFACES
// =====================================================================================

export interface User {
  id: string;                                    // UUID PRIMARY KEY
  email: string;                                 // VARCHAR(255) UNIQUE NOT NULL
  full_name: string;                             // ❗ NOT 'name' - exact match required
  role: 'investment_analyst' | 'executive_assistant'; // VARCHAR(50) with constraint
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
  is_active: boolean;                            // BOOLEAN DEFAULT TRUE
  preferences: Record<string, any>;              // ❗ JSONB field, NOT structured object
  last_login?: Date;                             // ❗ NOT 'lastActive' - TIMESTAMP WITH TIME ZONE
}

export interface Company {
  id: string;                                    // UUID PRIMARY KEY
  ticker_symbol: string;                         // ❗ NOT 'ticker' - VARCHAR(20) UNIQUE NOT NULL
  company_name: string;                          // ❗ NOT 'name' - VARCHAR(255) NOT NULL
  gics_sector: string;                           // ❗ NOT 'sector' - VARCHAR(100) NOT NULL
  gics_subsector: string;                        // ❗ NOT 'subsector' - VARCHAR(100) NOT NULL
  gics_industry?: string;                        // VARCHAR(100) - Optional field
  gics_sub_industry?: string;                    // VARCHAR(100) - Optional field
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
  is_active: boolean;                            // BOOLEAN DEFAULT TRUE
  classification_status: 'complete' | 'partial' | 'pending'; // VARCHAR(50) with constraint
}

export interface Event {
  id: string;                                    // UUID PRIMARY KEY
  title: string;                                 // VARCHAR(255) NOT NULL
  description?: string | null;                   // TEXT - Can be null
  start_date: Date;                              // ❗ NOT 'date' - TIMESTAMP WITH TIME ZONE NOT NULL
  end_date: Date;                                // ❗ NOT 'endTime' - TIMESTAMP WITH TIME ZONE NOT NULL
  location_type: 'physical' | 'virtual' | 'hybrid'; // VARCHAR(50) with constraint
  location_details?: Record<string, any>;       // JSONB - Physical venue details
  virtual_details?: Record<string, any>;        // JSONB - Virtual meeting details
  weather_location?: string;                     // VARCHAR(255)
  weather_coordinates?: Record<string, any>;     // JSONB
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
  is_active: boolean;                            // BOOLEAN DEFAULT TRUE
  event_type: 'standard' | 'catalyst';          // ❗ NOT custom event types - VARCHAR(50) with constraint
}

// =====================================================================================
// JUNCTION TABLE INTERFACES
// =====================================================================================

export interface EventCompany {
  id: string;                                    // UUID PRIMARY KEY
  event_id: string;                              // ❗ NOT 'eventId' - UUID REFERENCES events(id)
  company_id: string;                            // ❗ NOT 'companyId' - UUID REFERENCES companies(id)
  attendance_status: 'attending' | 'not_attending' | 'pending'; // VARCHAR(50) with constraint
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface UserEventResponse {
  id: string;                                    // UUID PRIMARY KEY
  user_id: string;                               // ❗ NOT 'userId' - UUID REFERENCES users(id)
  event_id: string;                              // ❗ NOT 'eventId' - UUID REFERENCES events(id)
  response_status: 'accepted' | 'declined' | 'pending'; // ❗ NOT 'attending'/'not_attending' - VARCHAR(50) with constraint
  response_date: Date | null;                    // TIMESTAMP WITH TIME ZONE DEFAULT NOW() - Can be null
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
  notes?: string | null;                         // TEXT - Can be null
}

export interface EventHost {
  id: string;                                    // UUID PRIMARY KEY
  event_id: string;                              // UUID FOREIGN KEY to events
  host_type: 'single_corp' | 'multi_corp' | 'non_company'; // Host type
  host_id?: string;                              // Company or Organization ID
  host_name?: string;                            // Populated from companies or organizations
  host_ticker?: string;                          // For companies
  host_sector?: string;
  host_subsector?: string;
  companies_jsonb?: Array<{
    id: string;
    ticker: string;
    name: string;
    is_primary: boolean;
  }>;                                            // For multi-corporate events
  primary_company_id?: string;                   // Primary company for multi-corp
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface Organization {
  id: string;                                    // UUID PRIMARY KEY
  name: string;                                  // VARCHAR(255) NOT NULL
  type: 'government' | 'association' | 'nonprofit' | 'private_company' | 'international';
  sector?: string;                               // VARCHAR(100)
  subsector?: string;                            // VARCHAR(100)
  website?: string;                              // VARCHAR(255)
  description?: string;                          // TEXT
  is_active: boolean;                            // BOOLEAN DEFAULT TRUE
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface UserSubscription {
  id: string;                                    // UUID PRIMARY KEY
  user_id: string;                               // ❗ NOT 'userId' - UUID REFERENCES users(id)
  subsector: string;                             // VARCHAR(100) NOT NULL - GICS subsector name
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled'; // VARCHAR(50) with constraint
  is_active: boolean;                            // BOOLEAN DEFAULT FALSE
  expires_at?: Date;                             // TIMESTAMP WITH TIME ZONE
  stripe_subscription_id?: string;               // VARCHAR(255)
  stripe_customer_id?: string;                   // VARCHAR(255)
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface ExecutiveAssistantAssignment {
  id: string;                                    // UUID PRIMARY KEY
  assistant_id: string;                          // UUID REFERENCES users(id)
  user_id: string;                               // UUID REFERENCES users(id)
  permissions: {                                 // JSONB field with specific structure
    rsvp: boolean;
    subscribe: boolean;
    view_calendar: boolean;
    manage_preferences?: boolean;
  };
  assignment_type: 'permanent' | 'temporary';    // VARCHAR(50) with constraint
  expires_at?: Date;                             // TIMESTAMP WITH TIME ZONE
  is_active: boolean;                            // BOOLEAN DEFAULT TRUE
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface UserCompanyOrder {
  id: string;                                    // UUID PRIMARY KEY
  user_id: string;                               // UUID REFERENCES users(id)
  company_id: string;                            // UUID REFERENCES companies(id)
  display_order: number;                         // INTEGER NOT NULL - For drag-and-drop ordering
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  updated_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface Notification {
  id: string;                                    // UUID PRIMARY KEY
  user_id: string;                               // UUID REFERENCES users(id)
  title: string;                                 // VARCHAR(255) NOT NULL
  message: string;                               // TEXT NOT NULL
  notification_type: 'event_reminder' | 'subscription_update' | 'ea_notification' | 'system_alert'; // VARCHAR(50) with constraint
  related_id?: string;                           // UUID
  metadata: Record<string, any>;                 // JSONB DEFAULT '{}'
  is_read: boolean;                              // BOOLEAN DEFAULT FALSE
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
}

export interface WeatherCache {
  id: string;                                    // UUID PRIMARY KEY
  location_key: string;                          // VARCHAR(255) UNIQUE NOT NULL
  weather_data: Record<string, any>;             // JSONB NOT NULL
  created_at: Date;                              // TIMESTAMP WITH TIME ZONE
  expires_at: Date;                              // TIMESTAMP WITH TIME ZONE - For cache invalidation
}

// =====================================================================================
// TYPE ALIASES AND CONSTRAINTS
// =====================================================================================

// ✅ CORRECT - Database constraint values only
export type ResponseStatus = 'accepted' | 'declined' | 'pending';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type UserRole = 'investment_analyst' | 'executive_assistant';
export type LocationType = 'physical' | 'virtual' | 'hybrid';
export type EventType = 'standard' | 'catalyst';
export type AttendanceStatus = 'attending' | 'not_attending' | 'pending';
export type ClassificationStatus = 'complete' | 'partial' | 'pending';
export type AssignmentType = 'permanent' | 'temporary';
export type NotificationType = 'event_reminder' | 'subscription_update' | 'ea_notification' | 'system_alert';

// =====================================================================================
// UI-SPECIFIC INTERFACES
// =====================================================================================

export interface CalendarEvent extends Event {
  companies: Company[];                          // Populated from event_companies join
  hosts?: EventHost[];                          // Event hosting information
  primary_host?: EventHost;                     // Primary host for easy access
  user_response?: UserEventResponse;             // User's RSVP status for this event
  color_code: string;                           // Derived from response_status
  location?: string;                            // Parsed location for display
  rsvpStatus?: 'accepted' | 'declined' | 'pending'; // RSVP status for UI
  attendees?: any[];                            // List of attendees
  isMultiCompany?: boolean;                     // Whether event has multiple companies
  attendingCompanies?: string[];                // IDs of attending companies
}

export interface CompanyWithEvents extends Company {
  events: CalendarEvent[];                      // Events this company is involved in
  display_order?: number;                       // From user_company_order table
}

export interface UserWithSubscriptions extends User {
  subscriptions: UserSubscription[];            // Active subscriptions
  ea_assignments?: ExecutiveAssistantAssignment[]; // If user is an EA
}

// =====================================================================================
// RSVP COLOR MAPPING
// =====================================================================================

// ✅ CORRECT - Matches database constraint values
export const RSVP_COLORS: Record<ResponseStatus, string> = {
  accepted: '#28a745',    // Green - attending
  declined: '#ffc107',    // Yellow - not attending  
  pending: '#6c757d',     // Grey - pending
};

// ✅ CORRECT - Database constraint values only
export const RSVP_STATUS_LABELS: Record<ResponseStatus, string> = {
  accepted: 'Attending',
  declined: 'Not Attending',
  pending: 'Pending Response'
};

// =====================================================================================
// GICS SUBSECTORS (For Subscriptions)
// =====================================================================================

export const AVAILABLE_SUBSECTORS = [
  'Software & IT Services',
  'Semiconductors & Semiconductor Equipment',
  'Banks',
  'Investment Banking & Brokerage',
  'Pharmaceuticals, Biotechnology & Life Sciences',
  'Healthcare Equipment & Services',
  'Consumer Services',
  'Consumer Durables & Apparel',
  'Energy',
  'Media & Entertainment',
  'Capital Goods'
] as const;

export type GICSSubsector = typeof AVAILABLE_SUBSECTORS[number];

// =====================================================================================
// VALIDATION HELPERS
// =====================================================================================

export const isValidResponseStatus = (status: string): status is ResponseStatus => {
  return ['accepted', 'declined', 'pending'].includes(status);
};

export const isValidUserRole = (role: string): role is UserRole => {
  return ['investment_analyst', 'executive_assistant'].includes(role);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return ['pending', 'paid', 'failed', 'cancelled'].includes(status);
};