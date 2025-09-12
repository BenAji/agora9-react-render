# AGORA Calendar Development Strategy & PRD
> **CRITICAL REFERENCE DOCUMENT** - Follow this strategy strictly to avoid infinite loops and ensure systematic progress

## 📋 **Document Purpose**
This PRD serves as the **single source of truth** for AGORA Calendar development. Every development session must reference this document to maintain systematic progress and prevent error loops.

---

## 🎯 **Development Philosophy**

### **Core Principles**
1. **Incremental Development**: Build one small feature at a time
2. **Mock Data First**: Always start with hardcoded data before API integration
3. **Validation Checkpoints**: Each phase must pass validation before proceeding
4. **Error Boundaries**: Every component wrapped in error handling
5. **Fallback Strategy**: Always have a working fallback state

### **Zero-Tolerance Rules**
- ❌ **NEVER** start a new phase without completing the previous one
- ❌ **NEVER** integrate real API calls without mock data working first
- ❌ **NEVER** proceed to next step if current step has errors
- ❌ **NEVER** skip validation checkpoints
- ❌ **NEVER** work on multiple features simultaneously

---

## 🏗️ **Phase-by-Phase Development Plan**

### **PHASE 1: FOUNDATION (SAFE - No API calls)**
**Duration**: 2-3 hours  
**Risk Level**: ZERO (no external dependencies)

#### **Step 1.1: Create Types & Constants** ⏱️ 30 minutes
```typescript
// File: src/types/calendar.ts
// Purpose: Define all TypeScript interfaces
// Dependencies: NONE
// Validation: TypeScript compiles without errors
```

**Deliverables:**
- [ ] `CalendarState` interface
- [ ] `CompanyRow` interface  
- [ ] `EventCell` interface
- [ ] `MiniCalendarDay` interface
- [ ] `WeatherForecast` interface
- [ ] All types compile without errors

**Validation Checkpoint 1.1:**
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] All interfaces properly exported

#### **Step 1.2: Create Mock Data Service** ⏱️ 30 minutes
```typescript
// File: src/services/mockCalendarData.ts
// Purpose: Hardcoded data for development
// Dependencies: calendar.ts types only
// Validation: Mock data returns expected structure
```

**Deliverables:**
- [ ] `getMockCompanies()` function
- [ ] `getMockEvents()` function
- [ ] `getMockWeatherForecast()` function
- [ ] All mock data matches TypeScript interfaces
- [ ] Mock data includes edge cases (empty states, multiple events)

**Validation Checkpoint 1.2:**
- [ ] Mock data functions return correct types
- [ ] Mock data includes realistic scenarios
- [ ] No runtime errors when calling mock functions

#### **Step 1.3: Create Basic Layout Component** ⏱️ 60 minutes
```typescript
// File: src/components/calendar/CalendarLayout.tsx
// Purpose: Basic calendar grid structure
// Dependencies: calendar.ts types, mockCalendarData.ts
// Validation: Component renders without errors
```

**Deliverables:**
- [ ] Calendar grid with company rows and day columns
- [ ] Week navigation header
- [ ] Event view toggle (My Events / All Events)
- [ ] Search bar in header
- [ ] Company ticker display (ticker + company name in italics)
- [ ] Responsive layout for Office add-ins

**Validation Checkpoint 1.3:**
- [ ] Component renders without crashing
- [ ] Layout matches design schema
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] All UI elements visible and functional

**PHASE 1 COMPLETION CRITERIA:**
- [ ] All validation checkpoints passed
- [ ] Calendar grid displays correctly
- [ ] No external API calls
- [ ] Component is fully self-contained

---

### **PHASE 2: EVENT DISPLAY (SAFE - Mock data only)**
**Duration**: 2-3 hours  
**Risk Level**: LOW (mock data only)

#### **Step 2.1: Create Event Cell Component** ⏱️ 45 minutes
```typescript
// File: src/components/calendar/EventCell.tsx
// Purpose: Display individual events with color coding
// Dependencies: calendar.ts types, mockCalendarData.ts
// Validation: Event cells display with correct colors
```

**Deliverables:**
- [ ] Event cell component with color coding
- [ ] Green: attending events
- [ ] Yellow: not attending events  
- [ ] Grey: pending events
- [ ] Event title and time display
- [ ] Multi-company event indicators
- [ ] Click handler for event details

**Validation Checkpoint 2.1:**
- [ ] Event cells render with correct colors
- [ ] Event information displays properly
- [ ] Click handlers work
- [ ] Color coding matches RSVP status

#### **Step 2.2: Integrate Mock Events** ⏱️ 45 minutes
```typescript
// File: Update CalendarLayout.tsx
// Purpose: Display mock events in calendar grid
// Dependencies: EventCell.tsx, mockCalendarData.ts
// Validation: Events appear in correct calendar cells
```

**Deliverables:**
- [ ] Events display in correct date/company intersections
- [ ] Color coding works for all event types
- [ ] Events are clickable
- [ ] Layout doesn't break with multiple events
- [ ] Empty states handled gracefully

**Validation Checkpoint 2.2:**
- [ ] Events appear in correct calendar positions
- [ ] Color coding is accurate
- [ ] Multiple events per day handled
- [ ] No layout breaking with events

#### **Step 2.3: Create Event Details Panel** ⏱️ 60 minutes
```typescript
// File: src/components/calendar/EventDetailsPanel.tsx
// Purpose: Right sidebar for event details
// Dependencies: calendar.ts types, mockCalendarData.ts
// Validation: Event details display correctly
```

**Deliverables:**
- [ ] Right sidebar panel
- [ ] Event title and description
- [ ] Date, time, and location details
- [ ] Speakers and agenda information
- [ ] RSVP status and action buttons
- [ ] Attendee list (mock data)
- [ ] Contact and access information
- [ ] Tags display
- [ ] Close button functionality

**Validation Checkpoint 2.3:**
- [ ] Event details panel opens on event click
- [ ] All event information displays correctly
- [ ] Panel closes properly
- [ ] No layout breaking when panel opens

**PHASE 2 COMPLETION CRITERIA:**
- [ ] All validation checkpoints passed
- [ ] Events display with correct color coding
- [ ] Event details panel works
- [ ] No real API calls made
- [ ] All functionality uses mock data

---

### **PHASE 3: MINI CALENDAR & WEATHER (SAFE - Mock data only)**
**Duration**: 2-3 hours  
**Risk Level**: LOW (mock data only)

#### **Step 3.1: Create Mini Calendar Component** ⏱️ 60 minutes
```typescript
// File: src/components/calendar/MiniCalendar.tsx
// Purpose: Month calendar with event count dots
// Dependencies: calendar.ts types, mockCalendarData.ts
// Validation: Mini calendar displays with event dots
```

**Deliverables:**
- [ ] Standard month calendar view
- [ ] Event count indicators as colored dots
- [ ] Green dots: attending events
- [ ] Yellow dots: not attending events
- [ ] Grey dots: pending events
- [ ] Click to navigate to specific dates
- [ ] Current date highlighting
- [ ] Event count legend

**Validation Checkpoint 3.1:**
- [ ] Mini calendar renders correctly
- [ ] Event dots display with correct colors
- [ ] Date navigation works
- [ ] Legend is clear and accurate

#### **Step 3.2: Integrate Mini Calendar with Event Details** ⏱️ 30 minutes
```typescript
// File: Update EventDetailsPanel.tsx
// Purpose: Add mini calendar to event details panel
// Dependencies: MiniCalendar.tsx
// Validation: Mini calendar appears in event details
```

**Deliverables:**
- [ ] Mini calendar at bottom of event details panel
- [ ] Event count dots per day
- [ ] Date navigation updates main calendar
- [ ] Event count legend
- [ ] Responsive design for panel

**Validation Checkpoint 3.2:**
- [ ] Mini calendar appears in event details
- [ ] Event dots show correct counts
- [ ] Date navigation works
- [ ] Panel layout accommodates mini calendar

#### **Step 3.3: Add Weather Forecast Integration** ⏱️ 60 minutes
```typescript
// File: src/components/calendar/WeatherForecast.tsx
// Purpose: 3-day weather forecast display
// Dependencies: calendar.ts types, mockCalendarData.ts
// Validation: Weather forecast displays correctly
```

**Deliverables:**
- [ ] 3-day weather forecast prior to event day
- [ ] Temperature and condition display
- [ ] Event day highlighting
- [ ] Time zone information
- [ ] Weather location display
- [ ] Mock weather data integration

**Validation Checkpoint 3.3:**
- [ ] Weather forecast displays correctly
- [ ] 3-day forecast shows prior to event
- [ ] Event day is highlighted
- [ ] Weather data is realistic

**PHASE 3 COMPLETION CRITERIA:**
- [ ] All validation checkpoints passed
- [ ] Mini calendar with event dots works
- [ ] Weather forecast displays
- [ ] No real API calls made
- [ ] All functionality uses mock data

---

### **PHASE 4: API INTEGRATION (CAREFUL - Gradual)**
**Duration**: 3-4 hours  
**Risk Level**: MEDIUM (real API calls with fallbacks)

#### **Step 4.1: Create API Hooks with Fallbacks** ⏱️ 60 minutes
```typescript
// File: src/hooks/useCalendarData.ts
// Purpose: API integration with mock data fallback
// Dependencies: apiClient.ts, mockCalendarData.ts
// Validation: API calls work with fallback on failure
```

**Deliverables:**
- [ ] `useCalendarData` hook
- [ ] API call for companies with mock fallback
- [ ] API call for events with mock fallback
- [ ] Error handling and loading states
- [ ] Graceful degradation on API failure
- [ ] Development mode toggle for mock data

**Validation Checkpoint 4.1:**
- [ ] API calls work when available
- [ ] Fallback to mock data on API failure
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Development mode toggle functions

#### **Step 4.2: Gradual API Replacement** ⏱️ 90 minutes
```typescript
// File: Update CalendarLayout.tsx
// Purpose: Replace mock data with real API calls
// Dependencies: useCalendarData.ts
// Validation: Real data displays correctly
```

**Deliverables:**
- [ ] Companies loaded from API
- [ ] Events loaded from API
- [ ] Subscription filtering works
- [ ] RSVP status integration
- [ ] Real-time data updates
- [ ] Error boundaries for API failures

**Validation Checkpoint 4.2:**
- [ ] Real data displays correctly
- [ ] Subscription filtering works
- [ ] RSVP status is accurate
- [ ] Error handling prevents crashes
- [ ] Fallback to mock data on failure

#### **Step 4.3: Add Real-Time Updates** ⏱️ 60 minutes
```typescript
// File: src/hooks/useRealtimeUpdates.ts
// Purpose: Real-time data updates
// Dependencies: Supabase real-time, useCalendarData.ts
// Validation: Real-time updates work without breaking UI
```

**Deliverables:**
- [ ] Real-time RSVP status updates
- [ ] Real-time event updates
- [ ] Real-time attendee list updates
- [ ] Optimistic UI updates
- [ ] Error handling for real-time failures
- [ ] Fallback to polling on real-time failure

**Validation Checkpoint 4.3:**
- [ ] Real-time updates work
- [ ] UI updates without breaking
- [ ] Error handling prevents crashes
- [ ] Fallback mechanisms work

**PHASE 4 COMPLETION CRITERIA:**
- [ ] All validation checkpoints passed
- [ ] Real API data displays correctly
- [ ] Fallback mechanisms work
- [ ] Real-time updates function
- [ ] Error handling prevents crashes

---

### **PHASE 5: ADVANCED FEATURES (INCREMENTAL)**
**Duration**: 3-4 hours  
**Risk Level**: MEDIUM (complex features)

#### **Step 5.1: Company Row Drag & Drop** ⏱️ 90 minutes
```typescript
// File: src/components/calendar/DraggableCompanyRow.tsx
// Purpose: Drag and drop company reordering
// Dependencies: react-beautiful-dnd, useCalendarData.ts
// Validation: Drag and drop works with persistence
```

**Deliverables:**
- [ ] Drag and drop functionality
- [ ] Visual feedback during drag
- [ ] Order persistence via API
- [ ] Touch-friendly drag handles
- [ ] Error handling for drag failures
- [ ] Fallback to manual reordering

**Validation Checkpoint 5.1:**
- [ ] Drag and drop works smoothly
- [ ] Order persists across sessions
- [ ] Touch interactions work
- [ ] Error handling prevents data loss

#### **Step 5.2: Company-Specific Blow-Up View** ⏱️ 90 minutes
```typescript
// File: src/pages/CompanyCalendarPage.tsx
// Purpose: Detailed calendar view for single company
// Dependencies: useCalendarData.ts, eventClassification.ts
// Validation: Company view displays correctly
```

**Deliverables:**
- [ ] Company-specific calendar view
- [ ] Event classification (hosting vs attending)
- [ ] Multi-company event indicators
- [ ] Navigation back to main calendar
- [ ] Company branding and context
- [ ] Event filtering by company

**Validation Checkpoint 5.2:**
- [ ] Company view displays correctly
- [ ] Event classification works
- [ ] Navigation functions properly
- [ ] Company context is clear

#### **Step 5.3: Mobile & Office Optimization** ⏱️ 60 minutes
```typescript
// File: Update CalendarLayout.tsx
// Purpose: Mobile and Office add-in optimization
// Dependencies: All previous components
// Validation: Mobile experience is smooth
```

**Deliverables:**
- [ ] Touch-friendly scrolling
- [ ] Responsive design for Office add-ins
- [ ] Optimized for 320px-450px width
- [ ] Touch gestures for mobile
- [ ] Performance optimization
- [ ] Accessibility improvements

**Validation Checkpoint 5.3:**
- [ ] Mobile experience is smooth
- [ ] Office add-in constraints respected
- [ ] Performance is acceptable
- [ ] Accessibility features work

**PHASE 5 COMPLETION CRITERIA:**
- [ ] All validation checkpoints passed
- [ ] Drag and drop works
- [ ] Company view functions
- [ ] Mobile optimization complete
- [ ] All features work together

---

## 🛠️ **Development Safety Tools**

### **Error Boundary Component**
```typescript
// File: src/components/ErrorBoundary.tsx
// Purpose: Catch and handle component errors
// Usage: Wrap every major component
```

### **Development Mode Configuration**
```typescript
// File: src/config/development.ts
// Purpose: Control development features
// Features: Mock data toggle, debug logging, error details
```

### **API Call Wrapper with Fallback**
```typescript
// File: src/utils/safeApiCall.ts
// Purpose: Safe API calls with fallback
// Usage: Wrap all API calls
```

### **Component Testing Strategy**
```typescript
// File: src/components/__tests__/
// Purpose: Test each component
// Coverage: Renders without crashing, handles props, error states
```

---

## 📋 **Daily Development Checklist**

### **Before Starting Each Session:**
- [ ] Read this PRD to understand current phase
- [ ] Check previous session's validation checkpoints
- [ ] Run `npm start` to ensure app starts
- [ ] Check for any existing errors in console
- [ ] Verify current phase is working

### **During Development:**
- [ ] Make small, incremental changes only
- [ ] Test after each change
- [ ] Use console.log for debugging
- [ ] Keep mock data as fallback
- [ ] Follow the phase structure strictly
- [ ] Don't skip validation checkpoints

### **After Each Session:**
- [ ] Complete current step's validation checkpoint
- [ ] Ensure app still runs without errors
- [ ] Commit working code with clear message
- [ ] Document what was completed
- [ ] Note any issues for next session
- [ ] Update this PRD if needed

---

## 🚨 **Emergency Procedures**

### **If You Get Stuck in an Error Loop:**
1. **STOP** immediately
2. **Revert** to last working checkpoint
3. **Identify** the specific error
4. **Fix** the error before proceeding
5. **Test** the fix thoroughly
6. **Continue** with the phase

### **If API Integration Fails:**
1. **Disable** API calls
2. **Revert** to mock data
3. **Fix** API issues separately
4. **Re-enable** API calls when fixed
5. **Test** thoroughly before proceeding

### **If Component Breaks:**
1. **Isolate** the broken component
2. **Create** minimal test case
3. **Fix** the specific issue
4. **Test** the fix
5. **Re-integrate** with other components

---

## 📊 **Progress Tracking**

### **Phase Completion Status:**
- [ ] Phase 1: Foundation (0/3 steps complete)
- [ ] Phase 2: Event Display (0/3 steps complete)
- [ ] Phase 3: Mini Calendar & Weather (0/3 steps complete)
- [ ] Phase 4: API Integration (0/3 steps complete)
- [ ] Phase 5: Advanced Features (0/3 steps complete)

### **Current Session Goals:**
- [ ] Complete current step
- [ ] Pass validation checkpoint
- [ ] No new errors introduced
- [ ] Ready for next step

---

## 🎯 **Success Metrics**

### **Technical Success:**
- [ ] All phases completed without error loops
- [ ] All validation checkpoints passed
- [ ] No breaking changes introduced
- [ ] Performance is acceptable
- [ ] Error handling prevents crashes

### **Functional Success:**
- [ ] Calendar displays correctly
- [ ] Events show with proper color coding
- [ ] Subscription filtering works
- [ ] RSVP management functions
- [ ] Mobile experience is smooth
- [ ] Office add-in integration works

---

## 📝 **Document Maintenance**

### **When to Update This PRD:**
- [ ] After completing each phase
- [ ] When encountering new issues
- [ ] When adding new features
- [ ] When changing development approach
- [ ] When fixing critical bugs

### **Version Control:**
- [ ] Commit PRD changes with code changes
- [ ] Tag major PRD updates
- [ ] Keep change log of PRD modifications
- [ ] Review PRD before each development session

---

**This PRD is the single source of truth for AGORA Calendar development. Follow it strictly to ensure systematic progress and prevent infinite error loops.**

**Last Updated:** [Current Date]  
**Current Phase:** Phase 1, Step 1.1  
**Next Action:** Create calendar types and constants
