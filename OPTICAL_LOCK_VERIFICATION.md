# Fixed optical badge and synchronous hydration

Story: The stored/system theme sets the root before styles paint; the matching badge label, icon and accessible toggle state appear immediately in fixed slots. Clicking the toggle changes the spectrum while preserving header geometry and all live module state.

## Changes

- Fixed border-box footprint: width/min-width/max-width 210px, height/min-height/max-height 36px, flex basis 210px.
- Fixed 16×16px icon slot, 26×16px switch and centered 126×22px label slot; explicit line heights, no label wrapping or mobile dimension overrides.
- Inline sun/moon SVGs and both labels are present in initial HTML. CSS reads the synchronous root `.dark` state; no post-mount label replacement or icon conversion.
- `DecisionTheme.syncToggle()` initializes accessible label, pressed state and title during parser boot, and updates them before theme events on user/system changes.
- Existing early `decision_maker_theme` read, validation, system fallback, persistence and storage failure behavior retained. Startup transition suppression retained.
- Stable root scrollbar gutter reserves the right edge. During QA an otherwise unrelated 15px scrollbar appearance shift was found and eliminated.
- Below 360px, header controls stack naturally without shrinking the badge.

## Browser measurements

At 1280×900, the light and dark interactive toggle states had identical rectangles:

| Element | x | y | Width | Height |
|---|---:|---:|---:|---:|
| Optical badge | 1023 | 16 | 210 | 36 |
| Icon slot | 1034 | 26 | 16 | 16 |
| Label slot | 1060 | 23 | 126 | 22 |
| Status/clock/version group | 633.1875 | 20 | 365.8125 | 28 |
| Clock | 815.1875 | 26 | 84.203125 | 16 |
| Version | 923.390625 | 20 | 75.609375 | 28 |

The actual live site was also measured at its normal narrower desktop size; both themes had identical badge/clock rectangles.

Using the separate `127.0.0.1:4174` regression fixture with **app.js delayed 1,500ms**, recorded frames before app controllers ran through 12 frames after readiness:

- Dark: 220 samples, one badge rectangle throughout, only `[DEEP SPACE]`/moon visible.
- Light: 245 samples, one badge rectangle throughout, only `[SOLAR DIAGNOSTIC]`/sun visible.
- First samples had readiness false and transitions suppressed. Final samples had readiness true and preload released. The theme, visible label and icon never changed during hydration.
- The 16×16 icon rectangle remained identical through initialization.

Mobile dark/light toggles and refreshes:

| Viewport width | Badge x/y | Badge dimensions | Distinct reload rectangles per theme | Horizontal page overflow |
|---|---|---|---:|---|
| 375px | 136 / 33 | 210×36 | 1 | None (body 360px) |
| 320px | 81 / 82 | 210×36 | 1 | None (body 305px) |

Clock positions were identical before/after theme clicks on both mobile sizes. Viewport override reset after QA. Browser warnings/errors: none. Existing two real archive records preserved; no live decisions restored or new runs created.

Evidence: `../decision-maker-optical-lock-evidence.json`, `../decision-maker-optical-lock-light.png`, `../decision-maker-optical-lock-dark.png`.

## Automated checks

`npm test`: 89 passed, 0 failed. New header-binding coverage verifies saved preferences override opposing system preferences before app mounting, parser binding does not overwrite preferences, and user/system events keep ARIA and root state synchronized. Existing persistence/storage failure, chart, fighter and navigation tests pass. Syntax and whitespace checks pass.

The fixture in `tests/first-paint-server.mjs` now also records theme labels, icon slots and header rectangles, continuing through readiness. It remains outside dist and is stopped after browser QA.
