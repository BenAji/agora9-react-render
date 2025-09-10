# AGORA User Stories & Requirements

## 1. User Personas

### Investment Analyst
- **Description:** Researches companies, subscribes to subsectors, RSVPs to events, and manages their own event calendar.
- **Key Needs:** Discover relevant events, manage subscriptions, RSVP to events, and organize their calendar.

### Executive Assistant
- **Description:** Assists one or more users (Investment Analysts) by performing operational tasks on their behalf. Has full operational access, receives notifications for assisted users, but cannot access sensitive analytics or private notes.
- **Key Needs:** Seamlessly manage events, subscriptions, and notifications for multiple users, ensuring nothing is missed in the user's absence.

---

## 2. User Stories & Acceptance Criteria

### 2.1. Subscriptions & Payments

**User Story:**
> As a user, I want to subscribe to a subsector, so that I can access events for companies in that subsector.

**Acceptance Criteria:**
- User can browse available subsectors.
- Selecting a subsector prompts for payment.
- Only after successful payment, the user is subscribed.
- Only events from subscribed companies appear in the calendar and event pages.

---

### 2.2. Event Classification by GICS Company Attendance

**User Story:**
> As a user, I want events to appear under the ticker symbol of every GICS company attending, so that I can see all relevant events for my subscribed companies.

**Acceptance Criteria:**
- If a GICS company is listed as attending an event, the event appears in that company's row on the calendar.
- Events can appear under multiple companies if multiple GICS companies are attending.
- The calendar always organizes events by the companies the user is subscribed to, based on attendance, not just hosting.
- If a user is subscribed to a company, they see all events that company is attending, regardless of who is hosting.
- Events with no GICS companies attending are displayed in a separate "Other Events" section or filtered out based on user preference.
- Events attended by many companies are displayed under each attending company's row, with visual indicators to show it's a multi-company event.

---

---

### 2.4. Event Attendance Status (Color Coding)

**User Story:**
> As a user, I want to see my attendance status for each event using color codes, so that I can quickly identify which events I am attending, not attending, or are pending.

**Acceptance Criteria:**
- Events I am attending are shown in green.
- Events I am not attending are shown in yellow.
- Events pending my response are shown in grey.
- No event category legend is shown; only color status is used.

---

### 2.5. See Who is Attending an Event

**User Story:**
> As a user, I want to see a list of attendees for each event, so that I know who else will be present.

**Acceptance Criteria:**
- Each event displays a list of confirmed attendees (names and optionally roles).
- The attendee list updates in real time as users RSVP.
- Executive Assistants can see attendees for users they assist.

---

### 2.6. Calendar Scrolling (Mobile-Friendly)

**User Story:**
> As a user, I want to scroll the calendar horizontally and vertically, so that I can easily navigate events on mobile devices.

**Acceptance Criteria:**
- Calendar supports smooth horizontal and vertical scrolling.
- Calendar is responsive and usable on mobile devices.
- Company rows and event columns remain accessible during scrolling.

---

### 2.7. Company Row Drag-and-Drop (Calendar Preference)

**User Story:**
> As a user, I want to reorder company rows on my calendar by dragging ticker symbols, so that I can prioritize the companies I care about most.

**Acceptance Criteria:**
- User can drag and drop company rows to reorder them.
- The new order is saved as the user's preference.
- The order persists across sessions and devices.

---

### 2.8. Company Event Blow-Up (Detailed View)

**User Story:**
> As a user, I want to click on a company in the calendar to see all its events in a detailed, standard calendar view, so that I can focus on one company at a time.

**Acceptance Criteria:**
- Clicking a company row expands or navigates to a detailed calendar for that company.
- The detailed view shows all upcoming and past events for the company.
- User can RSVP or view event details from this view.

---

### 2.9. Executive Assistant Full Operational Access

**User Story:**
> As an Executive Assistant, I want to manage events, subscriptions, and notifications for multiple users, so that I can ensure their schedules are up to date in their absence.

**Acceptance Criteria:**
- Executive Assistants can switch between users they assist.
- They can perform all operational tasks (RSVP, subscribe, etc.) for those users.
- They receive notifications for all users they assist.
- They cannot access sensitive analytics or private notes.

---

### 2.10. Event Visibility & "My Events"

**User Story:**
> As a user, I want to see only events (Accepted, Deline, Pending) from companies I have subscribed to, and have a "My Events" view for events I have accepted to attend.

**Acceptance Criteria:**
- Only events from subscribed companies are shown in the main calendar and event pages.
- "My Events" view shows only events the user has accepted to attend.
- Executive Assistants can view "My Events" for users they assist.

---

### 2.11. Full Event Location Details

**User Story:**
> As a user, I want to see the full physical address for events with a location, so that I know exactly where to go.

**Acceptance Criteria:**
- Event details include full address (room number, conference hall, etc.) if physical.
- For virtual events, show the meeting link and dial-in info.

---

## 3. Prioritized Feature List

### MVP (Minimum Viable Product)
- User authentication and profile management
- Subscriptions by subsector (with payment integration)
- Calendar view (with scrolling and mobile support)
- Event RSVP and attendance status (green/yellow/grey)
- See who is attending each event
- Company specific event blow-up (detailed standard calendar view)
- "My Events" shows the events that has been responded to. "All Events" shows all event that have been subcrided to
- Executive Assistant operational access and notification handling
- Full event location details
- Company row drag-and-drop (calendar preference)
- Only show events for subscribed companies
- Event classification by GICS company attendance (not just hosting)
- Advanced notification preferences (channels, frequency)
- Calendar export/sync (Google, Outlook)
- Visual indicators for multi-company events

### Nice-to-Have (Post-MVP)
- Enhanced attendee profiles (roles, bios)
- In-app chat or messaging
- Event feedback and ratings
- Multi-language support


### Future Features
- Approval workflow for certain actions (e.g., event RSVP, subscription)
- Advanced analytics and reporting
- Catalyst event type (special events with unique workflows)
- Integration with external data sources (Bloomberg, Reuters)

---

## 2.12. Natural Language Event Management (MCP-Powered)

**User Story:**
> As an Investment Analyst, I want to interact with the platform using natural language queries, so that I can quickly find events, manage RSVPs, and access information without navigating through multiple screens.

**Acceptance Criteria:**
- User can ask "Find events in technology sector next week" and get relevant results
- User can say "RSVP yes to Apple earnings call" and the system processes the RSVP
- User can request "Show me who's attending JPM conference" and see attendee lists
- Natural language queries respect subscription access (only show accessible events)
- Conversational interface provides suggestions and clarifications when needed
- All MCP actions maintain the same security and audit logging as manual actions

**MCP Tools Integration:**
- `search_events` - Natural language event discovery
- `event_details` - Get comprehensive event information
- `rsvp_event` - Process RSVP requests via conversation
- `who_is_attending` - Get attendee information
- `my_agenda` - Show user's personalized schedule
- `manage_subscription` - Handle subscription requests

---

## 2.13. Executive Assistant MCP Delegation

**User Story:**
> As an Executive Assistant, I want to use natural language commands to manage multiple users' calendars and subscriptions, so that I can efficiently handle complex multi-user operations through conversation.

**Acceptance Criteria:**
- EA can say "RSVP John to Tesla earnings and Mary to Apple event" for bulk operations
- EA can ask "What conflicts does Sarah have next week?" and get comprehensive analysis
- EA can request "Subscribe all my users to healthcare sector" for bulk subscription management
- Conversational interface maintains user context switching security
- All EA actions via MCP are logged with proper audit trails
- Natural language preserves role-based access restrictions

**MCP Tools Integration:**
- `switch_user_context` - Change active user for EA operations
- `bulk_rsvp` - Handle multiple RSVP operations
- `multi_user_calendar` - Get aggregated calendar view
- `bulk_subscription` - Manage subscriptions across users
- `ea_audit_log` - Access EA action history

---

## 2.14. Conversational Event Discovery

**User Story:**
> As a user, I want to have natural conversations about investment events, so that I can discover relevant opportunities I might have missed and get contextual recommendations.

**Acceptance Criteria:**
- User can ask "What important events are happening this week in my subscribed sectors?"
- System provides intelligent suggestions: "You might be interested in the Tesla battery day event"
- Conversational interface explains why events are relevant to user's portfolio
- Natural language queries work across company blow-up views and calendar displays
- MCP responses include actionable next steps (RSVP, subscribe, add to calendar)
- System maintains conversation context for follow-up questions

**MCP Tools Integration:**
- `intelligent_event_discovery` - AI-powered event recommendations
- `portfolio_context_analysis` - Analyze event relevance to user interests
- `subscription_recommendations` - Suggest new subscriptions based on interests
- `event_impact_analysis` - Explain why events matter to user

---

## 4. Notes
- Executive Assistants have full operational access but cannot view sensitive analytics/private notes.
- All features are designed to be mobile-friendly and accessible.
- Payment is required before subscribing to a subsector.
- Only events from subscribed companies are visible in the calendar and event pages.
- Event color coding: green (attending), yellow (not attending), grey (pending).
- No event category legend; color alone indicates status.
- Events are classified by GICS company attendance, not just hosting.
- Events with no GICS companies attending can be displayed in a separate section or filtered out.
- Multi-company events appear under each attending company's row with visual indicators.
- "Catalyst event" is a planned future feature.