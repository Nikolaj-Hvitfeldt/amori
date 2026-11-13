/**
 * Synthetic fixtures for mock mode [E4].
 *
 * Every title, text and place is invented. Photos are references of the form
 * `fixture:<name>` to the generated PNGs in assets/fixtures/; the mock layer
 * resolves them to dev-server URLs (see src/mock/index.ts). Fixtures must
 * never contain an http(s) URL; src/__tests__/fixtures.test.ts enforces it.
 *
 * Only loaded through a __DEV__-guarded require, so production bundles don't
 * contain them.
 */
import type { Moment } from "../types/moments";
import type { DateEntry } from "../types/dates";
import type { Milestone } from "../types/milestones";

export const FIXTURE_PHOTO_PREFIX = "fixture:";

export type FixturePhotoName =
  | "photo-1"
  | "photo-2"
  | "photo-3"
  | "photo-4"
  | "photo-5"
  | "photo-6"
  | "placeholder";

const photo = (name: FixturePhotoName) => `${FIXTURE_PHOTO_PREFIX}${name}`;

const stamp = (day: string) => `${day}T18:00:00.000Z`;

export const fixtureMoments: Moment[] = [
  {
    id: "fx-moment-1",
    title: "The night the kettle sang the wrong song",
    story_date: "2026-10-04",
    description:
      "We tried to make tea during a power flicker and the kettle let out a noise like a tiny trumpet. Neither of us could stop laughing for ten minutes.",
    photos: [photo("photo-1"), photo("photo-2")],
    created_at: stamp("2026-10-04"),
    updated_at: stamp("2026-10-04"),
  },
  {
    id: "fx-moment-2",
    title: "Folded paper boats",
    story_date: "2026-08-21",
    description: "Six paper boats, one puddle, and a very serious race with made-up rules.",
    photos: [],
    created_at: stamp("2026-08-21"),
    updated_at: stamp("2026-08-21"),
  },
  {
    id: "fx-moment-3",
    title:
      "A deliberately long title for the morning we got lost looking for the bakery with the blue door and found a lighthouse instead",
    story_date: "2026-06-02",
    description:
      "The map said left, the signpost said right, and the seagulls had their own opinions. The lighthouse keeper's cat walked us halfway back.",
    photos: [photo("photo-3")],
    created_at: stamp("2026-06-02"),
    updated_at: stamp("2026-06-02"),
  },
  {
    id: "fx-moment-4",
    title: "Rainy-day fort",
    story_date: "2025-12-29",
    description: "Every blanket in the flat, two chairs and a torch. Built in an hour, lived in for a whole afternoon.",
    created_at: stamp("2025-12-29"),
    updated_at: stamp("2025-12-29"),
  },
  {
    id: "fx-moment-5",
    title: "Learning the waltz badly",
    story_date: "2025-03-15",
    description: "Counted to three out loud the entire time. Stepped on exactly eleven toes.",
    photos: [photo("photo-4"), photo("photo-5"), photo("photo-6")],
    created_at: stamp("2025-03-15"),
    updated_at: stamp("2025-03-15"),
  },
  {
    id: "fx-moment-6",
    title: "Postcard from nowhere",
    story_date: "2024-07-09",
    description: "A postcard arrived addressed to both of us, signed only with a drawing of a pear.",
    photos: [photo("photo-6")],
    created_at: stamp("2024-07-09"),
    updated_at: stamp("2024-07-09"),
  },
];

export const fixtureDates: DateEntry[] = [
  {
    id: "fx-date-1",
    title: "Lantern walk by the canal",
    date: "2026-10-18",
    location: "Willowmere Canal",
    description: "Paper lanterns, warm chestnuts and a busker who only knew two songs.",
    mood: "magical",
    highlights: ["Chestnuts", "The busker's encore", "Finding a lucky stone"],
    weather: "Clear and cold",
    favorite_moment: "Making a wish on the third bridge",
    photos: [photo("photo-2"), photo("photo-1")],
    created_at: stamp("2026-10-18"),
    updated_at: stamp("2026-10-18"),
  },
  {
    id: "fx-date-2",
    title: "Candlelit dinner at home",
    date: "2026-09-05",
    location: "Our kitchen",
    description: "We cooked a recipe from a book with half the pages stuck together.",
    mood: "romantic",
    highlights: ["Homemade pasta"],
    weather: "Drizzle",
    photos: [],
    created_at: stamp("2026-09-05"),
    updated_at: stamp("2026-09-05"),
  },
  {
    id: "fx-date-3",
    title: "Kayaking to the little island",
    date: "2026-07-12",
    location: "Fernhollow Lake",
    description: "Paddled out, had a picnic, paddled back in circles for a while.",
    mood: "adventurous",
    highlights: ["Spotting a heron", "Picnic on the rocks"],
    weather: "Sunny with a breeze",
    favorite_moment: "The heron landing right beside us",
    photos: [photo("photo-4")],
    created_at: stamp("2026-07-12"),
    updated_at: stamp("2026-07-12"),
  },
  {
    id: "fx-date-4",
    title: "Board games and soup",
    date: "2026-01-20",
    location: "The Quiet Spoon cafe",
    description: "Three rounds of a game neither of us understood, and the best tomato soup.",
    mood: "cozy",
    highlights: [],
    created_at: stamp("2026-01-20"),
    updated_at: stamp("2026-01-20"),
  },
  {
    id: "fx-date-5",
    date: "2025-11-02",
    location: "Platform 4, Brindlecombe Station",
    description: "Missed the train, took the next one to wherever it went. It went to the seaside.",
    mood: "spontaneous",
    highlights: ["Chips on the pier"],
    weather: "Windy",
    photos: [photo("photo-5")],
    created_at: stamp("2025-11-02"),
    updated_at: stamp("2025-11-02"),
  },
  {
    id: "fx-date-6",
    title: "Stargazing on the hill",
    date: "2025-08-13",
    location: "Larkspur Hill",
    description: "Counted shooting stars until we lost count, then counted again.",
    mood: "dreamy",
    highlights: ["Seventeen shooting stars", "Hot cocoa"],
    weather: "Warm night",
    favorite_moment: "The long one over the trees",
    photos: [photo("photo-3"), photo("photo-6")],
    created_at: stamp("2025-08-13"),
    updated_at: stamp("2025-08-13"),
  },
];

export const fixtureMilestones: Milestone[] = [
  {
    id: "fx-milestone-1",
    milestone_type: "met",
    title: "The day we met",
    date: "2021-09-18",
    description: "Both reached for the last umbrella in the shop. Shared it instead.",
    photos: [photo("photo-1")],
    created_at: stamp("2021-09-18"),
    updated_at: stamp("2021-09-18"),
  },
  {
    id: "fx-milestone-2",
    milestone_type: "first_date",
    title: "First date",
    date: "2021-10-02",
    description: "Mini golf. Nobody kept score, everybody claimed victory.",
    created_at: stamp("2021-10-02"),
    updated_at: stamp("2021-10-02"),
  },
  {
    id: "fx-milestone-3",
    milestone_type: "official",
    title: "Made it official",
    date: "2022-02-14",
    photos: [],
    created_at: stamp("2022-02-14"),
    updated_at: stamp("2022-02-14"),
  },
  {
    id: "fx-milestone-4",
    milestone_type: "moved_in",
    title: "Moved in together",
    date: "2023-05-01",
    description: "Forty-two boxes, one lost box of spoons.",
    photos: [photo("photo-4"), photo("photo-2")],
    created_at: stamp("2023-05-01"),
    updated_at: stamp("2023-05-01"),
  },
  {
    id: "fx-milestone-5",
    milestone_type: "engagement",
    title: "Engaged",
    date: "2024-12-24",
    description: "Hidden inside a cracker. Almost got pulled by the wrong person.",
    photos: [photo("photo-5")],
    created_at: stamp("2024-12-24"),
    updated_at: stamp("2024-12-24"),
  },
  {
    id: "fx-milestone-6",
    milestone_type: "wedding",
    title: "Our wedding",
    date: "2025-06-21",
    description: "Longest day of the year, and it still felt short.",
    photos: [photo("photo-6"), photo("photo-3")],
    created_at: stamp("2025-06-21"),
    updated_at: stamp("2025-06-21"),
  },
  {
    id: "fx-milestone-7",
    milestone_type: "kid",
    title: "Welcomed little Pip",
    date: "2026-04-03",
    created_at: stamp("2026-04-03"),
    updated_at: stamp("2026-04-03"),
  },
  {
    id: "fx-milestone-8",
    milestone_type: "custom",
    title: "Planted the apple tree",
    date: "2026-09-27",
    description: "It is currently a stick. We have high hopes.",
    photos: [],
    created_at: stamp("2026-09-27"),
    updated_at: stamp("2026-09-27"),
  },
];
