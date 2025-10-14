# 🚀 Vercel Deployment Guide for AGORA

## ✅ Prerequisites Complete
- [x] Code pushed to GitHub: `https://github.com/BenAji/agora9`
- [x] Production build tested: 165.3 kB (gzipped)
- [x] Environment variables documented
- [x] App running successfully on localhost

---

## 🎯 Deployment Steps

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended for easy integration)
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your GitHub Repository

**Option A: Via Vercel Dashboard (Easiest)**

1. **Login to Vercel**: [vercel.com/login](https://vercel.com/login)

2. **Click "Add New Project"**
   - Or go directly to: [vercel.com/new](https://vercel.com/new)

3. **Import Git Repository**
   - Find `BenAji/agora9` in the list
   - Click "Import"
   - Select the `agora-react` subdirectory if needed

4. **Configure Project**
   ```
   Project Name: agora-react
   Framework Preset: Create React App (auto-detected)
   Root Directory: ./agora-react (or leave as ./)
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```env
   REACT_APP_SUPABASE_URL = https://whlgmfubxeqmfdccnsqb.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = your-supabase-anon-key
   REACT_APP_ENVIRONMENT = production
   REACT_APP_WEATHER_API_KEY = your-weather-api-key (optional)
   ```

   **Important:**
   - Get your Supabase URL and anon key from: [app.supabase.com/project/whlgmfubxeqmfdccnsqb/settings/api](https://app.supabase.com/project/whlgmfubxeqmfdccnsqb/settings/api)
   - Never use the `service_role` key in frontend!
   - Use the `anon` (public) key

6. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get your live URL: `https://agora-react-xxx.vercel.app`

---

**Option B: Via Vercel CLI (Alternative)**

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login
# Choose "Continue with GitHub"

# 3. Deploy from your project directory
cd C:\Users\ayoad\vibe\cursor\agora9\agora-react
vercel

# Follow the prompts:
# Set up and deploy? → Yes
# Which scope? → Your account
# Link to existing project? → No
# Project name? → agora-react
# Directory? → ./
# Override settings? → No

# 4. Add environment variables
vercel env add REACT_APP_SUPABASE_URL production
# Paste: https://whlgmfubxeqmfdccnsqb.supabase.co

vercel env add REACT_APP_SUPABASE_ANON_KEY production
# Paste: your-anon-key

vercel env add REACT_APP_ENVIRONMENT production
# Paste: production

vercel env add REACT_APP_WEATHER_API_KEY production
# Paste: your-weather-key (or skip if not using)

# 5. Deploy to production
vercel --prod
```

---

### Step 3: Configure Supabase for Production

1. **Go to Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)

2. **Navigate to Authentication Settings**
   - Project → Settings → Authentication

3. **Update Redirect URLs**
   - Add your Vercel URL to "Site URL":
     ```
     https://agora-react-xxx.vercel.app
     ```
   
   - Add to "Redirect URLs":
     ```
     https://agora-react-xxx.vercel.app/**
     https://agora-react-xxx.vercel.app/login
     ```

4. **Update Email Templates** (Optional)
   - Settings → Auth → Email Templates
   - Update confirmation links to use production URL

5. **Configure CORS** (If needed)
   - Settings → API → CORS
   - Add: `https://agora-react-xxx.vercel.app`

---

### Step 4: Test Your Deployment

1. **Visit Your Live URL**
   ```
   https://agora-react-xxx.vercel.app
   ```

2. **Test Core Features**
   - [ ] Sign up with new account
   - [ ] Login with existing account
   - [ ] View calendar
   - [ ] Click on events
   - [ ] RSVP to events
   - [ ] Search functionality
   - [ ] Profile settings
   - [ ] Subscription management

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any errors
   - Verify API calls to Supabase

4. **Test on Mobile**
   - Open on your phone
   - Check responsive design
   - Test all interactions

---

### Step 5: Set Up Custom Domain (Optional)

1. **Purchase Domain** (if you don't have one)
   - Namecheap, GoDaddy, Google Domains, etc.
   - Example: `agora-invest.com`

2. **Add Domain in Vercel**
   - Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `agora-invest.com`
   - Also add: `www.agora-invest.com`

3. **Update DNS Records**
   - In your domain registrar (e.g., Namecheap):
   
   **A Record:**
   ```
   Type: A
   Host: @
   Value: 76.76.21.21
   ```
   
   **CNAME Record:**
   ```
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for DNS Propagation**
   - Usually 5-30 minutes
   - Check status: [whatsmydns.net](https://www.whatsmydns.net/)

5. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Your site will be HTTPS within minutes

6. **Update Supabase**
   - Add custom domain to Supabase redirect URLs
   - Update email templates with new domain

---

### Step 6: Enable Automatic Deployments

**Already Set Up!** 🎉

Since you connected via GitHub, Vercel automatically:
- ✅ Deploys every push to `main` branch
- ✅ Creates preview deployments for PRs
- ✅ Runs build checks before merging

**Workflow:**
```bash
# Make changes on dev branch
git checkout dev
# ... make changes ...
git add .
git commit -m "New feature"
git push origin dev

# Merge to main when ready
git checkout main
git merge dev
git push origin main

# Vercel automatically deploys! 🚀
```

---

## 📊 Monitoring & Analytics

### Built-in Vercel Analytics

1. **Enable Analytics**
   - Project Settings → Analytics
   - Toggle "Enable Analytics"
   - Free tier: 100k events/month

2. **View Metrics**
   - Dashboard shows:
     - Page views
     - Unique visitors
     - Top pages
     - Geographic distribution
     - Performance metrics

### Performance Monitoring

1. **Core Web Vitals**
   - Vercel tracks automatically:
     - Largest Contentful Paint (LCP)
     - First Input Delay (FID)
     - Cumulative Layout Shift (CLS)

2. **Serverless Function Metrics**
   - Execution time
   - Error rate
   - Invocations

### Error Tracking (Optional)

Add Sentry for detailed error tracking:

```bash
npm install @sentry/react

# In src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.REACT_APP_ENVIRONMENT,
});
```

---

## 🔧 Advanced Configuration

### Environment Variables per Environment

Vercel supports different environments:

```bash
# Production (main branch)
vercel env add REACT_APP_SUPABASE_URL production

# Preview (PRs and other branches)
vercel env add REACT_APP_SUPABASE_URL preview

# Development (local)
vercel env add REACT_APP_SUPABASE_URL development
```

### Build & Deploy Hooks

Create webhooks to trigger deployments:

1. Project Settings → Git → Deploy Hooks
2. Create hook for `main` branch
3. Use URL to trigger deploys from CI/CD

### Edge Functions (Advanced)

Add serverless functions:

```bash
# Create api directory
mkdir -p api

# Create function
# api/hello.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' });
}
```

---

## 🔐 Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] Using Supabase `anon` key (not `service_role`)
- [ ] RLS policies enabled in Supabase
- [ ] HTTPS/SSL active (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Email verification enabled
- [ ] Strong password policies set
- [ ] No sensitive data in Git repository

---

## 💰 Cost Breakdown

### Vercel Free Tier
- **Bandwidth**: 100 GB/month
- **Deployments**: Unlimited
- **Team Members**: 1
- **Projects**: Unlimited
- **Analytics**: 100k events
- **Build Time**: 100 hours/month
- **Edge Functions**: 100k invocations

**Sufficient for:**
- MVP and testing
- Small user base (< 1000 users)
- Personal projects

### Vercel Pro ($20/month)
- **Bandwidth**: 1 TB/month
- **Analytics**: 10M events
- **Team Members**: Unlimited
- **Priority Support**: Yes
- **Password Protection**: Yes
- **Custom Deployment Domains**: Yes

**Best for:**
- Production applications
- Growing user base
- Team collaboration

### When to Upgrade?
- Exceeding 100 GB bandwidth
- Need more than 100k analytics events
- Want password-protected previews
- Need team collaboration features

---

## 🚨 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "Build exceeded timeout"**
- Optimize dependencies
- Remove unused packages
- Split large bundles

### Environment Variables Not Working

**Check:**
1. Variables are prefixed with `REACT_APP_`
2. Variables are set in Vercel dashboard
3. Redeploy after adding variables
4. Check variable names match exactly

### Supabase Connection Issues

**Error: "Invalid API key"**
- Verify you're using `anon` key (not `service_role`)
- Check key in Supabase dashboard → Settings → API

**Error: "CORS policy"**
- Add Vercel URL to Supabase CORS settings
- Check Supabase authentication redirect URLs

### 404 Errors on Routes

**For React Router:**
Already configured in `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📞 Support Resources

### Vercel
- **Docs**: https://vercel.com/docs
- **Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions
- **Status**: https://www.vercel-status.com/

### Supabase
- **Docs**: https://supabase.com/docs
- **Support**: https://supabase.com/support
- **Discord**: https://discord.supabase.com

### AGORA
- **GitHub**: https://github.com/BenAji/agora9
- **Issues**: https://github.com/BenAji/agora9/issues

---

## ✅ Post-Deployment Checklist

- [ ] App deployed successfully
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Supabase redirect URLs updated
- [ ] All features tested in production
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Team members invited (if applicable)
- [ ] Documentation updated
- [ ] Users notified of new URL
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 🎉 Next Steps

1. **Share Your App**
   - Send production URL to team/users
   - Create user documentation
   - Set up support channel

2. **Monitor Performance**
   - Check Vercel Analytics daily
   - Review error logs
   - Monitor Supabase usage

3. **Iterate & Improve**
   - Gather user feedback
   - Deploy updates via Git
   - Scale as needed

4. **Marketing & Growth**
   - Add SEO metadata
   - Set up Google Analytics (optional)
   - Create landing page
   - Social media presence

---

**🚀 Ready to Deploy!**

Your production URL will be:
```
https://agora-react.vercel.app
```

Or with custom domain:
```
https://your-domain.com
```

**Deployment time: ~3 minutes** ⏱️

Let's go live! 🎊

