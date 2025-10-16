# ⚡ Quick Start: Deploy to Render in 10 Minutes

This is a condensed guide to get your AGORA app live on Render as fast as possible.

---

## 🎯 What You'll Need

- [ ] GitHub account (already have: `BenAji/agora9`)
- [ ] Your Supabase URL and anon key
- [ ] 10 minutes

---

## 🚀 5-Step Deployment

### Step 1: Create Render Account (2 minutes)

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Choose "Continue with GitHub"
4. Authorize Render

### Step 2: Create Static Site (1 minute)

1. Click "New +" → "Static Site"
2. Find and connect: `BenAji/agora9`
3. Configure:
   - **Name:** `agora-react`
   - **Branch:** `main`
   - **Root Directory:** `agora-react` (if in subdirectory)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

### Step 3: Add Environment Variables (2 minutes)

Add these four variables:

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `REACT_APP_SUPABASE_URL` | `https://whlgmfubxeqmfdccnsqb.supabase.co` | Supabase → Settings → API |
| `REACT_APP_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase → Settings → API (use "anon" key) |
| `REACT_APP_ENVIRONMENT` | `production` | Type manually |
| `REACT_APP_WEATHER_API_KEY` | `your-key` | Optional - skip if not using |

### Step 4: Deploy (3 minutes)

1. Click "Create Static Site"
2. Wait for build to complete (watch logs)
3. Get your URL: `https://agora-react.onrender.com`

### Step 5: Update Supabase (2 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Your project → Authentication → URL Configuration
3. Add to Redirect URLs:
   ```
   https://agora-react.onrender.com/**
   ```
4. Save

---

## ✅ Test Your Deployment

Visit your Render URL and test:
- [ ] Homepage loads
- [ ] Sign up / Login works
- [ ] Calendar shows events
- [ ] No errors in browser console (F12)

---

## 🎉 Done!

Your app is now live on Render!

**Next steps:**
- Share the URL with your team
- Set up a custom domain (optional)
- Consider upgrading to $7/month tier for no cold starts

**Need detailed help?** Check:
- [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [VERCEL_TO_RENDER_MIGRATION.md](VERCEL_TO_RENDER_MIGRATION.md) - Migration from Vercel
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment variables reference

---

## 🚨 Troubleshooting

**Build fails?**
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies

**Can't login?**
- Verify Supabase URL in Render matches your project
- Check you're using the "anon" key (not "service_role")
- Ensure Render URL is added to Supabase redirect URLs

**Site is slow?**
- Free tier has cold starts after 15 min inactivity
- Upgrade to $7/month for instant response

---

**⏱️ Total time: ~10 minutes**

You're now free from Vercel and saving money! 🎊

