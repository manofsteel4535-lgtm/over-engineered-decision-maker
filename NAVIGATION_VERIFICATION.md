# Tactical module navigation

Quantum Matrix (`MATRIX`) remains Module 01 and the default dashboard. Option Fighter II (`FIGHTER`) is Module 02, followed by Quantum Trial (`TRIAL`) as Module 03. Modules 04–06 share the calibration placeholder, with distinct selected module names.

Navigation uses six indexed, keyboard-accessible tabs with roving tab stops and Left/Right/Home/End handling. The strip scrolls horizontally on mobile. Optical Mode remains globally available.

All three working modules remain mounted: navigation hides their DOM without replacing it. Matrix inputs, results, controls and charts survive visits to the court and arena. Court questions, outrage, transcript and decree also survive navigation. The Matrix Three.js loop and Fighter canvas loop pause when their view or document is hidden, resize on return, and retain their state. The court uses CSS and finite timers without any canvas or GPU loop. Fighter additionally retains manual pause and clears held movement controls on navigation.

Matrix choices, completed simulation evidence and arena provenance use a volatile shared immutable store. Trial choices are always read-only and bound to the original Matrix A/B order; dossiers require a valid completed simulation and use its explicit winner/loser. Combat alone cannot authorize Trial. Six inline banners return to Matrix and focus the required field or Run button. Navigation preserves a case while its simulation evidence remains valid. Changing choices or starting another run cancels the stale case and clears pending transitions; its completion produces a new dossier. Refresh returns to blank Matrix choices, idle analytics, `hasRun: false` and a blocked Trial. The final arena CTA opens the same evidence gate. Only Optical Mode remains saved. Current courtroom checks are in `TRIAL_LOCK_VERIFICATION.md`; arena rounds are checked in `TOURNAMENT_VERIFICATION.md`.

See `TRIAL_VERIFICATION.md` and `FIGHTER_VERIFICATION.md` for browser verification and navigation behavior.
