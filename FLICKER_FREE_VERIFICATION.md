# Flicker-free saved-tab reload verification

Story: Selecting a module writes `oddm_active_tab`; a reload synchronously restores the same page and navigation highlight before any app controller runs, while live decisions remain blank.

## Cause and implementation

Storage already restored synchronously in the head. The remaining defect was static `aria-selected="true"` on Matrix and static `hidden` on other panels. Deferred app initialization corrected those attributes later, allowing the wrong navigation highlight and an empty/default layout to paint first.

- Removed the initial Matrix selection and default panel visibility from HTML.
- Exact root `data-active-module` selectors now select one panel layout and one tab glow.
- Parser-blocking `navigation-boot.js` initializes accessible selection, roving tab stops and mobile horizontal strip position immediately after the nav markup.
- `preload` suppresses transitions before first paint. The selected main layout is reserved while content is invisible until controller/data/validation/theme setup completes. Two animation frames then release suppression; optional Three.js initialization does not delay the restored page.
- No lifecycle hook overwrites a default navigation state. No new live input or simulation persistence.

## Browser evidence

Used the actual dist app on the separate fixture origin `127.0.0.1:4174` with **app.js deliberately delayed 1,500 ms**. This origin started with no app storage and left real archive history at `127.0.0.1:4173` untouched. The fixture records 120 consecutive animation-frame DOM/computed-style samples per reload, before controllers can correct initial HTML.

| Restored page | Light wrong frames | Dark wrong frames | First selected/glowing tab | First panel layout |
|---|---:|---:|---|---|
| 01 Matrix | 0 / 120 | 0 / 120 | MATRIX only | matrix-view only |
| 02 Fighter | 0 / 120 | 0 / 120 | FIGHTER only | fighter-view only |
| 03 Trial | 0 / 120 | 0 / 120 | TRIAL only | trial-view only |
| 04 Archives | 0 / 120 | 0 / 120 | ARCHIVES only | archives-view only |

All first samples: `ready=false`, `preload=true`, tab transition durations `0s`. After loading: `ready=true`, `preload=false`, and blank Matrix inputs. Thus the saved selection is established before deferred app code executes. Repeated Archives reloads also retained only its glow.

Mobile 375×812 Archives reload: first sample ARCHIVES only, zero wrong frames. Restored tab stayed inside the strip (left 137.27px, right 345.97px); strip scrollLeft 445px.

Actual site at `http://127.0.0.1:4173/` reloaded to Archives with only `module-archives` selected, main content visible, readiness set, preload released, inputs empty, and the two existing archive records retained. Browser warnings/errors: none. Screenshot: `../decision-maker-flicker-free-archives.png`. Sample summaries: `../decision-maker-first-paint-evidence.json`.

## Reproduce

Run `node tests/first-paint-server.mjs`, visit `http://127.0.0.1:4174/`, select a tab and reload. The hidden `#first-paint-proof` output holds the sampled JSON for read-only inspection. This fixture is separate from the production static server and does not ship in dist.

`npm test`: 88 passed / 0 failed. Added parser-boot coverage confirms exactly one accessible selection for all saved IDs, initial transition suppression, mobile scroll positioning and no storage writes/controller handlers during parsing. Existing storage rejection, routing and volatile-state tests remain passing. `npm run check` and Git whitespace checks passed.

This report supplements `HEADER_NAVIGATION_VERIFICATION.md`: its heading measurements remain valid; the initial-paint handling is superseded by this stricter verification.
