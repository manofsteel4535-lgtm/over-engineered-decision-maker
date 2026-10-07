# Quantum Trial // read-only Matrix evidence and legal banners

Verified on 2026-10-05 at http://127.0.0.1:4173/ in the Codex in-app browser.

## Live verification

- Tested all six branches in order: both blank → ERR 404 VACUOUS PROSECUTION VOID; only pasta in B → ERR 409 UNILATERAL INDICTMENT DENIED; only sushi in A → ERR 409 ABSENT DEFENDANT DENIED; sushi/sushi → ERR 422 TAUTOLOGICAL PERJURY; sushi/sushis → ERR 418 SEMANTIC SUBTERFUGE; sushi/pasta without a run → ERR 402 UNCOMMITTED SPECULATION PROHIBITED.
- Every branch displayed the exact specified native alert header/message/CTA, hid the standard dossier and surrender button, disabled classification, and had zero open dialogs. Both Trial fields reported native readOnly=true and retained the global A/B input order.
- Banner CTAs selected Matrix and focused option-a, option-a, option-b, option-b, option-b and run-button, respectively. During an in-progress run, the 402 CTA returned to Matrix and focused Run immediately after it became enabled.
- A real 10,000-outcome sushi/pasta run selected Option B, pasta, at 56.85% simulated win rate. Trial fields remained sushi/pasta, while all observed dossier rerolls put pasta first and sushi second. The exact requested sentence appeared: “Subject surrendered to primitive dopamine cravings by picking pasta over sushi.” Source telemetry named pasta as simulation winner and sushi as alternative.
- Starting that case and submitting testimony worked. Changing Matrix B to noodles canceled the case, cleared transcript entries, hid examination and restored the 402 banner. Pending question timers did not reopen the old case. Changing B back to pasta still required a fresh simulation.
- The next real simulation selected sushi. Trial indicted sushi over pasta, completed three randomly sampled questions and reached a 70% Extreme-tier verdict. Certificate evidence preserved that same new simulation choice and all three filed responses.
- Reload returned to blank Matrix choices. Trial showed the 404 banner again. Starting a new run invalidated eligibility until completion; the court displayed 402 while processing and enabled its dossier only afterward.
- Solar desktop error/winner cards and a Dark 390px duplicate banner were visually inspected. The long correction CTA wrapped, fields stacked and no horizontal page overflow occurred. No browser JavaScript warnings/errors were reported.

## Code and tests

All 61 regression tests, JavaScript syntax checks and the Tailwind build passed. New cases cover six-warning precedence/focus targets, normalized identity/plurality, literal text injection, coherent completed-result membership, arena verdicts failing to substitute for simulation evidence, explicit A/B winner mapping, all six winner-first templates, the exact pasta-over-sushi sentence, immutable Matrix evidence, choice-change/new-run invalidation and stale-completion rejection. Existing bank, decree, combat, theme and volatile-session tests continue to pass. The final deferred-focus adjustment passed its syntax check and the live in-progress-run check above.

Matrix evidence is stored only in the existing in-memory store. Each run receives an epoch token; only the current valid pair and current token can publish hasRun=true, winner, loser and runId. Combat provenance remains separate. A changed pair through the arena Apply action invalidates old simulation evidence; an unchanged pair cannot replace its actual Matrix winner with the combat champion.

## Screenshots

In the parent outputs folder: `decision-maker-trial-run-required.png`, `decision-maker-trial-winner-bound.png`, and `decision-maker-trial-legal-mobile.png`.
