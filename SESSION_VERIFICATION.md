# Volatile decision sessions

Verified on 2026-10-05 at http://127.0.0.1:4173/ using the Codex in-app browser.

The later tournament update preserves these session rules. Combat evidence is now published only after all three rounds, as checked in `TOURNAMENT_VERIFICATION.md`; single-bout references below describe the earlier implementation.

- The shared choice store has no storage provider or persistence key. Every page instance starts with empty Option A/B, null fight winner/loser and an unlocked indictment. Trial no longer enumerates or deletes legacy browser records. Existing saved decisions are ignored.
- Historical source inspection found browser storage access only in the separate Optical Mode preference; the later header timezone feature adds the independent `oddm_user_timezone` preference. No decision module uses localStorage or sessionStorage.
- Entering Burger / Pizza and visiting Fighter automatically loaded both live names and enabled combat. Editing Option A in Trial to Veggie Burger updated Matrix immediately. A classification and first testimony were submitted; returning to Matrix retained the choices and a successful simulation recommended Veggie Burger.
- Reloading reset both Matrix fields to empty, selected Matrix [01], displayed MATRIX IDLE, cleared the Trial classification and restored editable blank Trial fields. Fighter displayed the requested Void Combat alert and disabled initiation.
- A live autonomous match between Moza R5 and Fanatec DD completed. Trial inherited its locked winner/loser dossier during that session. Reload cleared both names, the combat lock and selected charge; surrender was disabled again.
- After entering Burger / Pizza, the tab was closed and the URL reopened in a new tab. The homepage again had empty inputs, MATRIX IDLE and Matrix [01] selected. No JavaScript warnings or errors were reported.
- All 47 regression tests and JavaScript syntax checks pass. Updated shared-state tests cover independent fresh sessions, immutable live subscriptions, session-only KO publication, lock invalidation, atomic Apply, ignored legacy storage providers and name boundaries.

The saved Optical Mode preference remains intentional. Choice inputs, combat results, simulations, directives and court state live only in the current page's memory. Module navigation preserves that live state until reload or page closure.

Screenshot: `decision-maker-clean-session.png` in the parent outputs folder.
