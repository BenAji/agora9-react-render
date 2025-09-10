/**
 * AGORA API Interface Types
 * 
 * Defines the contract between frontend and backend API.
 * Supports both mock and real API implementations with identical interfaces.
 */

import { 
  Event, 
  Company, 
  User, 
  UserEventResponse, 
  UserSubscription,
  ExecutiveAssistantAssignment,
  Notification,
  ResponseStatus,
  CalendarEvent,
  CompanyWithEvents,
  UserWithSubscriptions
} from './database';

// =====================================================================================
// API REQUEST TYPES
// =====================================================================================

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'investment_analyst' | 'executive_assistant';
  preferences?: Record<string, any>;
}

export interface UpdateUserRequest {
  full_name?: string;
  preferences?: Record<string, any>;
  last_login?: Date;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  location_type: 'physical' | 'virtual' | 'hybrid';
  location_details?: Record<string, any>;
  virtual_details?: Record<string, any>;
  weather_location?: string;
  event_type?: 'standard' | 'catalyst';
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  is_active?: boolean;
}

export interface CreateRSVPRequest {
  user_id: string;                               // ✅ Correct field name
  event_id: string;                              // ✅ Correct field name  
  response_status: ResponseStatus;               // ✅ Database constraint values
  notes?: string;
}

export interface CreateSubscriptionRequest {
  user_id: string;
  subsector: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  expires_at?: Date;
}

export interface UpdateCompanyOrderRequest {
  user_id: string;
  company_orders: Array<{
    company_id: string;
    display_order: number;
  }>;
}

export interface CreateNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  notification_type: 'event_reminder' | 'subscription_update' | 'ea_notification' | 'system_alert';
  related_id?: string;
  metadata?: Record<string, any>;
}

// =====================================================================================
// API RESPONSE TYPES
// =====================================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface EventsResponse {
  events: CalendarEvent[];
  total_count: number;
}

export interface CompaniesResponse {
  companies: CompanyWithEvents[];
  total_count: number;
}

export interface UserCalendarResponse {
  events: CalendarEvent[];
  companies: Company[];
  user_responses: UserEventResponse[];
  subscriptions: UserSubscription[];
}

export interface EventAttendanceResponse {
  attending_count: number;
  not_attending_count: number;
  pending_count: number;
  total_responses: number;
  attendees?: Array<{
    user_id: string;
    full_name: string;
    response_status: ResponseStatus;
    response_date: Date | null;
  }>;
}

export interface SubscriptionSummaryResponse {
  total_subscriptions: number;
  active_subscriptions: number;
  pending_subscriptions: number;
  sectors: Array<{
    subsector: string;
    payment_status: string;
    is_active: boolean;
    expires_at?: Date;
  }>;
}

// =====================================================================================
// API QUERY PARAMETERS
// =====================================================================================

export interface EventsQueryParams {
  start_date?: Date;
  end_date?: Date;
  company_ids?: string[];
  event_types?: string[];
  location_types?: string[];
  user_id?: string;                              // For filtering user's events
  response_status?: ResponseStatus[];            // Filter by RSVP status
  page?: number;
  limit?: number;
}

export interface CompaniesQueryParams {
  sectors?: string[];
  subsectors?: string[];
  tickers?: string[];
  search?: string;
  is_active?: boolean;
  user_id?: string;                              // For user's ordered companies
  page?: number;
  limit?: number;
}

export interface NotificationsQueryParams {
  user_id: string;
  types?: string[];
  is_read?: boolean;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

// =====================================================================================
// API CLIENT INTERFACE
// =====================================================================================

export interface ApiClient {
  // Authentication
  login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>>;
  logout(): Promise<ApiResponse<null>>;
  getCurrentUser(): Promise<ApiResponse<User>>;
  
  // Users
  createUser(data: CreateUserRequest): Promise<ApiResponse<User>>;
  updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>>;
  getUser(id: string): Promise<ApiResponse<UserWithSubscriptions>>;
  
  // Events
  getEvents(params?: EventsQueryParams): Promise<ApiResponse<EventsResponse>>;
  getEvent(id: string): Promise<ApiResponse<CalendarEvent>>;
  createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>>;
  updateEvent(id: string, data: UpdateEventRequest): Promise<ApiResponse<Event>>;
  deleteEvent(id: string): Promise<ApiResponse<null>>;
  getEventAttendance(id: string): Promise<ApiResponse<EventAttendanceResponse>>;
  
  // Companies
  getCompanies(params?: CompaniesQueryParams): Promise<ApiResponse<CompaniesResponse>>;
  getAllCompanies(): Promise<ApiResponse<Company[]>>;
  getCompany(id: string): Promise<ApiResponse<CompanyWithEvents>>;
  getUserOrderedCompanies(userId: string): Promise<ApiResponse<Company[]>>;
  updateCompanyOrder(data: UpdateCompanyOrderRequest): Promise<ApiResponse<null>>;
  
  // RSVP Management
  createRSVP(data: CreateRSVPRequest): Promise<ApiResponse<UserEventResponse>>;
  updateRSVP(id: string, data: Partial<CreateRSVPRequest>): Promise<ApiResponse<UserEventResponse>>;
  deleteRSVP(id: string): Promise<ApiResponse<null>>;
  getUserEventResponse(userId: string, eventId: string): Promise<ApiResponse<UserEventResponse | null>>;
  getUserRSVPs(userId: string): Promise<ApiResponse<UserEventResponse[]>>;
  
  // Subscriptions
  createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<UserSubscription>>;
  updateSubscription(id: string, data: Partial<CreateSubscriptionRequest>): Promise<ApiResponse<UserSubscription>>;
  deleteSubscription(id: string): Promise<ApiResponse<null>>;
  getUserSubscriptions(userId: string): Promise<ApiResponse<UserSubscription[]>>;
  getSubscriptionSummary(userId: string): Promise<ApiResponse<SubscriptionSummaryResponse>>;
  activateSubscription(stripeSubscriptionId: string): Promise<ApiResponse<UserSubscription>>;
  getAllSubsectors(): Promise<ApiResponse<string[]>>;
  
  // Executive Assistant
  assignExecutiveAssistant(userId: string, assistantId: string, permissions: Record<string, boolean>): Promise<ApiResponse<ExecutiveAssistantAssignment>>;
  getAssignedUsers(assistantId: string): Promise<ApiResponse<UserWithSubscriptions[]>>;
  updateAssignment(id: string, permissions: Record<string, boolean>): Promise<ApiResponse<ExecutiveAssistantAssignment>>;
  removeAssignment(id: string): Promise<ApiResponse<null>>;
  
  // Notifications
  getNotifications(params: NotificationsQueryParams): Promise<ApiResponse<PaginatedResponse<Notification>>>;
  markNotificationRead(id: string, userId: string): Promise<ApiResponse<null>>;
  markAllNotificationsRead(userId: string): Promise<ApiResponse<null>>;
  createNotification(data: CreateNotificationRequest): Promise<ApiResponse<Notification>>;
  
  // Calendar Views
  getUserCalendar(userId: string, startDate: Date, endDate: Date): Promise<ApiResponse<UserCalendarResponse>>;
  getCompanyCalendar(companyId: string, startDate: Date, endDate: Date): Promise<ApiResponse<EventsResponse>>;
  
  // Weather
  getWeatherForLocation(location: string): Promise<ApiResponse<Record<string, any>>>;
}

// =====================================================================================
// ERROR TYPES
// =====================================================================================

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  field_errors?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  public code: string;
  public details?: Record<string, any>;
  public field_errors?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.details = error.details;
    this.field_errors = error.field_errors;
  }
}

// =====================================================================================
// API CONFIGURATION
// =====================================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
  },
};