# Black Box Archives verification

Verified 2026-10-07 at http://127.0.0.1:4173/ using the Codex in-app browser.

## User story and data flow

A user runs a valid Matrix comparison, optionally completes its three-round tournament and trial, then examines one historical case containing the combined evidence. That record survives refresh; historical evidence does not restore or authorize any live decision.

The app is a static, browser-only ES-module application. `npm start` serves `dist` on 127.0.0.1:4173 with caching disabled. No API, authentication, external datastore, environment variables or provider keys are required. The durable boundary is the browser's localStorage key `oddm_blackbox_archives`.

Matrix completion → completed run ID → new archive case. Combat/trial start → captured case ticket. Final tournament KO / third trial answer → append immutable stage snapshot to that ticket's case. Store update → feed and open dossier refresh. Historical reload → validated archive snapshots only.

The preview server was initially unreachable. Restarting the local Node server restored the page before browser verification continued.

## Live browser checks

- Exactly four tabs terminate at **04 // BLACK BOX ARCHIVES**. Empty repository showed its Matrix CTA and disabled purge button.
- Matrix **Moza R5 vs Fanatec DD** created **CASE-0001** immediately. Matrix recommended Moza R5: A/B probabilities 53.45% / 46.55%, utilities 55.15 / 52.98 and regret 46.55%. Its initial dossier was **PARTIAL SIMULATION / 1 of 3 stages**, with both provided skipped-stage badges.
- Export downloaded `CASE-0001-post-mortem.txt`. Reading the downloaded file confirmed the same case, Matrix statistics, skipped-stage badges and alternate sentence shown in the dossier.
- A real autonomous tournament completed all three arenas. Moza R5 won Round 1; Fanatec DD won Rounds 2–3. The same case became **2 of 3 stages**, with 25.70s combat time, 287.00 / 284.50 damage, 1–2 score, final KO and 10.50% champion HP. No duplicate case was created.
- The dossier separately labeled **Fanatec DD / ARENA CHAMPION** and **Moza R5 / MATRIX RECOMMENDATION**. Alternate Timeline B correctly used Moza R5, the final series runner-up. Trial preserved its existing explicit Matrix-winner indictment rule.
- Trial charge **Financial Recklessness Masked as 'Self-Care'** and three real answer clicks produced 40% outrage, **FOUND GUILTY OF MID-LEVEL ILLOGIC**, and the cryptocurrency explanation sentence. **OPEN BLACK BOX ARCHIVES [04]** opened CASE-0001 as **FULL DOSSIER / 3 of 3 stages**, with the charge, indictment, each exact prosecution/defense exchange and final decree.
- A new Matrix comparison **Fountain Pen vs Mechanical Pencil** created CASE-0002 as an independent partial file. The feed showed one full and one partial record, newest first.
- Reload reopened Matrix with empty A/B inputs and **MATRIX IDLE**. Archives retained both files and complete Stage 02/03 telemetry for CASE-0001, including after reloading the strengthened record validator.
- Purge opened a native confirmation dialog with Cancel focused and the correct two-file count. Cancelling retained both records. Existing browser records were not destructively purged during QA; deletion and pending-ticket isolation were verified using disposable test storage.
- Both optical themes recolored the feed and report. Reopening produced varied universal, lighthearted alternate outcomes. Escape closed the report and restored focus to its row action.
- At 375 × 812, body width was 360px within the viewport. The 330px feed region scrolled its 800px table locally. The dossier was 313px wide with matching scroll width, so it had no horizontal overflow. The temporary viewport was reset afterward.
- Final browser console: no warnings or errors. Archives tab left available as the deliverable.

## Automated checks

`npm run check`: passed for every app JS module.

`npm test`: **83 passed / 0 failed**. Nine new archive tests cover:

1. Immediate compact partial persistence, explicit probabilities, skipped badges, idempotence and blank live initialization.
2. Real Monte Carlo → autonomous three-round combat → three-answer trial full aggregation and reload.
3. Captured tickets linking delayed completions to the original case after a newer Matrix result.
4. Unrun/custom/incomplete/invalid stages rejected without fabricated evidence.
5. Appeals retained independently; latest decree shown; trial-only files remain partial.
6. Confirmed purge clears records while preserving monotonic IDs and rejecting late completions.
7. Denied/full/malformed storage, invalid contexts, damaged optional stages and immutable returned snapshots.
8. All eighteen alternate templates reached with universal item categories and literal placeholder-like/markup characters.
9. Exactly four navigation targets, with Archives mounted and obsolete placeholder tabs absent.

## Export and print scope

Text download was exercised in the browser and inspected on disk. Report-only print CSS and `window.print()` are implemented for browser print/save-PDF; no physical print job or OS PDF save was executed during QA. Historical records are local to this browser origin/profile; denied or full storage visibly falls back to session memory and export. No live choice, combat lock or trial state is loaded from archives.

## Screenshots

Saved in the parent `outputs` folder:

- `decision-maker-archives-light.png`
- `decision-maker-archives-dark.png`
- `decision-maker-dossier-light.png`
- `decision-maker-dossier-dark.png`
- `decision-maker-dossier-mobile.png`
