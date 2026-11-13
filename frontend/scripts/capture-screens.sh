#!/usr/bin/env bash
# Captures fixture screenshots of every in-scope surface for before/after diffs.
#
# Requires: the mock-mode web server running (npm run web:mock -- --port 8082)
#           and gstack's headless browser ($B, ~/.claude/skills/gstack/browse/dist/browse).
# Usage:    bash scripts/capture-screens.sh [out-dir] [base-url]
#           default out-dir docs/baseline, default base-url http://localhost:8082
#
# Writes <out-dir>/<width>/<surface>.png for widths 375 and 1280.
# Mock mode only: the app's fetch guard blocks anything that isn't localhost.
set -u
OUT="${1:-docs/baseline}"
BASE="${2:-http://localhost:8082}"
B="${B:-$HOME/.claude/skills/gstack/browse/dist/browse}"
SETTLE="${SETTLE:-3}"
FAILED=0

case "$BASE" in
  http://localhost:*|http://127.0.0.1:*) ;;
  *) echo "Refusing non-local base URL: $BASE" >&2; exit 1 ;;
esac

# Click the last leaf element whose trimmed text is exactly $1 (RN-web renders plain divs).
click_text() {
  local r
  r=$("$B" js "(() => { const t = $(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))'); const el = [...document.querySelectorAll('div,span,[role=button]')].filter(d => d.textContent.trim() === t && d.children.length === 0).pop(); if (el) el.click(); return el ? 'clicked' : 'missing'; })()" 2>&1)
  sleep "$SETTLE"
  case "$r" in *clicked*) return 0 ;; *) echo "  ! could not find '$1'" >&2; return 1 ;; esac
}

# Click the last pressable (role=button / tabindex) whose text is exactly $1, e.g. the FAB or "Edit".
click_button() {
  local r
  r=$("$B" js "(() => { const t = $(printf '%s' "$1" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8")))'); const el = [...document.querySelectorAll('[role=button],[tabindex]')].filter(b => b.textContent.trim() === t).pop(); if (el) el.click(); return el ? 'clicked' : 'missing'; })()" 2>&1)
  sleep "$SETTLE"
  case "$r" in *clicked*) return 0 ;; *) echo "  ! could not find button '$1'" >&2; return 1 ;; esac
}

shot() {
  "$B" screenshot --viewport "$DIR/$1.png" >/dev/null && echo "  $1"
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
  click_button "Edit" && shot moment-form-edit
  fresh ""; click_text "Moments" && click_button "💕" && shot moment-form-new

  fresh ""; click_text "Dates" && shot dates
  click_text "Lantern walk by the canal" && shot date-detail
  click_button "Edit" && shot date-form-edit
  fresh ""; click_text "Dates" && click_button "📅" && shot date-form-new

  fresh ""; click_text "Milestones" && shot milestones
  click_text "Planted the apple tree" && shot milestone-detail
  click_button "Edit" && shot milestone-form-edit
  fresh ""; click_text "Milestones" && click_button "⭐" && shot milestone-form-new

  fresh ""; click_text "Memories" && shot wall
  "$B" js "(() => { const img = document.querySelector('img'); let n = img; while (n && !(n.getAttribute && (n.getAttribute('role') === 'button' || n.hasAttribute('tabindex')))) n = n.parentElement; (n || img).click(); return 'ok'; })()" >/dev/null
  sleep "$SETTLE"; shot wall-lightbox

  # [2A] states that the current UI has: empty and error, per tab
  for SC in empty error; do
    for TAB in Timeline Moments Dates Milestones Memories; do
      fresh "?mockScenario=$SC"
      if [ "$TAB" != "Timeline" ]; then click_text "$TAB" || FAILED=1; fi
      shot "state-$SC-$(echo "$TAB" | tr 'A-Z' 'a-z')"
    done
  done
done

"$B" viewport auto >/dev/null
echo "done (missing-element warnings above, if any, mean a surface was not captured)"
exit $FAILED
