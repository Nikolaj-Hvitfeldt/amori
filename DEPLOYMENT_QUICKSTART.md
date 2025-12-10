# Quick Deployment Guide 🚀

**Deploy Amori in 15 minutes!**

## Prerequisites Checklist

- [ ] Supabase project created
- [ ] Database schema run (`backend/schema.sql`)
- [ ] Storage buckets created: `moments-photos`, `date-photos`, `milestone-photos`
- [ ] Service role key copied from Supabase
- [ ] GitHub repository ready

---

## Step 1: Deploy Backend to Render (5 min)

**Note:** Use Manual Web Service setup (not Blueprint) due to a known path resolution issue with Blueprint.

1. Go to https://render.com → Sign up/Login
2. Click **"New +"** → **"Web Service"** (NOT Blueprint)
3. Connect your GitHub repository
4. **Configure:**
   - **Name:** `amori-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
6. Click **"Create Web Service"** → Wait for deployment
7. **Copy your backend URL:** `https://amori-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel (5 min)

### Using CLI (Recommended):

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

### Using Dashboard:

1. Go to https://vercel.com → Sign up/Login
2. Click **"Add New"** → **"Project"**
3. Import from GitHub → Select your repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build:pwa`
   - **Output Directory:** `web-build`
5. Add environment variable:
   - `EXPO_PUBLIC_API_URL` = `https://amori-backend.onrender.com` (your Render URL)
6. Click **"Deploy"**

---

## Step 3: Test Everything (5 min)

1. Visit your Vercel URL
2. Create a moment with a photo
3. Verify it appears in the app
4. Check Supabase Storage to see the uploaded image

---

## Troubleshooting

**Backend not responding?**
- Check Render logs
- Verify environment variables are set
- First request after spin-down takes 30-60 seconds (free tier)

**Frontend can't connect to backend?**
- Verify `EXPO_PUBLIC_API_URL` is set in Vercel
- Check backend URL is correct
- Look for CORS errors in browser console

**Need help?** See `docs/DEPLOYMENT.md` for detailed guide.

---

## Your URLs

- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://amori-backend.onrender.com`

**Done!** 🎉 Share your PWA URL with your girlfriend!

