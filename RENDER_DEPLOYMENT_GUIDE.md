# Render Deployment Guide - Ologywood Artist Booking Platform

## Quick Start

Your Ologywood application is ready to deploy to Render! Follow these steps:

### Step 1: Create a Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended for easy integration)
3. Authorize Render to access your GitHub repositories

### Step 2: Create a New Web Service
1. Click **"New +"** button in Render dashboard
2. Select **"Web Service"**
3. Connect your GitHub repository: **Ologywood-Platform/ologywoodv5**
4. Select branch: **main**

### Step 3: Configure the Web Service

**Basic Settings:**
- **Name**: ologywood
- **Environment**: Node
- **Region**: Choose closest to your users (e.g., US East)
- **Plan**: Standard ($7/month) or higher

**Build & Deploy:**
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `npm start`

**Environment Variables:**
Add these in the "Environment" section:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-mysql-database-url>
STRIPE_SECRET_KEY=<your-stripe-key>
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-public-key>
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=<your-email>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
JWT_SECRET=<generate-a-random-string>
OPENAI_API_KEY=<your-openai-key>
OAUTH_SERVER_URL=<your-oauth-url>
VITE_OAUTH_PORTAL_URL=<your-oauth-portal-url>
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Pull your code from GitHub
   - Install dependencies
   - Build the production bundle
   - Start the server
3. Wait 5-10 minutes for deployment to complete

### Step 5: Access Your Live Site
Once deployed, you'll get a URL like: `https://ologywood.onrender.com`

---

## Troubleshooting

### Build Fails
- Check that `pnpm build` works locally
- Verify all environment variables are set
- Check Render logs for specific errors

### Application Crashes
- Check the logs in Render dashboard
- Verify database connection string is correct
- Ensure all required environment variables are set

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure database is accessible from Render
- Check database credentials

### Static Files Not Serving
- The server is configured to serve `dist/public` automatically
- If you see 404 errors, check that `pnpm build` completed successfully

---

## Monitoring & Maintenance

### View Logs
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Monitor for errors in real-time

### Set Up Alerts
1. Go to **"Settings"** → **"Notifications"**
2. Enable email alerts for deployment failures

### Manual Redeploy
1. Go to your service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Update Environment Variables
1. Go to **"Environment"** tab
2. Click **"Edit"** next to any variable
3. Changes take effect after next deployment

---

## Performance Tips

1. **Enable Auto-Deploy**: Automatically deploy when you push to GitHub
2. **Use Caching**: Render caches dependencies between builds
3. **Monitor Metrics**: Check CPU, memory, and request metrics
4. **Scale if Needed**: Upgrade to Pro plan for auto-scaling

---

## Support

If you encounter issues:
1. Check Render logs first
2. Verify environment variables are set correctly
3. Test locally with `npm start`
4. Contact Render support: https://render.com/support

---

## Next Steps After Deployment

1. **Test Critical Features**:
   - Login with OAuth
   - Create a booking
   - Process a test payment (use Stripe test card: 4242 4242 4242 4242)

2. **Monitor Performance**:
   - Check response times
   - Monitor error rates
   - Review user feedback

3. **Set Up Monitoring**:
   - Enable error tracking (Sentry)
   - Set up analytics
   - Configure alerts

4. **Custom Domain** (Optional):
   - Go to Settings → Custom Domain
   - Add your domain (e.g., ologywood.com)
   - Update DNS records

---

**Your application is production-ready! Deploy with confidence! 🚀**
