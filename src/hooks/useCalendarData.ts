/**
 * AGORA Calendar Data Hook
 * 
 * PHASE 4, STEP 4.1: API Integration
 * Dependencies: apiClient.ts
 * Purpose: Real-time API data fetching with error handling
 * 
 * SAFETY: Robust error handling and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { CompanyRow } from '../types/calendar';
import { CalendarEvent } from '../types/database';
import { apiClient } from '../utils/apiClient';
import { supabase } from '../lib/supabase';
import { parseEventLocation } from '../utils/locationUtils';

interface UseCalendarDataOptions {
  enableRealtime?: boolean;
}

interface CalendarDataState {
  companies: CompanyRow[];
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

interface CalendarDataActions {
  refreshData: () => Promise<void>;
  updateRSVP: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
  updateCompanyOrder: (companyOrders: Array<{ company_id: string; display_order: number }>) => Promise<void>;
}

export const useCalendarData = (
  options: UseCalendarDataOptions = {}
): CalendarDataState & CalendarDataActions => {
  const { enableRealtime = false } = options;

  const [state, setState] = useState<CalendarDataState>({
    companies: [],
    events: [],
    loading: true,
    error: null
  });

  // Load real API data
  const loadApiData = useCallback(async (): Promise<CalendarDataState> => {
    // Loading real API data
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Safety check for apiClient
      if (!apiClient) {
        throw new Error('API client is not initialized');
      }

      // Load companies and events in parallel
      const [companiesResponse, eventsResponse] = await Promise.all([
        apiClient.getSubscribedCompanies(),
        apiClient.getEvents()
      ]);

      if (!companiesResponse.success || !eventsResponse.success) {
        throw new Error('Failed to load data from API');
      }

      // Map API response to expected types
      const apiCompanies = companiesResponse.data || [];
      const apiEvents = eventsResponse.data?.events || [];

      // Map Company[] to CompanyRow[]
      const companies: CompanyRow[] = apiCompanies.map((company: any) => ({
        id: company.id,
        ticker_symbol: company.ticker_symbol,
        company_name: company.company_name,
        order: company.order || 0,
        isSubscribed: true,
        subscriptionStatus: 'active' as const,
        gics_sector: company.gics_sector || 'Unknown',
        gics_subsector: company.gics_subsector || 'Unknown',
        eventCount: 0 // Will be calculated from events
      }));

      // Map CalendarEvent[] to CalendarEvent[]
      const events: CalendarEvent[] = apiEvents.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        location_type: event.location_type || 'virtual',
        location_details: event.location_details || {},
        virtual_details: event.virtual_details || {},
        weather_location: event.weather_location,
        weather_coordinates: event.weather_coordinates,
        event_type: event.event_type || 'standard',
        created_at: new Date(event.created_at),
        updated_at: new Date(event.updated_at),
        is_active: event.is_active,
        companies: event.companies || [],
        hosts: event.hosts || [],
        primary_host: event.primary_host,
        user_response: event.user_response,
        color_code: event.color_code || (event.user_rsvp_status === 'accepted' ? 'green' : 
                  event.user_rsvp_status === 'declined' ? 'yellow' : 'grey'),
        parsed_location: event.parsed_location || parseEventLocation(
          event.location_type || 'virtual',
          event.location_details,
          event.virtual_details,
          event.weather_location
        ),
        user_rsvp_status: event.user_rsvp_status || event.user_response?.response_status || 'pending',
        rsvpStatus: event.user_rsvp_status || event.user_response?.response_status || 'pending',
        isMultiCompany: (event.companies?.length || 0) > 1,
        attendingCompanies: event.companies?.map((c: any) => c.id) || [],
        attendees: event.attendees || []
      }));

      // Update company event counts
      companies.forEach(company => {
        company.eventCount = events.filter(event => 
          event.companies.some(ec => ec.id === company.id)
        ).length;
      });

      // Data loaded successfully

      return {
        companies,
        events,
        loading: false,
        error: null
      };
    } catch (error) {
      
      return {
        companies: [],
        events: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      };
    }
  }, []);

  // Load data function
  const loadData = useCallback(async () => {
    const newState = await loadApiData();
    setState(newState);
  }, [loadApiData]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Update RSVP function
  const updateRSVP = useCallback(async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Optimistic update
      setState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                rsvpStatus: status,
                colorCode: status === 'accepted' ? 'green' : 
                          status === 'declined' ? 'yellow' : 'grey'
              }
            : event
        ),
        loading: false
      }));

      // Make API call - we need to get the current user first
      const currentUserResponse = await apiClient.getCurrentUser();
      if (!currentUserResponse.success) {
        throw new Error('Failed to get current user');
      }
      
      const response = await apiClient.updateRSVPByEventAndUser(
        eventId, 
        currentUserResponse.data.id, 
        status
      );
      
      if (!response.success) {
        throw new Error('Failed to update RSVP');
      }

      // Optimistic update is sufficient - no need to refresh all data
    } catch (error) {
      
      // Revert optimistic update on failure
      await refreshData();
    }
  }, [refreshData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time updates
  useEffect(() => {
    if (enableRealtime) {
      // Setting up real-time updates
      
      // Import Supabase client for real-time updates
      import('../lib/supabase').then(({ supabase }) => {
        // Subscribe to events table changes
        const eventsSubscription = supabase
          .channel('events-changes')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'events' 
            }, 
            (payload: any) => {
              // Refresh data when events change
              loadData();
            }
          )
          .subscribe();

        // Subscribe to user_event_responses table changes
        const rsvpSubscription = supabase
          .channel('rsvp-changes')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_event_responses' 
            }, 
            (payload: any) => {
              // Refresh data when RSVP changes
              loadData();
            }
          )
          .subscribe();

        // Subscribe to user_subscriptions table changes - CRITICAL for company visibility
        const subscriptionSubscription = supabase
          .channel('subscription-changes')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_subscriptions' 
            }, 
            (payload: any) => {
              // Refresh data when subscriptions change (subscribe/unsubscribe)
              loadData();
            }
          )
          .subscribe();

        return () => {
          eventsSubscription.unsubscribe();
          rsvpSubscription.unsubscribe();
          subscriptionSubscription.unsubscribe();
        };
      });
    }
  }, [enableRealtime, loadData]);

  // Update company order in database
  const updateCompanyOrder = useCallback(async (companyOrders: Array<{ company_id: string; display_order: number }>) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Call API to update company order
      const response = await apiClient.updateCompanyOrder({
        user_id: user.id,
        company_orders: companyOrders
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update company order');
      }

      } catch (error) {
      
      throw error;
    }
  }, []);

  return {
    ...state,
    refreshData,
    updateRSVP,
    updateCompanyOrder
  };
};
