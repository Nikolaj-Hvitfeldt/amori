# Amori design system: Candlelit Scrapbook

**Feeling:** "cozy as hell and nostalgic". **Coziness** comes from *lighting*: dark, warm and low. **Nostalgia** comes from *material*: paper, tape, faded prints, italic dates.

The direction was chosen by the owners on 2026-11-13, from a shared set of three mood images:
- **A fireplace** sets the palette: cocoa, cream paper and candle amber.
- **A black-and-white film selfie** sets the grain and the faded-print "develop" moment.
- **A lighthouse at dusk** sets the **Dusk** vignette: a pale-blue-to-blush sky fading into cocoa.

Everything on screen is built from `frontend/src/theme` tokens and `frontend/src/ui` primitives.
- No hex literals outside `frontend/src/theme`; `check:tokens` enforces this from Phase 2 on.
- No emoji used as UI icons. Emoji that people type into their entries is content and is never touched.

Decision ids in brackets ([1A], [5C], …) refer to the approved plan's Design Specification.

## 1. Colour (`theme/colors.ts`)
There is one dark theme. Tokens are layered: `palette` holds the raw values, and `color` / `section` hold the roles. Components use only the roles, so a later light "daylight" theme can be added by swapping the role map.

| Role | Value | Use |
|---|---|---|
| `surface` | #241a16 | screen background |
| `surfaceChrome` | #1b1310 | tab bar |
| `surfaceRaised` | #2f2420 | form fields |
| `sheetBackdrop` | #120c0a | behind a raised sheet |
| `lightboxBackdrop` | #0f0b0a | photo lightbox |
| `paper` | #f1e4d1 | entries, prints, polaroid frames, notes, and **nothing else** [5D] |
| `text` / `textMuted` | #f1e4d1 / #b09a85 | text on dark surfaces; inactive tabs use `textMuted` |
| `ink` / `inkMuted` | #3a2a22 / #6b5547 | text on paper |
| `accent` | #e7a660 | candle amber: hero number, active and focused states, the thread |
| `onAccent` | #241a16 | text on amber, and on any filled section-coloured chip |

**Section accents.** Each one has a value on the dark surface and an ink value on paper:
- Story: amber #e7a660 on surface, #8a5414 on paper.
- Moments: rose #e08a9b on surface, #a3485c on paper.
- Dates: lavender #b8a0c9 on surface, #6e5390 on paper.
- Milestones: sage #9fb89a on surface, #4f6b4a on paper.
- Wall: no accent. The photos carry the colour.

Timeline dots use the colour of the entry's own section.

**Contrast:** every text/background pair is at least 4.5:1 (WCAG 2). The pairs are listed in `contrastPairs` and enforced by `src/__tests__/contrast.test.ts` (25 pairs; all pass). Add a pair whenever a new combination appears.

**Amber discipline [4C]:** amber appears only on the hero number, the thread, and active or focused states. There are no amber accent words in headings.

## 2. Type (`theme/typography.ts`) [5A]
| Role | Spec |
|---|---|
| hero | Instrument Serif 56/56, capped at Dynamic Type ×1.3 |
| display (screen title) | Instrument Serif 34/38 |
| title (entry, sheet) | Instrument Serif 24/30 |
| heading | Figtree 600 18/24 |
| body (the minimum size for running text) | Figtree 400 16/24 |
| date / tagline | Instrument Serif *italic* 15/20 |
| caption, tab label | Figtree 500 12/16 (tab labels capped at ×1.3) |

- **Headings** are upright serif in `text`.
- **Italics** are reserved for dates, taglines and the hero's "days together" line.
- **Field labels** use the caption role in `textMuted`, uppercase with 0.04em tracking, and always sit above the field.
- **Fonts are still provisional.** Both families need a legibility check of small italic dates on a real Android device before Phase 3.

## 3. Space, shape and elevation (`theme/layout.ts`)
- **Spacing:** 4, 8, 12, 16, 24, 32, 48. The side gutter is 16. Touch targets are at least 44×44.
- **Radius:** print 3, field and chip 12, sheet 20 (top corners only), button as a full pill.
- **Polaroid:** an 8px frame and a 28px caption.
  - Tilt is within ±2°, *seeded from the entry id*.
  - Tape is 36×12 at 55% opacity, using `color.tape`.
- **Elevation:** one token, `shadow.paperLift` (black, y 6, blur 14, 45%). It is used only on paper prints, polaroids and the "+" button. Everything else is flat, and there are **no coloured glows** [4B].

## 4. Atmosphere (`theme/atmosphere.ts`)
| Effect | Implementation |
|---|---|
| **Dusk vignette** | `expo-linear-gradient` from the top: rgba(150,178,212,.22) → rgba(224,138,155,.16) at 40% → transparent at 85%, 420px tall, `pointerEvents="none"` |
| Film grain | a bundled 128×128 noise PNG, tiled at about 6% opacity |
| Photo warmth | an amber tint `View` at 8% over every photo in lists and on the Wall; never in the lightbox |
| Tape, tilt | static layout, always on |

**Turning effects off.** Grain, tint and vignette switch off when either signal below is on:
- iOS: `isReduceTransparencyEnabled()` or `isReduceMotionEnabled()`.
- Android: `isReduceMotionEnabled()`.
- Web: `prefers-reduced-transparency` or `prefers-reduced-motion`.

All effects are hidden from assistive tech.

## 5. Motion (`theme/layout.ts → motion`) [5C]
- **Durations:** tab indicator 220ms ease-out; sheet open 260 ease-out, close 220 ease-in; content fade 160ms from an already visible state; "Saved" held for 480ms, then the sheet closes.
- **The one signature moment, the polaroid "develop":** a photo fades from a warm, washed-out print to its resting tone over 600ms. It plays once per photo per session, and is off under Reduce Motion.
- **Banned:** looping pulses or rotations, bounce, and spring overshoot. `HeartPulse` and `SuccessCheckmark` are retired.

## 6. Icons [5B]
- **Library:** Lucide line icons at a 1.75 stroke.
- **Moods and milestone types** always show an icon *plus* the word, in the section colour:
  - Moods: magical `sparkles`, romantic `heart`, adventurous `mountain`, cozy `flame`, spontaneous `zap`, dreamy `moon`.
  - Milestone types: met `handshake`, first_date `wine`, official `heart-handshake`, moved_in `house`, engagement `gem`, wedding `church`, kid `baby`, custom `star`.
- **Tabs:** Story, Moments, Dates, Milestones, Wall [1B].

## 7. Patterns
- **Story** [1A]: header "Our story" with an italic tagline, then the days-together hero (hidden when there is no `met` milestone), then the thread grouped by italic month labels, newest first.
- **Moments, Dates, Milestones:** a header, then the *same thread component* filtered to that type, then a "+" button bottom-right with `paperLift`.
- **List entry** [4A]: a paper print with the cover photo *above* the text. Titles clamp at 2 lines. An entry without a photo is a text-only print.
- **Wall:** the header "Memory wall", an amber "✦ N photos ✦" line, and a polaroid grid.
  - **Lightbox** [7B]: true colour, with the title, italic date and an "Open date" text button. It closes on ✕, Esc, a backdrop tap or a swipe down.
- **Detail view:** photo hero, then title and italic date, then a type or mood chip, then the section's own fields, then the description. Edit and Delete live in a ⋯ menu.
- **Form sheet** [7A]: a dark sheet with ✕ (44px), the serif title and an amber **Save** pill (Saving… / Saved / Retry).
  - Fields are 52px on `surfaceRaised` with an amber 2px focus outline.
  - "More details" is collapsed.
  - Closing with unsaved edits asks "Discard this date?" with **Keep editing** / **Discard**.
- **States** [2A]:
  - Loading: paper skeletons.
  - Empty: one blank slip with section copy and an Add button.
  - Error: a paper slip, "Couldn't reach … Check your connection.", with **Try again**, plus "Showing your saved copy" when a copy is shown.
  - Partial: an image-off paper square.
  - Upload: a ring on the thumbnail.
- **Web at 768px and wider** [6A]: lists and forms use a centred 560px column, and the Wall a 840px column with 3 columns. The background and atmosphere run full-bleed. The tab bar sits at the bottom at column width.

## 8. Accessibility [6B]
- Every pressable has a role and a label.
- Each thread entry is one label, for example "Date, Lantern walk by the canal, 18 October 2026".
- The hero reads "N days together".
- The tab bar is a `tablist` with a selected state.
- On web: the focus ring is amber, 2px with a 2px offset; sheets trap focus and close on Esc.
- Caret and text selection are amber-tinted, and scrollbars are themed.

## Reference
Round-1 mockups (private canvas): https://claude.ai/artifact/LuLh2PBsAL2ZkfibFKCiSN. The Story · Dusk board is the chosen direction.
