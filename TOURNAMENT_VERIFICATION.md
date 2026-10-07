# Option Fighter // three-round tournament verification

Current round-progressive map concepts supersede the Citadel/Orbital/Core visuals recorded below. See `ROUND_STAGE_VERIFICATION.md` for Initial Docket, Neural Synapse Matrix and Singularity Court.

Verified on 2026-10-05 at http://127.0.0.1:4173/ in the Codex in-app browser.

The later dual-palette refactor replaces the historical dark starfield under a light HUD with a dedicated Solar Diagnostic orbital palette. All three maps now have explicit light/dark stage configurations; see `ARENA_THEME_VERIFICATION.md` for current theme checks.

The later Trial evidence-lock refactor preserves these arena rounds but changes the court handoff: Trial always requires a completed valid Matrix simulation and indicts its explicit winner/loser, regardless of the arena champion. The former combat-derived Trial checks below are historical. See `TRIAL_LOCK_VERIFICATION.md`.

## Live tournament

- Matrix choices Moza R5 / Fanatec DD automatically loaded into autonomous combat. Round 1 used NEON CITADEL // GRID SECTOR 01. Fanatec DD won with 44.5% integrity after 9.0 seconds; one of its three nameplate pips lit up and both result CTAs offered PROCEED TO ROUND 02 // 03. Trial remained editable after Round 1.
- The arena-overlay CTA started Round 2 on ORBITAL DECISION ARRAY // DEEP SPACE. Both fighters reset to 100 HP and 0% Overthink, with 60 seconds and the retained 0–1 score. The dark starfield, vectors, orbital arrays and circular radar were inspected with the light HUD. Navigation/pause retained the match.
- Fanatec DD won Round 2 at 34.5% integrity after 11.0 seconds. Two rose pips lit, the score became 0–2, and the UI still required Round 3. No visible Trial CTA was present. The F2 CTA offered PROCEED TO ROUND 03 // 03.
- That F2 CTA started Round 3 on QUANTUM CORE // VOLATILE SUB-ATOMIC VOID, resetting health/meters/timer while retaining 0–2. The crimson/amber warning matrix, hexagonal core and particle field were inspected in both optical themes.
- Round 3 ended with Fanatec DD at 53.5% integrity after 7.5 seconds, giving a 0–3 sweep. F2 displayed K.O. // TOTAL DOMINANCE ACHIEVED, CLEAN SWEEP: OPTION B ERADICATED ALL OPPOSITION ACROSS ALL 3 ROUNDS, and ROUND 3 // SERIES 0-3. All three B pips were filled; A had three unfilled pips.
- All three individual round records remained visible. Final damage was 167.5 / 300.0, maximum combo 4-HIT, and signed-meter volatility 37.1%. Both result CTA positions switched to PROCEED TO QUANTUM TRIAL [03]. Next-round CTAs disappeared.
- Proceed opened the read-only Trial dossier with Fanatec DD as winner and Moza R5 as loser. Apply routed to Matrix and showed Fanatec DD as the 3-round champion, score 0-3, and 53.5% integrity in its last win, without inventing a confidence interval.
- RESTART 3-ROUND SERIES returned to the Round 1 splash on NEON CITADEL, score 0–0, no lit pips, 100 HP each, 0% meters and 60 seconds. F2 was hidden. Reload then returned to Matrix with both choices blank.
- Final telemetry and history were inspected at 390px in Solar Diagnostic. The three history cards and action buttons stacked; no horizontal page overflow occurred. Desktop Solar and Deep Space screenshots were inspected. No browser JavaScript warnings/errors were reported.

## Automated verification

All 54 tests, JavaScript syntax checks and the Tailwind build passed. New tests cover all eight possible three-round winner sequences, mandatory Round 3 at 2–0, health/meter/timer resets, score/history preservation, immutable completed reports, prevention of repeated finish scoring, rejected mid-series restarts, aggregate damage/combo/duration/volatility, champion health provenance, and the champion differing from the last round's winner. Three sweep headline variants and the exact majority headline are verified. Three seeded autonomous full tournaments reach valid champions with real damage in every round. Browser evidence above covers the actual 0–3 outcome; majority and alternate final-round outcomes are covered by engine tests.

## Screenshots

In the parent outputs folder:

- `decision-maker-tournament-round1.png`
- `decision-maker-tournament-round2.png`
- `decision-maker-tournament-round3-light.png`
- `decision-maker-tournament-round3-dark.png`
- `decision-maker-tournament-result.png`
- `decision-maker-tournament-result-dark.png`
- `decision-maker-tournament-mobile.png`
