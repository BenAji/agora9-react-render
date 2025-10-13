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
  PaginatedResponse,
  CreateEventRequest,
  UpdateEventRequest
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
import { parseEventLocation } from './locationUtils';

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

  // Helper method to fetch host details based on host_type and host_id
  private async fetchHostDetails(host: any): Promise<any> {
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
            host_sector: primaryCompany.sector,
            host_subsector: primaryCompany.subsector,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching host details:', error);
    }

    return host; // Return original host if fetching fails
  }

  private async handleSupabaseError(error: any, operation: string): Promise<never> {
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


      // First, delete any subscriptions that have passed their expiration date
      const now = new Date().toISOString();
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      // Then get user's active subscriptions to filter events
      const { data: userSubscriptions, error: subError } = await supabaseService
        .from('user_subscriptions')
        .select('subsector')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('payment_status', 'paid');

      if (subError) {
        throw new ApiClientError({
          message: `Failed to fetch user subscriptions: ${subError.message}`,
          code: 'SUBSCRIPTIONS_FETCH_ERROR',
          details: { originalError: subError }
        });
      }

      const subscribedSubsectors = userSubscriptions?.map((sub: any) => sub.subsector) || [];
      
      if (subscribedSubsectors.length === 0) {
        // User has no subscriptions, return empty array
    return this.success({
          events: [],
          total_count: 0
        });
      }

      // Use a direct query with enhanced hosting information
      const { data: eventsData, error: eventsError } = await supabaseService
        .from('events')
        .select(`
          *,
          event_hosts(
            id,
            host_type,
            host_id,
            companies_jsonb,
            primary_company_id
          ),
          event_companies(
            companies(
              id,
              company_name,
              ticker_symbol,
              gics_sector,
              gics_subsector,
              is_active
            )
          ),
          user_event_responses(
            response_status,
            response_date,
            notes,
            user_id,
            users(
              id,
              full_name,
              email
            )
          )
        `)
        .gte('start_date', params?.start_date?.toISOString() || '2025-01-01')
        .lte('end_date', params?.end_date?.toISOString() || '2025-12-31')
        .eq('is_active', true);

      if (eventsError) {
        throw new ApiClientError({
          message: `Failed to fetch events: ${eventsError.message}`,
          code: 'EVENTS_FETCH_ERROR',
          details: { originalError: eventsError }
        });
      }


      // Filter events client-side based on subscriptions and active companies
      const filteredEvents = (eventsData || []).filter((event: any) => {
        // Check if event has any companies
        if (!event.event_companies || event.event_companies.length === 0) {
          return false;
        }
        
        // Check if any company is active and matches subscribed subsectors
        return event.event_companies.some((ec: any) => {
          const company = ec.companies;
          return company && 
                 company.is_active && 
                 subscribedSubsectors.includes(company.gics_subsector);
        });
      });

      // Transform the filtered query data to match CalendarEvent format
      const events: CalendarEvent[] = filteredEvents.map((event: any) => {
        // Extract companies from the nested event_companies structure
        const companies = (event.event_companies || [])
          .filter((ec: any) => ec.companies && ec.companies.is_active)
          .map((ec: any) => ({
          id: ec.companies.id,
          ticker_symbol: ec.companies.ticker_symbol,
          company_name: ec.companies.company_name,
          gics_sector: ec.companies.gics_sector,
          gics_subsector: ec.companies.gics_subsector,
          gics_industry: '',
          gics_sub_industry: '',
      created_at: new Date(),
          updated_at: new Date(),
      is_active: true,
          classification_status: 'complete' as const
        }));

        // Extract event hosts information - simplified for now
        const hosts = Array.isArray(event.event_hosts) ? event.event_hosts.map((eh: any) => ({
          id: eh.id,
          event_id: event.id,
          host_type: eh.host_type,
          host_id: eh.host_id,
          host_name: '', // Will be populated when needed
          host_ticker: '', // Will be populated when needed
          host_sector: '', // Will be populated when needed
          host_subsector: '', // Will be populated when needed
          companies_jsonb: eh.companies_jsonb,
          primary_company_id: eh.primary_company_id,
          created_at: new Date(eh.created_at),
          updated_at: new Date(eh.updated_at),
        })) : [];

        // Get primary host for easy access
        const primary_host = hosts.find((h: any) => h.primary_company_id === h.host_id) || hosts[0];

        // Get user response if it exists (filtered by current user only)
        const userResponse = event.user_event_responses && event.user_event_responses.length > 0 
          ? event.user_event_responses.find((response: any) => response.user_id === userId)
          : undefined;

        // Parse location information from JSONB fields
        const parsedLocation = parseEventLocation(
          event.location_type as 'physical' | 'virtual' | 'hybrid',
          event.location_details,
          event.virtual_details,
          event.weather_location
        );

        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          start_date: new Date(event.start_date),
          end_date: new Date(event.end_date),
          location_type: event.location_type as 'physical' | 'virtual' | 'hybrid',
          location_details: event.location_details,
          virtual_details: event.virtual_details,
          weather_location: event.weather_location,
          weather_coordinates: event.weather_coordinates,
          parsed_location: parsedLocation,
          event_type: event.event_type as 'standard' | 'catalyst',
          is_active: event.is_active,
          created_at: new Date(event.created_at),
          updated_at: new Date(event.updated_at),
          companies: companies,
          hostingCompanies: companies, // For compatibility with CalendarEventData interface
          hosts: hosts, // NEW: Event hosting information
          primary_host: primary_host, // NEW: Primary host for easy access
          // Additional properties required by CalendarEventData interface
          speakers: [], // Will be populated from database if available
          agenda: [], // Will be populated from database if available
          tags: [], // Will be populated from database if available
          access_info: {
            is_free: true,
            registration_required: false,
            registration_link: undefined,
            contact_email: undefined
          },
          rsvpStatus: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
          colorCode: this.getEventColor(userResponse?.response_status || 'pending'),
          isMultiCompany: companies.length > 1,
          attendingCompanies: companies.map((c: any) => c.ticker_symbol),
          attendees: event.user_event_responses?.filter((response: any) => response.response_status === 'accepted').map((response: any) => ({
            user_id: response.user_id,
            full_name: response.users?.full_name || 'Unknown User',
            email: response.users?.email || '',
            response_status: response.response_status,
            response_date: response.response_date ? new Date(response.response_date) : null
          })) || [], // Analyst confirmations
          user_response: userResponse ? {
            id: userResponse.id,
            user_id: userId!,
            event_id: event.id,
            response_status: (userResponse.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
            response_date: new Date(userResponse.response_date || new Date()),
            notes: userResponse.notes || '',
            created_at: new Date(userResponse.created_at || new Date()),
            updated_at: new Date(userResponse.updated_at || new Date())
          } : undefined,
          user_rsvp_status: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
          color_code: this.getEventColor(userResponse?.response_status || 'pending')
        };
      });

    
    return this.success({
        events,
        total_count: events.length
      });

    } catch (error: any) {
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
    try {
      const { data: eventData, error: eventError } = await supabaseService
        .from('events')
        .select(`
          *,
          event_hosts(
            id,
            host_type,
            host_id,
            companies_jsonb,
            primary_company_id
          ),
          event_companies(
            companies(
              id,
              company_name,
              ticker_symbol,
              gics_sector,
              gics_subsector,
              is_active
            )
          ),
          user_event_responses(
            response_status,
            response_date,
            notes,
            user_id,
            users(
              id,
              full_name,
              email
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (eventError) {
    throw new ApiClientError({
          message: `Failed to fetch event: ${eventError.message}`,
          code: 'EVENT_FETCH_ERROR',
          details: { originalError: eventError }
        });
      }

      if (!eventData) {
        throw new ApiClientError({
          message: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Transform the event data to match CalendarEvent format
      const companies = eventData.event_companies?.map((ec: any) => ec.companies).filter(Boolean) || [];
      const hosts = Array.isArray(eventData.event_hosts) ? eventData.event_hosts.map((eh: any) => ({
        id: eh.id,
        event_id: eventData.id,
        host_type: eh.host_type,
        host_id: eh.host_id,
        host_name: '', // Will be populated when needed
        host_ticker: '', // Will be populated when needed
        host_sector: '', // Will be populated when needed
        host_subsector: '', // Will be populated when needed
        companies_jsonb: eh.companies_jsonb,
        primary_company_id: eh.primary_company_id,
        created_at: new Date(eh.created_at),
        updated_at: new Date(eh.updated_at),
      })) : [];

      const primary_host = hosts.find((h: any) => h.primary_company_id) || hosts[0] || null;

      // Get user response
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;
      const userResponse = eventData.user_event_responses?.find((response: any) => response.user_id === userId);

      // Parse location details (simplified for now)
      const parsedLocation = eventData.location_details ? {
        displayText: eventData.location_details.venue || eventData.location_details.address || 'Location details available',
        fullAddress: eventData.location_details.address || '',
        isPrimarilyVirtual: eventData.location_type === 'virtual',
        hasPhysicalComponent: eventData.location_type === 'physical' || eventData.location_type === 'hybrid',
        hasVirtualComponent: eventData.location_type === 'virtual' || eventData.location_type === 'hybrid',
        meetingUrl: eventData.virtual_details?.join_url,
        weatherLocation: eventData.weather_location || eventData.location_details.city || 'Unknown location'
      } : undefined;

      return this.success({
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || '',
        start_date: new Date(eventData.start_date),
        end_date: new Date(eventData.end_date),
        location_type: eventData.location_type as 'physical' | 'virtual' | 'hybrid',
        location_details: eventData.location_details,
        virtual_details: eventData.virtual_details,
        weather_location: eventData.weather_location,
        weather_coordinates: eventData.weather_coordinates,
        parsed_location: parsedLocation,
        event_type: eventData.event_type as 'standard' | 'catalyst',
        is_active: eventData.is_active,
        created_at: new Date(eventData.created_at),
        updated_at: new Date(eventData.updated_at),
        companies: companies,
        hostingCompanies: companies,
        hosts: hosts,
        primary_host: primary_host,
        speakers: [],
        agenda: [],
        tags: [],
        access_info: {
          is_free: true,
          registration_required: false,
          registration_link: undefined,
          contact_email: undefined
        },
        rsvpStatus: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
        colorCode: this.getEventColor(userResponse?.response_status || 'pending'),
        isMultiCompany: companies.length > 1,
        attendingCompanies: companies.map((c: any) => c.ticker_symbol),
        attendees: eventData.user_event_responses?.filter((response: any) => response.response_status === 'accepted').map((response: any) => ({
          user_id: response.user_id,
          full_name: response.users?.full_name || 'Unknown User',
          email: response.users?.email || '',
          response_status: response.response_status,
          response_date: response.response_date ? new Date(response.response_date) : null
        })) || [],
        user_response: userResponse ? {
          id: userResponse.id,
          user_id: userId,
          event_id: eventData.id,
          response_status: (userResponse.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
          response_date: new Date(userResponse.response_date || new Date()),
          notes: userResponse.notes || '',
          created_at: new Date(userResponse.created_at || new Date()),
          updated_at: new Date(userResponse.updated_at || new Date())
        } : undefined,
        user_rsvp_status: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
        color_code: this.getEventColor(userResponse?.response_status || 'pending')
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVENT_FETCH_ERROR',
        details: { originalError: error }
      });
    }
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

      // First, delete any subscriptions that have passed their expiration date
      const now = new Date().toISOString();
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      // Then get user's subscribed subsectors
      const { data: subscriptions, error: subError } = await supabaseService
        .from('user_subscriptions')
        .select('subsector')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('payment_status', 'paid');

      if (subError) {
        throw new ApiClientError({
          message: `Failed to fetch subscriptions: ${subError.message}`,
          code: 'SUBSCRIPTION_FETCH_ERROR',
          details: { originalError: subError }
        });
      }

      const subscribedSubsectors = subscriptions?.map((s: any) => s.subsector) || [];

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

  // Get companies filtered by user subscriptions - for calendar display
  async getSubscribedCompanies(userId?: string): Promise<ApiResponse<Company[]>> {
    try {
      // Get current user if not provided
      if (!userId) {
        const currentUserResponse = await this.getCurrentUser();
        userId = currentUserResponse.data.id;
      }

      // First, delete any subscriptions that have passed their expiration date
      const now = new Date().toISOString();
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      // Get user's active subscriptions
      const { data: userSubscriptions, error: subError } = await supabaseService
        .from('user_subscriptions')
        .select('subsector')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('payment_status', 'paid');

      if (subError) {
        throw new ApiClientError({
          message: `Failed to fetch user subscriptions: ${subError.message}`,
          code: 'SUBSCRIPTIONS_FETCH_ERROR',
          details: { originalError: subError }
        });
      }

      const subscribedSubsectors = userSubscriptions?.map((sub: any) => sub.subsector) || [];
      
      if (subscribedSubsectors.length === 0) {
        // User has no subscriptions, return empty array
        return this.success([]);
      }

      // Get companies from subscribed subsectors
      const { data: companiesData, error } = await supabaseService
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .in('gics_subsector', subscribedSubsectors);

      if (error) {
        
        throw new ApiClientError({
          message: `Failed to fetch subscribed companies: ${error.message}`,
          code: 'SUBSCRIBED_COMPANIES_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(companiesData || []);
    } catch (error: any) {
      return this.handleSupabaseError(error, 'get subscribed companies');
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
        
        throw new ApiClientError({
          message: `Failed to fetch subsectors: ${error.message}`,
          code: 'SUBSECTORS_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      const subsectors: string[] = companiesData?.map((c: any) => c.gics_subsector as string) || [];
      const uniqueSubsectors: string[] = Array.from(new Set(subsectors)).sort();
      
      
      return this.success(uniqueSubsectors);
    } catch (error: any) {
      
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get all subsectors');
    }
  }

// =====================================================================================
  // PLACEHOLDER METHODS (Not implemented for minimal schema)
// =====================================================================================

  async createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>> {
    try {
      const { data: eventData, error: eventError } = await supabaseService
        .from('events')
        .insert({
          title: data.title,
          description: data.description || null,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString(),
          location_type: data.location_type,
          location_details: data.location_details || null,
          virtual_details: data.virtual_details || null,
          weather_location: data.weather_location || null,
          event_type: data.event_type || 'standard',
          is_active: true
        })
        .select()
        .single();

      if (eventError) {
        throw new ApiClientError({
          message: `Failed to create event: ${eventError.message}`,
          code: 'EVENT_CREATE_ERROR',
          details: { originalError: eventError }
        });
      }

      return this.success({
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        start_date: new Date(eventData.start_date),
        end_date: new Date(eventData.end_date),
        location_type: eventData.location_type as 'physical' | 'virtual' | 'hybrid',
        location_details: eventData.location_details,
        virtual_details: eventData.virtual_details,
        weather_location: eventData.weather_location,
        weather_coordinates: eventData.weather_coordinates,
        event_type: eventData.event_type as 'standard' | 'catalyst',
        is_active: eventData.is_active,
        created_at: new Date(eventData.created_at),
        updated_at: new Date(eventData.updated_at)
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVENT_CREATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async updateEvent(id: string, data: UpdateEventRequest): Promise<ApiResponse<Event>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that are provided
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.start_date !== undefined) updateData.start_date = data.start_date.toISOString();
      if (data.end_date !== undefined) updateData.end_date = data.end_date.toISOString();
      if (data.location_type !== undefined) updateData.location_type = data.location_type;
      if (data.location_details !== undefined) updateData.location_details = data.location_details;
      if (data.virtual_details !== undefined) updateData.virtual_details = data.virtual_details;
      if (data.weather_location !== undefined) updateData.weather_location = data.weather_location;
      if (data.event_type !== undefined) updateData.event_type = data.event_type;

      const { data: eventData, error: eventError } = await supabaseService
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (eventError) {
        throw new ApiClientError({
          message: `Failed to update event: ${eventError.message}`,
          code: 'EVENT_UPDATE_ERROR',
          details: { originalError: eventError }
        });
      }

      if (!eventData) {
        throw new ApiClientError({
          message: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      return this.success({
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        start_date: new Date(eventData.start_date),
        end_date: new Date(eventData.end_date),
        location_type: eventData.location_type as 'physical' | 'virtual' | 'hybrid',
        location_details: eventData.location_details,
        virtual_details: eventData.virtual_details,
        weather_location: eventData.weather_location,
        weather_coordinates: eventData.weather_coordinates,
        event_type: eventData.event_type as 'standard' | 'catalyst',
        is_active: eventData.is_active,
        created_at: new Date(eventData.created_at),
        updated_at: new Date(eventData.updated_at)
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVENT_UPDATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async deleteEvent(id: string): Promise<ApiResponse<null>> {
    try {
      // Soft delete by setting is_active to false
      const { error: eventError } = await supabaseService
        .from('events')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (eventError) {
        throw new ApiClientError({
          message: `Failed to delete event: ${eventError.message}`,
          code: 'EVENT_DELETE_ERROR',
          details: { originalError: eventError }
        });
      }

      return this.success(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVENT_DELETE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async getEventAttendance(eventId: string): Promise<ApiResponse<EventAttendanceResponse>> {
    try {
      // Get all user responses for this event
      const { data: responsesData, error: responsesError } = await supabaseService
        .from('user_event_responses')
        .select(`
          *,
          users(
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', eventId);

      if (responsesError) {
        throw new ApiClientError({
          message: `Failed to fetch event attendance: ${responsesError.message}`,
          code: 'ATTENDANCE_FETCH_ERROR',
          details: { originalError: responsesError }
        });
      }

      // Count responses by status
      const attending_count = responsesData?.filter((r: any) => r.response_status === 'accepted').length || 0;
      const not_attending_count = responsesData?.filter((r: any) => r.response_status === 'declined').length || 0;
      const pending_count = responsesData?.filter((r: any) => r.response_status === 'pending').length || 0;
      const total_responses = responsesData?.length || 0;

      // Build attendees list
      const attendees = responsesData?.filter((r: any) => r.response_status === 'accepted').map((response: any) => ({
        user_id: response.user_id,
        full_name: response.users?.full_name || 'Unknown User',
        response_status: response.response_status as 'accepted' | 'declined' | 'pending',
        response_date: response.response_date ? new Date(response.response_date) : null
      })) || [];

      return this.success({
        attending_count,
        not_attending_count,
        pending_count,
        total_responses,
        attendees
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to get event attendance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'ATTENDANCE_FETCH_ERROR',
        details: { originalError: error }
      });
    }
  }

  async updateEventResponse(eventId: string, responseStatus: 'accepted' | 'declined' | 'pending', notes?: string): Promise<ApiResponse<UserEventResponse>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      // Check if response already exists
      const { data: existingResponse, error: checkError } = await supabaseService
        .from('user_event_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new ApiClientError({
          message: `Failed to check existing response: ${checkError.message}`,
          code: 'RESPONSE_CHECK_ERROR',
          details: { originalError: checkError }
        });
      }

      const now = new Date().toISOString();
      let responseData;

      if (existingResponse) {
        // Update existing response
        const { data, error } = await supabaseService
          .from('user_event_responses')
          .update({
            response_status: responseStatus,
            response_date: now,
            notes: notes || existingResponse.notes,
            updated_at: now
          })
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (error) {
          throw new ApiClientError({
            message: `Failed to update event response: ${error.message}`,
            code: 'RESPONSE_UPDATE_ERROR',
            details: { originalError: error }
          });
        }
        responseData = data;
      } else {
        // Create new response
        const { data, error } = await supabaseService
          .from('user_event_responses')
          .insert({
            user_id: userId,
            event_id: eventId,
            response_status: responseStatus,
            response_date: now,
            notes: notes || null
          })
          .select()
          .single();

        if (error) {
          throw new ApiClientError({
            message: `Failed to create event response: ${error.message}`,
            code: 'RESPONSE_CREATE_ERROR',
            details: { originalError: error }
          });
        }
        responseData = data;
      }

      return this.success({
        id: responseData.id,
        user_id: responseData.user_id,
        event_id: responseData.event_id,
        response_status: responseData.response_status as 'accepted' | 'declined' | 'pending',
        response_date: new Date(responseData.response_date),
        notes: responseData.notes || '',
        created_at: new Date(responseData.created_at),
        updated_at: new Date(responseData.updated_at)
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to update event response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'RESPONSE_UPDATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async getCompany(): Promise<ApiResponse<CompanyWithEvents>> {
    throw new ApiClientError({ message: 'Get company not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async createUser(): Promise<ApiResponse<User>> {
    throw new ApiClientError({ message: 'Create user not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async getUser(userId?: string): Promise<ApiResponse<UserWithSubscriptions>> {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).data.id;

      // Get user data
      const { data: userData, error: userError } = await supabaseService
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .eq('is_active', true)
        .single();

      if (userError) {
        throw new ApiClientError({
          message: `Failed to fetch user: ${userError.message}`,
          code: 'USER_FETCH_ERROR',
          details: { originalError: userError }
        });
      }

      if (!userData) {
        throw new ApiClientError({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user subscriptions
      const { data: subscriptionsData, error: subError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_active', true);

      if (subError) {
        throw new ApiClientError({
          message: `Failed to fetch user subscriptions: ${subError.message}`,
          code: 'SUBSCRIPTIONS_FETCH_ERROR',
          details: { originalError: subError }
        });
      }

      const subscriptions = subscriptionsData?.map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        subsector: sub.subsector,
        payment_status: sub.payment_status as 'pending' | 'paid' | 'failed' | 'canceled',
        is_active: sub.is_active,
        expires_at: sub.expires_at ? new Date(sub.expires_at) : null,
        stripe_subscription_id: sub.stripe_subscription_id,
        stripe_customer_id: sub.stripe_customer_id,
        created_at: new Date(sub.created_at),
        updated_at: new Date(sub.updated_at)
      })) || [];

      return this.success({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role as 'investment_analyst' | 'executive_assistant',
        is_active: userData.is_active,
        preferences: userData.preferences,
        created_at: new Date(userData.created_at),
        updated_at: new Date(userData.updated_at),
        last_login: userData.last_login ? new Date(userData.last_login) : undefined,
        subscriptions
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'USER_FETCH_ERROR',
        details: { originalError: error }
      });
    }
  }

  async getSubscriptionSummary(): Promise<ApiResponse<SubscriptionSummaryResponse>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      // Get all user subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subscriptionsError) {
        throw new ApiClientError({
          message: `Failed to fetch subscription summary: ${subscriptionsError.message}`,
          code: 'SUBSCRIPTION_SUMMARY_ERROR',
          details: { originalError: subscriptionsError }
        });
      }

      const total_subscriptions = subscriptionsData?.length || 0;
      const active_subscriptions = subscriptionsData?.filter((sub: any) => sub.is_active).length || 0;
      const paid_subscriptions = subscriptionsData?.filter((sub: any) => sub.payment_status === 'paid').length || 0;
      const pending_subscriptions = subscriptionsData?.filter((sub: any) => sub.payment_status === 'pending').length || 0;

      // Get unique subsectors
      const subscribed_subsectors = Array.from(new Set(subscriptionsData?.map((sub: any) => sub.subsector) || []));

      // Build sectors array with proper structure
      const sectors = subscribed_subsectors.map(subsector => {
        const subscription = subscriptionsData?.find((sub: any) => sub.subsector === subsector);
        return {
          subsector: subsector as string,
          payment_status: subscription?.payment_status || 'pending',
          is_active: subscription?.is_active || false,
          expires_at: subscription?.expires_at ? new Date(subscription.expires_at) : undefined
        };
      });

      return this.success({
        total_subscriptions,
        active_subscriptions,
        paid_subscriptions,
        pending_subscriptions,
        subscribed_subsectors,
        sectors,
        subscriptions: subscriptionsData?.map((sub: any) => ({
          id: sub.id,
          user_id: sub.user_id,
          subsector: sub.subsector,
          payment_status: sub.payment_status as 'pending' | 'paid' | 'failed' | 'canceled',
          is_active: sub.is_active,
          expires_at: sub.expires_at ? new Date(sub.expires_at) : null,
          stripe_subscription_id: sub.stripe_subscription_id,
          stripe_customer_id: sub.stripe_customer_id,
          created_at: new Date(sub.created_at),
          updated_at: new Date(sub.updated_at)
        })) || []
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to get subscription summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SUBSCRIPTION_SUMMARY_ERROR',
        details: { originalError: error }
      });
    }
  }

  async activateSubscription(stripeSubscriptionId: string): Promise<ApiResponse<UserSubscription>> {
    try {
      // Find subscription by Stripe ID
      const { data: subscriptionData, error: findError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (findError) {
        throw new ApiClientError({
          message: `Failed to find subscription: ${findError.message}`,
          code: 'SUBSCRIPTION_NOT_FOUND',
          details: { originalError: findError }
        });
      }

      if (!subscriptionData) {
        throw new ApiClientError({
          message: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      // Update subscription to active
      const { data: updatedData, error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update({
          is_active: true,
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiClientError({
          message: `Failed to activate subscription: ${updateError.message}`,
          code: 'SUBSCRIPTION_ACTIVATE_ERROR',
          details: { originalError: updateError }
        });
      }

      return this.success({
        id: updatedData.id,
        user_id: updatedData.user_id,
        subsector: updatedData.subsector,
        payment_status: updatedData.payment_status as 'pending' | 'paid' | 'failed' | 'cancelled',
        is_active: updatedData.is_active,
        expires_at: updatedData.expires_at ? new Date(updatedData.expires_at) : undefined,
        stripe_subscription_id: updatedData.stripe_subscription_id,
        stripe_customer_id: updatedData.stripe_customer_id,
        created_at: new Date(updatedData.created_at),
        updated_at: new Date(updatedData.updated_at)
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to activate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SUBSCRIPTION_ACTIVATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async assignExecutiveAssistant(userId: string, assistantId: string, permissions: Record<string, boolean>): Promise<ApiResponse<ExecutiveAssistantAssignment>> {
    try {
      const { data: assignmentData, error: assignmentError } = await supabaseService
        .from('executive_assistant_assignments')
        .insert({
          user_id: userId,
          assistant_id: assistantId,
          permissions: permissions,
          assignment_type: 'permanent',
          is_active: true
        })
        .select()
        .single();

      if (assignmentError) {
        throw new ApiClientError({
          message: `Failed to assign executive assistant: ${assignmentError.message}`,
          code: 'EA_ASSIGNMENT_ERROR',
          details: { originalError: assignmentError }
        });
      }

      return this.success({
        id: assignmentData.id,
        assistant_id: assignmentData.assistant_id,
        user_id: assignmentData.user_id,
        permissions: assignmentData.permissions,
        assignment_type: assignmentData.assignment_type as 'permanent' | 'temporary',
        expires_at: assignmentData.expires_at ? new Date(assignmentData.expires_at) : undefined,
        is_active: assignmentData.is_active,
        created_at: new Date(assignmentData.created_at),
        updated_at: new Date(assignmentData.updated_at)
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to assign executive assistant: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EA_ASSIGNMENT_ERROR',
        details: { originalError: error }
      });
    }
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

  async getNotifications(params?: { limit?: number; offset?: number; unread_only?: boolean }): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      const limit = params?.limit || 20;
      const offset = params?.offset || 0;

      let query = supabaseService
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (params?.unread_only) {
        query = query.eq('is_read', false);
      }

      const { data: notificationsData, error: notificationsError } = await query;

      if (notificationsError) {
        throw new ApiClientError({
          message: `Failed to fetch notifications: ${notificationsError.message}`,
          code: 'NOTIFICATIONS_FETCH_ERROR',
          details: { originalError: notificationsError }
        });
      }

      const notifications = notificationsData?.map((notification: any) => ({
        id: notification.id,
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type as 'event_reminder' | 'subscription_update' | 'ea_notification' | 'system_alert',
        is_read: notification.is_read,
        metadata: notification.metadata,
        created_at: new Date(notification.created_at),
        updated_at: new Date(notification.updated_at)
      })) || [];

      // Get total count for pagination
      const { count, error: countError } = await supabaseService
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw new ApiClientError({
          message: `Failed to count notifications: ${countError.message}`,
          code: 'NOTIFICATIONS_COUNT_ERROR',
          details: { originalError: countError }
        });
      }

      return this.success({
        data: notifications,
        total_count: count || 0,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'NOTIFICATIONS_FETCH_ERROR',
        details: { originalError: error }
      });
    }
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      const { error } = await supabaseService
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw new ApiClientError({
          message: `Failed to mark notification as read: ${error.message}`,
          code: 'NOTIFICATION_UPDATE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'NOTIFICATION_UPDATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async markAllNotificationsRead(): Promise<ApiResponse<null>> {
    try {
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      const { error } = await supabaseService
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new ApiClientError({
          message: `Failed to mark all notifications as read: ${error.message}`,
          code: 'NOTIFICATIONS_UPDATE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'NOTIFICATIONS_UPDATE_ERROR',
        details: { originalError: error }
      });
    }
  }

  async createNotification(): Promise<ApiResponse<Notification>> {
    throw new ApiClientError({ message: 'Create notification not implemented in minimal schema', code: 'NOT_IMPLEMENTED' });
  }

  async updateCompanyOrder(data: UpdateCompanyOrderRequest): Promise<ApiResponse<null>> {
    try {
      // First, delete existing order records for this user
      await supabaseService
        .from('user_company_order')
        .delete()
        .eq('user_id', data.user_id);

      // Then insert new order records
      const orderRecords = data.company_orders.map(order => ({
        user_id: data.user_id,
        company_id: order.company_id,
        display_order: order.display_order
      }));

      const { error } = await supabaseService
        .from('user_company_order')
        .insert(orderRecords);

      if (error) {
        
        throw new ApiClientError({
          message: `Failed to update company order: ${error.message}`,
          code: 'COMPANY_ORDER_UPDATE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);

    } catch (error: any) {
      
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'update company order');
    }
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
      
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'update RSVP');
    }
  }

  // Helper method for updating RSVP by event and user
  async updateRSVPByEventAndUser(eventId: string, userId: string, responseStatus: 'accepted' | 'declined' | 'pending', notes?: string): Promise<ApiResponse<UserEventResponse>> {
    try {
      // First check if RSVP exists
      const { data: existingRsvp, error: checkError } = await supabaseService
        .from('user_event_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        
        throw new ApiClientError({
          message: `Failed to check existing RSVP: ${checkError.message}`,
          code: 'RSVP_CHECK_ERROR',
          details: { originalError: checkError }
        });
      }

      // If RSVP exists, update it
      if (existingRsvp) {
        const { data: updatedRsvp, error: updateError } = await supabaseService
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

        if (updateError) {
          
      throw new ApiClientError({
            message: `Failed to update RSVP: ${updateError.message}`,
          code: 'RSVP_UPDATE_ERROR',
            details: { originalError: updateError }
          });
        }

        const userEventResponse: UserEventResponse = {
          id: updatedRsvp.id,
          user_id: updatedRsvp.user_id,
          event_id: updatedRsvp.event_id,
          response_status: updatedRsvp.response_status as 'accepted' | 'declined' | 'pending',
          response_date: new Date(updatedRsvp.response_date),
          notes: updatedRsvp.notes || '',
          created_at: new Date(updatedRsvp.created_at),
          updated_at: new Date(updatedRsvp.updated_at)
        };

        return this.success(userEventResponse);
      } else {
        // If no existing record, create a new one
        return await this.createRSVP({
          user_id: userId,
          event_id: eventId,
          response_status: responseStatus,
          notes: notes
        });
      }

    } catch (error: any) {
      
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
        
        throw new ApiClientError({
          message: `Failed to delete RSVP: ${error.message}`,
          code: 'RSVP_DELETE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);

    } catch (error: any) {
      
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

      // First, delete any subscriptions that have passed their expiration date
      const now = new Date().toISOString();
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      // Then get all remaining active subscriptions
      const { data: subscriptions, error } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
        // Note: Only get active subscriptions since expired ones are deleted

      if (error) {
        
        throw new ApiClientError({
          message: `Failed to get user subscriptions: ${error.message}`,
          code: 'SUBSCRIPTIONS_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      // Convert to proper UserSubscription format
      const userSubscriptions: UserSubscription[] = (subscriptions || []).map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        subsector: sub.subsector,
        gics_subsector: sub.subsector,
        payment_status: (sub.payment_status === 'active' ? 'paid' : sub.payment_status) as 'pending' | 'paid' | 'failed' | 'cancelled',
        subscription_start_date: new Date(sub.created_at),
        subscription_end_date: sub.expires_at ? new Date(sub.expires_at) : null,
        expires_at: sub.expires_at ? new Date(sub.expires_at) : undefined, // Add the missing expires_at field
        is_active: sub.is_active,
        created_at: new Date(sub.created_at),
        updated_at: new Date(sub.updated_at || sub.created_at)
      }));

      return this.success(userSubscriptions);

    } catch (error: any) {
      
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get user subscriptions');
    }
  }

  async createUserSubscription(data: { user_id: string; subsector: string; payment_status?: string; is_active?: boolean }): Promise<ApiResponse<any>> {
    try {
      
      // First, delete any subscriptions that have passed their expiration date
      // Also delete subscriptions with null expiration date (they should have an expiration)
      const now = new Date().toISOString();
      
      // Delete subscriptions with actual expiration dates that have passed
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', data.user_id)
        .eq('is_active', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', now);

      // Also delete subscriptions with null expiration dates (data cleanup)
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', data.user_id)
        .eq('is_active', true)
        .is('expires_at', null);

      // Note: Expired subscriptions are deleted, so we can create new subscriptions freely
      // The database constraint prevents multiple active subscriptions for the same user/subsector
      // Clean approach - no expired subscription clutter in the database
      
      // Simple insert - no duplicates should exist due to UI filtering
      // Always set an expiration date (30 days from now as default)
      const defaultExpirationDate = new Date();
      defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);
      
      const { data: subscription, error } = await supabaseService
        .from('user_subscriptions')
        .insert({
          user_id: data.user_id,
          subsector: data.subsector,
          payment_status: data.payment_status || 'paid', // Default to 'paid' to match filters
          is_active: data.is_active !== false,
          expires_at: defaultExpirationDate.toISOString() // Always set an expiration date
        })
        .select()
        .single();

      if (error) {
        
        throw new ApiClientError({
          message: `Failed to create subscription: ${error.message}`,
          code: 'SUBSCRIPTION_CREATE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(subscription);

    } catch (error: any) {
      
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
        
        throw new ApiClientError({
          message: `Failed to delete subscription: ${error.message}`,
          code: 'SUBSCRIPTION_DELETE_ERROR',
          details: { originalError: error }
        });
      }

      return this.success(null);

    } catch (error: any) {
      
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

  async getUserOrderedCompanies(userId: string): Promise<ApiResponse<Company[]>> {
    try {
      // Get companies with their custom order
      const { data: orderedCompanies, error } = await supabaseService
        .from('user_company_order')
        .select(`
          display_order,
          companies!inner (
            id,
            ticker_symbol,
            company_name,
            gics_sector,
            gics_subsector,
            gics_industry,
            gics_sub_industry,
            is_active,
            classification_status,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) {
        
        throw new ApiClientError({
          message: `Failed to get ordered companies: ${error.message}`,
          code: 'ORDERED_COMPANIES_FETCH_ERROR',
          details: { originalError: error }
        });
      }

      // Transform the data to match Company interface
      const companies: Company[] = (orderedCompanies || [])
        .map((item: any) => ({
          id: item.companies.id,
          ticker_symbol: item.companies.ticker_symbol,
          company_name: item.companies.company_name,
          gics_sector: item.companies.gics_sector,
          gics_subsector: item.companies.gics_subsector,
          gics_industry: item.companies.gics_industry,
          gics_sub_industry: item.companies.gics_sub_industry,
          is_active: item.companies.is_active,
          classification_status: item.companies.classification_status,
          created_at: new Date(item.companies.created_at),
          updated_at: new Date(item.companies.updated_at)
        }));

      return this.success(companies);

    } catch (error: any) {
      
      if (error instanceof ApiClientError) throw error;
      return this.handleSupabaseError(error, 'get ordered companies');
    }
  }

  // =====================================================================================
  // SEARCH METHODS
  // =====================================================================================

  async searchEvents(query: string, params?: { limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<CalendarEvent>>> {
    try {
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;

      // Search events by title and description
      const { data: eventsData, error: eventsError } = await supabaseService
        .from('events')
        .select(`
          *,
          event_hosts(
            id,
            host_type,
            host_id,
            companies_jsonb,
            primary_company_id
          ),
          event_companies(
            companies(
              id,
              company_name,
              ticker_symbol,
              gics_sector,
              gics_subsector,
              is_active
            )
          ),
          user_event_responses(
            response_status,
            response_date,
            notes,
            user_id,
            users(
              id,
              full_name,
              email
            )
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('start_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (eventsError) {
        throw new ApiClientError({
          message: `Failed to search events: ${eventsError.message}`,
          code: 'SEARCH_EVENTS_ERROR',
          details: { originalError: eventsError }
        });
      }

      // Get total count for pagination
      const { count, error: countError } = await supabaseService
        .from('events')
        .select('*', { count: 'exact', head: true })
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true);

      if (countError) {
        throw new ApiClientError({
          message: `Failed to count search results: ${countError.message}`,
          code: 'SEARCH_COUNT_ERROR',
          details: { originalError: countError }
        });
      }

      // Transform events data (reuse existing transformation logic)
      const currentUserResponse = await this.getCurrentUser();
      const userId = currentUserResponse.data.id;

      const events = eventsData?.map((event: any) => {
        const companies = event.event_companies?.map((ec: any) => ec.companies).filter(Boolean) || [];
        const hosts = Array.isArray(event.event_hosts) ? event.event_hosts.map((eh: any) => ({
          id: eh.id,
          event_id: event.id,
          host_type: eh.host_type,
          host_id: eh.host_id,
          host_name: '', // Will be populated when needed
          host_ticker: '', // Will be populated when needed
          host_sector: '', // Will be populated when needed
          host_subsector: '', // Will be populated when needed
          companies_jsonb: eh.companies_jsonb,
          primary_company_id: eh.primary_company_id,
          created_at: new Date(eh.created_at),
          updated_at: new Date(eh.updated_at),
        })) : [];

        const primary_host = hosts.find((h: any) => h.primary_company_id) || hosts[0] || null;
        const userResponse = event.user_event_responses?.find((response: any) => response.user_id === userId);

        const parsedLocation = event.location_details ? {
          displayText: event.location_details.venue || event.location_details.address || 'Location details available',
          fullAddress: event.location_details.address || '',
          isPrimarilyVirtual: event.location_type === 'virtual',
          hasPhysicalComponent: event.location_type === 'physical' || event.location_type === 'hybrid',
          hasVirtualComponent: event.location_type === 'virtual' || event.location_type === 'hybrid',
          meetingUrl: event.virtual_details?.join_url,
          weatherLocation: event.weather_location || event.location_details.city || 'Unknown location'
        } : undefined;

        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          start_date: new Date(event.start_date),
          end_date: new Date(event.end_date),
          location_type: event.location_type as 'physical' | 'virtual' | 'hybrid',
          location_details: event.location_details,
          virtual_details: event.virtual_details,
          weather_location: event.weather_location,
          weather_coordinates: event.weather_coordinates,
          parsed_location: parsedLocation,
          event_type: event.event_type as 'standard' | 'catalyst',
          is_active: event.is_active,
          created_at: new Date(event.created_at),
          updated_at: new Date(event.updated_at),
          companies: companies,
          hostingCompanies: companies,
          hosts: hosts,
          primary_host: primary_host,
          speakers: [],
          agenda: [],
          tags: [],
          access_info: {
            is_free: true,
            registration_required: false,
            registration_link: undefined,
            contact_email: undefined
          },
          rsvpStatus: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
          colorCode: this.getEventColor(userResponse?.response_status || 'pending'),
          isMultiCompany: companies.length > 1,
          attendingCompanies: companies.map((c: any) => c.ticker_symbol),
          attendees: event.user_event_responses?.filter((response: any) => response.response_status === 'accepted').map((response: any) => ({
            user_id: response.user_id,
            full_name: response.users?.full_name || 'Unknown User',
            email: response.users?.email || '',
            response_status: response.response_status,
            response_date: response.response_date ? new Date(response.response_date) : null
          })) || [],
          user_response: userResponse ? {
            id: userResponse.id,
            user_id: userId,
            event_id: event.id,
            response_status: (userResponse.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
            response_date: new Date(userResponse.response_date || new Date()),
            notes: userResponse.notes || '',
            created_at: new Date(userResponse.created_at || new Date()),
            updated_at: new Date(userResponse.updated_at || new Date())
          } : undefined,
          user_rsvp_status: (userResponse?.response_status || 'pending') as 'accepted' | 'declined' | 'pending',
          color_code: this.getEventColor(userResponse?.response_status || 'pending')
        };
      }) || [];

      return this.success({
        data: events,
        total_count: count || 0,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to search events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SEARCH_EVENTS_ERROR',
        details: { originalError: error }
      });
    }
  }

  async searchCompanies(query: string, params?: { limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Company>>> {
    try {
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;

      // Search companies by name and ticker
      const { data: companiesData, error: companiesError } = await supabaseService
        .from('companies')
        .select('*')
        .or(`company_name.ilike.%${query}%,ticker_symbol.ilike.%${query}%`)
        .eq('is_active', true)
        .order('company_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (companiesError) {
        throw new ApiClientError({
          message: `Failed to search companies: ${companiesError.message}`,
          code: 'SEARCH_COMPANIES_ERROR',
          details: { originalError: companiesError }
        });
      }

      // Get total count for pagination
      const { count, error: countError } = await supabaseService
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .or(`company_name.ilike.%${query}%,ticker_symbol.ilike.%${query}%`)
        .eq('is_active', true);

      if (countError) {
        throw new ApiClientError({
          message: `Failed to count company search results: ${countError.message}`,
          code: 'SEARCH_COUNT_ERROR',
          details: { originalError: countError }
        });
      }

      const companies = companiesData?.map((company: any) => ({
        id: company.id,
        ticker_symbol: company.ticker_symbol,
        company_name: company.company_name,
        gics_sector: company.gics_sector,
        gics_subsector: company.gics_subsector,
        gics_industry: company.gics_industry,
        gics_sub_industry: company.gics_sub_industry,
        classification_status: company.classification_status as 'pending' | 'complete',
        is_active: company.is_active,
        created_at: new Date(company.created_at),
        updated_at: new Date(company.updated_at),
        events: [] // Will be populated if needed
      })) || [];

      return this.success({
        data: companies,
        total_count: count || 0,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        message: `Failed to search companies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SEARCH_COMPANIES_ERROR',
        details: { originalError: error }
      });
    }
  }
}

// =====================================================================================
// EXPORTED API CLIENT
// =====================================================================================

// 🎯 Clean Supabase-only implementation
export const apiClient: ApiClient = new SupabaseApiClient();

export { SupabaseApiClient };
