# Project Tasks

Remaining work for the level-1 character creator, reviewed on 2026-10-04. Implementation details belong in `PROJECT_RULES.md`; audit findings belong in the data-review documents. Passing tests verifies encoded behavior, not translation fidelity.

## Data Audits

- [ ] **User-owned translation task:** Complete the missing translation for 언데드 / Undead (`undead1`) in `frontend/data/foci.json`, including the currently empty effect text. The user will translate this entry; Codex must leave the translation to the user unless explicitly reassigned.
- [ ] Audit spells in `frontend/data/spells.json`: translated names and terminology, unambiguous effect wording, levels, schools, numerical values, and cross-references. Compare against the registered translator-provided sources and check first-level eligibility and class-school restrictions; record discrepancies for translator review.
- [ ] Audit arts in `frontend/data/arts/` and starting grants in `frontend/data/starting_arts.json`: names, terminology, numerical values, Effort costs/durations, class associations, prerequisites, and full/partial selections. Check fixed grants, restricted choices, and linked focus/ability effects against local descriptions.
- [ ] Correct `Skin Shifter` to `Skinshifter` in `frontend/data/classes.json` (`eng_name`) and active display text, keeping the `skinshifter` ID and references unchanged.
- [ ] Resolve the existing focus audit in `FOCUS_SEMANTIC_AUDIT.md` and `FOCUS_DATA_REVIEW.md`, rather than repeating it. Review names, wording, bonuses, requirements, levels, tags and unencoded creation effects with the translator. Traditional Education's wording and cross-class Effort-pool questions remain in entry 102.
- [ ] Audit equipment, properties and starting packages for translation consistency, values, prices, quantities and references. Resolve preserved discrepancies in `EQUIPMENT_DATA_REVIEW.md`, especially load footnotes, daily/weekly rations, package bundles and armor values.

## Creation Rules

- [ ] Calculate and display total maximum System Strain / 최대 기관계 부담 on the character sheet, including the base maximum and all applicable validated bonuses rather than only the existing bonus adjustment. Confirm the base calculation against the registered rules, use final effective attributes, and share the calculation between frontend preview and backend evaluation. Show the total with its base/bonus breakdown; verify attribute changes, focus bonuses and removal, and saved-draft restoration. Current System Strain tracking remains outside this task.
- [ ] Implement the missing effects of 자각인 / 自刻人 (`focus_0421`): set CON to 14 when below 14, otherwise to 18, and add +2 maximum System Strain. Preserve the existing Exert bonus skill and reflect the resulting score, modifier, HP and saves on the sheet. Resolve score-effect ordering and the labor/recovery/exhaustion wording recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 042; show play-time conditions as sheet notes within the level-1 creator's scope. Verify threshold cases, interaction with other score changes, focus removal and saved-draft restoration.
- [ ] Implement the missing effects of 소유품 포병종 / Chattel 抱病種 (`chattel1`): reroll STR as 1d4+2, choose CON or CHA for a +1 modifier bonus with a maximum of +3, apply -2 to all attack rolls, and show the +1 social-check bonus on the sheet. Preserve the existing non-combat, non-Magic bonus-skill choice. Resolve fixed-array handling and score-effect ordering recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 044. Persist and validate the die result and modifier choice without rerolling on render or restoration; verify derived statistics, modifier caps, focus removal and saved-draft restoration.

- [ ] Implement the Specialist / 특성화 인재 focus granted by 기능성 포병종 / Functionary 抱病種 (`functionary1`), bound to its selected non-combat, non-Magic bonus skill. Derive the granted level-1 instance from the eligible parent focus and show its source and bound skill on the character sheet. Resolve skill-allotment counting and focus-pick treatment recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 045; enforce Specialist's distinct-skill rules and handle existing ownership. Verify skill changes, duplicate handling, parent-focus removal and saved-draft restoration while preserving the level-2 creation ban.

- [ ] Implement the missing bonus-skill choice for 노움 / Gnomes (`gnomes1`): support Sneak (`sneak`) for the forest-dweller variant or Craft (`craft`) for the inventor variant described in the focus, instead of always granting fixed Sneak. Grant exactly one of these skills, reflect the choice in skill allotments and the character sheet, and verify selection changes, focus removal and saved-draft restoration, including legacy drafts with the fixed Sneak grant.

- [ ] Implement the AC effects of 리자드맨 / Lizardmen (`lizardmen1`): AC 13 without armor and +1 AC when wearing armor better than that baseline, as described in the focus. Resolve the unarmored/weaponless wording, armor comparison, DEX/shield application and interaction with other AC sources recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 062 before encoding the formula. Share the calculation between frontend preview and backend evaluation and show its source/breakdown on the sheet. Verify no armor, armor below/equal to/above 13, shields, other AC effects, focus removal and saved-draft restoration.

- [ ] Implement the HP increase from 드워프 / Dwarves, 다른 아인 variant (`dwarves_21`). Resolve the ambiguous "각 레벨마다 HD에 +1" wording recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 064 and encode the intended HP bonus explicitly. Apply it to first-level HP in both frontend preview and backend evaluation and show its source/breakdown on the sheet. Verify interaction with class hit dice, hit-die overrides, final CON modifiers and the minimum-HP rule, plus focus removal and saved-draft restoration.

- [ ] Implement the missing creation effect of 엘프 / Elves, reincarnating variant (`elves1`): redistribute points from other attributes to raise selected scores below 9 to 9, as described in the focus. Resolve optional versus mandatory increases, donor minimums, point conservation and interaction with rolled/fixed allocation and other score effects recorded in `FOCUS_SEMANTIC_AUDIT.md` entry 065. Store redistribution separately from the original allocation, validate it in frontend and backend, and reflect resulting scores and derived statistics on the sheet. Preserve and verify the existing free-choice skill and Notice grants, including duplicate-skill handling; test focus removal and saved-draft restoration. Daily rerolls, vision and reincarnation follow the deferred play-time/sheet-note scope; this task does not enable level-2 creation.

## Build Follow-Up

- [ ] Configure a backend production build and matching start command. `backend/package.json` currently has no build script; `start` expects `dist/index.js`, while the TypeScript output directory is not configured. This pass verifies the backend through tests and its running `tsx` development server, not a compiled production deployment.

## Deferred Scope

Focus `sheet_notes` coverage is partial: only some focus effects and play-time conditions are included in the character sheet's reference notes. Comprehensive coverage is a scope decision for future expansion, not an immediate defect or required task for this implementation pass. The displayed notes should not be treated as a complete summary of every selected focus's rules.

- [ ] If higher-level creation is added, implement repeated Spirit Familiar Level 2 purchases linked to one Level 1 instance. Save two distinct benefit IDs per purchase, forbid reuse across the entire acquisition history, and save the background subchoice. Adapt upgrade limits, focus-pick costs, removal/restoration and familiar-only effects. The six-benefit catalogue metadata is ready; the current builder still rejects Level 2.
- [ ] If higher-level creation is added, implement Antimage's Nullifier upgrade and the alternative focus for an already-level-2 owner. Current behavior is a free level-1 grant with paid duplicates refunded, never a level-2 exception.
- [ ] If higher-level creation is added, implement the missing mental-attribute modifier choice for 엘프 / Elves (`elves2`): choose INT, WIS or CHA, add +1 to that modifier and permit a maximum of +3. Preserve the existing bonus-skill choice and `elves1` prerequisite. See `FOCUS_SEMANTIC_AUDIT.md` entry 065; verify modifier caps, derived statistics, choice changes, parent/upgrade removal and saved-draft restoration. Keep the current level-2 creation ban until that scope is expanded.

Combat-time simulation, Effort spending, conditional roll resolution, crafting, ongoing inventory, carried-capacity/storage/coin loads and System Strain tracking remain outside this level-1 creator. Do not infer these features from passing creation tests.

## Verified Implementation

- Kitsune Beastfolk (`kitsune_beastfolk1`): automatic Elemental Sparks grant, one additional Elementalist art when already fixed by class/tradition, sheet provenance, duplicate validation, focus removal and saved-choice restoration.

Completed checklists are consolidated here; they are not open tasks.

- Focus rules: typed allowances, direct base-attack changes, modifier caps, Impervious Defense AC, direct and conditional saves, free art-granted Nullifier, and Spirit Familiar's data-only preparation with the level-2 ban.
- Traditional Education: tradition choice, full/partial Invoker starting arts, fixed grants without replacements, first-level spell access with two/four picks, and maximum Effort `max(1, Magic skill level)`.
- Background growth feeds derived scores, modifiers, HP, AC and saves. Class/focus abilities use shared definitions; Flaw of Fragility overrides Warrior/Duelist hit dice before HP calculation.
- Equipment: starting packages or funds, budgeted purchases, saved loadouts, owned equipment selection, AC and worn-armor penalties. Detailed data caveats remain in `EQUIPMENT_DATA_REVIEW.md`.
- Interface: HP/AC terminology, the image-only game banner, Korean labels with small English names, localized class/archetype selectors, a separate rules page, readable focus details and disabled unavailable choices.

## Latest Verification: 2026-10-05

- Kitsune implementation: backend **267 passed**, frontend **7 passed**, production frontend build passed (existing large-chunk warning). Added grant/replacement, duplicate/removal/restoration/API and rendered-sheet regression checks; no new browser interaction pass.

- Extracted the derived sheet from `App.tsx` into the presentation-only `CharacterSheet.tsx`. Shared signed-number formatting lives in `formatting.ts`; draft state, calculations, persistence, network handling, CSS and routing remain unchanged.
- `npm.cmd test` in `backend`: **264 passed**. New `npm.cmd test` in `frontend`: **6 passed**, covering sheet structure, supplied combat results, pending/offline display, completion status, focus caps/grants and input immutability. The frontend tests render through the existing Vite/React tooling without adding dependencies.
- Compared **470 complete initial-render HTML outputs** against the committed pre-extraction App using identical current catalogues: all matched. These are initial render comparisons, not 470 browser interaction tests.
- `npm.cmd run build` in `frontend`: **passed**, including TypeScript checks. Main JS: 803.55 kB minified / 227.47 kB gzip; CSS: 36.01 kB / 7.40 kB gzip. Source separation does not split the bundle; the existing large-chunk warning remains.
- Browser smoke check at the isolated `http://127.0.0.1:4187/` origin (1280 x 720): saved full Invoker restoration, HP/AC, background growth, arts/Effort/spells, expanded combat details, rules-page round trip preserving the disclosure, and reload passed. Moving a growth grant from DEX to STR changed AC 16 to 15; restoring DEX restored the complete sheet output. No page-level horizontal overflow or captured console warnings/errors. Temporary choices were restored, and the temporary tab/servers were closed. No new mobile or cross-browser pass was performed.

## Previous Verification: 2026-10-04

- `npm.cmd test` in `backend`: **264 passed, 0 failed, 0 skipped** after shared-evaluation extraction (259 before it). The script discovers `src/**/*.test.ts` automatically. Added preview/API parity, adapter response, immutability, raw-input validation and progression-lookup tests.
- `npm.cmd run build` in `frontend`: **passed**, including TypeScript project checks. Main JS: 802.77 kB minified / 226.45 kB gzip; CSS: 36.01 kB / 7.40 kB gzip. The existing large-chunk warning remains.
- Compared **469 complete API responses** captured before extraction with the new implementation: all matched, including issues and stage status. Cases cover all ordered class pairs, every focus, growth, modifier caps, free-focus refunds, equipment, traditions and invalid submissions. Permanent regression tests compare the frontend preview and API for normalized cases and ensure inputs/catalogues are not mutated.
- Shared catalogue/response types and creation calculations now live under `shared/`; filesystem loading, editor normalization and raw API validation retain separate boundaries. The earlier unused-cache and legacy-focus-helper cleanup remains in place. Saved-draft migrations and the API response contract were preserved.
- Post-extraction browser smoke check at `http://127.0.0.1:4187/`: a saved full Invoker restored successfully with background DEX growth, HP/AC, Traditional Education arts, Effort and four first-level spells displayed. No captured console errors/warnings. The temporary tab and servers were closed. The broader desktop/mobile scenarios below are from the earlier verification, not a new exhaustive interaction pass.
- Fixed build-blocking class-name and paid/art-granted focus instance types. Updated stale tests for Korean restriction messages and the current non-combat tags, without reverting game data.
- Production-preview browser checks used an isolated origin at `http://127.0.0.1:4187/` with the live backend; existing saved characters on the normal development origin were not changed. Desktop 1440 x 900 and mobile 390 x 844 checks showed no page-level horizontal overflow or captured console errors/warnings.
- Browser scenarios passed: initial unarmored AC; growth-to-DEX/AC; Developed Attribute reaching +3; Impervious Defense with armor/shield; Halfmen Mental target 15 -> 17 and reversal on removal; Antimage's free, locked Nullifier with conditional saves and removal on class change; readable but disabled Spirit Familiar Level 2; Traditional Education partial/full Invoker arts and two/four first-level spells; cross-slot spell duplicate locks; saved-draft reload and rules-page round trips.
- Remaining validation limits: this was a representative Chromium desktop/mobile smoke pass, not exhaustive interaction coverage, a cross-browser/accessibility audit, a backend production build or independent rules-source verification.
