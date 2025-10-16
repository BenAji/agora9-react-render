# AGORA Investment Calendar

A Bloomberg-style investment calendar for tracking corporate events, earnings calls, and conferences. Built with React, TypeScript, and database-aligned architecture.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

### Production Deployment
This app is configured for deployment on **Render** (recommended).

See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🏗️ Architecture

This application is built with a **mock-data-first approach** that seamlessly transitions to real backend data:

### Current State: Mock Data
- ✅ All UI components functional with mock data
- ✅ Database-aligned TypeScript interfaces
- ✅ RSVP functionality with correct status values
- ✅ Company-centric calendar view
- ✅ Bloomberg-style dark theme

### Database Alignment
All mock data **exactly matches** the PostgreSQL database schema:
- Field names: `user_id` (not `userId`), `ticker_symbol` (not `ticker`)
- RSVP values: `accepted`/`declined`/`pending` (not `attending`/`not_attending`)
- JSONB fields: `location_details`, `virtual_details`, `preferences`
- All constraints and relationships preserved

## 🔄 Switching to Real Backend

When your PostgreSQL backend is ready, simply change one line in `src/utils/apiClient.ts`:

```typescript
// Current: Mock data
export const apiClient: ApiClient = new MockApiClient();

// Switch to: Real backend
export const apiClient: ApiClient = new RealApiClient('your-api-url');
```

No other code changes needed! The API interface is identical.

## 📊 Features

### ✅ Implemented
- **Company-centric calendar** with draggable company rows
- **Event filtering** (All Events / My Events)
- **RSVP management** with color-coded status
- **Event details modal** with full information
- **Bloomberg-style dark theme** with professional styling
- **Responsive design** for mobile/desktop
- **Mock data service** matching database exactly

### 🔮 Ready for Backend Integration
- **Authentication** with Supabase
- **Real-time updates** via websockets
- **Subscription management** with Stripe
- **Executive assistant** proxy features
- **Notification system**
- **Weather integration**
- **Performance optimizations**

## 📁 Project Structure

```
src/
├── types/
│   ├── database.ts         # Database-aligned interfaces
│   └── api.ts             # API request/response types
├── data/
│   └── mockData.ts        # Mock data matching SQL seed data
├── utils/
│   └── apiClient.ts       # API abstraction layer
├── components/           # UI components (to be expanded)
├── App.tsx              # Main calendar application
└── index.css            # Bloomberg-style theme
```

## 🎨 Design System

### Color Palette (Bloomberg-Style)
- **Primary Background:** `#000000` (Pure black)
- **Secondary Background:** `#0a0a0a` (Very dark)
- **Accent Color:** `#d4af37` (Bloomberg gold)
- **Text:** `#ffffff` (White) / `#cccccc` (Muted)

### RSVP Status Colors
- **Accepted:** `#28a745` (Green)
- **Declined:** `#ffc107` (Yellow)
- **Pending:** `#6c757d` (Grey)

## 🔧 Technical Details

### Database Field Mapping
The application uses **exact database field names**:

```typescript
interface UserEventResponse {
  user_id: string;          // ✅ NOT userId
  event_id: string;         // ✅ NOT eventId  
  response_status: 'accepted' | 'declined' | 'pending'; // ✅ Exact DB values
}

interface Company {
  ticker_symbol: string;    // ✅ NOT ticker
  company_name: string;     // ✅ NOT name
  gics_sector: string;      // ✅ NOT sector
}
```

### Mock Data Features
- **22 companies** exactly matching database seed data
- **Events across Aug-Oct 2025** with realistic details
- **Multi-company events** (conferences, summits)
- **Individual earnings calls** for each company
- **User subscriptions** by GICS subsector
- **RSVP responses** with notes and timestamps

### API Client Benefits
- **Identical interface** for mock and real implementations
- **Type-safe** requests/responses
- **Error handling** with custom error types
- **Automatic retries** and timeout handling
- **Development flexibility** without backend dependency

## 🧪 Testing the Application

### Company Interactions
1. **Click company rows** in sidebar → Shows company details alert
2. **Hover effects** with visual feedback
3. **Drag handles** visible for reordering

### Event Management
1. **Click event blocks** → Opens detailed modal
2. **RSVP updates** change color immediately
3. **Event filtering** between "All Events" and "My Events"

### Calendar Navigation
1. **Week navigation** with arrow buttons
2. **Today highlighting** with gold accent
3. **Responsive grid** adapts to screen size

### Current User
- **John Smith** (Investment Analyst)
- **Subscriptions:** Software & IT Services, Semiconductors
- **RSVP responses** visible on relevant events

## 🚀 Next Steps

1. **Backend Integration:** Connect to PostgreSQL with Supabase
2. **Authentication:** Implement user login/logout
3. **Real-time Features:** Add live event updates
4. **Drag & Drop:** Implement company reordering
5. **Mobile App:** React Native version
6. **Advanced Features:** Weather, notifications, EA support

## 🔗 Database Schema

This frontend is designed to work with the PostgreSQL schema in `consolidated_migration_complete.sql`. All interfaces and mock data maintain perfect alignment with:

- **10 core tables** with proper relationships
- **Row Level Security** policies
- **Business logic functions** in PL/pgSQL
- **Comprehensive indexes** for performance
- **Seed data** with realistic corporate events

---

**Ready for production!** 🎉 The frontend works completely with mock data and will seamlessly connect to your PostgreSQL backend when ready.