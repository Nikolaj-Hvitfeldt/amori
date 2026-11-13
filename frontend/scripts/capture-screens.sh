#!/usr/bin/env bash
# Captures fixture screenshots of every in-scope surface for before/after diffs.
#
# Requires: the mock-mode web server running (npm run web:mock -- --port 8082)
#           and gstack's headless browser ($B, ~/.claude/skills/gstack/browse/dist/browse).
# Usage:    bash scripts/capture-screens.sh [out-dir] [base-url]
#           default out-dir screens-out (gitignored), default base-url http://localhost:8082
#
# Writes <out-dir>/<width>/<surface>.png for widths 375 and 1280.
# Mock mode only: the app's fetch guard blocks anything that isn't localhost.
set -u
OUT="${1:-screens-out}"
BASE="${2:-http://localhost:8082}"
B="${B:-$HOME/.claude/skills/gstack/browse/dist/browse}"
SETTLE="${SETTLE:-3}"
FAILED=0

if ! [[ "$BASE" =~ ^http://(localhost|127\.0\.0\.1):[0-9]+/?$ ]]; then
  echo "Refusing non-local base URL: $BASE (expected http://localhost:<port>)" >&2; exit 1
fi

# Click the last leaf element whose trimmed text is exactly $1 (RN-web renders plain divs).
click_text() {
  local r
  r=$("$B" js "(() => { const t = $(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))'); const el = [...document.querySelectorAll('div,span,[role=button]')].filter(d => d.textContent.trim() === t && d.children.length === 0).pop(); if (el) el.click(); return el ? 'clicked' : 'missing'; })()" 2>&1)
  sleep "$SETTLE"
  case "$r" in *clicked*) return 0 ;; *) echo "  ! could not find '$1'" >&2; FAILED=1; return 1 ;; esac
}

# Click the last pressable (role=button / tabindex) whose text is exactly $1, e.g. the FAB or "Edit".
click_button() {
  local r
  r=$("$B" js "(() => { const t = $(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))'); const el = [...document.querySelectorAll('[role=button],[tabindex]')].filter(b => b.textContent.trim() === t).pop(); if (el) el.click(); return el ? 'clicked' : 'missing'; })()" 2>&1)
  sleep "$SETTLE"
  case "$r" in *clicked*) return 0 ;; *) echo "  ! could not find button '$1'" >&2; FAILED=1; return 1 ;; esac
}

# Click the last element whose aria-label is exactly $1, e.g. "More options" or "Add a date".
click_label() {
  local r
  r=$("$B" js "(() => { const t = $(printf %s "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))'); const el = [...document.querySelectorAll('[aria-label]')].filter(e => e.getAttribute('aria-label') === t).pop(); if (el) el.click(); return el ? 'clicked' : 'missing'; })()" 2>&1)
  sleep "$SETTLE"
  case "$r" in *clicked*) return 0 ;; *) echo "  ! could not find label '$1'" >&2; FAILED=1; return 1 ;; esac
}

# Open the ⋯ menu of the open detail view and choose Edit.
edit_from_detail() { click_label "More options" && click_button "Edit"; }

shot() {
  if "$B" screenshot --viewport "$DIR/$1.png" >/dev/null; then echo "  $1"
  else echo "  ! screenshot failed: $1" >&2; FAILED=1; fi
}

fresh() { # fresh <query>: reload the app with an optional ?mockScenario=..., clearing the cache
  "$B" goto "$BASE/$1" >/dev/null
  "$B" js "(() => { localStorage.clear(); return 'ok'; })()" >/dev/null
  "$B" goto "$BASE/$1" >/dev/null
  sleep $((SETTLE * 3))
}

for VP in 375x812 1280x800; do
  W="${VP%x*}"; DIR="$OUT/$W"; mkdir -p "$DIR"
  echo "== $VP -> $DIR"
  "$B" viewport "$VP" >/dev/null

  # Lists, detail views and forms (default fixtures)
  fresh ""
  shot timeline
  click_text "Lantern walk by the canal" && shot timeline-detail-date
  fresh ""
  click_text "Moments" && shot moments
  click_text "The night the kettle sang the wrong song" && shot moment-detail
  edit_from_detail && shot moment-form-edit
  fresh ""; click_text "Moments" && click_label "Add a moment" && shot moment-form-new

  fresh ""; click_text "Dates" && shot dates
  click_text "Lantern walk by the canal" && shot date-detail
  edit_from_detail && shot date-form-edit
  fresh ""; click_text "Dates" && click_label "Add a date" && shot date-form-new

  fresh ""; click_text "Milestones" && shot milestones
  click_text "Planted the apple tree" && shot milestone-detail
  edit_from_detail && shot milestone-form-edit
  fresh ""; click_text "Milestones" && click_label "Add a milestone" && shot milestone-form-new

  fresh ""; click_text "Wall" && shot wall
  R=$("$B" js "(() => { const img = document.querySelector('img'); if (!img) return 'missing'; let n = img; while (n && !(n.getAttribute && (n.getAttribute('role') === 'button' || n.hasAttribute('tabindex')))) n = n.parentElement; (n || img).click(); return 'clicked'; })()" 2>&1)
  sleep "$SETTLE"
  case "$R" in *clicked*) shot wall-lightbox ;; *) echo "  ! no photo to open on the wall" >&2; FAILED=1 ;; esac

  # [2A] states that the current UI has: empty and error, per tab
  for SC in empty error; do
    # Tab label:file name. File names stay as in the 0c baseline so diffs line up.
    for PAIR in Story:timeline Moments:moments Dates:dates Milestones:milestones Wall:memories; do
      TAB="${PAIR%%:*}"; NAME="${PAIR#*:}"
      fresh "?mockScenario=$SC"
      if [ "$TAB" != "Story" ]; then click_text "$TAB"; fi
      shot "state-$SC-$NAME"
    done
  done
done

"$B" viewport auto >/dev/null
if [ "$FAILED" -ne 0 ]; then echo "done WITH FAILURES: see the '!' lines above" >&2; else echo "done: all surfaces captured"; fi
exit $FAILED
