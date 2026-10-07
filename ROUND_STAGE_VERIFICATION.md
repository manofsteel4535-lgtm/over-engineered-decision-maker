# Option Fighter // round-progressive environments

Historical Round 1 evidence: the Initial Docket skyline is superseded by the Neon Citadel / Blueprint Metropolis overhaul. See `METROPOLIS_VERIFICATION.md` for current Round 1 checks. Round 2 and Round 3 remain unchanged.

Verified on 2026-10-05 at http://127.0.0.1:4173/ using the Codex in-app browser.

## Current stages

| Round | Stage | Deep Space | Solar Diagnostic |
| --- | --- | --- | --- |
| 1 | THE INITIAL DOCKET | Midnight navy, cyan perspective grid, sparse cyber-city and beacon pulses | Slate drafting paper, charcoal architectural skyline and precision grid |
| 2 | NEURAL SYNAPSE MATRIX | Purple void, connected neural nodes, traveling electric pulses and magenta floor | Opal-white/lavender, industrial containment rings, warm amber sweeps and terracotta floor |
| 3 | SINGULARITY COURT | Crimson core sphere, fractured shell vectors, radial red bursts, pulsing orange warning floor | White/amber containment ring, high-vis indicators, coral vectors and black/yellow hazard stripes |

The final stage shows CRITICAL DECISION OVERLOAD; both final palettes have caution stripes. Character armor, outlines, projectiles, health meters and hit effects keep their independent optical palettes.

## Architecture and transitions

`ARENA_ROUND_MAP` is the immutable round-indexed registry. `StagePalette` and `RoundStageConfig` are documented with JSDoc, matching the app's existing vanilla ES module architecture. `getActiveRoundStage(round, isDark)` resolves both variables on every render frame and clamps invalid/fractional rounds safely. Tournament arena names and HUD titles use the same registry.

Static scenery is cached offscreen, rebuilding only when the round or theme changes. Bounded neural pulses, radar sweeps, radial bursts and floor waves animate independently of physics. Advancing rounds snapshots the previous background and uses a 650 ms smoothstep crossfade during the existing 820 ms round-call intro. It does not introduce a simulation delay. Reduced motion uses an immediate transition and stationary/reduced effects. Theme switching aborts any visual blend and paints the current round's new palette immediately, so old-theme/old-round scenery cannot leak through. Paused matches also repaint via the central optical event.

## Regression checks

All 66 tests passed, JavaScript syntax checks passed and Tailwind built successfully. New checks cover all six exact gradients, canonical stage names, resolver bounds, round-sensitive palette selection, and the fade's starting/midpoint composition. Hot-swapping during an intro drops the old snapshot, while reduced motion skips allocation/blending.

Existing renderer tests exercise theme changes during all three combat rounds and compare the complete serialized engine state and combat RNG count. HP, positions, velocities, hitboxes/attack timing, timer, phase, wins, history and queued events remain intact. Zero-delta repaints preserve animation time, shake, flash and particles. Controller checks retain the owned RAF handle, timing accumulator, held controls and diagnostic hitbox visibility. All existing tournament, Matrix and Trial tests still pass.

## Live browser checks

- Matrix choices Moza R5 / Fanatec DD loaded into autonomous combat. Round 1 showed THE INITIAL DOCKET. Its dark midnight skyline and light slate blueprint were inspected with the same resolved round state (53 seconds, 0 / 44.5 HP, series 0–1).
- Proceed loaded NEURAL SYNAPSE MATRIX with health/meters/timer reset for Round 2 and series 0–1 retained. Light → dark switching during combat retained phase `fighting`, render state `active`, round 2, displayed timer 60 and 100 / 100 HP. It stayed on the neural map. Deliberate pause, light repaint and resume retained the round; the clock advanced to 59 and the match continued.
- Round 2 finished with Moza R5 winning at 79 HP. One pip on each side lit and series 1–1 was preserved for the final stage.
- Proceed loaded SINGULARITY COURT. Light → dark switching during active Round 3 retained round 3, phase `fighting`, active render state, timer 60 and 100 / 100 HP. Dark sphere/fractures and light mechanical containment were inspected. After a deliberate pause and optical repaint, resume continued at 59 seconds with real damage (Fanatec DD 94.5 HP); no combat reset occurred.
- No browser JavaScript warnings/errors were reported. Browser checks used muted audio; the theme path calls only palette selection/drawing and has no audio or verdict dispatch.
- The full series finished 1–2 for Fanatec DD, with all three history records retained (R1 Fanatec DD 44.5 HP, R2 Moza R5 79 HP, R3 Fanatec DD 72.5 HP). Final telemetry showed DECISION // MAJORITY WIN and exposed PROCEED TO QUANTUM TRIAL [03], confirming progression through all three new environments.

Saved screenshots in the parent outputs folder: `decision-maker-progressive-round1-dark.png`, `decision-maker-progressive-round1-light.png`, `decision-maker-progressive-round2-dark.png`, `decision-maker-progressive-round2-light.png`, `decision-maker-progressive-round3-dark.png`, `decision-maker-progressive-round3-light.png`.

The screenshots document actual rendering; reduced-motion and exact transition composition are covered by automated checks. Rendering cost remains bounded by the existing 1280×720 drawing-buffer limit and cached scenery; frame rate depends on the browser/display/device.
