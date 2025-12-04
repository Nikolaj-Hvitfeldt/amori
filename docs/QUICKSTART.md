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
6. Your database table is now ready! ✨

### 2️⃣ Configure Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Now edit the `.env` file with your Supabase credentials:
```
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_KEY=YOUR-ANON-KEY
```

You can find these in your Supabase project settings under API.

### 3️⃣ Start the Backend

```bash
# Still in the backend directory
npm run start:dev
```

You should see:
```
Backend is running on http://localhost:3000
```

Keep this terminal running! 🏃

### 4️⃣ Configure Frontend

Open a **new terminal** window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

Update the Supabase credentials in `src/services/supabase.ts`:
```typescript
const supabaseUrl = 'https://YOUR-PROJECT-ID.supabase.co';
const supabaseAnonKey = 'YOUR-ANON-KEY';
```

### 5️⃣ Start the Frontend

```bash
# Still in the frontend directory
npm start
```

This will start the React Native development server.

### 6️⃣ Run on a Device/Emulator

#### For Web (Easiest for Testing)
```bash
npm run web
```

#### For iOS Simulator (Mac only)
```bash
npm run ios
```

#### For Android Emulator
```bash
npm run android
```

## Adding Sample Data

To test the app with some sample data:

### Option 1: Using curl (Terminal)

```bash
curl -X POST http://localhost:3000/journal \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Day We Met",
    "content": "I will never forget the moment our eyes met across the coffee shop...",
    "entry_type": "lovestory",
    "entry_date": "2023-01-15"
  }'
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project
2. Click "Table Editor"
3. Select `journal_entries`
4. Click "Insert row"
5. Fill in the fields
6. Click "Save"

See `EXAMPLE_DATA.md` for more sample entries!

## Testing the App

Once you have data:

1. **Home Tab** 🏠 - See all entries in a timeline
2. **Stories Tab** 💕 - View only love stories
3. **Dates Tab** 📅 - See special dates
4. **Pictures Tab** 📸 - View entries with images

## Troubleshooting

### Backend won't start
- Check that ports 3000 is available
- Verify your Supabase credentials are correct
- Run `npm install` again

### Frontend won't connect
- Make sure backend is running on http://localhost:3000
- Check the API URL in `src/services/api.ts`
- Verify Supabase credentials in `src/services/supabase.ts`

### No data showing
- Make sure you've created the database table using `schema.sql`
- Add some test data using the methods above
- Check the browser/app console for errors

## Next Steps

- 📝 Customize the color scheme in `frontend/tailwind.config.js`
- 🎨 Add your own images to entries
- 🚀 Deploy to production (backend on Railway/Render, frontend on Expo)
- 💾 Set up Supabase Row Level Security for data protection

## Need Help?

Check out:
- `README.md` - Full documentation
- `ARCHITECTURE.md` - System architecture
- `backend/README.md` - Backend API docs
- `frontend/README.md` - Frontend docs

Enjoy documenting your journey together! 💕

