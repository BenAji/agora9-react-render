# 🚀 AGORA Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### Code Quality
- [x] All TypeScript compilation errors resolved
- [x] No linting errors (`npm run build` passes)
- [x] Production build successful (165.3 kB gzipped)
- [x] Unused dependencies removed
- [x] Console logs cleaned up
- [x] Development documentation removed

### Environment Setup
- [ ] `.env.local` created with development credentials
- [ ] Supabase project URL confirmed
- [ ] Supabase anon key obtained (not service role key!)
- [ ] Weather API key obtained (optional)
- [ ] All environment variables documented

### Database
- [ ] Supabase database migrated to remote
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Database functions tested
- [ ] Seed data populated
- [ ] User authentication configured

### Security
- [ ] `.env` files in `.gitignore`
- [ ] No sensitive data in code
- [ ] CORS configured in Supabase
- [ ] Email verification enabled
- [ ] Password policies set

## Deployment Process

### Git Repository
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `.gitignore` properly configured
- [ ] README.md updated with deployment info
- [ ] Branch protection rules set (optional)

### Hosting Platform (Vercel Recommended)
- [ ] Account created on hosting platform
- [ ] New project created
- [ ] Repository connected
- [ ] Build settings configured
  - Build Command: `npm run build`
  - Output Directory: `build`
  - Install Command: `npm install`
- [ ] Environment variables added:
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
  - [ ] `REACT_APP_WEATHER_API_KEY` (optional)
  - [ ] `REACT_APP_ENVIRONMENT=production`

### Initial Deployment
- [ ] Deploy to staging/preview first
- [ ] Test all features in preview:
  - [ ] User signup/login
  - [ ] Calendar display
  - [ ] Event details
  - [ ] RSVP functionality
  - [ ] Company reordering
  - [ ] Search functionality
  - [ ] Profile settings
  - [ ] Subscription management
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify API calls to Supabase

### Production Deployment
- [ ] Deploy to production domain
- [ ] Verify HTTPS/SSL active
- [ ] Test all features again
- [ ] Check performance metrics
- [ ] Monitor error logs

## Post-Deployment

### Domain & DNS (Optional)
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Domain redirects working
- [ ] www and non-www both work

### Supabase Configuration
- [ ] Auth redirect URLs updated:
  - [ ] Add production URL to allowed redirect URLs
  - [ ] Add production URL to site URL
  - [ ] Configure email templates with production URL
- [ ] CORS settings updated
- [ ] API rate limits configured

### Monitoring & Analytics
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry optional)
- [ ] Performance monitoring active
- [ ] Uptime monitoring set up (optional)

### User Access
- [ ] Test user accounts created
- [ ] Invite beta users
- [ ] Share production URL
- [ ] Provide user documentation
- [ ] Set up support channel

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] User guide created
- [ ] API documentation updated
- [ ] Troubleshooting guide written

## Ongoing Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review and rotate API keys quarterly

### Scaling Considerations
- [ ] Monitor bandwidth usage
- [ ] Check database size
- [ ] Review API call patterns
- [ ] Plan for increased traffic
- [ ] Consider CDN optimization

## Rollback Plan

### If Issues Occur
- [ ] Previous deployment URL saved
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Team notified of issues
- [ ] Incident response plan ready

## Team Communication

### Notify Team
- [ ] Deployment schedule communicated
- [ ] Production URL shared
- [ ] Access credentials distributed (if needed)
- [ ] Support procedures established
- [ ] Feedback mechanism set up

---

## Quick Deployment Commands

### Vercel (Recommended)
```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Netlify
```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod --dir=build
```

### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **React Deployment**: https://create-react-app.dev/docs/deployment
- **AGORA Deployment Strategy**: See `DEPLOYMENT_STRATEGY.md`

---

**Last Updated**: Ready for deployment
**Deployment Status**: ✅ Pre-deployment checklist complete
**Next Step**: Choose hosting platform and deploy!

