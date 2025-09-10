# AGORA Technical Specifications (Outlook Add-in)

## 1. System Architecture

### 1.1. Overall Architecture
AGORA is an Outlook add-in that integrates with Microsoft Outlook to provide event management capabilities:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Outlook       │    │   AGORA Add-in  │    │   Backend       │
│   Desktop App   │◄──►│   (React/TS)    │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ - Email Client  │    │ - Task Pane     │    │ - Authentication│
│ - Calendar      │    │ - Dialog Boxes  │    │ - Real-time     │
│ - Contacts      │    │ - Commands      │    │ - API Gateway   │
│ - Tasks         │    │ - Ribbon UI     │    │ - Edge Functions│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Microsoft     │    │   Payment       │    │   Database      │
│   Graph API     │    │   Gateway       │    │   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Calendar Sync │    │ - Stripe        │    │ - User Data     │
│ - Email Access  │    │ - Webhooks      │    │ - Events        │
│ - User Profile  │    │ - Subscriptions │    │ - Subscriptions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Weather       │    │   File Storage  │
│   Services      │    │   API           │    │   (Supabase)    │
│                 │    │                 │    │                 │
│ - GICS Data     │    │ - OpenWeather   │    │ - Logos         │
│ - Market Data   │    │ - Weather Maps  │    │ - Documents     │
│ - Company Info  │    │ - Forecasts     │    │ - Assets        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2. Technology Stack

#### Outlook Add-in Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Webpack (Office Add-in standard)
- **UI Library:** Office UI Fabric (Fluent UI) + Shadcn/ui components
- **Styling:** Tailwind CSS + Office theme integration
- **State Management:** React Context + Hooks
- **Office Integration:** Office.js API
- **HTTP Client:** Supabase Client + Microsoft Graph API
- **Real-time:** Supabase Realtime
- **MCP Integration:** @modelcontextprotocol/sdk for conversational AI
- **Voice Interface:** Web Speech API for voice commands (optional)

#### Backend (Enhanced with MCP)
- **Platform:** Supabase (PostgreSQL + Auth + Real-time)
- **API:** RESTful APIs via Supabase + MCP Server Layer
- **Authentication:** Supabase Auth + Microsoft Identity Platform
- **Database:** PostgreSQL 15+
- **Edge Functions:** Supabase Edge Functions (Node.js)
- **File Storage:** Supabase Storage
- **MCP Server:** @modelcontextprotocol/sdk for natural language interface
- **AI Integration:** LLM client integration (Claude, GPT-4, etc.)

#### External Services
- **Payment Processing:** Stripe
- **Microsoft Services:** Microsoft Graph API, Microsoft Identity Platform
- **Email Service:** Supabase Auth + Microsoft Graph
- **Calendar Integration:** Native Outlook Calendar + Microsoft Graph API
- **GICS Data:** External API integration
- **Weather Service:** OpenWeatherMap API / WeatherAPI.com

### 1.3. Security Architecture
- **Authentication:** Microsoft Identity Platform + JWT-based with Supabase Auth
- **Authorization:** Row Level Security (RLS) in PostgreSQL + Microsoft Graph permissions
- **Data Encryption:** AES-256 encryption at rest
- **HTTPS:** TLS 1.3 for all communications
- **CORS:** Configured for Office add-in domains
- **Rate Limiting:** API rate limiting via Supabase + Microsoft Graph limits + MCP tool rate limiting
- **MCP Security:** Authentication bridge to existing Supabase auth, tool-level permissions

### 1.4. MCP (Model Context Protocol) Integration Layer

#### 1.4.1. MCP Server Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LLM Client    │    │   MCP Server    │    │   Existing      │
│   (Claude, etc) │◄──►│   (Thin Layer)  │◄──►│   Backend APIs  │
│                 │    │                 │    │                 │
│ - Natural Lang  │    │ - Tool Registry │    │ - Subscription  │
│ - Conversation  │    │ - Auth Mapping  │    │ - Role-based    │
│ - Context Mgmt  │    │ - Rate Limiting │    │ - Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Conversation  │    │   MCP Tools     │    │   Database      │
│   Interface     │    │   Registry      │    │   (Unchanged)   │
│                 │    │                 │    │                 │
│ - Chat UI       │    │ - search_events │    │ - All existing  │
│ - Voice Input   │    │ - rsvp_event    │    │ - tables and    │
│ - Suggestions   │    │ - my_agenda     │    │ - security      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 1.4.2. MCP Tool Definitions

**Core Event Management Tools:**
```typescript
// MCP Tool: search_events
{
  name: "search_events",
  description: "Search for investment events using natural language",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Natural language search query" },
      date_range: { type: "string", description: "Optional date range filter" },
      sectors: { type: "array", description: "GICS sectors to filter by" }
    }
  }
}

// MCP Tool: rsvp_event
{
  name: "rsvp_event",
  description: "RSVP to an event (attending/not attending/pending)",
  inputSchema: {
    type: "object",
    properties: {
      event_id: { type: "string", description: "Event identifier" },
      status: { type: "string", enum: ["attending", "not_attending", "pending"] },
      on_behalf_of: { type: "string", description: "User ID if EA acting on behalf" }
    }
  }
}

// MCP Tool: my_agenda
{
  name: "my_agenda",
  description: "Get user's personalized agenda and schedule",
  inputSchema: {
    type: "object",
    properties: {
      date_range: { type: "string", description: "Date range for agenda" },
      view_type: { type: "string", enum: ["my_events", "all_events"] }
    }
  }
}
```

#### 1.4.3. Authentication & Authorization Mapping

```typescript
// Map existing platform authentication to MCP scopes
interface MCPAuthMapping {
  platform_token: string;
  user_id: string;
  role: 'investment_analyst' | 'executive_assistant';
  subscriptions: string[];
  permissions: {
    can_rsvp: boolean;
    can_view_attendees: boolean;
    can_manage_users: string[]; // For EAs
    can_subscribe: boolean;
  };
}

// MCP scope validation
const validateMCPAccess = (token: string, tool: string) => {
  const auth = mapPlatformTokenToMCP(token);
  
  // Enforce same subscription rules as manual interface
  if (tool === 'search_events') {
    return auth.subscriptions.length > 0;
  }
  
  // Enforce role-based access
  if (tool.startsWith('ea_')) {
    return auth.role === 'executive_assistant';
  }
  
  return true;
};
```

#### 1.4.4. Data Flow Diagram

```
Analyst Query: "Find Tesla events next week"
    ↓
MCP Server receives natural language input
    ↓
Authenticate user & validate subscriptions
    ↓
Parse query → search_events tool
    ↓
Call existing GET /api/v1/events/search endpoint
    ↓
Apply subscription filtering (unchanged logic)
    ↓
Return structured response to LLM
    ↓
LLM formats natural language response
    ↓
Present to user with actionable options
```

---

## 2. Database Schema Reference

**Note:** Complete database schema, including all tables, indexes, RLS policies, and business logic functions, is documented in the **AGORA Database Design Document**. This section provides a high-level reference for the Technical Specifications.

### 2.1. Core Tables Overview

The AGORA database includes the following core tables:
- **users** - User profiles and authentication
- **companies** - GICS-classified companies with ticker symbols
- **events** - Investment events with location and weather data
- **event_companies** - Many-to-many relationship for company attendance
- **user_subscriptions** - Sector-based subscription management
- **user_event_responses** - RSVP tracking for events
- **executive_assistant_assignments** - Delegation system
- **notifications** - User notification system

- **weather_cache** - Weather data caching system

### 2.2. Key Database Features

- **Row Level Security (RLS)** - Comprehensive access control
- **Performance Indexes** - Optimized for calendar queries
- **Business Logic Functions** - PostgreSQL functions for complex operations
- **Audit Logging** - Complete data access tracking


### 2.3. Database Integration Points

The database integrates with:
- **Microsoft Graph API** - Calendar synchronization
- **Weather APIs** - Event location weather data
- **Stripe** - Payment processing
- **Supabase Auth** - Authentication and authorization

**For complete database documentation, refer to the AGORA Database Design Document.**

---

## 3. API Endpoints

### 3.1. Authentication Endpoints
```typescript
// Microsoft Identity Platform + Supabase Auth
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/reset-password
POST /auth/refresh-token
GET /auth/microsoft-login
POST /auth/microsoft-callback
```

### 3.2. Microsoft Graph Integration
```typescript
// Microsoft Graph API endpoints
GET /api/microsoft/user-profile
GET /api/microsoft/calendar-events
POST /api/microsoft/create-event
PUT /api/microsoft/update-event
DELETE /api/microsoft/delete-event
GET /api/microsoft/contacts
```

### 3.3. User Management
```typescript
// User profile (enhanced with Microsoft data)
GET /api/users/profile
PUT /api/users/profile
GET /api/users/preferences
PUT /api/users/preferences
GET /api/users/microsoft-sync-status

// Executive Assistant management
GET /api/users/assistants
POST /api/users/assistants
DELETE /api/users/assistants/:id
GET /api/users/assisted-users
```

### 3.4. Company & Subscription Management
```typescript
// Companies
GET /api/companies
GET /api/companies/:id
GET /api/companies/subsectors
GET /api/companies/by-subsector/:subsector

// Subscriptions
GET /api/subscriptions
POST /api/subscriptions
DELETE /api/subscriptions/:id
POST /api/subscriptions/:id/payment
GET /api/subscriptions/payment-status/:id
```

### 3.5. Event Management
```typescript
// Events
GET /api/events
GET /api/events/:id
GET /api/events/my-events
GET /api/events/all-events
GET /api/events/company/:companyId

// Event responses
POST /api/events/:id/respond
PUT /api/events/:id/response
GET /api/events/:id/attendees



// Outlook integration
POST /api/events/:id/sync-to-outlook
POST /api/events/:id/sync-from-outlook
GET /api/events/outlook-sync-status
```

### 3.6. Calendar & Display
```typescript
// Calendar
GET /api/calendar
GET /api/calendar/company/:companyId
PUT /api/calendar/company-order

// Event details
GET /api/events/:id/location
GET /api/events/:id/attendance-status

// Outlook calendar integration
GET /api/calendar/outlook-events
POST /api/calendar/sync-outlook
GET /api/calendar/outlook-conflicts
```

### 3.7. Weather Integration
```typescript
// Weather endpoints
GET /api/weather/event/:eventId
GET /api/weather/location/:location
GET /api/weather/forecast/:eventId
POST /api/weather/refresh/:eventId
GET /api/weather/alerts/:eventId

// Weather notifications
POST /api/weather/notify-severe/:eventId
GET /api/weather/upcoming-alerts
```

### 3.8. Notifications
```typescript
// Notifications
GET /api/notifications
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
DELETE /api/notifications/:id
GET /api/notifications/unread-count

// Outlook notifications
POST /api/notifications/outlook-reminder
GET /api/notifications/outlook-sync

// Weather notifications
POST /api/notifications/weather-alert
GET /api/notifications/weather-updates
```

### 3.9. Payment Integration
```typescript
// Stripe integration
POST /api/payments/create-subscription
POST /api/payments/webhook
GET /api/payments/subscription/:id
PUT /api/payments/subscription/:id/cancel
```

### 3.10. MCP (Model Context Protocol) Integration
```typescript
// MCP Server endpoints
POST /api/v1/mcp/chat - Main conversational interface
POST /api/v1/mcp/tools/:toolName - Direct tool execution
GET /api/v1/mcp/available-tools - List available tools for user
GET /api/v1/mcp/conversation-history - Get conversation context
POST /api/v1/mcp/reset-context - Reset conversation context
GET /api/v1/mcp/audit-log - MCP interaction audit trail

// MCP Tool endpoints (internal)
POST /api/v1/mcp/tools/search_events - Natural language event search
POST /api/v1/mcp/tools/event_details - Get event details via MCP
POST /api/v1/mcp/tools/rsvp_event - RSVP via natural language
POST /api/v1/mcp/tools/my_agenda - Get personalized agenda
POST /api/v1/mcp/tools/who_is_attending - Get attendee information
POST /api/v1/mcp/tools/manage_subscription - Handle subscriptions via MCP
```

### 3.11. Market Data Integration (MVP Phase 1)
```typescript
// S&P500 and Market Data (Essential for MVP)
GET /api/market/sp500-index
GET /api/market/sp500-constituents
GET /api/market/sector-performance

// Company Financial Data (Basic)
GET /api/companies/:ticker/enhanced-profile
GET /api/companies/:ticker/sp500-data

// Market Analytics (Core)
GET /api/events/:id/market-impact
GET /api/market/sentiment/:symbol

// News and Research (Basic)
GET /api/events/:id/news-context
GET /api/news/company/:ticker
```

---

## 4. System Requirements

### 4.1. Performance Requirements
- **Add-in Load Time:** < 3 seconds for initial load
- **API Response Time:** < 500ms for most endpoints
- **Real-time Updates:** < 100ms for live data changes
- **Outlook Integration:** < 1 second for calendar operations
- **Weather API Response:** < 2 seconds for weather data
- **Concurrent Users:** Support 1000+ concurrent users
- **Database Queries:** < 100ms for complex queries

### 4.2. Scalability Requirements
- **Horizontal Scaling:** Auto-scaling based on load
- **Database Scaling:** Read replicas for heavy queries
- **CDN:** Global content delivery for static assets
- **Caching:** Redis for session and query caching
- **Weather Cache:** 1-hour cache for weather data
- **Office Add-in Limits:** Respect Microsoft's add-in size and performance limits

### 4.3. Security Requirements

#### **🔒 CRITICAL: Development-Phase Security Implementation**
**These security measures MUST be implemented during development, not as post-deployment patches:**

#### **4.3.1. Data Protection (Implementation Priority: HIGH)**
- **Data Encryption:** AES-256 for data at rest
- **Transport Security:** TLS 1.3 for all communications
- **No Data Export:** Zero export, copy, print, or sharing capabilities
- **Dynamic Watermarking:** User identification on ALL displayed data
- **Session Logging:** Complete audit trail for all data access

#### **4.3.2. Screenshot & Screen Recording Prevention (Implementation Priority: CRITICAL)**
```typescript
// MUST be implemented in base layout component
- Disable PrintScreen key detection
- Block screen recording APIs
- Prevent browser screenshot extensions
- Disable right-click context menus
- Block developer tools access (F12, Ctrl+Shift+I)
```

#### **4.3.3. Copy & Text Selection Prevention (Implementation Priority: HIGH)**
```typescript
// MUST be applied to all sensitive data displays
- Disable text selection on calendar data
- Block copy/paste operations (Ctrl+C, Ctrl+V)
- Prevent drag-and-drop functionality
- Disable "Save As" and print functions
```

#### **4.3.4. Authentication & Authorization (Implementation Priority: CRITICAL)**
- **Microsoft Identity Platform:** Primary authentication layer
- **Multi-factor Authentication:** Mandatory for all users
- **Session Management:** 15-minute inactivity timeout
- **Role-Based Access:** Fine-grained permissions system
- **Microsoft Graph Permissions:** Minimal required scope

#### **4.3.5. Session Security (Implementation Priority: HIGH)**
```typescript
// Auto-logout and session validation
- 15-minute inactivity timer
- Session token validation on each request
- Concurrent session limits
- Device fingerprinting for session tracking
```

#### **4.3.6. Office Add-in Specific Security (Implementation Priority: MEDIUM)**
- **Add-in Manifest Security:** Restricted permissions and domains
- **Content Security Policy:** Strict CSP headers
- **Office Store Compliance:** Microsoft security guidelines
- **Isolated Storage:** No local storage of sensitive data

### 4.4. Availability Requirements
- **Uptime:** 99.9% availability
- **Backup:** Daily automated backups
- **Disaster Recovery:** RTO < 4 hours, RPO < 1 hour
- **Monitoring:** 24/7 system monitoring
- **Microsoft Graph Availability:** Dependent on Microsoft's service availability
- **Weather API Availability:** 99.5% availability for weather services

---

## 5. Integration Points

### 5.1. Microsoft Graph API
- **Calendar Management:** Read/write Outlook calendar events
- **Email Integration:** Access to user's email for notifications
- **User Profile:** Get user information from Microsoft account
- **Contacts:** Access to user's contact list
- **Real-time Notifications:** Webhook integration for calendar changes

### 5.2. Payment Gateway (Stripe)
- **Subscription Management:** Monthly/yearly subsector subscriptions
- **Webhook Handling:** Real-time payment status updates
- **Refund Processing:** Automated refund handling
- **Tax Calculation:** Automatic tax calculation based on location

### 5.3. Weather API Integration
- **Current Weather:** Real-time weather conditions for event locations
- **Forecast Data:** 3-day weather forecasts for event planning
- **Weather Alerts:** Severe weather notifications for events
- **Location Services:** Geocoding for event addresses
- **Weather Icons:** Visual weather representation

### 5.4. Email Notifications
- **Event Reminders:** Automated event reminders via Outlook
- **Payment Confirmations:** Subscription payment confirmations
- **System Notifications:** Important system updates

- **Weather Alerts:** Severe weather notifications for upcoming events

### 5.5. Financial Data APIs (MVP Phase 1)

#### **S&P500 & Market Data APIs (Essential)**
- **Alpha Vantage API:** Real-time S&P500 data, stock quotes, and market indicators
- **Yahoo Finance API:** Comprehensive financial data including S&P500 components

#### **Key S&P500 Data Points for AGORA:**
```typescript
// S&P500 Index Data
GET /api/market/sp500-index
{
  "symbol": "^GSPC",
  "current_price": 4850.25,
  "change": 15.75,
  "change_percent": 0.33,
  "volume": 2500000000,
  "market_cap": 45000000000000,
  "pe_ratio": 25.4,
  "dividend_yield": 1.45
}

// S&P500 Constituents
GET /api/market/sp500-constituents
{
  "constituents": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "weight": 7.2,
      "market_cap": 3200000000000,
      "price": 185.50
    }
  ],
  "total_constituents": 500,
  "last_updated": "2024-01-15T16:00:00Z"
}

// Sector Performance
GET /api/market/sector-performance
{
  "sectors": [
    {
      "sector": "Technology",
      "performance": 2.5,
      "weight": 28.5,
      "top_contributors": ["AAPL", "MSFT", "NVDA"]
    }
  ]
}
```

### 5.6. Company Information APIs (MVP Phase 1)

#### **Basic Company Data Sources:**
- **Yahoo Finance API:** Company profiles and basic financial data
- **Alpha Vantage API:** S&P500 constituent data and market metrics

#### **Company Profile Enhancement (Basic):**
```typescript
// Basic company data for MVP
GET /api/companies/:ticker/enhanced-profile
{
  "basic_info": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "subsector": "Technology Hardware & Equipment"
  },
  "sp500_data": {
    "is_sp500_constituent": true,
    "sp500_rank": 1,
    "sp500_weight": 7.2,
    "sector_performance": 2.5
  },
  "basic_metrics": {
    "market_cap": 3200000000000,
    "current_price": 185.50
  }
}
```

### 5.7. Market Analytics APIs (MVP Phase 1)

#### **Basic Market Data:**
- **Alpha Vantage API:** Basic market sentiment and S&P500 data
- **Yahoo Finance API:** Simple market impact analysis

#### **Market Impact Analysis (Basic):**
```typescript
// Basic market impact for events
GET /api/events/:id/market-impact
{
  "event_id": "event-123",
  "company": "AAPL",
  "market_impact": {
    "sentiment_score": 0.75,
    "sp500_correlation": 0.85
  },
  "sector_impact": "Technology sector may see increased volatility"
}
```

### 5.8. News & Research APIs (MVP Phase 1)

#### **Basic News Sources:**
- **Yahoo Finance API:** Basic company news and updates
- **Alpha Vantage API:** Simple news sentiment analysis

#### **Event Context Enhancement (Basic):**
```typescript
// Basic news context for events
GET /api/events/:id/news-context
{
  "event_id": "event-123",
  "company": "AAPL",
  "recent_news": [
    {
      "headline": "Apple Reports Strong Q4 Results",
      "source": "Yahoo Finance",
      "published": "2024-01-20T10:30:00Z",
      "sentiment": "positive"
    }
  ]
}
```

### 5.9. Economic Data APIs

#### **Economic Indicators:**
- **Federal Reserve API:** Interest rates and monetary policy data
- **Bureau of Labor Statistics API:** Employment and inflation data
- **Bureau of Economic Analysis API:** GDP and economic growth data
- **World Bank API:** Global economic indicators
- **IMF API:** International economic data

#### **Economic Context:**
```typescript
// Economic context for events
GET /api/events/:id/economic-context
{
  "event_id": "event-123",
  "economic_indicators": {
    "federal_funds_rate": 5.25,
    "inflation_rate": 3.1,
    "unemployment_rate": 3.7,
    "gdp_growth": 2.1
  },
  "market_conditions": {
    "vix_index": 18.5,
    "treasury_yield_10y": 4.2,
    "dollar_index": 103.5
  }
}
```

### 5.10. Regulatory & Compliance APIs

#### **Regulatory Data Sources:**
- **SEC API:** Regulatory filings and compliance data
- **FINRA API:** Broker-dealer and regulatory information
- **FDIC API:** Banking sector data and regulations
- **CFTC API:** Commodity trading data and regulations

#### **Compliance Integration:**
```typescript
// Regulatory compliance for events
GET /api/events/:id/compliance-status
{
  "event_id": "event-123",
  "company": "AAPL",
  "compliance": {
    "sec_filings": [
      {
        "filing_type": "10-K",
        "filing_date": "2024-01-15",
        "status": "filed"
      }
    ],
    "insider_trading": {
      "recent_transactions": [],
      "blackout_period": false
    },
    "regulatory_alerts": []
  }
}
```

### 5.11. Alternative Data APIs

#### **Alternative Data Sources:**
- **Satellite Data APIs:** Retail parking lot activity, shipping data
- **Social Media APIs:** Twitter, Reddit sentiment analysis
- **Web Traffic APIs:** Website traffic and engagement data
- **Credit Card APIs:** Consumer spending patterns
- **Supply Chain APIs:** Global supply chain data

#### **Alternative Data Integration:**
```typescript
// Alternative data for companies
GET /api/companies/:ticker/alternative-data
{
  "company": "AAPL",
  "retail_data": {
    "store_traffic": "increasing",
    "online_sales": "strong",
    "customer_sentiment": "positive"
  },
  "supply_chain": {
    "component_shortages": "none",
    "shipping_delays": "minimal",
    "inventory_levels": "healthy"
  },
  "social_sentiment": {
    "twitter_sentiment": 0.75,
    "reddit_sentiment": 0.68,
    "overall_sentiment": "positive"
  }
}
```

---

## 6. Development Environment

### 6.1. Local Development Setup
```bash
# Office Add-in development
npm install -g yo generator-office
yo office

# Frontend
npm install
npm run dev

# Database (Supabase CLI)
supabase start
supabase db reset

# Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Microsoft Graph & Identity Platform
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_microsoft_tenant_id
MICROSOFT_REDIRECT_URI=your_microsoft_redirect_uri

# Weather API Configuration
WEATHER_API_KEY=your_weather_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5
WEATHER_API_PROVIDER=openweathermap

# Financial Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
POLYGON_API_KEY=your_polygon_api_key
FINNHUB_API_KEY=your_finnhub_api_key

# Market Data APIs
TRADINGVIEW_API_KEY=your_tradingview_key
BENZINGA_API_KEY=your_benzinga_key
SENTIMENT_API_KEY=your_sentiment_analysis_key

# News & Research APIs
REUTERS_API_KEY=your_reuters_api_key
BLOOMBERG_API_KEY=your_bloomberg_api_key
SEEKING_ALPHA_API_KEY=your_seeking_alpha_key
MARKETWATCH_API_KEY=your_marketwatch_key
CNBC_API_KEY=your_cnbc_api_key

# Economic Data APIs
FEDERAL_RESERVE_API_KEY=your_fed_api_key
BLS_API_KEY=your_bls_api_key
BEA_API_KEY=your_bea_api_key
WORLD_BANK_API_KEY=your_world_bank_key
IMF_API_KEY=your_imf_api_key

# Regulatory APIs
SEC_API_KEY=your_sec_api_key
FINRA_API_KEY=your_finra_api_key
FDIC_API_KEY=your_fdic_api_key
CFTC_API_KEY=your_cftc_api_key

# Alternative Data APIs
SATELLITE_DATA_API_KEY=your_satellite_data_key
TWITTER_API_KEY=your_twitter_api_key
REDDIT_API_KEY=your_reddit_api_key
WEB_TRAFFIC_API_KEY=your_web_traffic_key
SUPPLY_CHAIN_API_KEY=your_supply_chain_key

# Security & Session Management
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key

# Application Configuration
NODE_ENV=development
APP_ENV=development
PORT=3000
API_BASE_URL=your_api_base_url

# Database Configuration
DATABASE_URL=your_database_connection_string
DATABASE_POOL_SIZE=10
DATABASE_SSL_MODE=require

# Email & Notification Services
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@agora.com

# Monitoring & Analytics
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
GOOGLE_ANALYTICS_ID=your_ga_id

# Office Add-in Configuration
OFFICE_ADD_IN_ID=your_office_add_in_id
OFFICE_ADD_IN_MANIFEST_URL=your_manifest_url

# CORS & Security
ALLOWED_ORIGINS=https://your-domain.com,https://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
REDIS_URL=your_redis_connection_string
CACHE_TTL=3600

# File Storage
SUPABASE_STORAGE_BUCKET=agora-assets
SUPABASE_STORAGE_URL=your_storage_url

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Feature Flags
ENABLE_WEATHER_FEATURE=true
ENABLE_PAYMENT_FEATURE=true
ENABLE_SCREENSHOT_PREVENTION=true
ENABLE_WATERMARKING=true

# Development Tools
ENABLE_DEBUG_MODE=false
ENABLE_TEST_MODE=false
```

### 6.2. Testing Strategy
- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Playwright for critical user flows
- **Office Add-in Tests:** Office Add-in testing framework
- **Performance Tests:** Load testing with Artillery
- **Weather API Tests:** Mock weather API responses

### 6.3. Deployment Pipeline
- **CI/CD:** GitHub Actions
- **Staging:** Automatic deployment to staging environment
- **Production:** Manual approval for production deployments
- **Office Store:** Deployment to Microsoft AppSource
- **Rollback:** Automated rollback capabilities

### 6.4. Security Implementation Checklist for Development

#### **🔴 Phase 1: Core Security Foundation (Week 1-2)**
```typescript
// Base security layout component - MUST BE FIRST
✅ Create SecurityProvider context
✅ Implement screenshot prevention hooks
✅ Add session timeout monitoring
✅ Setup security event logging
✅ Implement watermarking service
```

#### **🟡 Phase 2: Data Protection Layer (Week 2-3)**
```typescript
// Apply to all data display components
✅ Add copy prevention to calendar components
✅ Disable text selection on sensitive data
✅ Implement security alerts system
✅ Add audit logging for data access
✅ Setup dynamic watermarking display
```

#### **🟢 Phase 3: Advanced Security Features (Week 3-4)**
```typescript
// Enhanced security measures
✅ Implement device fingerprinting
✅ Add concurrent session management
✅ Setup security monitoring dashboard
✅ Implement breach detection alerts
✅ Add security compliance reporting
```

#### **Security Testing Requirements:**
- **Unit Tests:** Security hook testing
- **Integration Tests:** Security policy validation
- **E2E Tests:** Screenshot prevention verification
- **Penetration Testing:** Security vulnerability assessment
- **Compliance Testing:** Microsoft Office security standards

---

## 7. Monitoring & Analytics

### 7.1. Application Monitoring
- **Error Tracking:** Sentry for error monitoring
- **Performance Monitoring:** New Relic or DataDog
- **User Analytics:** Google Analytics 4
- **Real-time Monitoring:** Supabase Dashboard
- **Office Add-in Analytics:** Microsoft's add-in analytics
- **Weather API Monitoring:** API response times and error rates

### 7.2. Business Metrics
- **User Engagement:** Daily/Monthly active users
- **Subscription Metrics:** Conversion rates, churn
- **Event Participation:** RSVP rates, attendance
- **Feature Usage:** Most used features, user paths
- **Outlook Integration:** Calendar sync success rates
- **Weather Feature Usage:** Weather data access patterns

---

## 8. Future Technical Considerations

### 8.1. AI/ML Integration
- **LLM Chatbot:** OpenAI GPT integration for user assistance

- **Predictive Analytics:** User behavior prediction
- **Smart Calendar:** AI-powered calendar optimization
- **Weather Predictions:** ML-based weather impact analysis

### 8.2. Advanced Features
- **Mobile Outlook:** Support for Outlook mobile app
- **Offline Support:** Service workers for offline functionality
- **Advanced Search:** Elasticsearch integration
- **Real-time Chat:** WebSocket-based chat system
- **Voice Commands:** Integration with Microsoft's voice features
- **Weather Maps:** Interactive weather maps for event locations

### 8.3. Scalability Enhancements
- **Microservices:** Break down into smaller services
- **Event Sourcing:** For complex event workflows
- **GraphQL:** For more efficient data fetching
- **Edge Computing:** CDN-based edge functions
- **Office Add-in Optimization:** Performance improvements for add-in size and speed
- **Weather Data Optimization:** Advanced caching and CDN for weather data 

---

## 10. Security Implementation Reference

**Note:** Complete security implementation details, including RLS policies, audit logging, screenshot prevention, and session management, are documented in the **AGORA Database Design Document**. This section provides a high-level reference for the Technical Specifications.

### 10.1. Security Architecture Overview

The AGORA security implementation includes:
- **Row Level Security (RLS)** - Comprehensive database access control
- **Screenshot Prevention** - Dynamic watermarking and copy protection
- **Session Management** - Timeout handling and concurrent session control
- **Audit Logging** - Complete data access and security event tracking
- **Rate Limiting** - API endpoint protection and abuse prevention

### 10.2. Key Security Components

```typescript
// Security provider interface
interface SecurityProvider {
  preventScreenshots(): void;
  addDynamicWatermark(userId: string, timestamp: string): void;
  preventCopyPaste(): void;
  startSessionTimeout(): void;
  logSecurityEvent(event: SecurityEvent): void;
}

// Security context for React components
const SecurityContext = createContext<SecurityProvider | null>(null);
const useSecurity = () => useContext(SecurityContext);
```

### 10.3. Security Integration Points

Security measures integrate with:
- **Database Layer** - RLS policies and audit logging
- **Frontend Components** - Screenshot prevention and watermarking
- **API Endpoints** - Rate limiting and access control
- **Session Management** - Timeout handling and device fingerprinting

**For complete security implementation details, refer to the AGORA Database Design Document.**

---

## 11. Data Protection Reference

**Note:** Complete data protection implementation details, including screenshot prevention, dynamic watermarking, copy protection, and session security, are documented in the **AGORA Database Design Document**. This section provides a high-level reference for the Technical Specifications.

### 11.1. Data Protection Overview

The AGORA data protection system includes:
- **Screenshot Prevention** - CSS and JavaScript-based protection
- **Dynamic Watermarking** - User-specific watermarks with timestamps
- **Copy Protection** - Text selection and copy/paste prevention
- **Session Security** - Timeout management and device fingerprinting
- **Audit Logging** - Complete data access tracking

### 11.2. Key Protection Components

```typescript
// Data protection interface
interface DataProtection {
  preventScreenshots(): void;
  addWatermark(content: string, userId: string): string;
  preventCopyPaste(): void;
  logDataAccess(dataType: string, action: string): void;
}

// CSS protection classes
const protectionStyles = `
  .agora-protected {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
`;
```

### 11.3. Protection Integration Points

Data protection integrates with:
- **Calendar Display** - Watermarked event data
- **User Interface** - Screenshot and copy prevention
- **Session Management** - Timeout and access control
- **Audit System** - Complete access logging

**For complete data protection implementation details, refer to the AGORA Database Design Document.**

### 11.3. Copy Prevention
```typescript
// Prevent text selection and copying
document.addEventListener('copy', (e) => {
  e.preventDefault();
  showSecurityAlert('Copying data is not allowed');
  return false;
});

// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showSecurityAlert('Right-click is disabled for security');
  return false;
});

// Prevent drag and drop
document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
});
```

### 11.4. Session Security
```typescript
// Auto-logout on inactivity
let inactivityTimer: NodeJS.Timeout;

const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    logoutUser('Session expired due to inactivity');
  }, 15 * 60 * 1000); // 15 minutes
};

// Monitor user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
```

### 11.5. Data Access Logging
```typescript
// Log all data access attempts
const logDataAccess = (userId: string, dataType: string, action: string) => {
  await supabase.from('data_access_logs').insert({
    user_id: userId,
    data_type: dataType,
    action: action,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: navigator.userAgent
  });
};

// Log calendar view attempts
const logCalendarAccess = (userId: string, companyId?: string) => {
  logDataAccess(userId, 'calendar', `view${companyId ? `_company_${companyId}` : ''}`);
};
```

### 11.6. Security Alerts
```typescript
// Show security alerts to users
const showSecurityAlert = (message: string) => {
  const alert = document.createElement('div');
  alert.className = 'security-alert';
  alert.innerHTML = `
    <div class="alert-content">
      <h3>⚠️ Security Alert</h3>
      <p>${message}</p>
      <p>This action has been logged for security purposes.</p>
    </div>
  `;
  document.body.appendChild(alert);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
};
```

### 11.7. Database Schema for Security Logging
```sql
-- Data access logging table
CREATE TABLE data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL, -- calendar, events, companies
  action VARCHAR(100) NOT NULL, -- view, attempt_screenshot, attempt_copy
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  additional_data JSONB
);

-- Security alerts table
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- screenshot_attempt, copy_attempt, export_attempt
  alert_message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'medium' -- low, medium, high, critical
);
```

### 11.8. Frontend Security Measures
```typescript
// Disable developer tools
document.addEventListener('keydown', (e) => {
  // Prevent F12, Ctrl+Shift+I, Ctrl+U
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
    (e.ctrlKey && e.key === 'u')
  ) {
    e.preventDefault();
    showSecurityAlert('Developer tools are disabled for security');
  }
});

// Prevent view source
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    return false;
  }
});

// Disable text selection on sensitive data
const disableTextSelection = () => {
  const sensitiveElements = document.querySelectorAll('.calendar-data, .event-details');
  sensitiveElements.forEach(element => {
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.mozUserSelect = 'none';
    element.style.msUserSelect = 'none';
  });
};
```

This comprehensive security approach ensures that:
- **No data can be exported** from the system
- **Screenshots are prevented** through multiple layers
- **All access is logged** for audit purposes
- **Dynamic watermarks** identify the source of any leaked data
- **Session security** prevents unauthorized access
- **Copy prevention** stops data extraction 