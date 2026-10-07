# Option Fighter // Round 1 metropolis

Verified 2026-10-05 at http://127.0.0.1:4173/ in the Codex in-app browser.

## Scope

Only Round 1 palette and scenery changed. `fighter-cityscape.js` isolates the layered skyline and bounded telemetry animation. Static architecture is cached by the existing renderer; moving data pillars/beacon rings and the CAD scan draw separately. The same existing per-frame round/theme resolver and zero-delta optical repaint handle live and paused theme changes.

Round 2 and Round 3 registry entries and their static/dynamic drawing branches were compared with the pre-edit source and are identical. The combat drawing methods, physics engine, controller and central theme hooks are unchanged.

## Visual checks

- Deep Space: midnight-to-indigo sky, three city depth layers, stepped/crowned/spired towers, shaded facades, cyan/magenta windows and antenna beacons, radial cyan horizon bloom, rising data columns and cyan floor boundary.
- Solar Diagnostic: architectural paper sky, slate structural skyline, facade ribs, crosshairs, drafting circles, dimension arrowheads, elevation ticks, alignment guides, slate haze and charcoal floor boundary.
- Both fighters, health/meter bars and hit effects remain legible against both backgrounds.

Saved active-combat screenshots in the parent output folder:

- `decision-maker-metropolis-dark.png`
- `decision-maker-metropolis-light.png`

## Live synchronization

During Round 1 player-vs-AI combat, toggled Solar Diagnostic to Deep Space. Before and immediately after: phase `fighting`, round `1`, timer `60`, health `100 HP / 100 HP`. The switch preserved the live match, and subsequent snapshots showed the timer advancing normally to 59 and 58 with normal combat damage. Switched back to Solar Diagnostic without replaying the intro. Also verified a theme switch on the Round 1 result retained health, timer and series state.

## Automated checks

`npm run check` passes; `npm test` passes all 68 tests. New scenery checks cover deterministic draw geometry without combat RNG consumption, atmospheric colors, shaped skyline layers, neon/CAD details, balanced canvas style save/restore, bounded animated calls and reduced-motion behavior. Existing six-stage theme/physics invariants and three-round tournament tests remain green. No universal FPS guarantee is implied; actual performance depends on device/browser.
