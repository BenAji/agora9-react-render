/**
 * AGORA API Client - Clean Supabase-Only Implementation
 * 
 * Provides abstraction layer for Supabase backend.
 * Uses minimal schema with simple RPC functions.
 */

import { 
  ApiClient,
  ApiClientError,
  ApiResponse,
  EventsQueryParams,
  CompaniesQueryParams,
  CreateRSVPRequest,
  CreateSubscriptionRequest,
  UpdateCompanyOrderRequest,
  EventsResponse,
  CompaniesResponse,
  UserCalendarResponse,
  SubscriptionSummaryResponse,
  EventAttendanceResponse,
  PaginatedResponse
} from '../types/api';

import {
  User,
  CalendarEvent,
  Event,
  Company,
  CompanyWithEvents,
  UserWithSubscriptions,
  UserEventResponse,
  UserSubscription,
  ExecutiveAssistantAssignment,
  Notification
} from '../types/database';

import { supabase, supabaseService } from '../lib/supabase';

// =====================================================================================
// SUPABASE API CLIENT IMPLEMENTATION
// =====================================================================================

class SupabaseApiClient implements ApiClient {
  constructor() {
    console.log('🚀 SupabaseApiClient initialized - MINIMAL SCHEMA v1.0 🎯');
  }

  private success<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true
    };
  }

  private async handleSupabaseError(error: any, operation: string): Promise<never> {
    console.error(`Supabase ${operation} error:`, error);
    throw new ApiClientError({
      message: error.message || `Failed to ${operation}`,
      code: error.code || 'SUPABASE_ERROR',
      details: { originalError: error }
    });
  }

  // =====================================================================================
  // AUTHENTICATION METHODS
  // =====================================================================================

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log('🔐 SupabaseApiClient: Logging in user:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new ApiClientError({
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (!authData.user) {
        throw new ApiClientError({
          message: 'Authentication failed',
          code: 'AUTH_FAILED'
        });
      }

      // Get user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new ApiClientError({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        preferences: userData.preferences || {},
        created_at: new Date(userData.created_at),
        updated_at: new Date(userData.created_at), // minimal schema doesn't have updated_at
        last_login: undefined
      };

      console.log('✅ SupabaseApiClient: Login successful for:', user.email);
      return this.success({
        user,
        token: authData.session?.access_token || 'supabase-token'
      });

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Login failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'login');
    }
  }

  async logout(): Promise<ApiResponse<null>> {
    try {
      console.log('🚪 SupabaseApiClient: Logging out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new ApiClientError({
          message: error.message,
          code: 'LOGOUT_ERROR'
        });
      }

      return this.success(null);
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'logout');
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      console.log('👤 SupabaseApiClient: Getting current user');
      
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        throw new ApiClientError({
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData) {
        throw new ApiClientError({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        preferences: userData.preferences || {},
        created_at: new Date(userData.created_at),
        updated_at: new Date(userData.created_at),
        last_login: undefined
      };

      return this.success(user);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Get current user failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get current user');
    }
  }

  // =====================================================================================
  // EVENTS METHODS
  // =====================================================================================

  async getEvents(params?: EventsQueryParams): Promise<ApiResponse<EventsResponse>> {
    try {
      console.log('📅 SupabaseApiClient: Getting events with params:', params);

      // Get current user
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      console.log('👤 Current user ID:', userId);

      // Use our simple RPC function for minimal schema
      const { data: eventsData, error: eventsError } = await supabaseService
        .rpc('get_user_events_simple', {
          p_user_id: userId,
          p_start_date: params?.start_date?.toISOString() || '2025-01-01',
          p_end_date: params?.end_date?.toISOString() || '2025-12-31'
        });

      if (eventsError) {
        console.error('❌ SupabaseApiClient: Events query error:', eventsError);
        throw new ApiClientError({
          message: `Failed to fetch events: ${eventsError.message}`,
          code: 'EVENTS_FETCH_ERROR',
          details: { originalError: eventsError }
        });
      }

      console.log('📋 SupabaseApiClient: Raw events data:', eventsData);

      // Transform the data to match CalendarEvent format
      const events: CalendarEvent[] = (eventsData || []).map((event: any) => {
        console.log('🔄 Processing event:', event);
        return {
          id: event.event_id,
          title: event.title,
          description: event.description || '',
          start_date: new Date(event.start_date),
          end_date: new Date(event.end_date),
          location_type: event.location_type as 'physical' | 'virtual' | 'hybrid',
          location_details: undefined,
          virtual_details: undefined,
          weather_location: undefined,
          event_type: 'standard' as const,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          companies: event.companies || [],
          user_response: {
            id: crypto.randomUUID(),
            user_id: userId,
            event_id: event.event_id,
            response_status: (event.user_response || 'pending') as 'accepted' | 'declined' | 'pending',
            response_date: new Date(),
            notes: event.response_notes || '',
      created_at: new Date(),
      updated_at: new Date()
          },
          color_code: this.getEventColor(event.user_response || 'pending')
        };
      });

      console.log('✅ SupabaseApiClient: Processed events:', events.length);
      console.log('📊 Events details:', events);
      
      return this.success({
        events,
        total_count: events.length
      });

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Get events failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get events');
    }
  }

  private getEventColor(responseStatus: string): string {
    switch (responseStatus) {
      case 'accepted': return 'green';
      case 'declined': return 'yellow';
      case 'pending': return 'grey';
      default: return 'grey';
    }
  }

  async getEvent(id: string): Promise<ApiResponse<CalendarEvent>> {
    throw new ApiClientError({
      message: 'Get event not implemented in minimal schema',
      code: 'NOT_IMPLEMENTED'
    });
  }

  // =====================================================================================
  // COMPANIES METHODS
  // =====================================================================================

  async getCompanies(params?: CompaniesQueryParams): Promise<ApiResponse<CompaniesResponse>> {
    try {
      console.log('🏢 SupabaseApiClient: Getting companies with params:', params);

      // Get current user to filter by subscriptions
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      // Get user's subscribed subsectors
      const { data: subscriptions, error: subError } = await supabaseService
        .from('user_subscriptions')
        .select('subsector')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('payment_status', 'paid');

      if (subError) {
        console.error('❌ SupabaseApiClient: Subscriptions query error:', subError);
        throw new ApiClientError({
          message: `Failed to fetch subscriptions: ${subError.message}`,
          code: 'SUBSCRIPTION_FETCH_ERROR',
          details: { originalError: subError }
        });
      }

      const subscribedSubsectors = subscriptions?.map(s => s.subsector) || [];
      console.log('📋 SupabaseApiClient: User subscribed to:', subscribedSubsectors);

      if (subscribedSubsectors.length === 0) {
        return this.success({
          companies: [],
          total_count: 0
        });
      }

      // Get companies based on subscriptions
      const { data: companiesData, error: companiesError } = await supabaseService
        .from('companies')
        .select('*')
        .in('gics_subsector', subscribedSubsectors)
        .eq('is_active', true);

      if (companiesError) {
        console.error('❌ SupabaseApiClient: Companies query error:', companiesError);
        throw new ApiClientError({
          message: `Failed to fetch companies: ${companiesError.message}`,
          code: 'COMPANIES_FETCH_ERROR',
          details: { originalError: companiesError }
        });
      }

      console.log('📋 SupabaseApiClient: Found companies:', companiesData?.length || 0);

      const companies: CompanyWithEvents[] = (companiesData || []).map((company: any) => ({
        id: company.id,
        ticker_symbol: company.ticker_symbol,
        company_name: company.company_name,
        gics_sector: company.gics_sector,
        gics_subsector: company.gics_subsector,
        gics_industry: company.gics_industry || '',
        gics_sub_industry: company.gics_sub_industry || '',
        classification_status: 'complete' as const,
        is_active: company.is_active,
        created_at: new Date(company.created_at),
        updated_at: new Date(company.created_at),
        events: [] // TODO: Load company events if needed
      }));
    
    return this.success({
        companies,
        total_count: companies.length
      });

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Get companies failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get companies');
  }
}

// =====================================================================================
  // PLACEHOLDER METHODS (Not implemented for minimal schema)
// =====================================================================================

  async createEvent(): Promise<ApiResponse<Event>> {
    throw new ApiClientError({ message: 'Create event not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateEvent(): Promise<ApiResponse<Event>> {
    throw new ApiClientError({ message: 'Update event not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async deleteEvent(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Delete event not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getEventAttendance(): Promise<ApiResponse<EventAttendanceResponse>> {
    throw new ApiClientError({ message: 'Event attendance not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateEventResponse(): Promise<ApiResponse<UserEventResponse>> {
    throw new ApiClientError({ message: 'Update event response not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getCompany(): Promise<ApiResponse<CompanyWithEvents>> {
    throw new ApiClientError({ message: 'Get company not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async createUser(): Promise<ApiResponse<User>> {
    throw new ApiClientError({ message: 'Create user not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateUser(): Promise<ApiResponse<User>> {
    throw new ApiClientError({ message: 'Update user not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUser(): Promise<ApiResponse<UserWithSubscriptions>> {
    throw new ApiClientError({ message: 'Get user not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUserSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    throw new ApiClientError({ message: 'User subscriptions not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getSubscriptionSummary(): Promise<ApiResponse<SubscriptionSummaryResponse>> {
    throw new ApiClientError({ message: 'Subscription summary not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async activateSubscription(): Promise<ApiResponse<UserSubscription>> {
    throw new ApiClientError({ message: 'Activate subscription not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async assignExecutiveAssistant(): Promise<ApiResponse<ExecutiveAssistantAssignment>> {
    throw new ApiClientError({ message: 'Executive assistant assignment not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getAssignedUsers(): Promise<ApiResponse<UserWithSubscriptions[]>> {
    throw new ApiClientError({ message: 'Get assigned users not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateAssignmentPermissions(): Promise<ApiResponse<ExecutiveAssistantAssignment>> {
    throw new ApiClientError({ message: 'Update assignment permissions not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateAssignment(id: string, permissions: Record<string, boolean>): Promise<ApiResponse<ExecutiveAssistantAssignment>> {
    throw new ApiClientError({ message: 'Update assignment not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async removeAssignment(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Remove assignment not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getNotifications(): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    throw new ApiClientError({ message: 'Notifications not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async markNotificationRead(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Mark notification read not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Mark all notifications read not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async createNotification(): Promise<ApiResponse<Notification>> {
    throw new ApiClientError({ message: 'Create notification not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateCompanyOrder(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Update company order not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUserCalendar(): Promise<ApiResponse<UserCalendarResponse>> {
    throw new ApiClientError({ message: 'User calendar not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getCompanyCalendar(): Promise<ApiResponse<EventsResponse>> {
    throw new ApiClientError({ message: 'Company calendar not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getWeatherForLocation(): Promise<ApiResponse<Record<string, any>>> {
    throw new ApiClientError({ message: 'Weather not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async createRSVP(): Promise<ApiResponse<UserEventResponse>> {
    throw new ApiClientError({ message: 'Create RSVP not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateRSVP(): Promise<ApiResponse<UserEventResponse>> {
    throw new ApiClientError({ message: 'Update RSVP not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async deleteRSVP(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Delete RSVP not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUserEventResponse(): Promise<ApiResponse<UserEventResponse | null>> {
    throw new ApiClientError({ message: 'Get user event response not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUserRSVPs(): Promise<ApiResponse<UserEventResponse[]>> {
    throw new ApiClientError({ message: 'Get user RSVPs not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async createSubscription(): Promise<ApiResponse<UserSubscription>> {
    throw new ApiClientError({ message: 'Create subscription not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateSubscription(): Promise<ApiResponse<UserSubscription>> {
    throw new ApiClientError({ message: 'Update subscription not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async deleteSubscription(): Promise<ApiResponse<null>> {
    throw new ApiClientError({ message: 'Delete subscription not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUserOrderedCompanies(): Promise<ApiResponse<Company[]>> {
    throw new ApiClientError({ message: 'Get user ordered companies not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }
}

// =====================================================================================
// EXPORTED API CLIENT
// =====================================================================================

// 🎯 Clean Supabase-only implementation
export const apiClient: ApiClient = new SupabaseApiClient();

export { SupabaseApiClient };
