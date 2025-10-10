# EventDetailsPanel Component Documentation

## Overview
The EventDetailsPanel is a **fixed-position right sidebar** that slides in from the right side of the screen when an event is clicked. It's designed for **Office Add-in optimization** with touch-friendly design and compact layout.

## Key Features

### 1. Layout & Positioning
- **Fixed position**: `position: fixed, top: 0, right: 0`
- **Full height**: `height: 100vh`
- **Responsive width**: `min(420px, max(320px, 25vw))` - minimum 320px, maximum 420px
- **Slide animation**: Transforms from `translateX(100%)` to `translateX(0)` when visible
- **Z-index**: 1000 (above other content)
- **Click-outside-to-close**: Automatically closes when clicking outside the panel

### 2. Visual Design
- **Background**: `var(--secondary-bg)` (dark theme)
- **Border**: Left border with `var(--border-color)`
- **Box shadow**: `-4px 0 12px rgba(0,0,0,0.1)`
- **Font**: `"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`
- **Scrollable**: `overflowY: auto` with custom scrollbar styling

### 3. Header Section
- **Close button**: 44px × 44px touch-friendly button in top-right corner
- **Event type badge**: Colored badge showing event type (earnings, conference, webinar, catalyst)
- **Event title**: Large, bold heading with proper line height
- **Event description**: Muted text description

### 4. Host Information Section
- **Host type badge**: Shows hosting type with icons:
  - 🏢 **Corporate** (single_corp)
  - 🏢🏢 **Multi-Corporate** (multi_corp) 
  - 🏛️ **Regulatory** (non_company)
- **Host details**: Shows ticker symbol, company name, and industry sector
- **Multi-corporate support**: Lists co-hosts for multi-corporate events
- **Fallback handling**: Shows participating companies if host info unavailable

### 5. Event Information Cards
Three main information cards with consistent styling:

#### Date & Time Card
- Calendar icon
- Full date format (e.g., "Monday, January 15, 2024")
- Time range (e.g., "2:00 PM - 3:00 PM")

#### Location Card
- Location type icon (MapPin, Globe, Building2)
- Location type label (In-Person, Virtual, Hybrid)
- Location details text

#### Attendees Card
- Users icon
- Companies attending (ticker symbols)
- Analyst count ("Analysts Attending: X confirmed")

### 6. RSVP Section
- **Current status display**: Shows user's current RSVP status with colored icon
- **Status colors**:
  - 🟢 **Accepted**: Green (#10B981)
  - 🔴 **Declined**: Red (#EF4444)
  - 🟡 **Pending**: Gray (#6B7280)
- **Action buttons**: Accept/Decline buttons (44px minimum height for touch)
- **Button states**: Active state shows different background color

### 7. Weather Forecast Component
- **4-day forecast**: Shows 3 days prior + event day
- **2×2 grid layout**: Compact display
- **Event day highlighting**: Special border and background for event day
- **Weather data**: Temperature, conditions, humidity, wind speed
- **Travel information**: Helpful travel advice based on weather

## Data Structure Requirements

### CalendarEvent Interface
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  event_type: string;
  location_type: 'physical' | 'virtual' | 'hybrid';
  location?: string;
  weather_location?: string;
  
  // Host information
  primary_host?: EventHost;
  hosts?: EventHost[];
  
  // Company information
  companies: Company[];
  
  // RSVP information
  rsvpStatus?: 'accepted' | 'declined' | 'pending';
  user_response?: UserEventResponse;
  
  // Attendees
  attendees?: any[];
}
```

### EventHost Interface
```typescript
interface EventHost {
  host_type: 'single_corp' | 'multi_corp' | 'non_company';
  host_name?: string;
  host_ticker?: string;
  host_sector?: string;
  host_subsector?: string;
  companies_jsonb?: Array<{
    id: string;
    ticker: string;
    name: string;
    is_primary: boolean;
  }>;
}
```

### Company Interface
```typescript
interface Company {
  id: string;
  ticker_symbol: string;
  company_name: string;
  gics_sector?: string;
  gics_subsector?: string;
}
```

### UserEventResponse Interface
```typescript
interface UserEventResponse {
  id: string;
  user_id: string;
  event_id: string;
  response_status: 'accepted' | 'declined' | 'pending';
  response_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

## Props Interface
```typescript
interface EventDetailsPanelProps {
  event: CalendarEvent | null;
  isVisible: boolean;
  onClose: () => void;
  onRSVPUpdate?: (eventId: string, status: 'accepted' | 'declined' | 'pending') => Promise<void>;
  className?: string;
}
```

## CSS Variables Used
- `--secondary-bg`: Panel background
- `--primary-text`: Main text color
- `--muted-text`: Secondary text color
- `--accent-color`: Accent color for icons
- `--accent-bg`: Accent background
- `--tertiary-bg`: Card backgrounds
- `--border-color`: Border colors
- `--hover-bg`: Hover states
- `--primary-bg`: Primary background
- `--accent-text`: Accent text color
- `--info-text`: Info text color
- `--accent-bg-light`: Light accent background

## Key Functions

### Date & Time Formatting
```typescript
const formatEventDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatEventTime = (startDate: Date, endDate: Date) => {
  const startTime = startDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const endTime = endDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  return `${startTime} - ${endTime}`;
};
```

### Event Type Color Mapping
```typescript
const getEventTypeColor = (eventType: string) => {
  switch (eventType) {
    case 'earnings': return '#3B82F6'; // Blue
    case 'conference': return '#10B981'; // Green
    case 'webinar': return '#8B5CF6'; // Purple
    case 'catalyst': return '#F59E0B'; // Orange
    default: return '#6B7280'; // Gray
  }
};
```

### RSVP Status Icons & Colors
```typescript
const getRSVPStatusIcon = (status: string) => {
  switch (status) {
    case 'accepted': return <CheckCircle size={16} />;
    case 'declined': return <XCircle size={16} />;
    default: return <AlertCircle size={16} />;
  }
};

const getRSVPStatusColor = (status: string) => {
  switch (status) {
    case 'accepted': return '#10B981';
    case 'declined': return '#EF4444';
    default: return '#6B7280';
  }
};
```

### Location Type Icons
```typescript
const getLocationTypeIcon = (locationType: string) => {
  switch (locationType) {
    case 'physical': return <MapPin size={16} />;
    case 'virtual': return <Globe size={16} />;
    case 'hybrid': return <Building2 size={16} />;
    default: return <MapPin size={16} />;
  }
};
```

### Host Type Icons & Labels
```typescript
const getHostTypeIcon = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return '🏢';
    case 'multi_corp': return '🏢🏢';
    case 'non_company': return '🏛️';
    default: return '🏢';
  }
};

const getHostTypeLabel = (hostType: string) => {
  switch (hostType) {
    case 'single_corp': return 'Corporate';
    case 'multi_corp': return 'Multi-Corporate';
    case 'non_company': return 'Regulatory';
    default: return 'Corporate';
  }
};
```

## Component Structure

### Main Container
```typescript
<div
  ref={panelRef}
  className={`event-details-panel ${className}`}
  style={{
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: 'min(420px, max(320px, 25vw))',
    backgroundColor: 'var(--secondary-bg)',
    borderLeft: '1px solid var(--border-color)',
    boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
    zIndex: 1000,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
  }}
>
```

### Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (isVisible) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }
}, [isVisible, onClose]);
```

## WeatherForecast Component

### Features
- **4-day weather forecast**: 3 days prior + event day
- **2×2 grid layout**: Compact display for mobile
- **Event day highlighting**: Special styling for event day
- **Weather conditions**: Sunny, cloudy, rainy, snowy with appropriate icons
- **Temperature ranges**: High/low temperatures
- **Additional data**: Humidity percentage, wind speed
- **Travel information**: Helpful advice based on weather conditions

### Weather Data Structure
```typescript
interface MockWeatherData {
  date: Date;
  temperature: {
    high: number;
    low: number;
  };
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  description: string;
  humidity: number;
  windSpeed: number;
}
```

## Usage Example

```typescript
import EventDetailsPanel from './EventDetailsPanel';

const MyComponent = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsPanelVisible(true);
  };

  const handleClosePanel = () => {
    setIsPanelVisible(false);
    setSelectedEvent(null);
  };

  const handleRSVPUpdate = async (eventId: string, status: 'accepted' | 'declined' | 'pending') => {
    // Update RSVP status via API
    console.log(`Updating RSVP for event ${eventId} to ${status}`);
  };

  return (
    <div>
      {/* Your calendar or event list */}
      
      <EventDetailsPanel
        event={selectedEvent}
        isVisible={isPanelVisible}
        onClose={handleClosePanel}
        onRSVPUpdate={handleRSVPUpdate}
      />
    </div>
  );
};
```

## Dependencies

### Required Packages
- `react` - Core React functionality
- `lucide-react` - Icon library
- `date-fns` - Date formatting utilities

### Required Icons from lucide-react
- `MapPin` - Physical location icon
- `Users` - Attendees icon
- `Building2` - Corporate/hybrid location icon
- `Calendar as CalendarIcon` - Date/time icon
- `X` - Close button icon
- `Globe` - Virtual location icon
- `Shield` - RSVP section icon
- `CheckCircle` - Accepted status icon
- `XCircle` - Declined status icon
- `AlertCircle` - Pending status icon

## Styling Notes

### Touch-Friendly Design
- Minimum touch target size: 44px × 44px
- Adequate spacing between interactive elements
- Clear visual feedback for hover states

### Responsive Design
- Minimum width: 320px (mobile)
- Maximum width: 420px (desktop)
- Flexible width based on viewport: 25vw

### Animation
- Smooth slide-in transition: 0.3s ease-in-out
- Hover effects on interactive elements: 0.2s ease

## Accessibility Features
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast color scheme
- Touch-friendly sizing

This component is fully self-contained and can be easily replicated in other parts of the application by providing the same props and data structure.

