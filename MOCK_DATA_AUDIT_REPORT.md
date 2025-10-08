# Mock Data & Hardcoded Values Audit Report
**Date:** Current Session  
**Purpose:** Identify all mock data and hardcoded values for production readiness

---

## 🔴 CRITICAL: Mock Data Service

### 1. **src/services/mockCalendarData.ts** (ENTIRE FILE - 765 lines)
**Status:** ⚠️ SHOULD BE REMOVED OR DEPRECATED  
**Impact:** HIGH

**Mock Functions:**
- `getMockCompanies()` - Returns hardcoded company data
- `getMockEvents()` - Returns hardcoded event data  
- `getMockEventCells()` - Returns hardcoded event cells
- `getMockWeatherForecast()` - Returns fake weather data
- `getMockAttendees()` - Returns fake attendee data
- `getMockMiniCalendarDays()` - Returns hardcoded calendar days
- `getMockCalendarState()` - Returns complete mock state
- `getMockEventDetailsState()` - Returns mock event details
- `getMockCompanyById()` - Mock company lookup
- `getMockEventById()` - Mock event lookup
- `getMockEventsByCompany()` - Mock company events filter
- `getMockEventsByDateRange()` - Mock date range filter
- `getMockEventsByRSVPStatus()` - Mock RSVP filter

**Recommendation:** 
- Keep for development/testing only
- Add environment check to prevent production usage
- Consider moving to `src/__mocks__/` directory

---

## 🟡 MEDIUM PRIORITY: Mock Data Usage

### 2. **src/hooks/useCalendarData.ts**
**Status:** ⚠️ HAS MOCK DATA FALLBACKS  
**Lines:** 15-17, 22-23, 32, 45, 52-84, 113, 154, 217-218, 256, 305

**Mock Data References:**
```typescript
useMockData?: boolean;  // Line 22 - Option to use mock data
isUsingMockData: boolean;  // Line 32 - State tracking

// Default to mock in development
useMockData = process.env.NODE_ENV === 'development'  // Line 45

// Fallback functions
const loadMockData = useCallback(async () => {
  const mockCompanies = getMockCompanies();  // Line 63
  const mockEvents = getMockEvents();  // Line 64
  const mockCalendarState = getMockCalendarState();  // Line 65
}, []);

// API error fallbacks
companies = getMockCompanies();  // Line 113
events = getMockEvents() as any as CalendarEvent[];  // Line 154
```

**Recommendation:**
- ✅ KEEP - Good for graceful degradation
- ⚠️ Ensure `useMockData` defaults to `false` in production
- ✅ Add clear logging for mock vs. real data

---

### 3. **src/components/calendar/CalendarLayout.tsx**
**Status:** ⚠️ ACCEPTS MOCK DATA PROP  
**Lines:** 28, 33, 41, 44, 680-681, 701-702, 715-727

**Mock Data References:**
```typescript
interface CalendarLayoutProps {
  useMockData?: boolean;  // Line 28
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ 
  useMockData = false  // Line 33 - Defaults to FALSE (GOOD)
}) => {
  const { isUsingMockData } = useCalendarData({ 
    useMockData,  // Line 44
    enableRealtime: true
  });
}

// UI indicators
{isUsingMockData ? 'Loading mock data' : 'Connecting to API'}  // Line 680
{isUsingMockData ? 'Offline Mode' : 'Connection Error'}  // Line 701
{isUsingMockData ? '📦 MOCK DATA' : '🌐 API DATA'}  // Line 726
```

**Recommendation:**
- ✅ GOOD - Defaults to `false`
- ✅ KEEP - Visual indicators are helpful
- Consider removing UI indicators for production build

---

### 4. **src/components/calendar/MiniCalendar.tsx**
**Status:** ⚠️ USES MOCK EVENTS  
**Lines:** 14, 52-53

**Mock Data Reference:**
```typescript
import { getMockEvents } from '../../services/mockCalendarData';  // Line 14

const mockEvents = getMockEvents();  // Line 52
const counts: EventCountByDate = {};
```

**Recommendation:**
- 🔴 CRITICAL - Should use real events from props/API
- Replace with actual event data passed from parent component

---

## 🟢 LOW PRIORITY: Color Schemes (Can be kept as constants)

### 5. **src/components/calendar/EventCell.tsx**
**Status:** ✅ ACCEPTABLE - UI Constants  
**Lines:** 29-45

**Hardcoded RSVP Colors:**
```typescript
const getEventBackgroundColor = (rsvpStatus: string) => {
  case 'accepted': return 'rgba(16, 185, 129, 0.15)'; // Green
  case 'declined': return 'rgba(239, 68, 68, 0.15)';  // Red
  case 'pending': return 'rgba(245, 158, 11, 0.15)';  // Yellow
};

const getEventBorderColor = (rsvpStatus: string) => {
  case 'accepted': return '#10b981'; // Green
  case 'declined': return '#ef4444'; // Red
  case 'pending': return '#f59e0b';  // Yellow
};
```

**Recommendation:**
- ✅ ACCEPTABLE - These are UI constants
- Could be moved to CSS variables or theme config
- Already have RSVP_COLORS in `src/types/database.ts`

---

### 6. **src/types/database.ts**
**Status:** ✅ GOOD - Defined RSVP Color Constants

**RSVP Color Mapping:**
```typescript
export const RSVP_COLORS: Record<ResponseStatus, string> = {
  accepted: '#28a745',    // Green
  declined: '#ffc107',    // Yellow  
  pending: '#6c757d',     // Grey
};
```

**Recommendation:**
- ✅ KEEP - Good centralized constant
- ⚠️ EventCell.tsx should use these instead of inline colors

---

## 📝 TODO ITEMS FOUND

### 7. **src/types/calendar.ts** - Line 62
```typescript
event: CalendarEventData | any; // TODO: Migrate to CalendarEvent from database.ts
```
**Recommendation:** Complete migration to `CalendarEvent` type

---

### 8. **src/utils/apiClient.ts** - Line 436
```typescript
events: [] // TODO: Load company events if needed
```
**Recommendation:** Implement company events loading

---

### 9. **src/pages/LoginPage.tsx** - Line 331
```typescript
// TODO: Implement forgot password
alert('Forgot password functionality coming soon!');
```
**Recommendation:** Implement forgot password feature

---

### 10. **src/components/NotificationsDrawer.tsx** - Line 320
```typescript
// TODO: Save notification preferences
```
**Recommendation:** Implement notification preferences saving

---

## 🌐 API Endpoints

### 11. **src/types/api.ts** - Line 289
```typescript
baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
```

**Status:** ✅ GOOD - Uses environment variable  
**Recommendation:**
- Ensure `REACT_APP_API_URL` is set in production `.env`
- Consider removing localhost fallback for production builds

---

## 🎯 ACTION ITEMS FOR PRODUCTION

### High Priority:
1. **Remove/Deprecate `mockCalendarData.ts`** or move to `__mocks__/` directory
2. **Fix MiniCalendar.tsx** to use real event data instead of `getMockEvents()`
3. **Ensure `useMockData` defaults to `false`** in production environment
4. **Complete type migration** from `CalendarEventData` to `CalendarEvent`

### Medium Priority:
5. **Unify RSVP color constants** - Use `RSVP_COLORS` from database.ts everywhere
6. **Implement company events loading** in apiClient.ts
7. **Remove mock data UI indicators** for production builds
8. **Add environment checks** to prevent mock data in production

### Low Priority:
9. Implement forgot password functionality
10. Implement notification preferences saving
11. Move color constants to CSS variables or theme config

---

## 📊 SUMMARY

**Total Mock Data Files:** 1 (mockCalendarData.ts)  
**Files Using Mock Data:** 4  
**Hardcoded Values:** Mostly UI constants (acceptable)  
**TODO Items:** 4  
**Critical Issues:** 2 (mockCalendarData.ts, MiniCalendar.tsx)

**Overall Assessment:** 🟡 MODERATE  
Most mock data usage has proper fallbacks and environment checks. Main concerns are the MiniCalendar component and ensuring production deployment doesn't accidentally use mock data.

