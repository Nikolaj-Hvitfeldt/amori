# Example Data

Here are some example entries you can add to test the application:

## Moment

```json
{
  "title": "The Day We Met",
  "story_date": "2023-01-15",
  "description": "I'll never forget the moment our eyes met across the coffee shop. You smiled, and I knew my life was about to change forever. We talked for hours about everything and nothing, and time just flew by.",
  "photos": []
}
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/moments \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Day We Met",
    "story_date": "2023-01-15",
    "description": "I will never forget the moment our eyes met...",
    "photos": []
  }'
```

## Date Entry

```json
{
  "title": "Our First Anniversary",
  "date": "2024-01-15",
  "location": "Fancy Italian Restaurant",
  "description": "One year of incredible adventures, laughter, and love. We celebrated at that little Italian restaurant where we had our third date. You surprised me with tickets to our dream destination!",
  "mood": "romantic",
  "highlights": [
    "Amazing pasta",
    "Surprise tickets",
    "Dancing under the stars"
  ],
  "weather": "Clear and warm",
  "favorite_moment": "When you surprised me with the tickets",
  "photos": []
}
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/dates \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Our First Anniversary",
    "date": "2024-01-15",
    "location": "Fancy Italian Restaurant",
    "description": "One year of incredible adventures...",
    "mood": "romantic",
    "highlights": ["Amazing pasta", "Surprise tickets"],
    "weather": "Clear and warm",
    "favorite_moment": "When you surprised me with the tickets",
    "photos": []
  }'
```

## Milestone

```json
{
  "milestone_type": "first_date",
  "title": "Our First Date",
  "date": "2023-01-20",
  "description": "We went to the movies and then grabbed dinner. I was so nervous, but you made everything feel natural and easy. I knew by the end of the night that I wanted to see you again.",
  "photos": []
}
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "milestone_type": "first_date",
    "title": "Our First Date",
    "date": "2023-01-20",
    "description": "We went to the movies...",
    "photos": []
  }'
```

## More Examples

### Date Entry - Magical Mood
```json
{
  "date": "2024-06-15",
  "location": "Beach at Sunset",
  "description": "Watching the sunset together, everything felt perfect. The colors in the sky were incredible, and being with you made it even more magical.",
  "mood": "magical",
  "highlights": [
    "Beautiful sunset",
    "Beach walk",
    "Ice cream after"
  ],
  "photos": []
}
```

### Milestone - Engagement
```json
{
  "milestone_type": "engagement",
  "title": "You Said Yes!",
  "date": "2024-08-10",
  "description": "I proposed on the same beach where we had our first magical date. You said yes, and I've never been happier!",
  "photos": []
}
```

### Date Entry - Adventurous Mood
```json
{
  "date": "2024-07-20",
  "location": "Mountain Hiking Trail",
  "description": "We conquered that challenging trail together! The view from the top was worth every step, especially because I got to share it with you.",
  "mood": "adventurous",
  "highlights": [
    "Reached the summit",
    "Amazing views",
    "Picnic at the top"
  ],
  "weather": "Sunny and clear",
  "photos": []
}
```

## Adding Data via Supabase Dashboard

1. Go to your Supabase project
2. Navigate to Table Editor
3. Select the table (`moments`, `date_entries`, or `milestones`)
4. Click "Insert row"
5. Fill in the fields with the example data above
6. Click "Save"

## Adding Data via the App

1. Open the app
2. Navigate to the appropriate screen (Moments, Dates, or Milestones)
3. Tap the Floating Action Button (+)
4. Fill in the form
5. Optionally add photos
6. Tap "Save"

## Valid Values

### Date Mood Options
- `magical`
- `romantic`
- `adventurous`
- `cozy`
- `spontaneous`
- `dreamy`

### Milestone Types
- `met` - We Met
- `first_date` - First Date
- `official` - Became Official
- `moved_in` - Moved In Together
- `engagement` - Engagement
- `wedding` - Wedding
- `kid` - Kid
- `custom` - Custom Milestone

## Adding Photos

To add photos to entries:

1. Create the entry first (without photos)
2. Use the image upload endpoint to upload photos:
   ```bash
   curl -X POST http://localhost:3000/moments/upload-image \
     -H "Content-Type: application/json" \
     -d '{
       "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
     }'
   ```
3. Update the entry with the returned photo URLs

Or simply use the app UI - it handles image upload automatically when creating/editing entries!
