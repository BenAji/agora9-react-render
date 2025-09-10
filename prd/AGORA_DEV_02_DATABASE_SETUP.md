# AGORA Development Guide 02: Database Setup & Supabase Implementation (User Story Aligned)

> **⚠️ PREREQUISITE:** Complete **AGORA_DEV_01_PROJECT_SETUP** before starting this document.

## 📋 Overview

This document guides you through setting up the complete Supabase database infrastructure for AGORA using **Cursor AI IDE**. You'll implement the database schema aligned with user stories, Row Level Security (RLS), business logic functions, and data seeding as defined in the AGORA Database Design document and User Stories Requirements.

## 🎯 What You'll Accomplish

- ✅ Set up Supabase project and local development
- ✅ Implement user story-aligned database schema (15+ tables)
- ✅ Configure role-based authentication (Investment Analyst & Executive Assistant)
- ✅ Implement subscription-based access control with payment integration
- ✅ Set up Executive Assistant delegation system

- ✅ Configure Row Level Security (RLS) policies
- ✅ Create business logic functions for user story features
- ✅ Set up database migrations
- ✅ Implement seed data for development
- ✅ Configure database monitoring and optimization

## 📊 User Story-Aligned Database Overview

You'll implement these tables and relationships to support the user stories:

```mermaid
erDiagram
    Users ||--o{ User_Subscriptions : has
    Users ||--o{ User_Event_Responses : makes
    Users ||--o{ User_Company_Order : customizes
    Users ||--o{ Executive_Assistant_Assignments : assists
    
    Companies ||--o{ Event_Companies : participates
    Companies ||--o{ User_Subscriptions : subscribed_to
    Events ||--o{ Event_Companies : includes
    Events ||--o{ User_Event_Responses : receives
    
    Sectors ||--o{ Companies : categorizes
    Sectors ||--o{ User_Subscriptions : subscription_type
    User_Subscriptions ||--o{ Stripe_Payments : payment_for
```

### **User Story Requirements Mapped to Database:**

1. **Role-Based Access**: `users.role` → 'investment_analyst' | 'executive_assistant'
2. **Subscription & Payment**: `user_subscriptions` with Stripe integration
3. **Executive Assistant Delegation**: `executive_assistant_assignments` table
4. **Company Row Ordering**: `user_company_order` for drag-and-drop preferences

6. **GICS Company Classification**: Events organized by attending companies, not just hosting
7. **Color-Coded RSVP**: `user_event_responses.response_status` → green/yellow/grey
8. **Real-time Updates**: Database triggers and Supabase real-time subscriptions

---

## 🚀 Step 1: Supabase Project Setup

### **1.1 Create Supabase Account and Project**

1. **Go to [supabase.com](https://supabase.com) and create account**
2. **Create new project:**
   - Project name: `agora-dev`
   - Database password: Generate strong password (save it!)
   - Region: Choose closest to your location

### **1.2 Initialize Local Supabase Environment**

**Cursor AI Prompt:**
```
Navigate to the backend/ directory and initialize a Supabase project for local development. Configure the supabase/config.toml file with proper settings for the AGORA project including:
- Database port configuration
- API port settings
- Studio port configuration
- Auth settings for Microsoft integration
- Storage configuration for future file uploads
- Real-time subscriptions for Executive Assistant notifications
```

**Manual Commands:**
```bash
# Navigate to backend directory
cd backend/

# Initialize Supabase project
supabase init

# Start local Supabase (will download Docker images)
supabase start
```

### **1.3 Configure Environment Variables**

**Cursor AI Prompt:**
```
Create a .env file in the backend/ directory with all necessary Supabase environment variables for user story implementation:
- SUPABASE_URL (from your Supabase dashboard)
- SUPABASE_ANON_KEY (from your Supabase dashboard)
- SUPABASE_SERVICE_ROLE_KEY (from your Supabase dashboard)
- DATABASE_URL (for local development)
- Local Supabase development URLs
- Stripe payment integration keys for subscription management
- Microsoft Graph API keys for Executive Assistant integration

Include detailed comments explaining each variable and how to obtain the values.
```

**Expected .env structure:**
```env
# Supabase Production Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Local Development Configuration  
SUPABASE_LOCAL_URL=http://localhost:54321
SUPABASE_LOCAL_ANON_KEY=your-local-anon-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# API Configuration
API_PORT=3000
CORS_ORIGIN=http://localhost:5173

# Stripe Payment Integration (User Story: Subscriptions & Payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Microsoft Graph API (Executive Assistant Integration)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-microsoft-tenant-id
MICROSOFT_REDIRECT_URI=your-microsoft-redirect-uri
```

---

## 🗄️ Step 2: User Story-Aligned Database Schema Implementation

### **2.1 Create Core Tables with User Story Focus**

**Cursor AI Prompt:**
```
Create the complete database schema for AGORA that implements all user story requirements. The schema should include:

1. Users table with role-based authentication:
   - Support for 'investment_analyst' and 'executive_assistant' roles
   - User preferences for calendar display, company ordering, and notification settings

2. Companies table with GICS classification:
   - Complete GICS sector and subsector information
   - Support for event classification by company attendance

3. Events table with comprehensive location and attendance tracking:
   - Physical and virtual event support
   - Full address details for physical events
   - Weather integration for outdoor events

4. Executive Assistant delegation system:
   - executive_assistant_assignments table for multi-user management
   - Permissions and access control for assisted users

5. Subscription management with payment integration:
   - user_subscriptions table with Stripe payment fields
   - Subsector-based subscription model
   - Payment status tracking and expiration handling


   - Quality scoring and reputation management
   - Subscription requirement checking

7. User customization tables:
   - user_company_order for drag-and-drop company row preferences
   - user_event_responses for color-coded RSVP tracking

8. Real-time notification system:
   - notifications table for Executive Assistant alerts
   - Event reminders and notifications

Create all tables with proper constraints, indexes, and foreign key relationships.
```

**Create the migration file:**

```bash
# Create first migration for core schema
supabase migration new "create_user_story_aligned_schema"
```

**Migration file content (001_create_user_story_aligned_schema.sql):**

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Users table with user story roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'investment_analyst',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- User Story Constraints
  CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT check_valid_role CHECK (role IN ('investment_analyst', 'executive_assistant')),
  CONSTRAINT check_name_length CHECK (length(full_name) >= 2)
);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Companies table with GICS classification
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_symbol VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  gics_sector VARCHAR(100) NOT NULL,
  gics_subsector VARCHAR(100) NOT NULL,
  gics_industry VARCHAR(100),
  gics_sub_industry VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  classification_status VARCHAR(50) DEFAULT 'complete',
  
  -- Constraints
  CONSTRAINT check_ticker_format CHECK (ticker_symbol ~* '^[A-Z0-9.-]{1,20}$'),
  CONSTRAINT check_company_name_length CHECK (length(company_name) >= 2),
  CONSTRAINT check_classification_status CHECK (classification_status IN ('complete', 'partial', 'pending'))
);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Events table with comprehensive location support
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location_type VARCHAR(50) NOT NULL DEFAULT 'physical',
  location_details JSONB,
  virtual_details JSONB,
  weather_location VARCHAR(255),
  weather_coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  event_type VARCHAR(50) DEFAULT 'standard',
  
  -- Constraints
  CONSTRAINT check_date_order CHECK (end_date > start_date),
  CONSTRAINT check_title_length CHECK (length(title) >= 3),
  CONSTRAINT check_location_type CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
  CONSTRAINT check_event_type CHECK (event_type IN ('standard', 'catalyst'))
);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Event-Company relationship (many-to-many for attendance tracking)
CREATE TABLE event_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  attendance_status VARCHAR(50) DEFAULT 'attending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_attendance_status CHECK (attendance_status IN ('attending', 'not_attending', 'pending')),
  UNIQUE(event_id, company_id)
);

-- 5. User Subscriptions with Stripe payment integration
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subsector VARCHAR(100) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  source VARCHAR(50) DEFAULT 'direct', -- direct, promotion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints for payment integration
  CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  CONSTRAINT check_expires_at CHECK (expires_at IS NULL OR expires_at > created_at),
  CONSTRAINT check_source CHECK (source IN ('direct', 'promotion')),
  UNIQUE(user_id, subsector)
);

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. User Event Responses (color-coded RSVP)
CREATE TABLE user_event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  response_status VARCHAR(50) DEFAULT 'pending',
  response_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  -- User Story: Color coding - green/yellow/grey
  CONSTRAINT check_response_status CHECK (response_status IN ('accepted', 'declined', 'pending')),
  UNIQUE(user_id, event_id)
);

CREATE TRIGGER update_user_event_responses_updated_at BEFORE UPDATE ON user_event_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Executive Assistant Assignments (delegation system)
CREATE TABLE executive_assistant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  assignment_type VARCHAR(50) DEFAULT 'permanent',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT check_assignment_type CHECK (assignment_type IN ('permanent', 'temporary')),
  CONSTRAINT check_temp_expiry CHECK (
    (assignment_type = 'permanent' AND expires_at IS NULL) OR
    (assignment_type = 'temporary' AND expires_at IS NOT NULL AND expires_at > created_at)
  ),
  CONSTRAINT check_different_users CHECK (assistant_id != user_id),
  UNIQUE(assistant_id, user_id)
);

CREATE TRIGGER update_executive_assistant_assignments_updated_at BEFORE UPDATE ON executive_assistant_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. User Company Order (drag-and-drop preferences)
CREATE TABLE user_company_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_display_order CHECK (display_order > 0),
  CONSTRAINT unique_user_company_order UNIQUE (user_id, company_id),
  CONSTRAINT unique_user_order_position UNIQUE (user_id, display_order)
);

CREATE TRIGGER update_user_company_order_updated_at BEFORE UPDATE ON user_company_order
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 10. Notifications (Executive Assistant alerts)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT check_notification_type CHECK (notification_type IN ('event_reminder', 'subscription_update', 'ea_notification', 'system_alert'))
);

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **2.2 Create Database Indexes for Performance**

**Cursor AI Prompt:**
```
Create comprehensive indexes for the AGORA database that optimize queries for user story features:

1. User role-based queries
2. Subscription status and payment lookups
3. Executive Assistant delegation queries
4. Event classification by company attendance
5. Company ordering and preferences

7. Real-time notification queries
8. Calendar display optimization

Focus on composite indexes that support the most common user story query patterns.
```

**Create indexes migration:**

```bash
supabase migration new "create_performance_indexes"
```

**Migration content (002_create_performance_indexes.sql):**

```sql
-- User-related indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email_active ON users(email, is_active);

-- Company indexes
CREATE INDEX idx_companies_ticker ON companies(ticker_symbol);
CREATE INDEX idx_companies_sector ON companies(gics_sector);
CREATE INDEX idx_companies_subsector ON companies(gics_subsector);
CREATE INDEX idx_companies_active ON companies(is_active);

-- Event indexes
CREATE INDEX idx_events_date_range ON events(start_date, end_date);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_type ON events(event_type);

-- Event-Company relationship indexes
CREATE INDEX idx_event_companies_event ON event_companies(event_id);
CREATE INDEX idx_event_companies_company ON event_companies(company_id);
CREATE INDEX idx_event_companies_attendance ON event_companies(attendance_status);

-- Subscription indexes (critical for user story access control)
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_subsector ON user_subscriptions(subsector);
CREATE INDEX idx_user_subscriptions_payment_status ON user_subscriptions(payment_status);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(is_active);
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(expires_at);
CREATE INDEX idx_user_subscriptions_active_paid ON user_subscriptions(user_id, subsector, is_active, payment_status)
  WHERE is_active = true AND payment_status = 'paid';

-- Executive Assistant indexes
CREATE INDEX idx_assistant_assignments_assistant ON executive_assistant_assignments(assistant_id);
CREATE INDEX idx_assistant_assignments_user ON executive_assistant_assignments(user_id);
CREATE INDEX idx_assistant_assignments_active ON executive_assistant_assignments(is_active);

-- User preferences and ordering indexes
CREATE INDEX idx_user_company_order_user ON user_company_order(user_id);
CREATE INDEX idx_user_company_order_display ON user_company_order(user_id, display_order);

-- Event response indexes (color-coded RSVP)
CREATE INDEX idx_user_event_responses_user ON user_event_responses(user_id);
CREATE INDEX idx_user_event_responses_event ON user_event_responses(event_id);
CREATE INDEX idx_user_event_responses_status ON user_event_responses(response_status);
CREATE INDEX idx_user_event_responses_user_status ON user_event_responses(user_id, response_status);



-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(notification_type);
```

---

## 🔒 Step 3: Row Level Security (RLS) Implementation

### **3.1 Enable RLS and Create User Story-Aligned Policies**

**Cursor AI Prompt:**
```
Implement comprehensive Row Level Security (RLS) policies for AGORA that enforce user story requirements:

1. Role-based access control:
   - Investment Analysts can only access their own data and subscribed content
   - Executive Assistants can access data for users they assist

2. Subscription-based content access:
   - Users can only see events from companies they have active, paid subscriptions to
   - Immediate access removal when subscriptions expire or payments fail

3. Executive Assistant delegation:
   - Assistants can perform operational tasks for assigned users
   - No access to sensitive analytics or private notes


   - Spam prevention and reputation-based restrictions

5. Data isolation and security:
   - Complete data separation between users
   - Audit logging for all data access attempts

Create all RLS policies with proper testing and validation.
```

**Create RLS migration:**

```bash
supabase migration new "implement_rls_policies"
```

**Migration content (003_implement_rls_policies.sql):**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_assistant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_order ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id);

-- Company table policies (readable by authenticated users)
CREATE POLICY "Companies viewable by authenticated users" ON companies FOR SELECT
USING (auth.role() = 'authenticated');

-- Subscription-based event access (CRITICAL for user story)
CREATE POLICY "Events viewable by subscribed users" ON events FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- User has active subscription to any company attending the event
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      JOIN event_companies ec ON ec.event_id = events.id
      JOIN companies c ON c.id = ec.company_id
      WHERE us.user_id = auth.uid()
        AND us.subsector = c.gics_subsector
        AND us.is_active = true
        AND us.payment_status = 'paid'
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
    )
    OR
    -- Executive Assistant can see events for users they assist
    EXISTS (
      SELECT 1 FROM executive_assistant_assignments eaa
      JOIN user_subscriptions us ON us.user_id = eaa.user_id
      JOIN event_companies ec ON ec.event_id = events.id
      JOIN companies c ON c.id = ec.company_id
      WHERE eaa.assistant_id = auth.uid()
        AND eaa.is_active = true
        AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
        AND us.subsector = c.gics_subsector
        AND us.is_active = true
        AND us.payment_status = 'paid'
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
    )
  )
);

-- Event-Company relationship policies
CREATE POLICY "Event companies viewable with event access" ON event_companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_companies.event_id
    -- Relies on events table RLS policy
  )
);

-- User subscription policies
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can view subscriptions of users they assist
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = user_subscriptions.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);

CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions FOR ALL
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can manage subscriptions
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = user_subscriptions.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);

-- User event response policies (color-coded RSVP)
CREATE POLICY "Users can view own responses" ON user_event_responses FOR SELECT
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can view responses for assisted users
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = user_event_responses.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);

CREATE POLICY "Users can manage own responses" ON user_event_responses FOR ALL
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can manage responses
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = user_event_responses.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);

-- Executive Assistant assignment policies
CREATE POLICY "Users can view relevant assignments" ON executive_assistant_assignments FOR SELECT
USING (
  assistant_id = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY "Assistants can manage assignments" ON executive_assistant_assignments FOR ALL
USING (
  assistant_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'executive_assistant'
  )
);

-- User company order policies (drag-and-drop preferences)
CREATE POLICY "Users can manage own company order" ON user_company_order FOR ALL
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can manage order for assisted users
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = user_company_order.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);



-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can view notifications for assisted users
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = notifications.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);

CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL
USING (
  user_id = auth.uid() OR
  -- Executive Assistants can manage notifications
  EXISTS (
    SELECT 1 FROM executive_assistant_assignments eaa
    WHERE eaa.assistant_id = auth.uid()
      AND eaa.user_id = notifications.user_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW())
  )
);
```

---

## ⚙️ Step 4: Business Logic Functions for User Stories

### **4.1 Create User Story-Specific Database Functions**

**Cursor AI Prompt:**
```
Create comprehensive PostgreSQL functions that implement core user story business logic:

1. Subscription management functions:
   - check_user_subscription_access(user_id, subsector)
   - handle_subscription_expiration()
   - process_stripe_webhook_payment_update()

2. Executive Assistant delegation functions:
   - assign_executive_assistant(assistant_id, user_id, permissions)
   - get_assisted_users_for_ea(assistant_id)
   - check_ea_permission(assistant_id, user_id, action)



4. Company ordering functions:
   - update_user_company_display_order()
   - get_user_ordered_companies()

5. Color-coded RSVP functions:
   - update_event_response_with_color_coding()
   - get_user_calendar_with_color_status()

6. Real-time notification functions:
   - create_ea_notification()
   - process_event_reminder_notifications()

All functions should include proper error handling, logging, and audit trails.
```

**Create business logic migration:**

```bash
supabase migration new "create_business_logic_functions"
```

**Migration content (004_create_business_logic_functions.sql):**

```sql
-- Function: Check if user has valid subscription access
CREATE OR REPLACE FUNCTION check_user_subscription_access(
    p_user_id UUID,
    p_subsector VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = p_user_id
          AND subsector = p_subsector
          AND is_active = true
          AND payment_status = 'paid'
          AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Handle subscription expiration
CREATE OR REPLACE FUNCTION handle_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
BEGIN
    -- Automatically deactivate expired subscriptions
    UPDATE user_subscriptions
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
      AND expires_at IS NOT NULL
      AND expires_at <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Create notifications for expired subscriptions
    INSERT INTO notifications (user_id, title, message, notification_type)
    SELECT 
        user_id,
        'Subscription Expired',
        'Your subscription to ' || subsector || ' has expired. Please renew to continue accessing events.',
        'subscription_update'
    FROM user_subscriptions
    WHERE is_active = false
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND expires_at > (NOW() - INTERVAL '1 day'); -- Only recent expirations
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create Executive Assistant assignment
CREATE OR REPLACE FUNCTION assign_executive_assistant(
    p_assistant_id UUID,
    p_user_id UUID,
    p_permissions JSONB DEFAULT '{}',
    p_assignment_type VARCHAR(50) DEFAULT 'permanent',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
    v_assistant_role VARCHAR(50);
BEGIN
    -- Check if assistant has correct role
    SELECT role INTO v_assistant_role
    FROM users
    WHERE id = p_assistant_id;
    
    IF v_assistant_role != 'executive_assistant' THEN
        RAISE EXCEPTION 'User must have executive_assistant role to be assigned as assistant';
    END IF;
    
    -- Create or update assignment
    INSERT INTO executive_assistant_assignments (
        assistant_id, user_id, permissions, assignment_type, expires_at
    )
    VALUES (
        p_assistant_id, p_user_id, p_permissions, p_assignment_type, p_expires_at
    )
    ON CONFLICT (assistant_id, user_id)
    DO UPDATE SET
        permissions = EXCLUDED.permissions,
        assignment_type = EXCLUDED.assignment_type,
        expires_at = EXCLUDED.expires_at,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_assignment_id;
    
    -- Create notification for both users
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES 
        (p_user_id, 'Executive Assistant Assigned', 'An executive assistant has been assigned to help manage your calendar and events.', 'ea_notification'),
        (p_assistant_id, 'Assignment Created', 'You have been assigned to assist a user with their calendar and events.', 'ea_notification');
    
    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get assisted users for Executive Assistant
CREATE OR REPLACE FUNCTION get_assisted_users_for_ea(p_assistant_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    assignment_type VARCHAR(50),
    permissions JSONB,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name,
        u.email,
        eaa.assignment_type,
        eaa.permissions,
        eaa.expires_at
    FROM executive_assistant_assignments eaa
    JOIN users u ON u.id = eaa.user_id
    WHERE eaa.assistant_id = p_assistant_id
      AND eaa.is_active = true
      AND (eaa.expires_at IS NULL OR eaa.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Function: Update user company display order (drag-and-drop)
CREATE OR REPLACE FUNCTION update_user_company_display_order(
    p_user_id UUID,
    p_company_orders JSONB -- Array of {company_id, display_order}
)
RETURNS BOOLEAN AS $$
DECLARE
    company_order RECORD;
BEGIN
    -- Delete existing orders for user
    DELETE FROM user_company_order WHERE user_id = p_user_id;
    
    -- Insert new orders
    FOR company_order IN SELECT * FROM jsonb_to_recordset(p_company_orders) AS x(company_id UUID, display_order INTEGER)
    LOOP
        INSERT INTO user_company_order (user_id, company_id, display_order)
        VALUES (p_user_id, company_order.company_id, company_order.display_order);
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user calendar with color-coded status
CREATE OR REPLACE FUNCTION get_user_calendar_with_color_status(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    event_id UUID,
    event_title VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    company_name VARCHAR(255),
    company_ticker VARCHAR(20),
    response_status VARCHAR(50),
    color_code VARCHAR(20) -- green, yellow, grey
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.start_date,
        e.end_date,
        c.company_name,
        c.ticker_symbol,
        COALESCE(uer.response_status, 'pending'),
        CASE 
            WHEN COALESCE(uer.response_status, 'pending') = 'accepted' THEN 'green'
            WHEN COALESCE(uer.response_status, 'pending') = 'declined' THEN 'yellow'
            ELSE 'grey'
        END as color_code
    FROM events e
    JOIN event_companies ec ON ec.event_id = e.id
    JOIN companies c ON c.id = ec.company_id
    JOIN user_subscriptions us ON us.subsector = c.gics_subsector
    LEFT JOIN user_event_responses uer ON uer.event_id = e.id AND uer.user_id = p_user_id
    LEFT JOIN user_company_order uco ON uco.company_id = c.id AND uco.user_id = p_user_id
    WHERE us.user_id = p_user_id
      AND us.is_active = true
      AND us.payment_status = 'paid'
      AND (us.expires_at IS NULL OR us.expires_at > NOW())
      AND e.start_date >= p_start_date
      AND e.end_date <= p_end_date
      AND e.is_active = true
    ORDER BY 
        COALESCE(uco.display_order, 999),
        c.company_name,
        e.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🌱 Step 5: Seed Data for User Story Testing

### **5.1 Create User Story Test Data**

**Cursor AI Prompt:**
```
Create comprehensive seed data for AGORA that supports all user story testing scenarios:

1. User accounts:
   - Investment Analysts with different subscription patterns
   - Executive Assistants with various delegation setups
   - Test scenarios for role switching and permission testing

2. Company data:
   - GICS-classified companies across different sectors and subsectors
   - Major companies for realistic testing (Apple, Microsoft, Tesla, etc.)
   - Companies that frequently host investment events

3. Subscription patterns:
   - Paid subscriptions for different subsectors
   - Expired subscriptions for testing access control
   - Various subscription sources (direct, promotion)

4. Events with realistic scenarios:
   - Earnings calls, investor meetings, conferences
   - Multi-company events for testing attendance classification
   - Events requiring different subscription levels

5. Executive Assistant relationships:
   - Permanent and temporary assignments
   - Different permission levels
   - Cross-user delegation scenarios


   - Various reputation scores for testing

7. User preferences:
   - Company ordering preferences
   - RSVP patterns for color-coding testing
   - Notification preferences

All seed data should be realistic and support comprehensive user story validation.
```

**Create seed data migration:**

```bash
supabase migration new "create_user_story_seed_data"
```

**Migration content (005_create_user_story_seed_data.sql):**

> **📋 Note:** Use the comprehensive seed data from `comprehensive_seed_data.sql` which includes:
> - **22 GICS-classified companies** from major sectors (Technology, Financial, Healthcare, Energy, etc.)
> - **60 realistic investment events** spanning Aug 10 - Oct 10, 2025
> - **Multi-company event relationships** demonstrating user story requirements
> - **User story test scenarios** with proper subscriptions, roles, and preferences

**Copy the contents from comprehensive_seed_data.sql into this migration file, or run:**

```bash
# Copy comprehensive seed data into migration
cp comprehensive_seed_data.sql supabase/migrations/005_create_user_story_seed_data.sql
```

**📊 Comprehensive Seed Data Summary:**

### **C.1. Companies (22 Total)**
```
- TECHNOLOGY: AAPL, MSFT, GOOGL, META, NVDA
- FINANCIAL: JPM, BAC, WFC, GS  
- HEALTHCARE: JNJ, PFE, UNH
- CONSUMER: AMZN, HD, NKE, TSLA
- ENERGY: XOM, CVX
- COMMUNICATION: NFLX, DIS
- INDUSTRIALS: BA, CAT
```

### **C.2. Events (60 Total - Aug 10 - Oct 10, 2025)**
```
- AUGUST: 20 events (earnings calls, tech summits, conferences)
- SEPTEMBER: 25 events (industry conferences, quarterly calls)
- OCTOBER: 15 events (earnings season, sector events)
```

### **C.3. Multi-Company Event Examples**
```
- Tech Innovation Summit 2025: AAPL, MSFT, GOOGL, META
- Financial Services Technology Forum: JPM, BAC, WFC, MSFT
- Healthcare Innovation Summit: JNJ, PFE, UNH
- Energy Transition Summit: XOM, CVX, TSLA
- Media & Entertainment Conference: NFLX, DIS, META
```

### **User Story Test Scenarios Included:**
```
✅ Role-based users (Investment Analysts & Executive Assistants)
✅ Subscription-based access with payment integration
✅ Executive Assistant multi-user delegation
✅ Color-coded RSVP responses (green/yellow/grey)
✅ Company row ordering preferences (drag-and-drop)

✅ Real-time notifications for EA workflows
✅ Multi-company event attendance classification
```

**This comprehensive seed data provides realistic testing scenarios for all user story requirements and supports full validation of the subscription-based access control, role-based authentication, and Executive Assistant delegation features.**

---

## 🧪 Step 6: Testing and Validation

### **6.1 User Story Validation Testing**

**Cursor AI Prompt:**
```
Create comprehensive test scripts that validate all user story requirements are properly implemented in the database:

1. Role-based access testing:
   - Verify Investment Analysts can only see their subscribed content
   - Verify Executive Assistants can access data for assigned users only

2. Subscription-based access control:
   - Test immediate access removal when subscriptions expire
   - Verify payment status affects event visibility
   - Test subscription requirement notifications

3. Event classification testing:
   - Verify events appear under all attending companies, not just hosts
   - Test multi-company event display
   - Validate GICS subsector-based access

4. Color-coded RSVP testing:
   - Test green (accepted), yellow (declined), grey (pending) logic
   - Verify color updates in real-time

5. Executive Assistant delegation:
   - Test multi-user management capabilities
   - Verify permission-based access restrictions
   - Test notification delivery to assistants

6. Company ordering preferences:
   - Test drag-and-drop functionality data persistence
   - Verify user-specific ordering



Create automated test functions that can be run to validate the entire system.
```

**Create testing migration:**

```bash
supabase migration new "create_user_story_tests"
```

**Test function creation and validation scripts would go here...**

---

## 🔍 Step 7: Database Client Configuration

### **7.1 Configure TypeScript Client**

**Cursor AI Prompt:**
```
Set up the Supabase TypeScript client configuration for AGORA with proper type generation and user story-specific utilities:

1. Generate TypeScript types from the database schema
2. Create type-safe query helpers for user story features
3. Set up real-time subscriptions for Executive Assistant notifications
4. Configure proper error handling for subscription-based access
5. Create utility functions for role-based queries
6. Set up performance monitoring for critical user story queries

Include proper connection management, retry logic, and security configurations.
```

**Manual Commands:**
```bash
# Generate TypeScript types
supabase gen types typescript --local > ../shared/types/supabase.ts

# Install Supabase client
npm install @supabase/supabase-js

# Install additional dependencies for user story features
npm install stripe @stripe/stripe-js
```

**Create client configuration files:**

1. supabase-client.ts - Main client configuration
2. database-types.ts - Type definitions and helpers  
3. database-utils.ts - Common database operations
4. query-builders.ts - Complex query helpers
5. error-handlers.ts - Database error handling

---

## ✅ Step 8: Completion Verification

### **8.1 User Story Implementation Checklist**

Before proceeding to **AGORA_DEV_03_AUTHENTICATION**, verify all user story requirements:

### **User Roles & Authentication ✅**
- [ ] Users table supports 'investment_analyst' and 'executive_assistant' roles
- [ ] Role-based constraints properly implemented
- [ ] User preferences structure supports all user story needs

### **Subscription System ✅**
- [ ] user_subscriptions table with Stripe payment integration
- [ ] Subsector-based subscription model implemented
- [ ] Payment status tracking and expiration handling working
- [ ] Subscription-based event access control active

### **Executive Assistant Delegation ✅**  
- [ ] executive_assistant_assignments table created
- [ ] Multi-user management capabilities implemented
- [ ] Permission-based access control working
- [ ] Notification system for assistants active

### **Event Classification ✅**
- [ ] Events organized by attending companies, not just hosts
- [ ] Multi-company event support implemented
- [ ] GICS subsector-based access control working

### **User Preferences ✅**
- [ ] user_company_order table for drag-and-drop functionality
- [ ] Company ordering preferences persist across sessions
- [ ] Color-coded RSVP tracking (green/yellow/grey) implemented



### **Real-time Features ✅**
- [ ] Notification system for all user story requirements
- [ ] Real-time updates for Executive Assistant workflows
- [ ] Proper audit logging and security tracking

### **Data Security ✅**
- [ ] Row Level Security policies for all user story scenarios
- [ ] Complete data isolation between users
- [ ] Subscription-based access immediately enforced
- [ ] Executive Assistant permissions properly restricted

---

## 📋 Next Steps

Once you've completed ALL items in the checklist above:

1. **Test database connectivity:**
   ```bash
   npm run test:database-connection
   ```

2. **Validate user story implementation:**
   ```bash
   npm run test:user-stories
   ```

3. **Commit your work:**
   ```bash
   git add .
   git commit -m "Complete user story-aligned database setup: roles, subscriptions, EA delegation"
   ```

4. **Proceed to AGORA_DEV_03_AUTHENTICATION.md** - This will guide you through implementing role-based Microsoft SSO authentication that works with your user story database structure

---

**Document Status:** ✅ Ready for Implementation (User Story Aligned)  
**Next Document:** AGORA_DEV_03_AUTHENTICATION.md  
**Estimated Time:** 6-8 hours  
**Difficulty:** Intermediate-Advanced  
**Prerequisites:** Completed AGORA_DEV_01_PROJECT_SETUP

**Key User Story Features Implemented:**
- ✅ Role-based authentication (Investment Analyst & Executive Assistant)
- ✅ Subscription-based access control with payment integration
- ✅ Executive Assistant multi-user delegation system
- ✅ Event classification by GICS company attendance
- ✅ Color-coded RSVP tracking (green/yellow/grey)
- ✅ Company row drag-and-drop ordering preferences

- ✅ Real-time notifications for Executive Assistant workflows
- ✅ Complete data security and audit logging