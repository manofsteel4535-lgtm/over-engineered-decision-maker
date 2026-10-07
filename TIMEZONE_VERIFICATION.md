# Shared header timezone clock

## Current auto-detection and direct click toggle

Verified 2026-10-06 at http://127.0.0.1:4173/. The clock displays plain `HH:MM:SS TIMEZONE`. There are no brackets, popup containers, SVG vectors, orbit nodes, hover listeners, disclosure state or geometry calculations in the implementation. The abbreviation is a native button with inherited font/color, transparent background, 0px border, fixed 3ch width, no transforms, no animation and 0s transition duration. The space previously reserved for the arc is removed.

Initialization keeps the existing `oddm_user_timezone` key so previously saved preferences remain valid. A valid saved selection takes precedence; otherwise native Intl region detection and Date offset mapping select and save IST, GMT or UTC. India aliases and -330-minute offsets map to IST; London (including summer), Etc/GMT and zero offsets map to fixed GMT; other regions map to UTC. Denied storage falls back to in-memory operation.

Live click verification: UTC 11:21:51 -> IST 16:51:52 -> GMT 11:21:53 -> UTC 11:21:54. Clock bounds were identical before and after the full cycle (84.203125px wide, 16px high). Native Enter activation also advanced the cycle. IST remained active in Quantum Trial and after reload. A fresh localhost origin automatically displayed IST. At the effective 360px mobile viewport, the 71px clock remained inline and inside the header. Both optical themes were inspected; browser warning/error logs were empty.

Syntax checks and all 74 tests passed. Tests cover region/offset mapping, London daylight-saving handling, fresh initialization and saving, saved-preference precedence, invalid/denied storage, exact rotation, immediate subscriber updates, reload persistence and midnight rollover. Original UTC/Solar Diagnostic preferences were restored after verification.

Current screenshots: `../decision-maker-timezone-toggle-light.png` and `../decision-maker-timezone-toggle-dark.png`.

## Previous glassmorphic HUD overhaul (historical)

Verified 2026-10-06 at http://127.0.0.1:4173/. Independent floating tags use exactly `rgba(6,182,212,.05)` in Deep Space and `rgba(241,245,249,.6)` in Solar Diagnostic, with 8px backdrop blur, 0px borders and no outer box shadows. Active selection changes text/dot contrast and ambient glow only. Inactive labels remain at .48 opacity and brighten to .9 on hover; keyboard focus retains a fine 1px dashed indicator.

The horizontal radius increased from 80px to 94px, with slimmer 60px tags. The middle GMT node and badge have identical center coordinates (0px alignment error). SVG branches and the dashed arc use the same resolved positions. A centered phone clock row preserves equal wing spacing rather than shifting GMT away from the badge. Deployment remains 200ms with 0/20/40ms stagger and reduced-motion support.

Desktop nodes end at 94.8px above module tabs beginning at 97px; side tags begin at 56px below Optical Mode ending at 55.5px. At the effective 360px phone viewport, nodes span 82.5–330.5px horizontally, GMT and badge both center at 206.5px, and nodes end at 136.8px above tabs at 144px. Both themes were checked, with no clipping or node overlap.

Hovering digits keeps the arc closed; badge hover opens it. Choosing IST updates the clock by +05:30 and survives module navigation and reload. GMT and UTC restore zero-offset time. Storage/calculation code in `dist/time-zone.js` remains unchanged. Browser warning/error logs were empty. Syntax checks and all 71 tests passed. Original UTC and Solar Diagnostic preferences were restored after checking.

Final screenshots: `../decision-maker-timezone-glass-light.png` and `../decision-maker-timezone-glass-dark.png`.

## Previous radial HUD overhaul (historical)

Verified 2026-10-06. The rectangular wrapper is removed. Three independent dot/label nodes deploy from a badge-anchored SVG origin along a dashed downward arc, using 200ms easing and 0/20/40ms staggering. Inactive labels/dots are muted; the active node uses a cyan glow in Deep Space and slate fill with a teal outline in Solar Diagnostic. Reduced motion disables deployment transitions.

Live pointer checks: hovering digits kept the selector closed; hovering the badge opened it; moving away collapsed it. Keyboard Down now focuses UTC without skipping to GMT. Choosing IST, navigating to Trial and refreshing retained IST. Selecting GMT returned to zero-offset time. Browser warning/error logs remained empty.

Alignment checks: desktop nodes finish at 86.8px, above module tabs at 89px. On the narrow viewport, nodes span 81–120.8px vertically, clear of Optical Mode ending at 52px and tabs beginning at 124px; all three stay inside the viewport. The narrow-screen clamp adjusts the vector origin without moving the clock or changing timezone state.

All 71 automated tests passed. The timezone state/calculation/storage module is unchanged by this visual refactor. New captures in the parent directory: `decision-maker-timezone-arc-light.png` and `decision-maker-timezone-arc-dark.png`.

## Original branching selector evidence

Verified 2026-10-06 at http://127.0.0.1:4173/ in the Codex in-app browser.

- Pointer movement over the clock digits left `aria-expanded=false`; entering the timezone badge changed it to `true` and exposed the UTC/GMT/IST branch. The timestamp is a sibling of the branch trigger.
- Selecting IST immediately changed `10:09:37 UTC` to `15:39:38 IST` during the live check, closed the menu and returned focus to the badge. GMT and UTC both displayed the zero-offset live time with their distinct labels.
- IST remained selected after switching from Matrix to Quantum Trial and after a full page reload, while the Matrix inputs remained blank.
- Keyboard Down opens/focuses the first choice; the choice buttons support keyboard activation, arrow navigation and Escape dismissal. Closed choices are inert. Click/tap on the badge supports devices without hover.
- Both optical themes show the compact panel, active choice, 1px connector lines and 180ms/4px transition. The status indicator, version and Optical Mode control retain their markup and styling.
- At a narrow 375px viewport, the clock remained visible and the popup bounds stayed within the viewport. The temporary viewport override was reset after checking.
- Browser warning/error log was empty after selection, navigation, refresh and optical switching.

`npm run check` and all 71 tests pass. Timezone tests cover the 5.5-hour offset and midnight rollover, UTC/GMT equivalence, immediate shared subscriber updates, reload persistence, preference validation, denied storage and isolation from decision/simulation persistence.

The header preference is the only new stored value (`oddm_user_timezone`). Decision, combat and trial state retain their existing volatile behavior. Certificate UTC stamps and telemetry log timestamps retain their original explicit time conventions; this change targets the global header indicator.

Screenshots are in the parent output directory: `decision-maker-timezone-light.png` and `decision-maker-timezone-dark.png`.
