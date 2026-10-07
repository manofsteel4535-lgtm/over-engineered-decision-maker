# Option Fighter // dual arena palettes

Historical verification of the prior Citadel/Orbital/Core concepts. The round-progressive replacement uses Initial Docket / Neural Synapse Matrix / Singularity Court; see `ROUND_STAGE_VERIFICATION.md` for current behavior and checks.

Verified on 2026-10-05 at http://127.0.0.1:4173/ using the local app and Codex in-app browser.

## Implementation

- `dist/fighter-stages.js` owns three immutable stage records with explicit `dark` and `light` configurations and JSDoc `StageDefinition` / `StageThemeConfig` types. Arena names used by the tournament derive from this registry.
- Every frame reads the root `.dark` signal and chooses the current round's palette. Static sky, skyline/stars, rings, floor mesh and hazard stripes rebuild on an offscreen canvas only when the round/theme changes. One completed background is copied to the visible canvas; no visible canvas reset or loop recreation is involved.
- Moving vehicles, radar sweep, scanlines and core particles use the selected palette on each frame. Floor lines glow in Deep Space and stay crisp in Solar Diagnostic. The orbital palette contains no dark-only hardcoded star, platform or radar colors.
- The central theme event additionally performs a zero-delta redraw for paused matches. Diagnostic hitboxes remain visible. No engine reset/update, audio call, verdict dispatch, RAF scheduling, control clearing or particle restart occurs in this path.

## Automated checks

All 64 tests and JavaScript syntax checks passed; the Tailwind stylesheet built successfully.

The renderer regression exercises all three rounds with dark → light → dark frame changes during combat. It compares complete serialized engine state and combat RNG calls before/after: health, positions, velocities, attack timing/hitboxes, timer, phase, series scores/history and pending events remain unchanged. Animation time, shake, flash and existing particles survive zero-delta repaints. Subsequent simulation/render steps advance the same clocks. Paint recordings verify actual stage gradients, grids, floor lines, orbital stars and core hazard colors. Stable frames do not rebuild cached scenery. A separate controller check preserves active/paused state, held keys, accumulator, last frame and the owned RAF while forwarding hitbox visibility.

## Live checks

- Neon Citadel inspected in both modes: dark cyan/magenta structural city versus slate blueprint outlines and steel-blue floor grid. Theme switching after a round preserved its timer, HP, score and next-round CTA.
- Orbital Array switched light → dark during active Round 2 at 57 seconds, 62.5 / 90 HP and series 0–1. Both snapshots retained phase `fighting` and render state `active`, with the same timer and HP. An intentional pause followed; changing to light and resuming continued the same round, with subsequent timer/damage progression. Light mode uses bright slate radar, gray tracking dots and blue vector platforms; dark mode uses a cosmic starfield and cyan vectors.
- The autonomous series completed all three rounds and retained telemetry/history, finishing 0–3 with Pasta as champion. Final-round theme changes preserved 54 seconds, 0 / 52.5 HP, the series score and final Trial CTA. Quantum Core uses an amber grid on crimson in Deep Space and coral/terracotta grid on warm peach in Solar Diagnostic; both show alternating black and high-vis yellow hazard stripes.
- A second, player-controlled series verified dark → light switching during active Round 3 (phase `fighting`, render state `active`, 60-second displayed clock, 100 / 100 HP, retained 0–2 series). An intentional pause followed. Switching back to dark repainted the paused core with the same fighter positions, timer and score; resuming continued at 59 seconds. Complete core and Citadel stages were inspected in both modes. The browser reported no JavaScript warnings/errors.

Screenshots in the parent `outputs` folder use the `decision-maker-arena-` prefix: `citadel-light.png`, `citadel-dark.png`, `orbital-light.png`, `orbital-dark.png`, `core-light.png`, `core-dark.png`.

Sound replay prevention is verified by the theme path calling only palette selection and drawing; the browser checks used muted audio. FPS remains device/browser dependent.
