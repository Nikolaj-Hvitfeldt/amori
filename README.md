# Amori

Cross-platform relationship journal built with React Native (Expo) and NestJS. Capture moments, dates, milestones, and photos in one place—with a timeline, memory wall, and optional PWA install on the web.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Implementation notes](#implementation-notes)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

| Area | Description |
|------|-------------|
| **Platforms** | iOS, Android, and web from a single Expo codebase |
| **Moments** | Stories with photos and narrative |
| **Dates** | Outings with mood theming, location, and media |
| **Milestones** | Structured markers (first date, engagement, wedding, and similar) |
| **Memory wall** | Gallery-oriented view of shared photos |
| **Timeline** | Chronological feed with a visual timeline |
| **UX** | Animations via React Native Reanimated; skeleton loading where appropriate |
| **Media** | Upload-side compression, thumbnails, HEIC/HEIF handling |
| **Web** | PWA-friendly export for installable web use |

## Tech stack

**Client (`frontend/`)** — Expo ~54, React 19, TypeScript, React Native Reanimated, Expo Image, `@react-native-community/datetimepicker` / `react-datepicker` (web), AsyncStorage (native) and browser storage patterns on web.

**API (`backend/`)** — NestJS 11, TypeScript, Supabase (PostgreSQL + Storage), Sharp for raster work, HEIC conversion for iOS uploads.

## Repository layout

```
amori/
├── frontend/                 # Expo app
│   ├── src/
│   │   ├── screens/          # Timeline, Moments, Dates, Milestones, Pictures
│   │   ├── components/       # Animated UI, pickers, thumbnails, etc.
│   │   ├── navigation/
│   │   ├── services/         # API client (see api.ts)
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   └── package.json
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── moments/
│   │   ├── dates/
│   │   ├── milestones/
│   │   ├── supabase/
│   │   ├── utils/
│   │   └── main.ts
│   ├── migrations/
│   └── package.json
├── docs/                     # Top-level deployment docs
├── DEPLOYMENT_QUICKSTART.md
├── render.yaml               # Render Blueprint (API)
├── LICENSE
└── README.md
```

## Prerequisites

- **Node.js** 20 or newer
- **npm** or **yarn**
- **Supabase** project (free tier is sufficient for development)
- For device testing: **Expo Go** or a full native toolchain (Xcode / Android Studio) as needed

## Getting started

### Backend

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create `backend/.env`:

   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Apply SQL in `backend/migrations/` to your Supabase database in order, then enable Row Level Security as described in `backend/migrations/009_enable_rls_policies.sql`.

4. Start the API in development mode:

   ```bash
   npm run start:dev
   ```

   Default base URL: `http://localhost:3000`

### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Point the app at your API. Configuration lives in `frontend/src/services/api.ts` and follows this priority:

   - **`EXPO_PUBLIC_API_URL`** — preferred for hosted builds (e.g. Vercel) and consistent environments.
   - **Web on localhost** — uses `http://localhost:3000` when the site is opened on localhost.
   - **Web on LAN hostname** — uses `http://<hostname>:3000` when opened via your machine’s IP on the LAN.
   - **Fallback** — update `PRODUCTION_API_URL` in `api.ts` after you deploy the API, or set `EXPO_PUBLIC_API_URL` instead.

   For **physical devices** hitting a machine on your network, set `EXPO_PUBLIC_API_URL` to `http://<your-computer-ip>:3000`, or temporarily return that URL from `getApiUrl()` for native builds. You can discover a suitable IP from the backend with:

   ```bash
   cd backend
   npm run get:ip
   ```

3. Start Expo:

   ```bash
   npm start
   ```

   Then press `w` (web), `a` (Android), or `i` (iOS), or scan the QR code with Expo Go.

## Database schema

Three primary tables back the product surface:

### `moments`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `title` | TEXT | |
| `story_date` | DATE | When the moment occurred |
| `description` | TEXT | |
| `photos` | TEXT[] | Storage URLs |
| `created_at`, `updated_at` | TIMESTAMP | |

### `date_entries`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `title` | TEXT | Optional |
| `date` | DATE | |
| `location` | TEXT | |
| `description` | TEXT | |
| `mood` | TEXT | e.g. magical, romantic, adventurous |
| `highlights` | TEXT[] | |
| `weather` | TEXT | Optional |
| `favorite_moment` | TEXT | Optional |
| `photos` | TEXT[] | |
| `created_at`, `updated_at` | TIMESTAMP | |

### `milestones`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `milestone_type` | TEXT | e.g. met, first_date, official |
| `title` | TEXT | |
| `date` | DATE | |
| `description` | TEXT | Optional |
| `photos` | TEXT[] | |
| `created_at`, `updated_at` | TIMESTAMP | |

## API reference

Base path: `/moments`, `/dates`, `/milestones` (NestJS controllers). Typical verbs:

| Resource | List / create | Read / update / delete | Upload |
|----------|----------------|-------------------------|--------|
| Moments | `GET`, `POST` `/moments` | `GET`, `PATCH`, `DELETE` `/moments/:id` | `POST` `/moments/upload-image` |
| Dates | `GET`, `POST` `/dates` | `GET`, `PATCH`, `DELETE` `/dates/:id` | `POST` `/dates/upload-image` |
| Milestones | `GET`, `POST` `/milestones` | `GET`, `PATCH`, `DELETE` `/milestones/:id` | `POST` `/milestones/upload-image` |

List endpoints support pagination where implemented.

## Implementation notes

**Images** — Compression on upload, thumbnail generation, HEIC/HEIF support, progressive fallback, and storage cleanup when records are removed.

**Motion** — Card stagger, FAB, press feedback, modals, success and heart motifs, tab indicator, and shimmer skeletons.

**Dates** — Native picker on mobile; themed web picker; future dates are blocked; sensible default to “today” where applicable.

**Caching** — AsyncStorage on native and equivalent patterns on web, with invalidation on writes and TTL tuned per resource type.

## Security

- Row Level Security (RLS) on Supabase tables.
- Backend uses the **service role** key (bypasses RLS for trusted server operations).
- Clients talk only to the REST API, not directly to the database with elevated credentials.
- Upload validation and size limits on the API.

## Deployment

**Fast path** — Step-by-step checklist: [`DEPLOYMENT_QUICKSTART.md`](./DEPLOYMENT_QUICKSTART.md).

**Suggested hosting**

| Layer | Typical host | Notes |
|-------|----------------|-------|
| Web (PWA) | Vercel | Connect repo; set `EXPO_PUBLIC_API_URL` to your API origin |
| API | Render | Root [`render.yaml`](./render.yaml); set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |

**Deeper docs**

- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — end-to-end deployment
- [`backend/docs/DEPLOYMENT.md`](./backend/docs/DEPLOYMENT.md) — API-only details
- [`frontend/docs/PWA_SETUP.md`](./frontend/docs/PWA_SETUP.md) — PWA / export notes

**Render (API)** — Link the GitHub repository, confirm root `render.yaml`, add the Supabase variables, deploy.

**Vercel (web)** — From `frontend/`, use the Vercel CLI or dashboard; set `EXPO_PUBLIC_API_URL` in project settings. Example CLI flow:

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Store builds for iOS and Android are out of scope here; use **EAS Build** or local release builds when you need store binaries.

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so direction and scope stay aligned.

## License

[ISC License](./LICENSE) — Copyright (c) 2024 Nikolaj Hvitfeldt.
