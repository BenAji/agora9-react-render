# 🚀 Render Setup Guide - Express Server for SPA Routing

This guide walks you through setting up your AGORA React app on Render with the Express server solution to fix SPA routing issues.

---

## 📋 Prerequisites

- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ GitHub repository with your code pushed
- ✅ Environment variables ready (Supabase URL, keys, etc.)

---

## 🎯 Step-by-Step Setup

### Step 1: Push Your Changes to GitHub

First, make sure all your changes are committed and pushed:

```bash
# Check status
git status

# Add all changes
git add server.js package.json render.yaml

# Commit
git commit -m "Fix SPA routing: Switch to Express server for React Router support"

# Push to GitHub
git push origin main
```

---

### Step 2: Access Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Log in to your Render account
3. You should see your dashboard

---

### Step 3: Create or Update Your Service

#### Option A: If You Already Have a Static Site Service

1. **Go to your existing service** in the Render dashboard
2. Click on the service name to open settings
3. **Update Service Type:**
   - Scroll to "Service Type" section
   - Change from "Static Site" to "Web Service"
   - Render will prompt you to confirm

4. **Update Build & Start Commands:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run server`
   - **Environment:** Select "Node"

5. **Set Environment Variables:**
   - Go to "Environment" tab
   - Add/verify these variables:
     ```
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_ANON_KEY=your-anon-key
     REACT_APP_ENVIRONMENT=production
     REACT_APP_WEATHER_API_KEY=your-weather-key (optional)
     PORT=10000
     ```

6. **Save Changes** - Render will automatically redeploy

#### Option B: If Creating a New Service

1. **Click "New +"** button in the top right
2. **Select "Web Service"**
3. **Connect Your Repository:**
   - If not connected, click "Connect account" and authorize Render
   - Select your GitHub repository: `agora-react-render`
   - Click "Connect"

4. **Configure Service:**
   - **Name:** `agora-react` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** Leave empty (or `./` if needed)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run server`

5. **Set Environment Variables:**
   - Click "Advanced" to expand options
   - Under "Environment Variables", click "Add Environment Variable"
   - Add each variable:
     ```
     Key: REACT_APP_SUPABASE_URL
     Value: https://your-project.supabase.co
     
     Key: REACT_APP_SUPABASE_ANON_KEY
     Value: your-anon-key-here
     
     Key: REACT_APP_ENVIRONMENT
     Value: production
     
     Key: REACT_APP_WEATHER_API_KEY
     Value: your-weather-key (optional)
     
     Key: PORT
     Value: 10000
     ```

6. **Select Plan:**
   - Choose "Free" for testing (or paid plan for production)
   - Free tier includes:
     - 750 hours/month
     - Automatic SSL
     - Custom domains

7. **Click "Create Web Service"**

---

### Step 4: Using render.yaml (Alternative - Automatic Setup)

If you prefer Render to auto-detect settings from `render.yaml`:

1. **Push your `render.yaml` file** (already done if you followed Step 1)
2. **In Render Dashboard:**
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`
   - Review the configuration
   - **Set Environment Variables** (they won't be auto-filled for security)
   - Click "Apply"

3. **Environment Variables Still Need Manual Setup:**
   - Go to your service → "Environment" tab
   - Add all the variables listed in Step 3

---

### Step 5: Monitor the Deployment

1. **Watch the Build Logs:**
   - After creating/updating, Render starts building
   - Click on "Events" or "Logs" tab to watch progress
   - You should see:
     ```
     npm install
     npm run build
     npm run server
     ```

2. **Check for Errors:**
   - If build fails, check logs for:
     - Missing dependencies
     - Build errors
     - Environment variable issues

3. **Wait for "Live" Status:**
   - Service shows "Live" when ready
   - URL will be: `https://agora-react.onrender.com` (or your custom domain)

---

### Step 6: Test the Deployment

1. **Visit Your App:**
   - Click the service URL in Render dashboard
   - Or visit: `https://your-service-name.onrender.com`

2. **Test SPA Routing:**
   - Navigate to `/calendar`
   - **Refresh the page** (F5 or Ctrl+R)
   - ✅ Should NOT show 404 error
   - ✅ Should load the calendar page correctly

3. **Test Other Routes:**
   - Try `/settings` → refresh
   - Try `/subscriptions` → refresh
   - All routes should work on refresh!

---

## 🔧 Troubleshooting

### Issue: Build Fails with "express not found"

**Solution:**
- Make sure `package.json` includes `express` in dependencies
- Check that `npm install` runs during build
- Verify `render.yaml` has correct `buildCommand`

### Issue: Service Won't Start

**Check:**
- `startCommand` is `npm run server` (not `npm start`)
- `PORT` environment variable is set to `10000`
- `server.js` file exists in root directory
- Build completed successfully (check `build/` directory exists)

### Issue: Still Getting 404 on Refresh

**Verify:**
- Service type is "Web Service" (not "Static Site")
- `startCommand` is `npm run server`
- Check server logs for errors
- Verify `server.js` catch-all route is working

### Issue: Environment Variables Not Working

**Solution:**
- Variables must start with `REACT_APP_` to be available in React
- Set them in Render dashboard → Environment tab
- Redeploy after adding variables
- Check browser console for undefined values

---

## 📝 Render Dashboard Checklist

Before deploying, verify:

- [ ] Service type: **Web Service** (not Static Site)
- [ ] Environment: **Node**
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run server`
- [ ] Environment Variables:
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
  - [ ] `REACT_APP_ENVIRONMENT=production`
  - [ ] `PORT=10000`
  - [ ] `REACT_APP_WEATHER_API_KEY` (if using)

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Service shows "Live" status
2. ✅ Build logs show successful completion
3. ✅ Server logs show: "Server is running on port 10000"
4. ✅ Visiting any route and refreshing doesn't show 404
5. ✅ All React Router routes work correctly

---

## 🔄 Updating Your Service

After making code changes:

```bash
# Commit and push
git add .
git commit -m "Your commit message"
git push origin main
```

Render will automatically:
- Detect the push
- Start a new build
- Deploy the updated service
- Keep old version running until new one is ready

---

## 💰 Cost Considerations

**Free Tier:**
- 750 hours/month (enough for 24/7 single service)
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)

**Paid Plans:**
- Services stay awake 24/7
- Faster response times
- More resources

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Render Logs:**
   - Service → "Logs" tab
   - Look for error messages

2. **Verify Configuration:**
   - Compare your settings with this guide
   - Check `render.yaml` syntax

3. **Test Locally:**
   ```bash
   npm run build
   npm run server
   # Visit http://localhost:3000
   ```

4. **Render Support:**
   - [Render Docs](https://render.com/docs)
   - [Render Community](https://community.render.com)

---

## 📚 Next Steps

Once deployed and working:

1. ✅ Set up custom domain (optional)
2. ✅ Configure auto-deploy from GitHub
3. ✅ Set up monitoring/alerts
4. ✅ Review security headers
5. ✅ Test all routes thoroughly

---

**You're all set!** Your React app should now handle SPA routing correctly on Render. 🎊
