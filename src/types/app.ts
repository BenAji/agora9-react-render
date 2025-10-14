/**
 * App-specific type definitions
 * Separated from database types for better maintainability
 */

import { CalendarEvent, CompanyWithEvents, UserWithSubscriptions } from './database';

export interface AppState {
  currentDate: Date;
  calendarView: 'week' | 'month';
  eventFilter: 'all' | 'my';
  events: CalendarEvent[];
  companies: CompanyWithEvents[];
  selectedEvent: CalendarEvent | null;
  selectedCompany: CompanyWithEvents | null;
  showProfileDropdown: boolean;
  currentUser: UserWithSubscriptions | null;
  subscriptionCount: number;
  showEventsDropdown: boolean;
  showFiltersDropdown: boolean;
  showViewDropdown: boolean;
  isReordering: boolean;
  showNotificationsDrawer: boolean;
  companyCalendarModal: {
    isOpen: boolean;
    currentMonth: Date;
  };
  // Page navigation
  currentPage: 'calendar' | 'events' | 'subscriptions';
  showUserProfile: boolean;
  // Filter states
  searchQuery: string;
  eventTypeFilter: 'all' | 'standard' | 'catalyst';
  locationTypeFilter: 'all' | 'physical' | 'virtual' | 'hybrid';
  rsvpStatusFilter: 'all' | 'accepted' | 'declined' | 'pending';
  // Executive assistant features
  isExecutiveAssistant: boolean;
  managedUsers: UserWithSubscriptions[];
  selectedManagedUser: UserWithSubscriptions | null;
}

// DragEndEvent type removed - DnD functionality not used in production

export interface EventBadge {
  type: 'host' | 'multi' | 'attend';
  label: string;
  icon: string;
}

export interface CompanyOrderUpdate {
  user_id: string;
  company_orders: Array<{
    company_id: string;
    display_order: number;
  }>;
}
