# Example Data

Here are some example journal entries you can add to test the application:

## Love Story

```json
{
  "title": "The Day We Met",
  "content": "I'll never forget the moment our eyes met across the coffee shop. You smiled, and I knew my life was about to change forever. We talked for hours about everything and nothing, and time just flew by.",
  "entry_type": "lovestory",
  "entry_date": "2023-01-15",
  "images": []
}
```

## Special Date

```json
{
  "title": "Our First Anniversary",
  "content": "One year of incredible adventures, laughter, and love. We celebrated at that little Italian restaurant where we had our third date. You surprised me with tickets to our dream destination!",
  "entry_type": "date",
  "entry_date": "2024-01-15",
  "images": []
}
```

## Milestone

```json
{
  "title": "Moving In Together",
  "content": "Today we officially moved in together! Our first home as a couple. We spent the day unpacking boxes, assembling furniture, and making this place ours. Can't wait to create more memories here.",
  "entry_type": "milestone",
  "entry_date": "2024-06-01",
  "images": []
}
```

## General Entry

```json
{
  "title": "Perfect Sunday",
  "content": "Lazy morning, brunch in bed, then a walk in the park. These simple moments together are what I cherish most. You make every ordinary day feel special.",
  "entry_type": "general",
  "entry_date": "2024-11-10",
  "images": []
}
```

## Adding Data via API

You can add these entries using curl:

```bash
curl -X POST http://localhost:3000/journal \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Day We Met",
    "content": "I'll never forget the moment our eyes met across the coffee shop...",
    "entry_type": "lovestory",
    "entry_date": "2023-01-15"
  }'
```

Or directly in Supabase:

1. Go to your Supabase project
2. Navigate to Table Editor
3. Select `journal_entries` table
4. Click "Insert row"
5. Fill in the fields with the example data above

