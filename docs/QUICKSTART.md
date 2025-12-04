# Quick Start Guide 🚀

Get your Amori journal app up and running in minutes!

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js v20+ installed
- ✅ npm installed
- ✅ A Supabase account (sign up at https://supabase.com - it's free!)

## Step-by-Step Setup

### 1️⃣ Set Up Supabase Database

1. Go to https://supabase.com and create a new project
2. Wait for your database to be provisioned (takes ~2 minutes)
3. Navigate to the SQL Editor in your Supabase dashboard
4. Copy the contents of `backend/schema.sql`
5. Paste it into the SQL Editor and click "Run"
6. Your database tables are now ready! ✨

**Note:** Alternatively, you can run the migration files in `backend/migrations/` in order (002, 003, 004, 005, 006, 007, 009).

### 2️⃣ Set Up Supabase Storage

1. In Supabase Dashboard, go to Storage
2. Create three public buckets:
   - `moments-photos`
   - `date-photos`
   - `milestone-photos`
3. Set each bucket to **Public** (or configure policies as needed)

### 3️⃣ Configure Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
# Create .env file with:
```

Edit the `.env` file with your Supabase credentials:
```
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```

**Important:** Use the **Service Role Key**, not the anon key. Find it in:
Supabase Dashboard → Settings → API → Service Role Key

### 4️⃣ Start the Backend

```bash
# Still in the backend directory
npm run start:dev
```

You should see:
```
Backend is running on http://localhost:3000
Also accessible at http://YOUR_LOCAL_IP:3000
```

Keep this terminal running! 🏃

### 5️⃣ Configure Frontend

Open a **new terminal** window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

Update the API URL in `src/services/api.ts`:
```typescript
const API_URL = Platform.OS === "web"
  ? "http://localhost:3000"           // Web
  : "http://YOUR_LOCAL_IP:3000";      // Mobile (use the IP from backend output)
```

### 6️⃣ Start the Frontend

```bash
# Still in the frontend directory
npm start
```

This will start the React Native development server.

### 7️⃣ Run on a Device/Emulator

#### For Web (Easiest for Testing)
```bash
# In the frontend terminal, press 'w'
# Or run:
npm run web
```

#### For iOS Simulator (Mac only)
```bash
# In the frontend terminal, press 'i'
# Or run:
npm run ios
```

#### For Android Emulator
```bash
# In the frontend terminal, press 'a'
# Or run:
npm run android
```

#### For Mobile Device
1. Install Expo Go app on your phone
2. Scan the QR code shown in the terminal
3. Make sure your phone is on the same network as your computer

## Adding Sample Data

To test the app with some sample data, see `EXAMPLE_DATA.md` for examples.

### Option 1: Using the App UI

1. Open the app
2. Tap the Floating Action Button (+)
3. Fill in the form
4. Add photos if desired
5. Save!

### Option 2: Using curl (Terminal)

```bash
# Create a moment
curl -X POST http://localhost:3000/moments \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Day We Met",
    "story_date": "2023-01-15",
    "description": "I will never forget the moment our eyes met...",
    "photos": []
  }'

# Create a date entry
curl -X POST http://localhost:3000/dates \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-02-14",
    "location": "Fancy Restaurant",
    "description": "Wonderful anniversary dinner",
    "mood": "romantic",
    "highlights": ["Great food", "Beautiful ambiance"]
  }'

# Create a milestone
curl -X POST http://localhost:3000/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "milestone_type": "first_date",
    "title": "Our First Date",
    "date": "2023-01-20",
    "description": "We went to the movies..."
  }'
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project
2. Click "Table Editor"
3. Select a table (`moments`, `date_entries`, or `milestones`)
4. Click "Insert row"
5. Fill in the fields
6. Click "Save"

## Testing the App

Once you have data:

1. **Home Tab** 🏠 - See all entries in a chronological timeline
2. **Moments Tab** 💕 - View only love stories/moments
3. **Dates Tab** 📅 - See special dates with mood theming
4. **Milestones Tab** 🏆 - View relationship milestones
5. **Pictures Tab** 📸 - Gallery view of all photos

## Features to Try

- ✅ **Create entries** - Tap the FAB (+) button
- ✅ **Upload photos** - Add multiple photos per entry
- ✅ **Date picker** - Click the date field to pick a date
- ✅ **Animations** - Notice smooth card animations
- ✅ **Delete entries** - Edit an entry and tap delete
- ✅ **View details** - Tap any card to see full details

## Troubleshooting

### Backend won't start
- Check that port 3000 is available
- Verify your Supabase credentials are correct (use SERVICE ROLE KEY)
- Run `npm install` again
- Check that `.env` file exists and has correct values

### Frontend won't connect
- Make sure backend is running on http://localhost:3000
- Check the API URL in `src/services/api.ts`
- For mobile: Use your local IP address (shown in backend output)
- Ensure both devices are on the same network

### No data showing
- Make sure you've created the database tables using `schema.sql`
- Add some test data using the methods above
- Check the browser/app console for errors
- Verify backend is running and accessible

### Images not uploading
- Check that Supabase Storage buckets are created
- Verify buckets are set to Public
- Check backend console for error messages
- Ensure image size is under 10MB

### Date picker not working
- On web: Check browser console for errors
- On mobile: Ensure `@react-native-community/datetimepicker` is installed
- Verify date format matches backend expectations

## Next Steps

- 📝 Customize the color themes in `frontend/src/constants/theme.ts`
- 🎨 Add your own images to entries
- 🚀 Deploy to production (see `DEPLOYMENT.md`)
- 💾 Row Level Security is already enabled for data protection

## Need Help?

Check out:
- `README.md` - Full documentation
- `ARCHITECTURE.md` - System architecture
- `DEPLOYMENT.md` - Production deployment guide
- `backend/README.md` - Backend API docs
- `frontend/README.md` - Frontend docs

Enjoy documenting your journey together! 💕
