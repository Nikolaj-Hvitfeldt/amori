# Deployment Guide 🚀

This guide covers deploying your Amori journal app to production.

## Database (Supabase)

Your Supabase database is already production-ready! Just ensure you've:

1. ✅ Created the database schema using `backend/schema.sql`
2. ✅ Noted your production Supabase URL and keys
3. ✅ (Optional) Set up Row Level Security policies for data protection

### Setting Up Row Level Security (Recommended)

In Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all entries
CREATE POLICY "Users can view entries"
  ON journal_entries FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert entries
CREATE POLICY "Users can insert entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their entries
CREATE POLICY "Users can update entries"
  ON journal_entries FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete their entries
CREATE POLICY "Users can delete entries"
  ON journal_entries FOR DELETE
  USING (auth.role() = 'authenticated');
```

## Backend Deployment

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js app
5. Set the root directory to `backend`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
7. Deploy!

Your backend will be available at: `https://your-app.railway.app`

### Option 2: Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: amori-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Click "Create Web Service"

### Option 3: Heroku

```bash
cd backend

# Create Heroku app
heroku create amori-backend

# Set environment variables
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_KEY=your-key

# Create Procfile
echo "web: npm start" > Procfile

# Deploy
git subtree push --prefix backend heroku main
```

### Option 4: VPS (DigitalOcean, AWS, etc.)

```bash
# On your server
git clone your-repo
cd amori/backend
npm install
npm run build

# Set environment variables
export SUPABASE_URL=your-url
export SUPABASE_KEY=your-key

# Use PM2 for process management
npm install -g pm2
pm2 start dist/main.js --name amori-backend
pm2 save
pm2 startup
```

## Frontend Deployment

### Option 1: Expo (For Mobile Apps)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure your app:
   ```bash
   cd frontend
   eas build:configure
   ```

4. Update API URL in `src/services/api.ts`:
   ```typescript
   const API_URL = 'https://your-backend.railway.app';
   ```

5. Build for Android:
   ```bash
   eas build --platform android
   ```

6. Build for iOS:
   ```bash
   eas build --platform ios
   ```

7. Submit to stores:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

### Option 2: React Native CLI (Traditional)

#### Android
```bash
cd frontend/android
./gradlew assembleRelease
```
APK will be in `android/app/build/outputs/apk/release/`

#### iOS
1. Open `frontend/ios/amori.xcworkspace` in Xcode
2. Select "Generic iOS Device"
3. Product → Archive
4. Upload to App Store Connect

### Option 3: Web (Expo Web)

If you want a web version:

```bash
cd frontend

# Build for web
npx expo export:web

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir web-build
```

Or use Vercel:
```bash
npm install -g vercel
vercel --prod
```

## Environment Configuration

### Production Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-production-anon-key
PORT=3000
NODE_ENV=production
```

### Production Frontend

Update these files:

**src/services/api.ts:**
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.railway.app';
```

**src/services/supabase.ts:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'your-key';
```

Then create `.env.production`:
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-production-anon-key
```

## Post-Deployment Checklist

- [ ] Backend is accessible at production URL
- [ ] Environment variables are set correctly
- [ ] Database schema is created in production Supabase
- [ ] Frontend API URL points to production backend
- [ ] CORS is enabled on backend for your frontend domain
- [ ] SSL/HTTPS is working
- [ ] Test all API endpoints
- [ ] Test the mobile app on real devices
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Set up analytics (optional: Google Analytics, Mixpanel)

## Monitoring & Maintenance

### Backend Monitoring
- Use Railway/Render built-in metrics
- Set up error tracking with Sentry
- Monitor API response times

### Database Monitoring
- Use Supabase Dashboard for metrics
- Set up alerts for high usage
- Regular backups (automatic in Supabase)

### Frontend Monitoring
- Expo provides analytics in EAS dashboard
- Consider adding Sentry for crash reporting
- Monitor app performance with React Native Performance

## Scaling Considerations

As your app grows:

1. **Database**: Supabase free tier handles 500MB/2GB. Upgrade as needed.
2. **Backend**: Add more dynos/instances on Railway/Render
3. **CDN**: Use Cloudflare for static assets
4. **Caching**: Implement Redis for frequently accessed data
5. **Image Storage**: Use Supabase Storage or Cloudinary for images

## Security Best Practices

1. Never commit `.env` files
2. Use HTTPS everywhere
3. Implement Supabase Row Level Security
4. Add authentication (Supabase Auth)
5. Validate all user inputs
6. Rate limit your API endpoints
7. Keep dependencies updated
8. Regular security audits

## Cost Estimates (Monthly)

**Free Tier:**
- Supabase: $0 (500MB database, 2GB bandwidth)
- Railway: $0 (500 hours, then $5/month)
- Expo: $0 (community plan)
- **Total**: ~$0-5/month

**Production:**
- Supabase Pro: $25/month (8GB database, 50GB bandwidth)
- Railway Pro: $20/month (higher limits)
- Expo: Free for most apps
- **Total**: ~$45/month

## Support

Need help with deployment?
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs

Happy deploying! 🚀
