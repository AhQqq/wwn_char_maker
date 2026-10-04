# Project Tasks

Open work for the level-1 character creator, checked against the implementation on 2026-10-04. Completed scaffolding and generic placeholders are omitted. Combat-time simulation, crafting, and ongoing inventory tracking remain outside the current scope.

## Creation Rules

- [ ] Implement Traditional Education (`traditional_education1`) beyond its existing Invoker-only restriction: tradition selection, spell-school access, starting arts, and Effort. First resolve the full/partial arts rule, duplicate arts, spell count, and Effort-pool interaction with the translator; see entry 102 in `FOCUS_SEMANTIC_AUDIT.md`.
- [ ] Review the preserved equipment discrepancies in `EQUIPMENT_DATA_REVIEW.md`, especially load footnotes, daily/weekly rations, package bundles, and armor values. Ordinary equipment AC, purchases, and equipped-state rules are implemented; carried capacity, storage/transport assignments, coin loads, and unencoded focus/art equipment exceptions remain outside that implementation.

## Ability Data

Class, exact-pair, and named focus ability grants resolve through `abilities.json` and appear together on the derived sheet. Full Warrior and full Expert grants are configured in `fullclass_abilities.json`; the three named focus abilities reference shared IDs. Masterful Expertise uses the translator's corrected description. Flaw of Fragility now overrides Warrior/Duelist hit dice from `1d6+2` to `1d6` before HP calculation, with a visible source explanation. Other ability effects remain reference text unless explicitly encoded; combat-time simulation is still out of scope.

## Review Follow-Up

Direct base attack adjustments and typed focus allowances are implemented. Their regression cases and affected legacy fixtures passed as part of the full 206-test backend run on 2026-10-04.

The equipment page is imported with linked properties and a data-only source snapshot. Starting packages or rolled funds, budgeted shopping, saved purchases/loadouts, owned armor/shield/weapon choices, equipment AC, and armor check penalties are implemented. On 2026-10-04, all 206 backend tests passed and the frontend production build (including TypeScript checks) succeeded. Equipment browser checks passed against the production preview with the live backend at desktop and 390px mobile widths; see the verification section in `EQUIPMENT_DATA_REVIEW.md`. The build retains a non-blocking main-bundle size warning (710.74 kB minified, 198.32 kB gzip).

The full-catalogue semantic audit is already drafted in `FOCUS_SEMANTIC_AUDIT.md`. Its wording proposals, unresolved rulings, and creation-time implementation gaps still need translator review; the audit itself does not need to be repeated. `FOCUS_DATA_REVIEW.md` records earlier implementation passes, not complete catalogue verification.
