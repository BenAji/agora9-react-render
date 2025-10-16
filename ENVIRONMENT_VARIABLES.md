# 🔐 Environment Variables Reference

## Overview

This document contains all environment variables required for deploying the AGORA React application. These variables must be set in your deployment platform (Render, Vercel, etc.) and should **NEVER** be committed to Git.

---

## 📋 Required Variables

### 1. REACT_APP_SUPABASE_URL

**Description:** The URL of your Supabase project  
**Required:** ✅ Yes  
**Environment:** All (development, production, preview)

**How to get it:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: Settings → API
4. Copy the "Project URL"

**Example:**
```
https://whlgmfubxeqmfdccnsqb.supabase.co
```

**Used in:** All API calls to Supabase (authentication, database queries)

---

### 2. REACT_APP_SUPABASE_ANON_KEY

**Description:** The public/anonymous API key for your Supabase project  
**Required:** ✅ Yes  
**Environment:** All (development, production, preview)

**How to get it:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: Settings → API
4. Copy the "anon" "public" key (under "Project API keys")

**Important:**
- ⚠️ Use the `anon` key (NOT the `service_role` key)
- The `anon` key is safe to use in frontend applications
- The `service_role` key should NEVER be exposed to the client

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZGd...
```

**Used in:** Initializing Supabase client, authentication, authorized API calls

---

### 3. REACT_APP_ENVIRONMENT

**Description:** Indicates which environment the app is running in  
**Required:** ✅ Yes (recommended)  
**Environment:** Varies by deployment

**Possible values:**
- `development` - Local development
- `production` - Production deployment
- `staging` - Staging/preview deployment
- `preview` - Pull request previews

**How to set:**

**For Render:**
- Production: `production`
- Preview deployments: `preview`

**For Vercel:**
- Production: `production`
- Preview: `preview`
- Development: `development`

**For local development (.env.local):**
```
REACT_APP_ENVIRONMENT=development
```

**Example:**
```
production
```

**Used in:**
- Conditional logging (disable in production)
- Feature flags
- Analytics configuration
- Error reporting
- API endpoint selection (if you have different environments)

---

### 4. REACT_APP_WEATHER_API_KEY

**Description:** API key for weather service (OpenWeatherMap or similar)  
**Required:** ⚠️ Optional (only if using weather features)  
**Environment:** All

**How to get it:**
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Create a free account
3. Generate an API key
4. Free tier: 1,000 calls/day

**Alternative providers:**
- [WeatherAPI.com](https://www.weatherapi.com/) - Free tier: 1M calls/month
- [Tomorrow.io](https://www.tomorrow.io/) - Free tier available
- [WeatherStack](https://weatherstack.com/) - Free tier: 1,000 calls/month

**Example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Used in:**
- Weather forecast display on calendar view
- Event weather predictions
- Location-based weather data

**If not provided:**
- Weather features will be disabled
- No errors will occur
- App will function normally without weather data

---

## 🛠️ Setting Up Environment Variables

### For Render

1. **During Initial Setup:**
   - When creating the static site
   - Add variables in "Environment Variables" section
   - Click "Add Environment Variable" for each one

2. **After Deployment:**
   - Go to your service dashboard
   - Navigate to: Settings → Environment
   - Click "Add Environment Variable"
   - Enter key and value
   - Click "Save Changes"
   - **Important:** Redeploy after adding new variables

3. **For Preview Deployments:**
   - Settings → Environment
   - Switch to "Preview" tab
   - Add preview-specific variables
   - These override production values for PR previews

**Example Render setup:**
```
Key: REACT_APP_SUPABASE_URL
Value: https://whlgmfubxeqmfdccnsqb.supabase.co
Environments: ✅ Production ✅ Preview
```

---

### For Vercel (if still using)

1. **Via Dashboard:**
   - Go to your project
   - Settings → Environment Variables
   - Add variable name and value
   - Select environments (Production, Preview, Development)
   - Click "Save"

2. **Via CLI:**
   ```bash
   vercel env add REACT_APP_SUPABASE_URL production
   # Paste value when prompted
   
   vercel env add REACT_APP_SUPABASE_ANON_KEY production
   # Paste value when prompted
   ```

---

### For Local Development

1. **Create `.env.local` file** (in project root):
   ```bash
   # DON'T commit this file to Git!
   # It's already in .gitignore
   
   REACT_APP_SUPABASE_URL=https://whlgmfubxeqmfdccnsqb.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   REACT_APP_ENVIRONMENT=development
   REACT_APP_WEATHER_API_KEY=your-weather-key-here
   ```

2. **Restart development server** after adding variables:
   ```bash
   # Stop the server (Ctrl+C)
   npm start
   ```

3. **Verify variables are loaded:**
   ```javascript
   // In your component or App.tsx
   console.log('Environment:', process.env.REACT_APP_ENVIRONMENT);
   console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
   ```

---

## 🔒 Security Best Practices

### DO ✅

1. **Use the correct Supabase key**
   - ✅ Use `anon` (public) key in frontend
   - ✅ This key is safe to expose in client-side code
   - ✅ It's protected by Row Level Security (RLS) policies

2. **Set variables in deployment platform**
   - ✅ Add to Render dashboard
   - ✅ Add to Vercel dashboard
   - ✅ Use `.env.local` for local development

3. **Keep `.env.local` in `.gitignore`**
   - ✅ Already configured in your project
   - ✅ Prevents accidental commits

4. **Rotate keys regularly**
   - ✅ Change API keys every 3-6 months
   - ✅ Immediately if compromised

5. **Use different keys for different environments**
   - ✅ Different Supabase projects for dev/prod (optional but recommended)
   - ✅ Different weather API keys for testing vs production

### DON'T ❌

1. **Never use `service_role` key in frontend**
   - ❌ This key bypasses all RLS policies
   - ❌ Only use server-side (if you have a backend)
   - ❌ Exposing it is a critical security vulnerability

2. **Never commit sensitive values to Git**
   - ❌ Don't commit `.env` files
   - ❌ Don't hardcode keys in source code
   - ❌ Don't commit to public repositories

3. **Never share keys publicly**
   - ❌ Don't post in Discord, Slack, forums
   - ❌ Don't include in screenshots
   - ❌ Don't add to public documentation

4. **Never use production keys in development**
   - ❌ Use separate development Supabase project
   - ❌ Or use local Supabase instance

---

## 🧪 Testing Environment Variables

### Verify Variables are Set Correctly

1. **During development:**
   ```javascript
   // Add to src/App.tsx temporarily
   console.log('=== Environment Check ===');
   console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
   console.log('ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
   console.log('Weather API Key exists:', !!process.env.REACT_APP_WEATHER_API_KEY);
   console.log('========================');
   ```

2. **In production:**
   - Check browser console (F12)
   - Look for "Environment Check" logs
   - Verify values are correct (not undefined)

3. **Troubleshooting:**
   
   **If variables are undefined:**
   - ✅ Check they're prefixed with `REACT_APP_`
   - ✅ Restart development server
   - ✅ Redeploy on Render (clear build cache)
   - ✅ Check for typos in variable names
   - ✅ Verify they're set in deployment platform

   **If authentication fails:**
   - ✅ Verify `REACT_APP_SUPABASE_URL` is correct
   - ✅ Verify `REACT_APP_SUPABASE_ANON_KEY` is correct
   - ✅ Check Supabase dashboard for API key
   - ✅ Ensure you're using `anon` key (not `service_role`)

---

## 📝 Environment Variables Template

### For Quick Setup

Copy this template and fill in your values:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Environment
REACT_APP_ENVIRONMENT=production

# Optional: Weather API
REACT_APP_WEATHER_API_KEY=your-weather-api-key
```

---

## 🔄 Updating Environment Variables

### When You Need to Update:

1. **Supabase project changed**
   - Update both URL and ANON_KEY
   - Update in all environments (dev, prod, preview)

2. **API key compromised**
   - Immediately rotate key in Supabase
   - Update in all deployment platforms
   - Redeploy all environments

3. **New environment added**
   - Add variables to new environment
   - Test thoroughly before promoting

### How to Update:

**On Render:**
1. Go to: Service → Settings → Environment
2. Click "Edit" on the variable
3. Update the value
4. Click "Save Changes"
5. Trigger a new deployment (or wait for auto-deploy)

**On Vercel:**
1. Go to: Project → Settings → Environment Variables
2. Click the three dots (•••) next to variable
3. Click "Edit"
4. Update value
5. Save and redeploy

**Locally:**
1. Edit `.env.local`
2. Save file
3. Restart development server

---

## ❓ Frequently Asked Questions

### Q: Can I commit `.env.local` to Git for the team?

**A:** ❌ No! Never commit environment files with real credentials. Instead:
- Use `.env.example` with placeholder values
- Share actual credentials securely (1Password, LastPass, encrypted docs)
- Each developer creates their own `.env.local`

### Q: What if I accidentally commit my `.env` file?

**A:** 🚨 Act immediately:
1. Remove file from Git history
2. Rotate ALL compromised API keys
3. Update keys in all environments
4. Add `.env*` to `.gitignore` (already done)

### Q: Do I need different Supabase projects for dev and prod?

**A:** It's recommended but optional:
- **Recommended:** Separate projects prevent test data in production
- **Simpler:** Use same project, different tables/RLS policies
- **For this app:** You can use the same project initially

### Q: How do I know if my environment variables are working?

**A:** Test these:
1. App loads without errors
2. Login/signup works (Supabase connection)
3. No "undefined" errors in console
4. Weather displays (if using weather API)

### Q: Can I change variable names?

**A:** ⚠️ Only if you update the code:
1. Search codebase for old variable name
2. Replace all occurrences
3. Update this documentation
4. Update variables in deployment platforms
5. Test thoroughly

---

## 📞 Support

**If you're having issues with environment variables:**

1. **Check this document first**
2. **Review deployment logs** (Render or Vercel)
3. **Check browser console** for undefined variables
4. **Verify Supabase dashboard** for correct keys
5. **Contact platform support:**
   - Render: support@render.com
   - Vercel: vercel.com/support
   - Supabase: supabase.com/support

---

## ✅ Quick Checklist

Before deploying, verify:

- [ ] `REACT_APP_SUPABASE_URL` is set and correct
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is set and correct (anon key, not service_role)
- [ ] `REACT_APP_ENVIRONMENT` is set to appropriate value
- [ ] `REACT_APP_WEATHER_API_KEY` is set (if using weather features)
- [ ] All variables are set in deployment platform
- [ ] `.env.local` exists locally (not committed to Git)
- [ ] Variables are prefixed with `REACT_APP_`
- [ ] No typos in variable names
- [ ] Deployment platform shows all variables
- [ ] Test deployment confirms variables work

---

**🔐 Keep your keys secret, keep your app secure!**

Last updated: [Auto-generated on deployment]

