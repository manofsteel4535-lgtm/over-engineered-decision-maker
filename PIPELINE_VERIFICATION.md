# Matrix → Fighter → Trial verification

Verified on 2026-10-05 at http://127.0.0.1:4173/ using the Codex in-app browser.

The later volatile-session refactor removes the refresh persistence described below. Current reload behavior is verified in `SESSION_VERIFICATION.md`; combat locks now last only within the current page session. The subsequent three-round tournament replaces the single-round publication/CTAs in these historical checks: only completed Round 3 publishes the series champion. Current handoff checks are in `TOURNAMENT_VERIFICATION.md`.

- Navigation displays Matrix 01, Option Fighter 02, Quantum Trial 03, followed by unchanged Modules 04–06. Module headings and the certificate label agree with the new indices.
- Clearing both Matrix choices displays the requested ERR 404 Void Combat banner and disables initiation. Filling custom arena names cannot bypass this gate. Providing only one Matrix choice remains blocked; providing both automatically loads the fighter slots and enables initiation.
- LOAD MATRIX OPTIONS restores the shared choices after editing a custom arena name. Direct Trial navigation shows editable native Option A/B fields. Editing Trial Option A immediately updates the Matrix field, arena slot and indictment.
- A live autonomous match between Moza R5 Bundle and Fanatec DD resolved with Option A winning at 42% health. The victory banner contained PROCEED TO QUANTUM TRIAL [03]; clicking it opened the locked winner/loser dossier. Reroll switched between the two combat-specific phrasings without unlocking either field.
- Refresh retained the combat record, actual names and readonly fields. The red SVG lock remained visible. The locked case completed all three questions and reached a 15% cosmic pardon with its arena evidence intact. Appeal returned to the current locked indictment.
- Changing a Matrix choice cleared the stale combat lock and restored editable Trial fields. A second autonomous match then produced the opposite result: Fanatec DD (Option B) won. Opening Trial through its ordinary tab, without clicking either victory CTA or Apply, already showed Fanatec DD as the locked winner and Moza R5 Bundle as the loser.
- APPLY WINNER TO QUANTUM MATRIX displayed Fanatec DD as the combat directive and preserved the Trial lock. Thus the combined choice/verdict handoff does not accidentally invalidate combat provenance.
- Both optical themes were visually inspected. Locked input fields stack on mobile; checks at 320px and 390px found no horizontal page overflow. The independent navigation strip remains scrollable. Browser runs reported no JavaScript warnings or errors.
- All 47 regression tests, JavaScript syntax checks and the Tailwind build pass. Added tests cover immutable combat publication, storage migration, invalid persisted records, fresh-choice unlocks, atomic Apply, winner-first combat wording and maximum-length evidence.

Screenshots in the parent outputs folder: `decision-maker-pipeline-light.png`, `decision-maker-pipeline-dark.png`, and `decision-maker-pipeline-mobile.png`.

The shared store retains choices and combat provenance only in memory until reload. A new bout clears the previous arena lock. An already-started court case remains sealed during ordinary navigation; the explicit arena Proceed CTA opens a fresh indictment for the latest result.
