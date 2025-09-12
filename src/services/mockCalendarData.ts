/**
 * AGORA Calendar Mock Data Service
 * 
 * PHASE 1, STEP 1.2: Mock Data Service
 * Dependencies: calendar.ts types only
 * Purpose: Hardcoded data for development
 * 
 * SAFETY: No external dependencies, no API calls, pure functions
 */

import {
  CompanyRow,
  CalendarEventData,
  EventCell,
  MiniCalendarDay,
  WeatherForecast,
  EventAttendee,
  EventSpeaker,
  CalendarState,
  CalendarViewMode,
  EventDetailsState,
  MiniCalendarState,
  WeatherForecastState,
  CALENDAR_CONSTANTS
} from '../types/calendar';

// =====================================================================================
// MOCK COMPANIES DATA
// =====================================================================================

export const getMockCompanies = (): CompanyRow[] => {
  return [
    {
      id: 'company-1',
      ticker_symbol: 'AAPL',
      company_name: 'Apple Inc.',
      gics_sector: 'Information Technology',
      gics_subsector: 'Technology Hardware & Equipment',
      order: 1,
      isSubscribed: true,
      subscriptionStatus: 'active',
      eventCount: 3
    },
    {
      id: 'company-2',
      ticker_symbol: 'TSLA',
      company_name: 'Tesla Inc.',
      gics_subsector: 'Automobiles & Components',
      gics_sector: 'Consumer Discretionary',
      order: 2,
      isSubscribed: true,
      subscriptionStatus: 'active',
      eventCount: 2
    },
    {
      id: 'company-3',
      ticker_symbol: 'MSFT',
      company_name: 'Microsoft Corp.',
      gics_sector: 'Information Technology',
      gics_subsector: 'Software & Services',
      order: 3,
      isSubscribed: true,
      subscriptionStatus: 'active',
      eventCount: 4
    },
    {
      id: 'company-4',
      ticker_symbol: 'GOOGL',
      company_name: 'Alphabet Inc.',
      gics_sector: 'Information Technology',
      gics_subsector: 'Software & Services',
      order: 4,
      isSubscribed: true,
      subscriptionStatus: 'active',
      eventCount: 2
    },
    {
      id: 'company-5',
      ticker_symbol: 'NVDA',
      company_name: 'NVIDIA Corp.',
      gics_sector: 'Information Technology',
      gics_subsector: 'Semiconductors',
      order: 5,
      isSubscribed: false,
      subscriptionStatus: 'none',
      eventCount: 0
    },
    {
      id: 'company-6',
      ticker_symbol: 'JPM',
      company_name: 'JPMorgan Chase & Co.',
      gics_sector: 'Financials',
      gics_subsector: 'Banks',
      order: 6,
      isSubscribed: true,
      subscriptionStatus: 'expired',
      eventCount: 1
    }
  ];
};

// =====================================================================================
// MOCK EVENTS DATA
// =====================================================================================

export const getMockEvents = (): CalendarEventData[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  // Get companies data for event references
  const companies = getMockCompanies();

  return [
    {
      id: 'event-1',
      title: 'Q4 2024 Earnings Call',
      description: 'Apple Inc. will announce Q4 2024 financial results and provide forward guidance.',
      start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 8, 30),
      end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 30),
      location_type: 'virtual',
      location: 'Virtual Event',
      location_details: {},
      virtual_details: {
        meeting_link: 'https://apple.com/investor-relations/earnings-call',
        dial_in: '+1-888-555-0123',
        meeting_id: 'AAPL-Q4-2024'
      },
      event_type: 'standard',
      speakers: [
        {
          name: 'Tim Cook',
          title: 'Chief Executive Officer',
          company: 'Apple Inc.',
          bio: 'CEO of Apple Inc. since 2011'
        },
        {
          name: 'Luca Maestri',
          title: 'Chief Financial Officer',
          company: 'Apple Inc.',
          bio: 'CFO of Apple Inc. since 2014'
        }
      ],
      agenda: [
        'Financial Results Overview',
        'Product Performance Review',
        'Forward Guidance',
        'Q&A Session'
      ],
      tags: ['Earnings', 'Q4', 'Technology', 'Results'],
      access_info: {
        is_free: true,
        registration_required: false,
        contact_email: 'investor.relations@apple.com'
      },
      weather_location: 'Cupertino, CA',
      // Added properties for event display
      companies: [companies[0]], // AAPL
      rsvpStatus: 'accepted',
      colorCode: 'green',
      isMultiCompany: false,
      attendingCompanies: ['AAPL'],
      attendees: [
        { 
          id: 'attendee-1',
          name: 'John Doe', 
          title: 'Senior Analyst', 
          company: 'Goldman Sachs',
          email: 'john.doe@goldmansachs.com',
          rsvp_status: 'accepted',
          response_date: new Date()
        },
        { 
          id: 'attendee-2',
          name: 'Jane Smith', 
          title: 'Portfolio Manager', 
          company: 'BlackRock',
          email: 'jane.smith@blackrock.com',
          rsvp_status: 'accepted',
          response_date: new Date()
        }
      ]
    },
    {
      id: 'event-2',
      title: 'Tesla AI Day 2024',
      description: 'Tesla showcases latest developments in artificial intelligence and autonomous driving.',
      start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0),
      end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 0),
      location_type: 'hybrid',
      location: 'Tesla Gigafactory, Austin, TX',
      location_details: {
        address: '1 Tesla Road, Austin, TX 78725',
        building: 'Gigafactory Texas',
        room: 'Main Auditorium'
      },
      virtual_details: {
        meeting_link: 'https://tesla.com/ai-day-2024',
        meeting_id: 'TSLA-AI-DAY-2024'
      },
      event_type: 'catalyst',
      speakers: [
        {
          name: 'Elon Musk',
          title: 'Chief Executive Officer',
          company: 'Tesla Inc.',
          bio: 'CEO and Product Architect of Tesla'
        },
        {
          name: 'Andrej Karpathy',
          title: 'Director of AI',
          company: 'Tesla Inc.',
          bio: 'Leading Tesla\'s AI and Autopilot development'
        }
      ],
      agenda: [
        'Full Self-Driving Updates',
        'Neural Network Architecture',
        'Dojo Supercomputer Progress',
        'Optimus Robot Demonstration'
      ],
      tags: ['AI', 'Autonomous', 'Technology', 'Innovation'],
      access_info: {
        is_free: false,
        registration_required: true,
        registration_link: 'https://tesla.com/ai-day-registration',
        contact_email: 'events@tesla.com'
      },
      weather_location: 'Austin, TX',
      // Added properties for event display
      companies: [companies[1]], // TSLA
      rsvpStatus: 'pending',
      colorCode: 'grey',
      isMultiCompany: false,
      attendingCompanies: ['TSLA'],
      attendees: [
        { 
          id: 'attendee-3',
          name: 'Mike Johnson', 
          title: 'AI Researcher', 
          company: 'OpenAI',
          email: 'mike.johnson@openai.com',
          rsvp_status: 'pending',
          response_date: new Date()
        },
        { 
          id: 'attendee-4',
          name: 'Sarah Wilson', 
          title: 'Tech Analyst', 
          company: 'Morgan Stanley',
          email: 'sarah.wilson@morganstanley.com',
          rsvp_status: 'pending',
          response_date: new Date()
        }
      ]
    },
    {
      id: 'event-3',
      title: 'Microsoft Build 2024',
      description: 'Annual developer conference showcasing Microsoft\'s latest technologies and platforms.',
      start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 0),
      end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 17, 0),
      location_type: 'hybrid',
      location: 'Meydenbauer Center, Bellevue, WA',
      location_details: {
        address: '777 106th Ave NE, Bellevue, WA 98004',
        building: 'Meydenbauer Center',
        room: 'Main Theater'
      },
      virtual_details: {
        meeting_link: 'https://build.microsoft.com/2024',
        meeting_id: 'MSFT-BUILD-2024'
      },
      event_type: 'standard',
      speakers: [
        {
          name: 'Satya Nadella',
          title: 'Chief Executive Officer',
          company: 'Microsoft Corp.',
          bio: 'CEO of Microsoft since 2014'
        },
        {
          name: 'Scott Guthrie',
          title: 'Executive Vice President',
          company: 'Microsoft Corp.',
          bio: 'EVP of Cloud + AI Group'
        }
      ],
      agenda: [
        'Azure AI and Copilot Updates',
        'Developer Tools and Platforms',
        'Cloud Infrastructure Advances',
        'Partner Ecosystem Showcase'
      ],
      tags: ['Developer', 'Cloud', 'AI', 'Platform'],
      access_info: {
        is_free: true,
        registration_required: true,
        registration_link: 'https://build.microsoft.com/register',
        contact_email: 'build@microsoft.com'
      },
      weather_location: 'Bellevue, WA',
      // Added properties for event display
      companies: [companies[2]], // MSFT
      rsvpStatus: 'declined',
      colorCode: 'yellow',
      isMultiCompany: false,
      attendingCompanies: ['MSFT'],
      attendees: [
        { 
          id: 'attendee-5',
          name: 'Alex Chen', 
          title: 'Senior Developer', 
          company: 'GitHub',
          email: 'alex.chen@github.com',
          rsvp_status: 'declined',
          response_date: new Date()
        },
        { 
          id: 'attendee-6',
          name: 'Lisa Brown', 
          title: 'Cloud Architect', 
          company: 'AWS',
          email: 'lisa.brown@aws.com',
          rsvp_status: 'declined',
          response_date: new Date()
        }
      ]
    },
    {
      id: 'event-4',
      title: 'Google I/O 2024',
      description: 'Google\'s annual developer conference featuring the latest in AI, Android, and web technologies.',
      start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 10, 0),
      end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 16, 0),
      location_type: 'physical',
      location: 'Shoreline Amphitheatre, Mountain View, CA',
      location_details: {
        address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
        building: 'Shoreline Amphitheatre',
        room: 'Main Stage'
      },
      virtual_details: {},
      event_type: 'catalyst',
      speakers: [
        {
          name: 'Sundar Pichai',
          title: 'Chief Executive Officer',
          company: 'Alphabet Inc.',
          bio: 'CEO of Alphabet and Google'
        },
        {
          name: 'Demis Hassabis',
          title: 'CEO of DeepMind',
          company: 'Alphabet Inc.',
          bio: 'Leading Google\'s AI research efforts'
        }
      ],
      agenda: [
        'Android 15 and New Features',
        'Gemini AI Model Updates',
        'Search and Assistant Evolution',
        'Developer Tools and APIs'
      ],
      tags: ['Developer', 'Android', 'AI', 'Search'],
      access_info: {
        is_free: false,
        registration_required: true,
        registration_link: 'https://io.google.com/2024',
        contact_email: 'io-support@google.com'
      },
      weather_location: 'Mountain View, CA',
      // Added properties for event display
      companies: [companies[3]], // GOOGL
      rsvpStatus: 'accepted',
      colorCode: 'green',
      isMultiCompany: false,
      attendingCompanies: ['GOOGL'],
      attendees: [
        { 
          id: 'attendee-7',
          name: 'David Kim', 
          title: 'AI Engineer', 
          company: 'DeepMind',
          email: 'david.kim@deepmind.com',
          rsvp_status: 'accepted',
          response_date: new Date()
        },
        { 
          id: 'attendee-8',
          name: 'Emma Davis', 
          title: 'Product Manager', 
          company: 'Google',
          email: 'emma.davis@google.com',
          rsvp_status: 'accepted',
          response_date: new Date()
        }
      ]
    }
  ];
};

// =====================================================================================
// MOCK EVENT CELLS DATA
// =====================================================================================

export const getMockEventCells = (): EventCell[] => {
  const events = getMockEvents();
  const companies = getMockCompanies();

  return [
    {
      id: 'cell-1',
      event: events[0], // Apple Earnings
      rsvpStatus: 'accepted',
      colorCode: 'green',
      isMultiCompany: false,
      attendingCompanies: ['AAPL'],
      position: {
        companyRowId: 'company-1',
        date: events[0].start_date,
        startTime: '8:30 AM',
        endTime: '9:30 AM'
      }
    },
    {
      id: 'cell-2',
      event: events[1], // Tesla AI Day
      rsvpStatus: 'pending',
      colorCode: 'grey',
      isMultiCompany: false,
      attendingCompanies: ['TSLA'],
      position: {
        companyRowId: 'company-2',
        date: events[1].start_date,
        startTime: '2:00 PM',
        endTime: '5:00 PM'
      }
    },
    {
      id: 'cell-3',
      event: events[2], // Microsoft Build
      rsvpStatus: 'declined',
      colorCode: 'yellow',
      isMultiCompany: true,
      attendingCompanies: ['MSFT', 'GOOGL'],
      position: {
        companyRowId: 'company-3',
        date: events[2].start_date,
        startTime: '9:00 AM',
        endTime: '5:00 PM'
      }
    },
    {
      id: 'cell-4',
      event: events[2], // Microsoft Build (multi-company)
      rsvpStatus: 'declined',
      colorCode: 'yellow',
      isMultiCompany: true,
      attendingCompanies: ['MSFT', 'GOOGL'],
      position: {
        companyRowId: 'company-4',
        date: events[2].start_date,
        startTime: '9:00 AM',
        endTime: '5:00 PM'
      }
    },
    {
      id: 'cell-5',
      event: events[3], // Google I/O
      rsvpStatus: 'accepted',
      colorCode: 'green',
      isMultiCompany: false,
      attendingCompanies: ['GOOGL'],
      position: {
        companyRowId: 'company-4',
        date: events[3].start_date,
        startTime: '10:00 AM',
        endTime: '4:00 PM'
      }
    }
  ];
};

// =====================================================================================
// MOCK WEATHER FORECAST DATA
// =====================================================================================

export const getMockWeatherForecast = (eventDate: Date): WeatherForecast[] => {
  const forecasts: WeatherForecast[] = [];
  
  // Generate 3 days prior to event + event day
  for (let i = 3; i >= 0; i--) {
    const date = new Date(eventDate);
    date.setDate(eventDate.getDate() - i);
    
    const isEventDay = i === 0;
    
    forecasts.push({
      date: date,
      temperature: {
        high: 70 + Math.floor(Math.random() * 15),
        low: 55 + Math.floor(Math.random() * 10),
        current: 65 + Math.floor(Math.random() * 10),
        unit: 'F'
      },
      condition: isEventDay ? 'Sunny' : ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      conditionCode: isEventDay ? 'clear' : 'partly-cloudy',
      icon: isEventDay ? '☀️' : ['⛅', '☀️', '☁️', '🌦️'][Math.floor(Math.random() * 4)],
      humidity: 40 + Math.floor(Math.random() * 30),
      windSpeed: 5 + Math.floor(Math.random() * 10),
      isEventDay: isEventDay,
      location: 'Cupertino, CA',
      timezone: 'PST (GMT-8)'
    });
  }
  
  return forecasts;
};

// =====================================================================================
// MOCK ATTENDEES DATA
// =====================================================================================

export const getMockAttendees = (eventId: string): EventAttendee[] => {
  const baseAttendees = [
    {
      id: 'attendee-1',
      name: 'John Smith',
      title: 'Senior Investment Analyst',
      company: 'Goldman Sachs',
      email: 'john.smith@gs.com',
      rsvp_status: 'accepted' as const,
      response_date: new Date(),
      notes: 'Looking forward to the earnings discussion'
    },
    {
      id: 'attendee-2',
      name: 'Sarah Johnson',
      title: 'Portfolio Manager',
      company: 'Morgan Stanley',
      rsvp_status: 'accepted' as const,
      response_date: new Date(),
      notes: ''
    },
    {
      id: 'attendee-3',
      name: 'Mike Chen',
      title: 'Research Director',
      company: 'JPMorgan Chase',
      rsvp_status: 'pending' as const,
      response_date: new Date(),
      notes: 'Need to check calendar conflicts'
    },
    {
      id: 'attendee-4',
      name: 'Emily Rodriguez',
      title: 'Investment Strategist',
      company: 'BlackRock',
      rsvp_status: 'accepted' as const,
      response_date: new Date(),
      notes: 'Interested in AI developments'
    },
    {
      id: 'attendee-5',
      name: 'David Kim',
      title: 'Technology Analyst',
      company: 'Fidelity Investments',
      rsvp_status: 'declined' as const,
      response_date: new Date(),
      notes: 'Schedule conflict with client meeting'
    }
  ];

  // Return different attendees based on event
  return baseAttendees.slice(0, 3 + Math.floor(Math.random() * 3));
};

// =====================================================================================
// MOCK MINI CALENDAR DATA
// =====================================================================================

export const getMockMiniCalendarDays = (currentMonth: Date): MiniCalendarDay[] => {
  const days: MiniCalendarDay[] = [];
  const today = new Date();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Add days from previous month to fill the first week
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Generate 42 days (6 weeks) for the calendar
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isToday = date.toDateString() === today.toDateString();
    
    // Mock event counts for some days
    const eventCount = isCurrentMonth && Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
    const attendingCount = Math.floor(eventCount * 0.6);
    const pendingCount = Math.floor(eventCount * 0.3);
    const declinedCount = eventCount - attendingCount - pendingCount;
    
    days.push({
      date: date,
      isCurrentMonth: isCurrentMonth,
      isToday: isToday,
      isSelected: false,
      eventCount: eventCount,
      attendingCount: attendingCount,
      pendingCount: pendingCount,
      declinedCount: declinedCount,
      eventDots: eventCount > 0 ? [
        { color: 'green' as const, count: attendingCount, tooltip: `${attendingCount} attending` },
        { color: 'grey' as const, count: pendingCount, tooltip: `${pendingCount} pending` },
        { color: 'yellow' as const, count: declinedCount, tooltip: `${declinedCount} declined` }
      ].filter(dot => dot.count > 0) : []
    });
  }
  
  return days;
};

// =====================================================================================
// MOCK CALENDAR STATE
// =====================================================================================

export const getMockCalendarState = (): CalendarState => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);
  
  const viewMode: CalendarViewMode = {
    type: 'company_rows',
    eventFilter: 'all_events'
  };
  
  return {
    companies: getMockCompanies(),
    events: getMockEventCells(),
    selectedDate: today,
    dateRange: {
      start: today,
      end: endDate
    },
    viewMode: viewMode,
    searchQuery: '',
    loading: false,
    error: null
  };
};

// =====================================================================================
// MOCK EVENT DETAILS STATE
// =====================================================================================

export const getMockEventDetailsState = (eventId?: string): EventDetailsState => {
  const events = getMockEvents();
  const selectedEvent = eventId ? events.find(e => e.id === eventId) || events[0] : null;
  
  return {
    isOpen: !!selectedEvent,
    selectedEvent: selectedEvent,
    attendees: selectedEvent ? getMockAttendees(selectedEvent.id) : [],
    userRSVP: selectedEvent ? {
      eventId: selectedEvent.id,
      userId: 'current-user-id',
      status: 'pending',
      notes: '',
      timestamp: new Date()
    } : null,
    weatherForecast: selectedEvent ? getMockWeatherForecast(selectedEvent.start_date) : [],
    miniCalendar: {
      currentMonth: new Date(),
      selectedDate: new Date(),
      days: getMockMiniCalendarDays(new Date()),
      isNavigating: false
    },
    loading: false,
    error: null
  };
};

// =====================================================================================
// UTILITY FUNCTIONS FOR MOCK DATA
// =====================================================================================

export const getMockCompanyById = (id: string): CompanyRow | null => {
  return getMockCompanies().find(company => company.id === id) || null;
};

export const getMockEventById = (id: string): CalendarEventData | null => {
  return getMockEvents().find(event => event.id === id) || null;
};

export const getMockEventsByCompany = (companyId: string): EventCell[] => {
  return getMockEventCells().filter(cell => cell.position.companyRowId === companyId);
};

export const getMockEventsByDateRange = (startDate: Date, endDate: Date): EventCell[] => {
  return getMockEventCells().filter(cell => {
    const eventDate = cell.position.date;
    return eventDate >= startDate && eventDate <= endDate;
  });
};

export const getMockEventsByRSVPStatus = (status: 'accepted' | 'declined' | 'pending'): EventCell[] => {
  return getMockEventCells().filter(cell => cell.rsvpStatus === status);
};

// =====================================================================================
// MOCK DATA VALIDATION
// =====================================================================================

export const validateMockData = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const companies = getMockCompanies();
    const events = getMockEvents();
    const eventCells = getMockEventCells();
    
    // Validate companies
    if (companies.length === 0) {
      errors.push('No mock companies found');
    }
    
    // Validate events
    if (events.length === 0) {
      errors.push('No mock events found');
    }
    
    // Validate event cells
    if (eventCells.length === 0) {
      errors.push('No mock event cells found');
    }
    
    // Validate data consistency
    eventCells.forEach(cell => {
      const company = companies.find(c => c.id === cell.position.companyRowId);
      if (!company) {
        errors.push(`Event cell ${cell.id} references non-existent company ${cell.position.companyRowId}`);
      }
      
      const event = events.find(e => e.id === cell.event.id);
      if (!event) {
        errors.push(`Event cell ${cell.id} references non-existent event ${cell.event.id}`);
      }
    });
    
  } catch (error) {
    errors.push(`Mock data validation failed: ${error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
