/**
 * AGORA Calendar Data Hook
 * 
 * PHASE 4, STEP 4.1: API Integration with Mock Data Fallbacks
 * Dependencies: apiClient.ts, mockCalendarData.ts
 * Purpose: API integration with graceful degradation
 * 
 * SAFETY: Always falls back to mock data on API failure
 */

import { useState, useEffect, useCallback } from 'react';
import { CompanyRow, CalendarState } from '../types/calendar';
import { CalendarEvent } from '../types/database';
import { 
  getMockEvents, 
  getMockCompanies, 
  getMockCalendarState 
} from '../__mocks__/mockCalendarData';
import { apiClient } from '../utils/apiClient';

interface UseCalendarDataOptions {
  useMockData?: boolean;
  enableRealtime?: boolean;
}

interface CalendarDataState {
  companies: CompanyRow[];
  events: CalendarEvent[];
  calendarState: CalendarState;
  loading: boolean;
  error: string | null;
  isUsingMockData: boolean;
}

interface CalendarDataActions {
  refreshData: () => Promise<void>;
  toggleMockMode: () => void;
  updateRSVP: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
}

export const useCalendarData = (
  options: UseCalendarDataOptions = {}
): CalendarDataState & CalendarDataActions => {
  const { 
    useMockData = process.env.NODE_ENV === 'development', 
    enableRealtime = false 
  } = options;

  const [state, setState] = useState<CalendarDataState>({
    companies: [],
    events: [],
    calendarState: getMockCalendarState(),
    loading: true,
    error: null,
    isUsingMockData: useMockData
  });

  // Load mock data as fallback
  const loadMockData = useCallback(async (): Promise<CalendarDataState> => {
    console.log('📦 Loading mock calendar data...');
    
    try {
      const mockCompanies = getMockCompanies();
      const mockEvents = getMockEvents();
      const mockCalendarState = getMockCalendarState();

      return {
        companies: mockCompanies,
        events: mockEvents as any as CalendarEvent[],
        calendarState: mockCalendarState,
        loading: false,
        error: null,
        isUsingMockData: true
      };
    } catch (error) {
      console.error('❌ Error loading mock data:', error);
      return {
        companies: [],
        events: [],
        calendarState: getMockCalendarState(),
        loading: false,
        error: 'Failed to load mock data',
        isUsingMockData: true
      };
    }
  }, []);

  // Load real API data with fallback
  const loadApiData = useCallback(async (): Promise<CalendarDataState> => {
    console.log('🌐 Attempting to load real API data...');
    
    try {
      // Attempt to load companies
      let companies: CompanyRow[] = [];
      try {
        const companiesResponse = await apiClient.getSubscribedCompanies();
        if (companiesResponse.success && companiesResponse.data) {
          companies = companiesResponse.data.map((company: any) => ({
          id: company.id,
          ticker_symbol: company.ticker_symbol,
          company_name: company.company_name,
          order: company.order || 0,
          isSubscribed: true, // Assume subscribed if in user's list
          subscriptionStatus: 'active' as const,
            gics_sector: company.gics_sector || 'Unknown',
            gics_subsector: company.gics_subsector || 'Unknown',
            eventCount: 0 // Will be calculated from events
          }));
        }
        console.log('✅ Companies loaded from API:', companies.length);
      } catch (companyError) {
        console.warn('⚠️ Company API failed, using mock companies:', companyError);
        companies = getMockCompanies();
      }

      // Attempt to load events
      let events: CalendarEvent[] = [];
      try {
        const eventsResponse = await apiClient.getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          events = eventsResponse.data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description || '',
          start_date: new Date(event.start_date),
          end_date: new Date(event.end_date),
          location_type: event.location_type || 'virtual',
          location: event.location || '',
          location_details: event.location_details || {},
          virtual_details: event.virtual_details || {},
          weather_location: event.weather_location || event.location || '',
          weather_coordinates: event.weather_coordinates,
          event_type: event.event_type || 'standard',
          created_at: new Date(event.created_at),
          updated_at: new Date(event.updated_at),
          is_active: event.is_active !== undefined ? event.is_active : true,
          companies: event.companies || companies.filter((c: any) => 
            event.company_ids?.includes(c.id)
          ),
          hosts: event.hosts || [],
          primary_host: event.primary_host,
          user_response: event.user_response,
          color_code: event.color_code || (event.user_rsvp_status === 'accepted' ? 'green' : 
                    event.user_rsvp_status === 'declined' ? 'yellow' : 'grey'),
          rsvpStatus: event.user_rsvp_status || 'pending',
          isMultiCompany: (event.companies?.length || 0) > 1,
          attendingCompanies: event.companies?.map((c: any) => c.id) || [],
          attendees: event.attendees || []
          }));
        }
        console.log('✅ Events loaded from API:', events.length);
      } catch (eventError) {
        console.warn('⚠️ Events API failed, using mock events:', eventError);
        events = getMockEvents() as any as CalendarEvent[];
      }

      // Update company event counts
      companies.forEach(company => {
        company.eventCount = events.filter(event => 
          event.companies.some((ec: any) => ec.id === company.id)
        ).length;
      });

      // Create calendar state with EventCell format
      const eventCells = events.map(event => ({
        id: `cell-${event.id}`,
        event: event,
        rsvpStatus: event.rsvpStatus || 'pending',
        colorCode: event.color_code,
        isMultiCompany: event.isMultiCompany || false,
        attendingCompanies: event.attendingCompanies || [],
        position: {
          companyRowId: event.companies[0]?.id || '',
          date: event.start_date,
          startTime: event.start_date.toTimeString().slice(0, 5),
          endTime: event.end_date.toTimeString().slice(0, 5)
        }
      }));

      const calendarState: CalendarState = {
        companies: companies,
        events: eventCells,
        selectedDate: new Date(),
        dateRange: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        viewMode: {
          type: 'company_rows',
          eventFilter: 'all_events'
        },
        searchQuery: '',
        loading: false,
        error: null
      };

      return {
        companies,
        events,
        calendarState,
        loading: false,
        error: null,
        isUsingMockData: false
      };

    } catch (error) {
      console.error('❌ API data loading failed completely, falling back to mock data:', error);
      return await loadMockData();
    }
  }, [loadMockData]);

  // Main data loading function
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newState = state.isUsingMockData ? 
        await loadMockData() : 
        await loadApiData();
      
      setState(newState);
    } catch (error) {
      console.error('💥 Critical error loading calendar data:', error);
      const fallbackState = await loadMockData();
      setState({
        ...fallbackState,
        error: 'Failed to load calendar data, using offline mode'
      });
    }
  }, [state.isUsingMockData, loadMockData, loadApiData]);

  // Refresh data
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing calendar data...');
    await loadData();
  }, [loadData]);

  // Toggle between mock and API data
  const toggleMockMode = useCallback(() => {
    console.log('🔀 Toggling data mode...');
    setState(prev => ({
      ...prev,
      isUsingMockData: !prev.isUsingMockData,
      loading: true
    }));
  }, []);

  // Update RSVP status
  const updateRSVP = useCallback(async (
    eventId: string, 
    status: 'accepted' | 'declined' | 'pending'
  ) => {
    console.log(`📝 Updating RSVP for event ${eventId} to ${status}`);
    
    try {
      if (!state.isUsingMockData) {
        // Try to update via API
        // const { createRSVP, updateRSVP } = await import('../utils/apiClient');
        // await updateRSVP(eventId, status);
        console.log('🌐 RSVP API call would happen here');
      }

      // Update local state immediately for better UX
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
        calendarState: {
          ...prev.calendarState,
          events: prev.calendarState.events.map(event => 
            event.id === eventId 
              ? {
                  ...event,
                  rsvpStatus: status,
                  colorCode: status === 'accepted' ? 'green' : 
                            status === 'declined' ? 'yellow' : 'grey'
                }
              : event
          )
        }
      }));

    } catch (error) {
      console.error('❌ Failed to update RSVP:', error);
      // Revert optimistic update on failure
      await refreshData();
    }
  }, [state.isUsingMockData, refreshData]);

  // Load data on mount and when mock mode changes
  useEffect(() => {
    loadData();
  }, [state.isUsingMockData]);

  // Optional: Set up real-time updates
  useEffect(() => {
    if (enableRealtime && !state.isUsingMockData) {
      console.log('🔄 Setting up real-time updates...');
      
      // Import Supabase client for real-time updates
      import('../lib/supabase').then(({ supabase }) => {
        // Subscribe to events table changes
        const eventsSubscription = supabase
          .channel('calendar_events')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'events' 
            }, 
            (payload: any) => {
              console.log('🔄 Event change received:', payload);
              // Refresh data when events change
              loadData();
            }
          )
          .subscribe();

        // Subscribe to user_event_responses table changes
        const rsvpSubscription = supabase
          .channel('calendar_rsvp')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'user_event_responses' 
            }, 
            (payload: any) => {
              console.log('🔄 RSVP change received:', payload);
              // Refresh data when RSVP changes
              loadData();
            }
          )
          .subscribe();

        return () => {
          console.log('🔄 Cleaning up real-time updates...');
          eventsSubscription.unsubscribe();
          rsvpSubscription.unsubscribe();
        };
      });
    }
  }, [enableRealtime, state.isUsingMockData, loadData]);

  return {
    companies: state.companies,
    events: state.events,
    calendarState: state.calendarState,
    loading: state.loading,
    error: state.error,
    isUsingMockData: state.isUsingMockData,
    refreshData,
    toggleMockMode,
    updateRSVP
  };
};

export default useCalendarData;
