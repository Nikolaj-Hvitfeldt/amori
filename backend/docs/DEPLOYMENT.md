# Backend Deployment Guide 🚀

This guide covers deploying the Amori backend API to production. The backend is a NestJS application that provides REST API endpoints for managing moments, dates, and milestones, with image processing and Supabase integration.

## Prerequisites

Before deploying, ensure you have:
- ✅ Node.js v20+ installed
- ✅ A Supabase account with a project created
- ✅ Database schema set up (see `schema.sql`)
- ✅ Storage buckets created in Supabase
- ✅ Service role key from Supabase (NOT anon key)

## Pre-Deployment Checklist

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run `schema.sql` to create all tables, indexes, and RLS policies
   - Or run migrations in order from `migrations/` folder
4. Verify tables exist: `moments`, `date_entries`, `milestones`

### 2. Storage Buckets Setup

Create three public storage buckets in Supabase:

1. Go to Storage in Supabase Dashboard
2. Create bucket: `moments-photos` (set to **Public**)
3. Create bucket: `date-photos` (set to **Public**)
4. Create bucket: `milestone-photos` (set to **Public**)

**Important:** Buckets must be public for the app to access images.

### 3. Environment Variables

You'll need these environment variables:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Critical:** Use the **Service Role Key**, not the anon key. Find it in:
- Supabase Dashboard → Settings → API → Service Role Key

The service role key bypasses Row Level Security (RLS) and has full database access.

### 4. Test Locally First

Before deploying, test that everything works:

```bash
# Check environment variables
npm run check:env

# Test database connection
npm run test:connection

# Test image processing
npm run test:image

# Start development server
npm run start:dev
```

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway is great for quick deployments with automatic HTTPS and zero configuration.

1. **Sign up** at https://railway.app
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Configure:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add Environment Variables:**
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key
6. **Deploy!**

Railway will:
- Auto-detect Node.js
- Provide HTTPS URL automatically
- Handle restarts automatically
- Show logs in dashboard

Your backend will be available at: `https://your-app.railway.app`

**Free Tier:** 500 hours/month, then $5/month

### Option 2: Render

Render offers a free tier with automatic deployments.

1. **Sign up** at https://render.com
2. **New +** → "Web Service"
3. **Connect GitHub** repository
4. **Configure:**
   - Name: `amori-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add Environment Variables:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. **Create Web Service**

**Free Tier:** 750 hours/month, then $7/month

### Option 3: VPS (DigitalOcean, AWS EC2, Linode, etc.)

For full control, deploy to a VPS:

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/yourusername/amori.git
cd amori/backend

# Install dependencies
npm install

# Build the application
npm run build

# Set environment variables (create .env file)
nano .env
# Add:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Install PM2 for process management
npm install -g pm2

# Start the application
pm2 start dist/main.js --name amori-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions shown

# Check status
pm2 status
pm2 logs amori-backend
```

**Set up Nginx reverse proxy** (recommended):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then set up SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 4: Docker

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

Build and run:

```bash
# Build image
docker build -t amori-backend ./backend

# Run container
docker run -d \
  --name amori-backend \
  -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  amori-backend

# View logs
docker logs amori-backend

# Stop container
docker stop amori-backend
```

For Docker Compose, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

## Post-Deployment Steps

### 1. Verify Deployment

Test your deployed backend:

```bash
# Health check (if you have a health endpoint)
curl https://your-backend.railway.app

# Test moments endpoint
curl https://your-backend.railway.app/moments

# Test image upload
curl -X POST https://your-backend.railway.app/moments/upload-image \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

### 2. Update Frontend API URL

Update `frontend/src/services/api.ts`:

```typescript
const API_URL = Platform.OS === "web"
  ? "https://your-backend.railway.app"
  : "https://your-backend.railway.app";
```

### 3. Verify CORS

The backend is configured to allow all origins in development. For production, you may want to restrict CORS to your frontend domain. Update `src/constants/app.constants.ts`:

```typescript
export const CORS_CONFIG = {
  origin: [
    'https://your-frontend.netlify.app',
    'https://your-frontend.vercel.app',
    // Add other allowed origins
  ],
  credentials: true,
};
```

### 4. Monitor Logs

- **Railway**: View logs in dashboard
- **Render**: View logs in dashboard
- **VPS**: `pm2 logs amori-backend` or `docker logs amori-backend`
- **Docker**: `docker logs -f amori-backend`

## Troubleshooting

### Backend won't start

**Check environment variables:**
```bash
npm run check:env
```

**Common issues:**
- Missing `SUPABASE_SERVICE_ROLE_KEY`
- Wrong Supabase URL format
- Using anon key instead of service role key

### Database connection errors

**Test connection:**
```bash
npm run test:connection
```

**Verify:**
- Supabase URL is correct
- Service role key is correct
- Database tables exist
- RLS policies are set up (though service role bypasses them)

### Image upload not working

**Check storage buckets:**
```bash
# Run the storage bucket check script
npx ts-node tests/check-storage-buckets.ts
```

**Verify:**
- Storage buckets exist: `moments-photos`, `date-photos`, `milestone-photos`
- Buckets are set to **Public**
- Service role key has storage access

### CORS errors

**Symptoms:** Frontend can't connect to backend

**Solutions:**
- Verify CORS is enabled in `app.constants.ts`
- Check that frontend URL is in allowed origins (if restricted)
- Ensure backend is accessible via HTTPS in production

### Sharp/image processing errors

**Symptoms:** Image upload fails with Sharp errors

**Solutions:**
- Ensure `sharp` is installed: `npm install sharp`
- Check Node.js version (v20+ recommended)
- Verify image format is supported
- Check file size limits (10MB max)

## Environment-Specific Configuration

### Development

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

### Production

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3000
```

**Never commit `.env` files!** Use your hosting platform's environment variable settings.

## Monitoring & Maintenance

### Health Checks

Create a simple health check endpoint (optional):

```typescript
// In main.ts or a health controller
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Logging

The backend uses console.log for logging. For production, consider:
- Using a logging library (Winston, Pino)
- Setting up log aggregation (Logtail, Datadog)
- Monitoring errors (Sentry)

### Database Backups

Supabase provides automatic backups. You can also:
- Use Supabase Dashboard → Database → Backups
- Set up manual backups with scripts in `scripts/` folder

### Image Storage Management

Monitor storage usage in Supabase Dashboard:
- Storage → Overview
- Check bucket sizes
- Clean up unused images if needed

## Scaling Considerations

As your app grows:

1. **Database**: Supabase scales automatically (upgrade tier if needed)
2. **Backend**: Add more instances (Railway/Render auto-scaling)
3. **Image Processing**: Consider queue system for high volume
4. **Caching**: Add Redis for frequently accessed data
5. **CDN**: Use Cloudflare for static assets

## Security Best Practices

✅ **Environment Variables**: Never commit `.env` files  
✅ **Service Role Key**: Keep it secret, rotate if compromised  
✅ **HTTPS**: Always use HTTPS in production  
✅ **CORS**: Restrict to known origins in production  
✅ **Rate Limiting**: Consider adding rate limiting for API endpoints  
✅ **Input Validation**: DTOs validate all inputs  
✅ **File Size Limits**: 10MB max for images  
✅ **MIME Type Validation**: Only allow image types  

## Cost Estimates

**Free Tier:**
- Railway: $0 (500 hours/month)
- Render: $0 (750 hours/month)
- Supabase: $0 (500MB database, 1GB storage)

**Production:**
- Railway: $5-20/month
- Render: $7-25/month
- Supabase: $25/month (Pro tier)
- VPS: $5-20/month (DigitalOcean, etc.)

## Next Steps

1. ✅ Deploy backend to Railway/Render/VPS
2. ✅ Verify all endpoints work
3. ✅ Test image upload functionality
4. ✅ Update frontend API URL
5. ✅ Deploy frontend (see `frontend/docs/PWA_SETUP.md`)
6. ✅ Test full application flow

## Support

Need help?
- Check `backend/README.md` for API documentation
- See `docs/DEPLOYMENT.md` for general deployment guide
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs

Happy deploying! 🚀

