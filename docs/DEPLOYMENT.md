# Deployment Guide 🚀

This guide covers deploying your Amori journal app to production.

## Database (Supabase)

Your Supabase database is already production-ready! Just ensure you've:

1. ✅ Created the database schema using `backend/schema.sql` or migrations
2. ✅ Created storage buckets: `moments-photos`, `date-photos`, `milestone-photos`
3. ✅ Set buckets to Public (or configure policies)
4. ✅ Noted your production Supabase URL and service role key
5. ✅ Row Level Security is enabled (included in schema.sql)

### Verifying RLS

RLS is enabled in the schema. To verify in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('moments', 'date_entries', 'milestones');
```

## Backend Deployment

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js app
5. Set the root directory to `backend`
6. Add environment variables:
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (NOT anon key)
7. Railway will auto-detect build and start commands
8. Deploy!

Your backend will be available at: `https://your-app.railway.app`

### Option 2: Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: amori-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Create Web Service"

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# On your server
git clone your-repo
cd amori/backend
npm install
npm run build

# Set environment variables
export SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Use PM2 for process management
npm install -g pm2
pm2 start dist/main.js --name amori-backend
pm2 save
pm2 startup
```

### Option 4: Docker

Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t amori-backend ./backend
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  amori-backend
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
   const API_URL = Platform.OS === "web"
     ? "https://your-backend.railway.app"
     : "https://your-backend.railway.app"; // Use production URL for mobile too
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

### Option 2: Web Deployment (PWA)

Build for web:
```bash
cd frontend
npm run build
```

Deploy to Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir web-build
```

Or use Vercel:
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Option 3: Standalone Mobile Apps

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

## Environment Configuration

### Production Backend (.env)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3000
```

**Important:** Never commit `.env` files. Use your hosting platform's environment variable settings.

### Production Frontend

Update `src/services/api.ts`:
```typescript
const API_URL = Platform.OS === "web"
  ? process.env.EXPO_PUBLIC_API_URL || "https://your-backend.railway.app"
  : "https://your-backend.railway.app";
```

For Expo, you can use environment variables:
```bash
# Create .env.production
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

## Post-Deployment Checklist

- [ ] Backend is accessible at production URL
- [ ] Environment variables are set correctly (service role key!)
- [ ] Database schema is created in production Supabase
- [ ] Storage buckets are created and set to Public
- [ ] Frontend API URL points to production backend
- [ ] CORS is enabled on backend (already configured)
- [ ] SSL/HTTPS is working
- [ ] Test all API endpoints
- [ ] Test image upload functionality
- [ ] Test the mobile app on real devices
- [ ] Verify RLS is enabled
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Set up analytics (optional: Google Analytics, Mixpanel)

## Monitoring & Maintenance

### Backend Monitoring
- Use Railway/Render built-in metrics
- Set up error tracking with Sentry
- Monitor API response times
- Check image processing performance

### Database Monitoring
- Use Supabase Dashboard for metrics
- Set up alerts for high usage
- Regular backups (automatic in Supabase)
- Monitor storage bucket usage

### Frontend Monitoring
- Expo provides analytics in EAS dashboard
- Consider adding Sentry for crash reporting
- Monitor app performance
- Track image loading performance

## Scaling Considerations

As your app grows:

1. **Database**: Supabase free tier handles 500MB/2GB. Upgrade as needed.
2. **Backend**: Add more instances on Railway/Render
3. **CDN**: Use Cloudflare for static assets
4. **Caching**: Implement Redis for frequently accessed data
5. **Image Storage**: Supabase Storage scales automatically
6. **Image Processing**: Consider queue system for high volume

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use HTTPS everywhere
3. ✅ Row Level Security is enabled
4. ✅ Service role key stored securely (never in frontend)
5. ✅ Validate all user inputs (DTOs)
6. ✅ File size limits (10MB max)
7. ✅ MIME type validation
8. ✅ Keep dependencies updated
9. ✅ Regular security audits
10. ✅ Monitor for suspicious activity

## Image Storage Considerations

- **Supabase Storage**: Free tier includes 1GB, then $0.021/GB
- **Compression**: Images are automatically compressed to save space
- **Thumbnails**: Generated for faster loading
- **Cleanup**: Images are deleted when entries are deleted

## Cost Estimates (Monthly)

**Free Tier:**
- Supabase: $0 (500MB database, 2GB bandwidth, 1GB storage)
- Railway: $0 (500 hours, then $5/month)
- Render: $0 (750 hours free tier)
- Expo: $0 (community plan)
- **Total**: ~$0-5/month

**Production:**
- Supabase Pro: $25/month (8GB database, 50GB bandwidth, 100GB storage)
- Railway Pro: $20/month (higher limits)
- Render: $7/month (starter plan)
- Expo: Free for most apps
- **Total**: ~$32-52/month

## Troubleshooting Production Issues

### Backend Issues
- Check logs in Railway/Render dashboard
- Verify environment variables are set
- Test API endpoints with curl/Postman
- Check Supabase connection

### Image Upload Issues
- Verify storage buckets exist and are public
- Check file size limits
- Verify MIME types are allowed
- Check Supabase Storage policies

### Frontend Issues
- Verify API URL is correct
- Check CORS settings
- Test on multiple devices
- Check browser console for errors

## Support

Need help with deployment?
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs

Happy deploying! 🚀
