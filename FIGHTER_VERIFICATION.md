# Option Fighter II verification

Verified on 2026-10-05 against the live local server at http://127.0.0.1:4173/.

## Current combat pipeline

Trial now requires completed Matrix evidence independently of arena combat and always uses its simulation winner/loser. Final arena CTA navigation is retained, but no fight can bypass that gate. See `TRIAL_LOCK_VERIFICATION.md`; older combat-derived court checks below are historical.

### Three-round tournament — 2026-10-05

All three rounds are mandatory, with rotating city/orbital/core maps, three win pips per fighter, round history and final series telemetry. Trial and Matrix handoff now require Round 3 and use the overall champion. See `TOURNAMENT_VERIFICATION.md` for the current 54-test run and live browser evidence. Older single-round and best-of-three checks below are historical.

### Duplicate and plural banners — 2026-10-05

- Pizza / pizza displayed ERR 422 TAUTOLOGICAL COMBAT PARADOX and the DIFFERENTIATE OPTIONS CTA. Pizza / pizzas displayed ERR 418 GRAMMATICAL DUPLICATION DETECTED with both names in the requested message and the FIX GRAMMATICAL DUPLICATE CTA. Both clicks selected Matrix and focused Option B.
- In both conflicts, initiation was natively disabled, its computed opacity was 0.5 and pointer events were disabled. No modal was open. Changing the rival to burger hid the warning and enabled initiation immediately.
- Box / boxes also triggered the plural branch. Unit tests cover both argument orders, s/es/ies endings, case/whitespace/punctuation normalization and identity-before-plural routing.
- The existing Void Combat, Shadowboxing and Unopposed Gladiator branches remained correct after navigating through conflict states. Reload still returned to a clean Matrix session.
- Clinical light and dark mobile banners were inspected. The long grammatical CTA wrapped within a 390px viewport with no horizontal page overflow. No browser JavaScript warnings/errors were reported. All 51 tests and JavaScript syntax checks pass.

Screenshots: `decision-maker-fighter-plural-banner.png` and `decision-maker-fighter-conflict-mobile.png` in the parent outputs folder.

### Context-aware Matrix CTA — 2026-10-05

Verified the exact three labels in the browser: INPUT BOTH OPTIONS when both fields are blank, INPUT OPTION A when only Pizza is entered in B, and INPUT OPTION B when only Burger is entered in A. Each click selected Matrix [01] and focused the expected native input: A, A, and B respectively. Labels update from the same live warning branch as the focus target. The button now uses a tactical red border/background, bold uppercase monospace and a visible keyboard-focus outline. No browser errors or warnings; all 49 tests and syntax checks pass. Screenshot: `decision-maker-dynamic-cta.png` in the parent outputs folder.

### Partial Matrix choices — 2026-10-05

- Both blank choices showed ERR 404 VOID COMBAT PROHIBITED, disabled initiation and returned focus to Option A through the new banner CTA.
- Only Burger in Option A showed ERR 409 SOLITARY SHADOWBOXING DETECTED, inserted Burger twice in the requested message and disabled initiation. The CTA routed to Matrix and focused Option B.
- Only Pizza in Option B showed ERR 409 UNOPPOSED GLADIATOR DETECTED, inserted Pizza in the requested message and disabled initiation. The CTA focused Option A.
- Filling both choices hid the warning and enabled initiation immediately. Whitespace-only choices still count as empty. Markup-like names rendered as literal text with no inserted child elements. Reload retained the clean blank session behavior.
- Solar Diagnostic and Deep Space warnings were visually inspected, including the 390px mobile layout with no page overflow. No browser JavaScript warnings/errors were reported. All 49 tests and syntax checks pass.

Screenshots in the parent outputs folder: `decision-maker-partial-option-light.png`, `decision-maker-partial-option-dark.png` and `decision-maker-partial-option-mobile.png`.

Option Fighter is now Module 02. It automatically loads shared Matrix choices, blocks blank global choices with the Void Combat alert, publishes both winner and loser on resolution, and links to the locked Module 03 indictment. Current end-to-end verification is in `PIPELINE_VERIFICATION.md`; the original checks below retain their historical tab labels.

- Tab 03 is labeled `[03 // OPTION FIGHTER]` and opens the mounted canvas arena. Blank callsigns are rejected. Matrix names load into character assignment; both control modes can be selected.
- The VS splash displays both names, then beams, round callout and live combat. Autonomous fighters caused actual HP loss, blocking, meter gain and combo callouts. A complete match reached KO and a winner stance with post-fight telemetry: Fanatec DD won at 47% health, 4-hit maximum combo and 53/100 damage. Damage telemetry caps overkill at the remaining health.
- Applying that winner routed to Matrix and displayed Fanatec DD with an explicitly labeled combat directive/source notice. Rematch immediately started Round 02 at 100 HP each, retained the 0–1 series score and reset the timer to 60.
- Pausing, switching to Trial and returning retained the match and manual pause. Hidden arena DOM reported `data-render-state="paused"`. Returning resumed the same engine without replacing the canvas. A completed 10,000-scenario Matrix result survived a player-mode arena visit, and the existing Trial still entered cross-examination successfully.
- Player mode exposed enabled touch attacks and movement, with the super disabled below full charge. Keyboard J/K/W dispatched attacks/jump; a subsequent K strike connected against a blocking AI, reducing B from 100 to 94.5 HP (22 × 0.25). P paused the match. Headless engine tests separately verify exact unblocked damage, jumping, movement bounds, attack recovery and charged specials.
- Dark and light arena/HUD/pause palettes were inspected. A theme change preserves HP and phase; refresh retained the optical preference. Light uses deep teal/crimson wireframes over clinical sky. Paused overlays remain opaque even when pausing during the animated round callout.
- At 320, 390 and 768 CSS pixels the page had no horizontal overflow; the navigation strip scrolls independently. ResizeObserver updated the drawing buffer and the stage retained 16:9 proportions. The 390px layout was visually inspected.
- Live desktop FPS varied with preview visibility and viewport: a visible autonomous run reported roughly 69–90 FPS, with higher rates in other runs and lower transient samples during browser automation. The renderer caches its background, bounds particles and caps its drawing buffer at 1280×720. Actual throughput is device/browser dependent; the simulation uses a fixed 120 Hz timestep independent of rendering.
- Browser runs reported no JavaScript warnings/errors. All 37 tests, JavaScript syntax checks and the Tailwind build pass. Automated tests cover guarded initialization, all intro phases, movement/collision/jump, jab timing, 75% blocking, heavy knockback, misses, charged plasma specials, combos, KO/slow-motion, actual-health damage accounting, timeout/tiebreak, best-of-three scoring and seeded autonomous matches with winners on both sides. After the pixel-budget change, a 1440px preview confirmed a 1280×720 drawing buffer and an active round callout.

Screenshots in the parent `outputs` folder: `decision-maker-fighter-splash.png`, `decision-maker-fighter-dark.png`, `decision-maker-fighter-light.png`, `decision-maker-fighter-result.png` and `decision-maker-fighter-mobile.png`.

Audio cues and optional speech are wired to user gestures and shared mute. Browser interaction checked mute behavior; audible playback and installed voice quality were not independently assessed.
