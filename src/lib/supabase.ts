/**
 * Supabase Client Configuration
 * 
 * Initializes the Supabase client with environment variables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set.'
  );
}

// Global singleton instances using window object to persist across hot reloads
const getGlobalSupabase = () => {
  if (typeof window !== 'undefined') {
    if (!(window as any).__agoraSupabase) {
      (window as any).__agoraSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'agora-auth-user', // Unique storage key for user client
          flowType: 'pkce' // Use PKCE flow to prevent multiple instances
        },
        realtime: {
          params: {
            eventsPerSecond: 10, // Enable realtime updates with rate limiting
            reconnect: false   // Disable reconnection attempts
          }
        },
        global: {
          fetch: fetch, // Use standard fetch API
          headers: { 'X-Client-Info': 'agora-web' }
        }
      });
    } else {
      }
    return (window as any).__agoraSupabase;
  }
  // Fallback for SSR
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'agora-auth-service',
      flowType: 'pkce' // Use PKCE flow to prevent multiple instances
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Enable realtime updates with rate limiting
        reconnect: false   // Disable reconnection attempts
      }
    },
    global: {
      fetch: fetch,
      headers: { 'X-Client-Info': 'agora-web' }
    }
  });
};

// Service role client for server-side operations (bypasses RLS)
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const getGlobalSupabaseService = () => {
  if (typeof window !== 'undefined') {
    if (!(window as any).__agoraSupabaseService) {
      (window as any).__agoraSupabaseService = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storageKey: 'agora-auth-service-role' // Different storage key for service client
        },
        realtime: {
          params: {
            eventsPerSecond: 10, // Enable realtime updates with rate limiting
            reconnect: false   // Disable reconnection attempts
          }
        },
        global: {
          fetch: fetch,
          headers: { 'X-Client-Info': 'agora-web-service' }
        }
      });
    } else {
      }
    return (window as any).__agoraSupabaseService;
  }
  // Fallback for SSR
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'agora-auth-service-role-fallback' // Different storage key for fallback service client
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Enable realtime updates with rate limiting
        reconnect: false   // Disable reconnection attempts
      }
    },
    global: {
      fetch: fetch,
      headers: { 'X-Client-Info': 'agora-web-service' }
    }
  });
};

// Export singleton instances
export const supabase = getGlobalSupabase();
export const supabaseService = getGlobalSupabaseService();

// Cleanup function for hot reloading
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Clear instances on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if ((window as any).__agoraSupabase) {
      delete (window as any).__agoraSupabase;
      delete (window as any).__agoraSupabaseService;
    }
  });
}

// Database type definitions for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'investment_analyst' | 'executive_assistant';
          is_active: boolean;
          preferences: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role: 'investment_analyst' | 'executive_assistant';
          is_active?: boolean;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'investment_analyst' | 'executive_assistant';
          is_active?: boolean;
          preferences?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          ticker_symbol: string;
          company_name: string;
          gics_sector: string;
          gics_subsector: string;
          gics_industry: string;
          gics_sub_industry: string;
          classification_status: 'pending' | 'complete';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticker_symbol: string;
          company_name: string;
          gics_sector: string;
          gics_subsector: string;
          gics_industry: string;
          gics_sub_industry: string;
          classification_status?: 'pending' | 'complete';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticker_symbol?: string;
          company_name?: string;
          gics_sector?: string;
          gics_subsector?: string;
          gics_industry?: string;
          gics_sub_industry?: string;
          classification_status?: 'pending' | 'complete';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          location_type: 'physical' | 'virtual' | 'hybrid';
          location_details: Record<string, any> | null;
          virtual_details: Record<string, any> | null;
          weather_location: string | null;
          event_type: 'standard' | 'catalyst';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          location_type: 'physical' | 'virtual' | 'hybrid';
          location_details?: Record<string, any> | null;
          virtual_details?: Record<string, any> | null;
          weather_location?: string | null;
          event_type?: 'standard' | 'catalyst';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          location_type?: 'physical' | 'virtual' | 'hybrid';
          location_details?: Record<string, any> | null;
          virtual_details?: Record<string, any> | null;
          weather_location?: string | null;
          event_type?: 'standard' | 'catalyst';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_companies: {
        Row: {
          id: string;
          event_id: string;
          company_id: string;
          attendance_status: 'attending' | 'not_attending' | 'tentative';
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          company_id: string;
          attendance_status?: 'attending' | 'not_attending' | 'tentative';
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          company_id?: string;
          attendance_status?: 'attending' | 'not_attending' | 'tentative';
          created_at?: string;
        };
      };
      user_event_responses: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          response_status: 'accepted' | 'declined' | 'pending';
          response_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          response_status: 'accepted' | 'declined' | 'pending';
          response_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          response_status?: 'accepted' | 'declined' | 'pending';
          response_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subsector: string;
          payment_status: 'pending' | 'paid' | 'failed' | 'canceled';
          is_active: boolean;
          expires_at: string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subsector: string;
          payment_status?: 'pending' | 'paid' | 'failed' | 'canceled';
          is_active?: boolean;
          expires_at?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subsector?: string;
          payment_status?: 'pending' | 'paid' | 'failed' | 'canceled';
          is_active?: boolean;
          expires_at?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      executive_assistant_assignments: {
        Row: {
          id: string;
          assistant_id: string;
          user_id: string;
          permissions: Record<string, any>;
          assignment_type: 'permanent' | 'temporary';
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assistant_id: string;
          user_id: string;
          permissions: Record<string, any>;
          assignment_type?: 'permanent' | 'temporary';
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assistant_id?: string;
          user_id?: string;
          permissions?: Record<string, any>;
          assignment_type?: 'permanent' | 'temporary';
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_company_order: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
