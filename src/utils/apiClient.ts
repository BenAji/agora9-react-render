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

      // Use user ID from params or get current user
      let userId = params?.user_id;
      if (!userId) {
        const currentUserResponse = await this.getCurrentUser();
        userId = currentUserResponse.data.id;
      }


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


      // Transform the data to match CalendarEvent format
      const events: CalendarEvent[] = (eventsData || []).map((event: any) => {
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
          user_response: event.user_response ? {
            id: event.user_response_id || crypto.randomUUID(),
            user_id: userId,
            event_id: event.event_id,
            response_status: (event.user_response || 'pending') as 'accepted' | 'declined' | 'pending',
            response_date: new Date(),
            notes: event.response_notes || '',
      created_at: new Date(),
      updated_at: new Date()
          } : null,
          color_code: this.getEventColor(event.user_response || 'pending')
      };
    });

    
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

      // Use user ID from params or get current user
      let userId = params?.user_id;
      if (!userId) {
        const currentUserResponse = await this.getCurrentUser();
        userId = currentUserResponse.data.id;
      }

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

  // Get ALL companies (regardless of subscription status) - for subscription management
  async getAllCompanies(): Promise<ApiResponse<Company[]>> {
    try {
      const { data: companiesData, error } = await supabaseService
        .from('companies')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ SupabaseApiClient: All companies query error:', error);
        throw new ApiClientError({
          message: `Failed to fetch all companies: ${error.message}`,
          code: 'ALL_COMPANIES_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(companiesData || []);
    } catch (error: any) {
      return this.handleSupabaseError(error, 'get all companies');
    }
  }

  // Get All Available Subsectors
  async getAllSubsectors(): Promise<ApiResponse<string[]>> {
    try {

      // Get all unique subsectors from companies table
      const { data: companiesData, error } = await supabaseService
        .from('companies')
        .select('gics_subsector')
        .eq('is_active', true);

      if (error) {
        console.error('❌ SupabaseApiClient: Subsectors query error:', error);
        throw new ApiClientError({
          message: `Failed to fetch subsectors: ${error.message}`,
          code: 'SUBSECTORS_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      const uniqueSubsectors = Array.from(
        new Set(companiesData?.map(c => c.gics_subsector) || [])
      ).sort();
      
      
      return this.success(uniqueSubsectors);
    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Get all subsectors failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get all subsectors');
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

  async getUser(): Promise<ApiResponse<UserWithSubscriptions>> {
    throw new ApiClientError({ message: 'Get user not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
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

  async createRSVP(data: { user_id: string; event_id: string; response_status: 'accepted' | 'declined' | 'pending'; notes?: string }): Promise<ApiResponse<UserEventResponse>> {
    try {

      const { data: rsvpData, error } = await supabaseService
        .from('user_event_responses')
        .insert({
          user_id: data.user_id,
          event_id: data.event_id,
          response_status: data.response_status,
          notes: data.notes || null,
          response_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseApiClient: Create RSVP error:', error);
        throw new ApiClientError({
          message: `Failed to create RSVP: ${error.message}`,
          code: 'RSVP_CREATE_ERROR',
          details: { originalError: error }
        });
      }

      const userEventResponse: UserEventResponse = {
        id: rsvpData.id,
        user_id: rsvpData.user_id,
        event_id: rsvpData.event_id,
        response_status: rsvpData.response_status as 'accepted' | 'declined' | 'pending',
        response_date: new Date(rsvpData.response_date),
        notes: rsvpData.notes || '',
        created_at: new Date(rsvpData.created_at),
        updated_at: new Date(rsvpData.updated_at)
      };

      return this.success(userEventResponse);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Create RSVP failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'create RSVP');
    }
  }

  async updateRSVP(id: string, data: Partial<CreateRSVPRequest>): Promise<ApiResponse<UserEventResponse>> {
    try {

      const { data: rsvpData, error } = await supabaseService
        .from('user_event_responses')
        .update({
          response_status: data.response_status,
          response_date: new Date().toISOString(),
          notes: data.notes || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseApiClient: Update RSVP error:', error);
        throw new ApiClientError({
          message: `Failed to update RSVP: ${error.message}`,
          code: 'RSVP_UPDATE_ERROR',
          details: { originalError: error }
        });
      }

      const userEventResponse: UserEventResponse = {
        id: rsvpData.id,
        user_id: rsvpData.user_id,
        event_id: rsvpData.event_id,
        response_status: rsvpData.response_status as 'accepted' | 'declined' | 'pending',
        response_date: new Date(rsvpData.response_date),
        notes: rsvpData.notes || '',
        created_at: new Date(rsvpData.created_at),
        updated_at: new Date(rsvpData.updated_at)
      };

      return this.success(userEventResponse);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Update RSVP failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'update RSVP');
    }
  }

  // Helper method for updating RSVP by event and user
  async updateRSVPByEventAndUser(eventId: string, userId: string, responseStatus: 'accepted' | 'declined' | 'pending', notes?: string): Promise<ApiResponse<UserEventResponse>> {
    try {

      // First try to update existing RSVP
      const { data: rsvpData, error } = await supabaseService
        .from('user_event_responses')
        .update({
          response_status: responseStatus,
          response_date: new Date().toISOString(),
          notes: notes || null
        })
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        // If update fails (no existing record), create new one
        if (error.code === 'PGRST116') {
          return await this.createRSVP({
            user_id: userId,
            event_id: eventId,
            response_status: responseStatus,
            notes: notes
          });
        }

        console.error('❌ SupabaseApiClient: Update RSVP error:', error);
      throw new ApiClientError({
          message: `Failed to update RSVP: ${error.message}`,
          code: 'RSVP_UPDATE_ERROR',
        details: { originalError: error }
      });
    }

      const userEventResponse: UserEventResponse = {
        id: rsvpData.id,
        user_id: rsvpData.user_id,
        event_id: rsvpData.event_id,
        response_status: rsvpData.response_status as 'accepted' | 'declined' | 'pending',
        response_date: new Date(rsvpData.response_date),
        notes: rsvpData.notes || '',
        created_at: new Date(rsvpData.created_at),
        updated_at: new Date(rsvpData.updated_at)
      };

      return this.success(userEventResponse);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Update RSVP failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'update RSVP');
    }
  }

  async deleteRSVP(id: string): Promise<ApiResponse<null>> {
    try {

      const { error } = await supabaseService
        .from('user_event_responses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ SupabaseApiClient: Delete RSVP error:', error);
        throw new ApiClientError({
          message: `Failed to delete RSVP: ${error.message}`,
          code: 'RSVP_DELETE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Delete RSVP failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'delete RSVP');
    }
  }

  async getUserEventResponse(): Promise<ApiResponse<UserEventResponse | null>> {
    throw new ApiClientError({ message: 'Get user event response not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  // User Subscription Management  
  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<UserSubscription>> {
    return await this.createUserSubscription({
      user_id: data.user_id,
      subsector: data.subsector,
      payment_status: 'paid' // Match the filter in getCompanies
    }) as any;
  }

  async deleteSubscription(id: string): Promise<ApiResponse<null>> {
    return await this.deleteUserSubscription(id);
  }

  async getUserSubscriptions(userId: string): Promise<ApiResponse<UserSubscription[]>> {
    try {

      const { data: subscriptions, error } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ SupabaseApiClient: Get subscriptions error:', error);
        throw new ApiClientError({
          message: `Failed to get user subscriptions: ${error.message}`,
          code: 'SUBSCRIPTIONS_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      // Convert to proper UserSubscription format
      const userSubscriptions: UserSubscription[] = (subscriptions || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        subsector: sub.subsector,
        gics_subsector: sub.subsector,
        payment_status: (sub.payment_status === 'active' ? 'paid' : sub.payment_status) as 'pending' | 'paid' | 'failed' | 'cancelled',
        subscription_start_date: new Date(sub.created_at),
        subscription_end_date: null,
        is_active: sub.is_active,
        created_at: new Date(sub.created_at),
        updated_at: new Date(sub.created_at)
      }));

      return this.success(userSubscriptions);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Get user subscriptions failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get user subscriptions');
    }
  }

  async createUserSubscription(data: { user_id: string; subsector: string; payment_status?: string; is_active?: boolean }): Promise<ApiResponse<any>> {
    try {
      
      // Validation: Check if subscription already exists
      const { data: existingSubscriptions, error: checkError } = await supabaseService
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('subsector', data.subsector)
        .eq('is_active', true);

      if (checkError) {
        console.error('❌ SupabaseApiClient: Subscription check error:', checkError);
        throw new ApiClientError({
          message: `Failed to check existing subscription: ${checkError.message}`,
          code: 'SUBSCRIPTION_CHECK_ERROR',
          details: { originalError: checkError }
        });
      }

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        throw new ApiClientError({
          message: `User is already subscribed to ${data.subsector}`,
          code: 'DUPLICATE_SUBSCRIPTION',
          details: { user_id: data.user_id, subsector: data.subsector }
        });
      }

      // Simple insert - no duplicates should exist due to UI filtering
      const { data: subscription, error } = await supabaseService
        .from('user_subscriptions')
        .insert({
          user_id: data.user_id,
          subsector: data.subsector,
          payment_status: data.payment_status || 'paid', // Default to 'paid' to match filters
          is_active: data.is_active !== false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseApiClient: Create subscription error:', error);
        throw new ApiClientError({
          message: `Failed to create subscription: ${error.message}`,
          code: 'SUBSCRIPTION_CREATE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(subscription);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Create subscription failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'create user subscription');
    }
  }

  async deleteUserSubscription(subscriptionId: string): Promise<ApiResponse<null>> {
    try {

      const { error } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) {
        console.error('❌ SupabaseApiClient: Delete subscription error:', error);
        throw new ApiClientError({
          message: `Failed to delete subscription: ${error.message}`,
          code: 'SUBSCRIPTION_DELETE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Delete subscription failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'delete subscription');
    }
  }

  async updateUser(userId: string, data: { full_name?: string }): Promise<ApiResponse<UserWithSubscriptions>> {
    try {

      const { data: user, error } = await supabaseService
        .from('users')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseApiClient: Update user error:', error);
        throw new ApiClientError({
          message: `Failed to update user: ${error.message}`,
          code: 'USER_UPDATE_ERROR',
          details: { originalError: error }
        });
      }

      // Get user subscriptions
      const subscriptionsResponse = await this.getUserSubscriptions(userId);
      const subscriptions = subscriptionsResponse.success ? subscriptionsResponse.data : [];

      const userWithSubscriptions: UserWithSubscriptions = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as 'investment_analyst' | 'executive_assistant',
        is_active: user.is_active,
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at),
        preferences: {},
        subscriptions: subscriptions
      };

      return this.success(userWithSubscriptions);

    } catch (error: any) {
      console.error('💥 SupabaseApiClient: Update user failed:', error);
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'update user');
    }
  }

  async getUserRSVPs(): Promise<ApiResponse<UserEventResponse[]>> {
    throw new ApiClientError({ message: 'Get user RSVPs not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateSubscription(): Promise<ApiResponse<UserSubscription>> {
    throw new ApiClientError({ message: 'Update subscription not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
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
