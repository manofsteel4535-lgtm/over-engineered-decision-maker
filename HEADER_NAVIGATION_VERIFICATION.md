# Shared module headings and refresh persistence

Verified 2026-10-07 at http://127.0.0.1:4173/.

## Story and boundary

The user switches to any of the four module pages, then refreshes: the same page returns with a consistent heading and newly initialized blank live choices. Historical archive files remain independent.

This is a static browser app with no API, credentials or environment variables. The existing preview server log reports `Local: http://127.0.0.1:4173`; the live page loaded normally. The data flow is navigation action → `oddm_active_tab` numeric preference → synchronous head initialization → selected panel/ARIA state → mounted module activity. No choice or simulation store participates in this preference.

## Changes

- Every primary page heading uses the shared `module-header`, `module-header-copy`, `module-header-meta`, `module-header-title` and `module-header-description` contract.
- Archives' monospace title and extra page-top padding were removed. Fighter's primary title has no italic/skewed typography. Matrix now has the matching Module 01 breadcrumb while retaining its application title.
- `navigation-preference.js` restores only valid `01`, `02`, `03`, `04` values, with Matrix fallback for missing/invalid/blocked storage. A root marker suppresses the default Matrix view before the restored panel mounts.
- `ModuleNavigation` initializes panel visibility and ARIA selection without calling controllers still under construction. `app.js` activates the restored module once all controllers exist. All tab clicks, keyboard changes and module correction/return actions save the destination.

## Browser typography measurements

All four pages had identical measured properties in both Solar Diagnostic and Deep Space:

| Property | All four modules |
|---|---|
| Title family | `Barlow, Arial, sans-serif` |
| Title size / weight | 40px / 800 |
| Title letter spacing / line height | -0.8px (-0.02em) / 44px (1.1) |
| Title top / bottom margin | 10px / 12px |
| Header top / bottom padding | 32px / 32px |
| Breadcrumb family | JetBrains Mono / Courier New / monospace |
| Breadcrumb size / weight / tracking | 12px / 600 / 0.96px (0.08em) |
| Header document top / height | 156px / 192.796875px |
| Breadcrumb / title document top | 188px / 216px |

Solar breadcrumbs used `rgb(8,145,178)`; Deep Space used `rgb(0,243,255)`, identically across the modules. Two-line description space aligns desktop content starts without fixing the viewport height or disabling document scrolling.

At a 375 × 812 viewport, all four titles used the same 32px sans-serif/800 style, breadcrumbs remained 12px, and vertical header padding was 24px. Body scroll width was 360px within the 375px viewport on every page. Long text wraps naturally; the archive feed retains its local horizontal scroll. The temporary viewport was reset after inspection.

## Browser refresh and routing evidence

- No prior active-tab preference: the initial reload displayed Matrix, blank inputs and MATRIX IDLE.
- Entered Sushi / Pasta and navigated to Trial. Live in-session fields retained the names and correctly showed ERR 402 because no simulation had run.
- Refreshed Trial: the only visible panel was `trial-view`; Tab 03 remained selected. Both Matrix and Trial fields were blank, ERR 404 VACUOUS PROSECUTION VOID rendered inline, and Fighter's render loop was paused.
- Trial correction CTA routed to Matrix and focused `option-a`.
- Entered Ramen / Rice, selected Archives, then refreshed. Tab 04 and Archives returned directly; Matrix inputs were blank. The existing two archive files, including one full dossier, remained unchanged.
- Selected Fighter and refreshed. Tab 02 returned with blank fighter slots, ERR 404 VOID COMBAT PROHIBITED and disabled INITIATE COMBAT.
- Fighter correction CTA routed to Matrix; refreshing then retained Tab 01 with blank inputs and MATRIX IDLE.
- Theme toggles preserved the current module and applied the same heading geometry. Mobile navigation kept the selected Archives tab within the touch-scroll strip.
- Final restored page: Archives in Solar Diagnostic, with no browser console warnings/errors. No historical records were purged.

## Automated results

`npm run check`: passed, including the new synchronous navigation preference script.

`npm test`: **87 passed / 0 failed**. Four navigation tests exercise all valid saved IDs, missing/obsolete/malicious-looking values, denied storage, invalid routing rejection, cold live state, initialized panel/ARIA/tab-stop states, no premature controller callback, click/keyboard/programmatic routing, reload restoration and persistence limited to the navigation key.

Existing tests continue to cover volatile Matrix choices/results, combat/trial resets, archive independence, themes and the full decision pipeline. Typography was checked through computed styles and screenshots rather than tests that merely mirror CSS declarations.

## Screenshots

Saved in the parent outputs folder:

- `decision-maker-trial-refresh-light.png`
- `decision-maker-header-archives-light.png`
- `decision-maker-header-archives-dark.png`
- `decision-maker-header-mobile.png`

Earlier verification notes describe historical default-to-Matrix behavior. This document records the current saved-tab behavior; live decision volatility remains unchanged.
