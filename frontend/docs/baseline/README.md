# Phase 0c baseline screenshots

Fixture screenshots of every in-scope surface before the Candlelit Scrapbook redesign. They were taken from `redesign` at cd26ff6 (fix track and safety net merged) on 2026-11-13. Every screen migration diffs against these.

- `375/` is 375×812 (phone); `1280/` is 1280×800 (desktop web).
- All data is synthetic mock-mode fixtures (`src/fixtures`). No production data or requests are involved.

## Recapture (for "after" shots in a PR)
Run from `frontend/`; the out-dir is relative to it. The script exits non-zero if any surface was missed.
```bash
npm run web:mock -- --port 8082           # in one terminal
bash scripts/capture-screens.sh docs/after  # in another; needs gstack's $B browser
```

## Surfaces (26 per width)
| File | Surface |
|---|---|
| `timeline`, `timeline-detail-date` | Story list; a Date opened from it (read-only detail) |
| `moments`, `moment-detail`, `moment-form-new`, `moment-form-edit` | Moments list, detail, create and edit forms |
| `dates`, `date-detail`, `date-form-new`, `date-form-edit` | Dates |
| `milestones`, `milestone-detail`, `milestone-form-new`, `milestone-form-edit` | Milestones |
| `wall`, `wall-lightbox` | Memory Wall and its photo lightbox |
| `state-empty-*`, `state-error-*` | [2A] empty and error states for each tab (`?mockScenario=empty|error`) |

## Known non-determinism (not regressions)
- **Wall:** the current code shuffles photos and picks tilt and offset with `Math.random()` on every load, so the order and angles differ between runs. The redesign replaces this with tilt seeded per entry [Material table].
- **Relative dates:** "N days ago" and "Days since" depend on the capture date.

## Not captured
- **Loading skeletons:** transient. With fixtures they flash for well under a second.
- **"Showing your saved copy":** needs a successful load followed by a failed refresh. It was verified by hand in PR #4; a fixture toggle for it can come with T4.
- **Partial states** (failed image, upload in progress): the current UI has no distinct rendering for these. They are new in T4.
