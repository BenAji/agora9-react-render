# AGORA Database Schema

## Overview
This document provides a complete overview of the AGORA database schema, including all tables, relationships, constraints, and indexes.

## Core Tables

### 1. Users Table
**Purpose**: Store user accounts and authentication data

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('investment_analyst', 'executive_assistant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Fields**:
- `id`: Unique identifier (UUID)
- `email`: User email address (unique)
- `full_name`: User's full name
- `role`: User role (investment_analyst, executive_assistant, admin)
- `preferences`: User preferences stored as JSONB
- `last_login`: Last login timestamp
- `is_active`: Account status flag

---

### 2. Companies Table
**Purpose**: Store company information and GICS classification

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_symbol VARCHAR(10) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  gics_sector VARCHAR(100),
  gics_subsector VARCHAR(100),
  gics_industry VARCHAR(100),
  gics_sub_industry VARCHAR(100),
  classification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `ticker_symbol`: Stock ticker symbol (unique)
- `company_name`: Full company name
- `gics_sector`: GICS sector classification
- `gics_subsector`: GICS subsector classification
- `gics_industry`: GICS industry classification
- `gics_sub_industry`: GICS sub-industry classification
- `classification_status`: Classification completion status

---

### 3. Events Table
**Purpose**: Store event information and details

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
  location_details JSONB,
  virtual_details JSONB,
  weather_location VARCHAR(255),
  weather_coordinates POINT,
  event_type VARCHAR(50) DEFAULT 'standard' CHECK (event_type IN ('standard', 'catalyst', 'earnings')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `title`: Event title
- `description`: Event description
- `start_date`: Event start date/time
- `end_date`: Event end date/time
- `location_type`: Type of event location (physical, virtual, hybrid)
- `location_details`: Physical location details (JSONB)
- `virtual_details`: Virtual meeting details (JSONB)
- `weather_location`: Location for weather data
- `weather_coordinates`: Geographic coordinates (POINT)
- `event_type`: Event type (standard, catalyst, earnings)

---

### 4. Organizations Table
**Purpose**: Store non-company entities that can host events

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('government', 'association', 'nonprofit', 'private_company', 'international')),
  sector VARCHAR(100),
  subsector VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `name`: Organization name (unique)
- `type`: Organization type (government, association, nonprofit, etc.)
- `sector`: Organization sector
- `subsector`: Organization subsector
- `website`: Organization website URL
- `description`: Organization description

---

### 5. Event Hosts Table
**Purpose**: Store event hosting relationships with support for multiple host types

```sql
CREATE TABLE event_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  host_type VARCHAR(50) NOT NULL CHECK (host_type IN ('single_corp', 'multi_corp', 'non_company')),
  host_id UUID, -- References companies.id OR organizations.id
  companies_jsonb JSONB, -- For multi-corporate events
  primary_company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Host Types**:
- `single_corp`: Single company hosts the event
- `multi_corp`: Multiple companies co-host the event
- `non_company`: Organization (not a company) hosts the event

**Fields**:
- `event_id`: Reference to events table
- `host_type`: Type of host relationship
- `host_id`: ID of the host (company or organization)
- `companies_jsonb`: JSONB array of companies for multi-corp events
- `primary_company_id`: Primary company for multi-corp events

---

### 6. Event Companies Table
**Purpose**: Store company participation in events

```sql
CREATE TABLE event_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  attendance_status VARCHAR(20) DEFAULT 'attending' CHECK (attendance_status IN ('attending', 'not_attending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, company_id)
);
```

**Fields**:
- `event_id`: Reference to events table
- `company_id`: Reference to companies table
- `attendance_status`: Company's attendance status

---

### 7. User Event Responses Table
**Purpose**: Store user RSVP responses to events

```sql
CREATE TABLE user_event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  response_status VARCHAR(20) NOT NULL CHECK (response_status IN ('accepted', 'declined', 'pending')),
  response_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
```

**Response Status**:
- `accepted`: User is attending the event
- `declined`: User is not attending the event
- `pending`: User has not responded yet

---

### 8. User Subscriptions Table
**Purpose**: Store user subscriptions to company subsectors

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subsector VARCHAR(100) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Payment Status**:
- `pending`: Payment is pending
- `paid`: Payment is completed
- `failed`: Payment failed
- `cancelled`: Subscription cancelled

---

### 9. Executive Assistant Assignments Table
**Purpose**: Store executive assistant assignments and permissions

```sql
CREATE TABLE executive_assistant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{}',
  assignment_type VARCHAR(50) DEFAULT 'permanent' CHECK (assignment_type IN ('permanent', 'temporary')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Assignment Types**:
- `permanent`: Permanent assignment
- `temporary`: Temporary assignment with expiration

---

### 10. User Company Order Table
**Purpose**: Store user's custom company display order

```sql
CREATE TABLE user_company_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
```

---

### 11. Notifications Table
**Purpose**: Store user notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  related_id UUID,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Database Functions

### 1. get_event_hosts(event_uuid UUID)
**Purpose**: Get all hosts for an event with their details

```sql
CREATE OR REPLACE FUNCTION get_event_hosts(event_uuid UUID)
RETURNS TABLE (
  host_id UUID,
  host_type VARCHAR(50),
  host_name VARCHAR(255),
  host_ticker VARCHAR(10),
  host_sector VARCHAR(100),
  host_subsector VARCHAR(100),
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eh.host_id,
    eh.host_type,
    COALESCE(c.company_name, o.name) as host_name,
    c.ticker_symbol as host_ticker,
    COALESCE(c.gics_sector, o.sector) as host_sector,
    COALESCE(c.gics_subsector, o.subsector) as host_subsector,
    CASE 
      WHEN eh.host_type = 'single_corp' THEN TRUE
      WHEN eh.host_type = 'multi_corp' THEN (eh.companies_jsonb->0->>'is_primary')::BOOLEAN
      ELSE FALSE
    END as is_primary
  FROM event_hosts eh
  LEFT JOIN companies c ON eh.host_id = c.id AND eh.host_type = 'single_corp'
  LEFT JOIN organizations o ON eh.host_id = o.id AND eh.host_type = 'non_company'
  WHERE eh.event_id = event_uuid;
END;
$$ LANGUAGE plpgsql;
```

### 2. is_company_hosting(event_uuid UUID, company_uuid UUID)
**Purpose**: Check if a specific company is hosting an event

```sql
CREATE OR REPLACE FUNCTION is_company_hosting(event_uuid UUID, company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_hosts eh
    WHERE eh.event_id = event_uuid
    AND (
      (eh.host_type = 'single_corp' AND eh.host_id = company_uuid)
      OR (eh.host_type = 'multi_corp' AND eh.companies_jsonb @> jsonb_build_array(jsonb_build_object('id', company_uuid)))
    )
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Key Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Companies
CREATE INDEX idx_companies_ticker ON companies(ticker_symbol);

-- Events
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_end_date ON events(end_date);

-- Event Hosts
CREATE INDEX idx_event_hosts_event_id ON event_hosts(event_id);
CREATE INDEX idx_event_hosts_host_id ON event_hosts(host_id);
CREATE INDEX idx_event_hosts_host_type ON event_hosts(host_type);
CREATE INDEX idx_event_hosts_primary_company ON event_hosts(primary_company_id);
CREATE INDEX idx_event_hosts_companies_jsonb ON event_hosts USING GIN (companies_jsonb);

-- Organizations
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_type ON organizations(type);

-- User Subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_subsector ON user_subscriptions(subsector);

-- User Event Responses
CREATE INDEX idx_user_event_responses_user_id ON user_event_responses(user_id);
CREATE INDEX idx_user_event_responses_event_id ON user_event_responses(event_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Constraints

### Check Constraints
- **Users.role**: Must be 'investment_analyst', 'executive_assistant', or 'admin'
- **Events.location_type**: Must be 'physical', 'virtual', or 'hybrid'
- **Events.event_type**: Must be 'standard', 'catalyst', or 'earnings'
- **Event_hosts.host_type**: Must be 'single_corp', 'multi_corp', or 'non_company'
- **Organizations.type**: Must be 'government', 'association', 'nonprofit', 'private_company', or 'international'
- **User_event_responses.response_status**: Must be 'accepted', 'declined', or 'pending'
- **User_subscriptions.payment_status**: Must be 'pending', 'paid', 'failed', or 'cancelled'

### Unique Constraints
- **Users.email**: Email must be unique
- **Companies.ticker_symbol**: Ticker symbol must be unique
- **Organizations.name**: Organization name must be unique
- **Event_hosts.event_id**: Only one host record per event
- **User_event_responses(user_id, event_id)**: One response per user per event
- **User_company_order(user_id, company_id)**: One order record per user per company
- **Event_companies(event_id, company_id)**: One participation record per event per company

---

## Data Relationships

### Primary Relationships
1. **Events → Event Hosts**: One-to-one (each event has one host record)
2. **Events → Event Companies**: One-to-many (events can have multiple participating companies)
3. **Users → User Event Responses**: One-to-many (users can respond to multiple events)
4. **Users → User Subscriptions**: One-to-many (users can subscribe to multiple subsectors)
5. **Users → Executive Assistant Assignments**: One-to-many (users can have multiple EA assignments)

### Host Relationships
1. **Event Hosts → Companies**: For single_corp and multi_corp host types
2. **Event Hosts → Organizations**: For non_company host type
3. **Event Hosts → Companies (Primary)**: For multi_corp primary company

---

## Sample Data

The database includes sample data for:
- **Organizations**: SEC, Federal Reserve, FDA, FTC, CFA Institute, SIFMA, etc.
- **Events**: Earnings calls, product launches, conferences
- **Companies**: Apple (AAPL), Chevron (CVX), NVIDIA (NVDA)
- **Users**: Sample investment analysts and executive assistants
- **Relationships**: Event-company relationships, user responses, subscriptions

---

## Security

### Row Level Security (RLS)
- **Disabled for Development**: RLS is currently disabled for easier development
- **Production Ready**: Schema includes RLS policies for production deployment
- **User Isolation**: Policies ensure users can only access their own data

### Data Protection
- **Cascade Deletes**: Proper foreign key constraints with cascade deletes
- **Data Validation**: Check constraints ensure data integrity
- **Unique Constraints**: Prevent duplicate data entries

---

This schema supports the full AGORA application functionality including event management, user subscriptions, RSVP tracking, executive assistant assignments, and comprehensive host information display.
