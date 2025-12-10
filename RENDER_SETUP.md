# Render Deployment Setup Instructions

## The Issue

Render has a path resolution bug when using "Root Directory" that causes it to look for files in `/opt/render/project/src/backend/` instead of `/opt/render/project/backend/`.

## Solution: Manual Setup WITHOUT Root Directory

### Step-by-Step:

1. **Go to Render Dashboard** → Click "New +" → "Web Service"

2. **Connect GitHub** and select your repository

3. **Configure the service:**
   - **Name:** `amori-backend`
   - **Root Directory:** Leave EMPTY (do not set to `backend`)
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`

4. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key

5. **Click "Create Web Service"**

## Why This Works

By leaving Root Directory empty and using explicit `cd backend` commands, we avoid Render's path resolution bug. The commands will:
1. Change to the backend directory
2. Run npm commands from there
3. Node will correctly resolve `dist/main.js` relative to the backend directory

## Alternative: If Still Not Working

If you still get errors, try this start command instead:
```
cd backend && pwd && ls -la dist/ && node dist/main.js
```

This will show you:
- The current working directory
- What files are in the dist folder
- Then try to run the app

This helps debug where Render is actually looking for files.

