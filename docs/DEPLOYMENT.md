# Deployment Guide 🚀

This guide covers deploying Amori to production:
- **Frontend** → Vercel (PWA)
- **Backend** → Render (API)

## Prerequisites

Before deploying, ensure you have:
- ✅ Node.js v20+ installed locally
- ✅ A Supabase account with a project created
- ✅ Database schema set up (see `backend/schema.sql`)
- ✅ Storage buckets created in Supabase
- ✅ Service role key from Supabase (NOT anon key)
- ✅ GitHub account (for connecting repositories)

## Quick Start

1. **Deploy Backend to Render** (5-10 minutes)
2. **Deploy Frontend to Vercel** (5-10 minutes)
3. **Update API URL** in frontend environment variables
4. **Test everything!**

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Your Backend

1. **Verify your backend is ready:**
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm run start:dev
   # Should start on http://localhost:3000
   ```

### Step 2: Set Up Supabase

1. **Create storage buckets** in Supabase Dashboard:
   - Go to Storage → Create bucket
   - Create: `moments-photos` (Public)
   - Create: `date-photos` (Public)
   - Create: `milestone-photos` (Public)

2. **Get your credentials:**
   - Supabase URL: Dashboard → Settings → API → Project URL
   - Service Role Key: Dashboard → Settings → API → Service Role Key (⚠️ Keep secret!)

3. **Set up database:**
   - Go to SQL Editor in Supabase
   - Run `backend/schema.sql` to create tables

### Step 3: Deploy to Render

1. **Sign up** at https://render.com (free tier available)

2. **Option A: Using Blueprint (Easiest - Recommended)**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` in the root
   - Add environment variables:
     - `SUPABASE_URL` = Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key
   - Click "Apply" → Wait for deployment
   - Your backend will be available at: `https://amori-backend.onrender.com`

3. **Option B: Manual Web Service Setup**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository
   - **Configure the service:**
     - **Name:** `amori-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
   - **Add Environment Variables:**
     - Click "Environment" tab
     - Add:
       ```
       NODE_ENV=production
       SUPABASE_URL=https://your-project-id.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
       ```
     - ⚠️ **Important:** Use the **Service Role Key**, not the anon key!
   - **Deploy:**
     - Click "Create Web Service"
     - Wait for build to complete (2-5 minutes)
     - Your backend will be available at: `https://amori-backend.onrender.com`

### Step 4: Verify Backend

Test your deployed backend:

```bash
# Health check
curl https://amori-backend.onrender.com

# Should return:
# {"message":"Amori API","version":"1.0.0",...}
```

**Note:** Render free tier services spin down after 15 minutes of inactivity. The first request may take 30-60 seconds to wake up.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Your Frontend

1. **Verify your frontend is ready:**
   ```bash
   cd frontend
   npm install
   npm run build:pwa
   # Should create web-build/ folder
   ```

2. **Update API URL** (we'll do this via environment variables in Vercel)

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Follow prompts:**
   - Link to existing project? → No (first time)
   - Project name? → `amori` (or your choice)
   - Directory? → `frontend`
   - Override settings? → No (uses `vercel.json`)

5. **Add Environment Variables:**
   - Go to https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add:
     ```
     EXPO_PUBLIC_API_URL=https://amori-backend.onrender.com
     ```
   - Apply to: Production, Preview, Development

6. **Redeploy:**
   ```bash
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard

1. **Sign up** at https://vercel.com

2. **Import Project:**
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository

3. **Configure:**
   - **Framework Preset:** Other
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build:pwa`
   - **Output Directory:** `web-build`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   - Before deploying, add:
     ```
     EXPO_PUBLIC_API_URL=https://amori-backend.onrender.com
     ```
   - (Replace with your actual Render backend URL)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Your frontend will be available at: `https://amori.vercel.app` (or your custom domain)

### Step 3: Verify Frontend

1. **Visit your Vercel URL**
2. **Test the app:**
   - Create a moment
   - Upload a photo
   - Verify API calls work

---

## Part 3: Update Configuration

### Update Backend CORS (Optional)

If you want to restrict CORS to only your Vercel domain:

1. **In Render Dashboard:**
   - Go to your service → Environment
   - Add:
     ```
     ALLOWED_ORIGINS=https://amori.vercel.app,https://amori-git-main.vercel.app
     ```
   - (Add all your Vercel preview URLs if needed)

2. **Redeploy backend** (Render will auto-redeploy)

### Update Frontend API URL

The frontend uses `EXPO_PUBLIC_API_URL` environment variable. Make sure it's set in Vercel:

1. **Vercel Dashboard:**
   - Project → Settings → Environment Variables
   - Verify `EXPO_PUBLIC_API_URL` is set to your Render backend URL

2. **Redeploy frontend** if you changed it

---

## Post-Deployment Checklist

- [ ] Backend is accessible at Render URL
- [ ] Frontend is accessible at Vercel URL
- [ ] API calls work from frontend
- [ ] Image upload works
- [ ] Database operations work (create, read, update, delete)
- [ ] CORS is configured correctly
- [ ] Environment variables are set correctly

---

## Troubleshooting

### Backend Issues

**Backend won't start:**
- Check Render logs: Service → Logs
- Verify environment variables are set
- Check that `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)

**Database connection errors:**
- Verify Supabase URL is correct
- Check that database schema is set up
- Verify service role key has correct permissions

**CORS errors:**
- Check `ALLOWED_ORIGINS` environment variable
- Or set `origin: true` in `app.constants.ts` for development

**Render service is slow:**
- Free tier services spin down after 15 minutes
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid tier for always-on service

### Frontend Issues

**API calls failing:**
- Check `EXPO_PUBLIC_API_URL` is set correctly in Vercel
- Verify backend URL is accessible
- Check browser console for CORS errors
- Ensure backend CORS allows your Vercel domain

**Build fails:**
- Check Vercel build logs
- Verify `npm run build:pwa` works locally
- Check that all dependencies are in `package.json`

**Icons not showing:**
- Verify icons exist in `frontend/assets/`
- Check `app.json` paths are correct
- Rebuild: `npm run build:pwa`

### General Issues

**Images not loading:**
- Check Supabase Storage buckets are public
- Verify image URLs are correct
- Check browser console for errors

**PWA not installing:**
- Must use HTTPS (Vercel provides this automatically)
- Check browser console for errors
- Verify `manifest.json` is correct

---

## Cost Estimates

### Free Tier (Perfect for Starting)

- **Render:** 750 hours/month free (enough for 24/7 single service)
- **Vercel:** Unlimited free tier for personal projects
- **Supabase:** 500MB database, 1GB storage free

**Total: $0/month** 🎉

### If You Need More

- **Render:** $7/month (always-on service, no spin-down)
- **Vercel:** Free tier is generous, Pro is $20/month
- **Supabase Pro:** $25/month (8GB database, 100GB storage)

---

## Next Steps

1. ✅ **Custom Domain** (Optional)
   - Add custom domain in Vercel
   - Update `EXPO_PUBLIC_API_URL` if needed

2. ✅ **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor Render logs
   - Set up uptime monitoring

3. ✅ **Backups**
   - Supabase provides automatic backups
   - Consider manual backups for important data

4. ✅ **Performance**
   - Enable Vercel Analytics
   - Monitor Render service performance
   - Optimize images (already done!)

---

## Support

Need help?
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Backend README:** `backend/README.md`
- **Frontend PWA Guide:** `frontend/docs/PWA_SETUP.md`

Happy deploying! 🚀💕
