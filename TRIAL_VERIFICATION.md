# Quantum Trial verification

Verified on the local app at http://127.0.0.1:4173/ with the Codex in-app browser.

Current session behavior is documented in `SESSION_VERIFICATION.md`: every reload resets choices, combat locks and court state. Persistence checks below are historical and have been superseded.

## Matrix evidence gate and winner binding — 2026-10-05

Current rules are verified in `TRIAL_LOCK_VERIFICATION.md`: Trial inputs are always read-only, six inline warnings gate prosecution, a completed valid Matrix run is mandatory and all templates use its explicit winner/loser. Combat does not bypass the gate; changing the pair or re-running cancels stale cases. All 61 tests pass. Earlier editable, generic and combat-derived indictment checks below are historical.

## Expanded question bank, prediction secrecy and decrees — 2026-10-05

Current verification is in `TRIAL_BANK_VERIFICATION.md`: ten questions/31 responses, three unique sampled questions per case, classified option badges by default, live prediction reveal, and independently randomized headlines/sentences in the 0–25 / 26–65 / 66–100 tiers. Live cases reached 15%, 45% and 100% with the matching low/moderate/extreme decrees. All 56 tests pass. The previous static-question and 50/51 threshold checks below are historical.

## Historical combat pipeline — 2026-10-05

Quantum Trial is Module 03. Its choices are editable when no completed tournament verdict exists and read-only after Round 3, with a glowing red lock icon and champion-first indictment. Current combat evidence is in `TOURNAMENT_VERIFICATION.md`; `PIPELINE_VERIFICATION.md` and the entries below retain historical single-round, module-label and input behavior checks.

## Auto-indictment refactor — 2026-10-05

- Starting with empty Matrix choices renders a generic Option A / Option B dossier and a fallback warning. Surrender is disabled. The dropdown has twelve entries: one disabled placeholder and all eleven specified charges.
- Entering “Order Pizza” and “Eat Salad” updates the hidden Trial dossier immediately. Opening Module 02 shows both choices in the generated sentence, a read-only badge and Matrix source line. Reroll changes the phrasing without changing choices. The dossier is static text, not an editable field; the browser refused an attempted typing action against its read-only textbox role.
- Selecting a charge enables surrender. The existing three-question cross-examination reached the 15% cosmic pardon and certificate successfully.
- Editing Option A to “Cook Noodles” during examination did not change the existing Exhibit A or its certificate. Appeal rebuilt the dossier from Cook Noodles / Eat Salad, restored the placeholder, disabled surrender and focused classification.
- Refresh restored both Matrix inputs from `decision_maker_options`. Unit tests also verify denied/corrupt storage fallback, immutable snapshots, subscriptions and the 60-character limit.
- A partly empty pair retained the provided choice and substituted only the missing “Option B”, with a warning. Markup-like input (`<b>Pizza</b> $& {Option B}`) appeared literally in the generated sentence. All six templates and all eleven charges pass engine tests, including the longest permitted names within the evidence limit.
- Dark, clinical light and 390px mobile dossiers were visually inspected. Layout checks at 320, 390 and 768px found no page overflow. Browser runs reported no JavaScript warnings or errors. All 43 regression tests and syntax checks pass.

Current screenshots: `decision-maker-auto-indictment.png`, `decision-maker-auto-indictment-light.png` and `decision-maker-auto-indictment-mobile.png` in the parent `outputs` folder.

## Original courtroom verification

- Module 02 is labeled `[02 // QUANTUM TRIAL]` and routes to `TRIAL`. The retired module's files, forms, chart canvases, imports, tests and documentation have been removed. Source search has no retired module references. Retired suite report records are deleted on initialization; optical preference is preserved.
- The original manual-evidence flow displayed an inline warning for blank decisions. It has since been replaced by the auto-generated dossier and classification gate above.
- The indictment opens the three judicial cards and first question. All questions and answer weights match the specification. Testimony updates the live meter before the finite 650ms transition to the next question.
- Selecting ads (+35), ignored advice (+40), entropy (+30) displays 35%, 75%, then a capped 100% guilty verdict. The evidence record correctly distinguishes the last answer's nominal +30 from its applied +25 points.
- Selecting calculated reasoning (+10), unboxing (+15), honesty (−10) displays 10%, 25%, then a 15% cosmic pardon. The pardon certificate records the actual disposition.
- A completed trial has 17 transcript entries and three sworn evidence records. It displays one sentence from the four-message pool.
- Original appeal cleared evidence and focused its input. The current appeal keeps shared Matrix choices, regenerates the dossier and focuses the empty charge selector.
- A completed Moza R5 / Fanatec DD Matrix recommendation survived a visit to the court and return. Court state also survived a visit to Matrix. At this verification, total canvas count remained two; topology reported `paused` when hidden and `active` on return. Module 03 was subsequently replaced by Option Fighter II; see `FIGHTER_VERIFICATION.md` for its integration checks.
- Dark and light courtroom palettes were inspected in the indictment, examination and verdict flow. Theme switches preserve scores and testimony. Reload retained the selected optical theme.
- A 390px mobile trial reached the verdict with no horizontal page overflow. Additional verdict checks at 320, 768 and 1024px also found no overflow. The module navigation scrolls independently.
- Certificate preview shows the decision, case classification, UTC issue time, actual verdict, final outrage, all three question/answer pairs and mandatory sentence. A native download link is prepared with a Blob URL and case-specific HTML filename. Clicking it shows export-request telemetry. The in-app browser did not expose a download event, so actual file delivery remains unverified there. Print/save-as-PDF is provided through the native print action; print rules isolate only an open certificate.
- Browser runs reported no JavaScript warnings or errors. Syntax checks and all 24 regression tests pass. Trial tests cover all 27 answer paths, the 50/51 verdict boundary, the honesty reduction, capped increases, invalid/stale/post-verdict clicks, all four sentences, snapshot isolation and appeal resets.

Screenshots in the parent `outputs` folder: `decision-maker-trial-indictment.png`, `decision-maker-trial-examination.png`, `decision-maker-trial-light.png`, `decision-maker-trial-dark.png`, `decision-maker-trial-mobile.png` and `decision-maker-trial-certificate.png`.
