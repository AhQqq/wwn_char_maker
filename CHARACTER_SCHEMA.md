Character

name
background
class
hit point

attributes
  STR
    modifer
  DEX
    modifier
  CON
    modifier
  INT
    modifier
  WIS
    modifier
  CHA
    modifier

skills
  administer
    rank
  alchemy
    rank
  connect
    rank
  convince
    rank
  craft
    rank
  exert
    rank
  heal
    rank
  know
    rank
  lead
    rank
  magic
    rank
  notice
    rank
  perform
    rank
  pray
    rank
  punch
    rank
  ride
    rank
  sail
    rank
  shoot
    rank
  sneak
    rank
  stab
    rank
  survive
    rank
  trade
    rank
  work
    rank

focus

derived
  physical save
  evasion save
  mental save
  luck save
  ac
  base attack bonus

## Starting Equipment Catalogue

Equipment data follows the existing array-of-objects, stable `id` and Korean `name` convention. Frontend and API share `shared/startingEquipment.ts` for initial grants and `shared/equipment.ts` for purchases, ownership, loadout, and AC. Initial source: [equipment page](https://ahqqq.github.io/equipment.html), retrieved 2026-10-04. Active names and property wording incorporate the author's requested equipment translation comparison against the registered `Main.tex`; see `EQUIPMENT_DATA_REVIEW.md`. This did not change the schema or numerical rules.

`frontend/data/equipment.json` contains the shared catalogue. Each entry has:

- `id`: unique snake_case reference, not a verified English translation.
- `name`: the source's Korean item name, with a simple item quantity stored separately in the package grant.
- `type`: `item` for one named item or supply unit; `bundle` for a source row containing multiple different items. Bundles retain their complete source names and are not expanded into additional grants.
- `category`: `gear`, `bundle`, `weapon`, `armor`, or `shield`, for browsing.
- `availability`: `purchase`, `grant_only`, or `inherent`. Unarmored/unarmed entries are inherent, not inventory purchases. Missing prices are not zero-price goods.
- `price`: `{ amount, currency: "silver" | "copper" }` or `null`. Amount is per named catalogue unit, not per encumbrance group. One arrow unit contains 20 arrows; throwing knives are bought individually.
- `encumbrance`: `{ value: number | null, raw: string }`. Numeric load and original symbols are separate; raw dashes/footnotes are retained. Unlike package rows, catalogue load applies to one listed unit/group.
- `propertyIds`: references into `equipment_properties.json`. That file stores `id`, Korean `name`, `category` (`weapon`, `encumbrance`, `shield`), and full `description`. Includes all 12 weapon properties, three load footnotes, and shield protection.
- `weapon` when applicable: `damage` dice string, nullable `shock: { damage, maxAc }`, `attributes` IDs, and nullable `range: { normal, maximum, unit: "ft" }`. Values are base/reference statistics.
- `armor` when applicable: `baseAc`, armor `category` (`none`, `light`, `medium`, `heavy`), and `skillPenalties: { sneak, exert }`. These modify checks, not learned skill levels.
- `shield` when applicable: `baseAc` and `armorBonus`. Shield entries also have weapon profiles under the same ID.
- `sources`: original `table`, `name`, `price`, and `encumbrance` cells for each source row. These are historical webpage/package cells, not the current translation; preserve them when an active `name` changes. Source names preserve alternate package/general labels without changing existing IDs.

`frontend/data/starting_equipment.json` contains six packages. Each has `id`, `name`, `englishName`, `items`, and `currency: { silver: number }`. Names come from the supplied list. Package names do not impose class or background restrictions. Each item grant has this shape:

```json
{ "id": "dagger", "count": 2, "encumbrance": 2 }
```

- `id` references exactly one entry in `equipment.json`.
- `count` is a positive integer number of catalogue units granted. One week's rations is one supply unit; one bundle includes all of its named contents. Five throwing knives use `count: 5`; two daggers use `count: 2`.
- `encumbrance` is the source's load for the **entire row**, already including its quantity. Do not multiply it by `count` again: five throwing knives have listed encumbrance 1, and two daggers have listed encumbrance 2. This package-context value is not an invented per-item inventory weight.
- Numeric 0 is preserved. `null` preserves the source's `-`, meaning no numeric encumbrance was supplied, not zero. Do not treat a partial sum with a `null` entry as a complete load total.
- `currency.silver` records the listed coins separately from items: 20 for Gentry Wayfarer, 20 for Ranger or Archer, and 80 for Mage, Healer, or Scholar. Other packages list no coins and use 0. No currency encumbrance rule is inferred.

The original package table is retained in `frontend/data/old/starting_equipment.txt`; the webpage's raw table cells and properties are archived in `frontend/data/old/equipment_source.json`. Preserve the page's discrepancies, documented in `EQUIPMENT_DATA_REVIEW.md`. Do not infer missing bundle prices, component loads, or transport capacity. Step 10's alternative `3d6 * 10` silver roll remains a separate creation rule, not additional package currency.

### Starting Equipment Choice and Evaluation

The draft saves only the selected method and its input:

```json
{ "startingEquipment": { "method": "package", "packageId": "armored_warrior" } }
```

Alternatively, the silver method saves its three dice, not the calculated money:

```json
{ "startingEquipment": { "method": "silver", "rolls": [2, 4, 6] } }
```

`{ "method": "" }` represents no choice yet. A package with an empty ID or silver with an empty roll array is unfinished. Other malformed shapes, non-d6 values, wrong dice counts, extra fields, and mixed-method inputs are rejected. Switching method clears the inactive input; rerolling replaces all three dice. Valid rolls survive reload without rolling again. Unknown saved package IDs remain unresolved for correction; malformed saved choices are cleared with a notice. Legacy `armor` is discarded during restoration and ignored by the API, never mapped to equipment.

The API returns `equipmentSelection` with `choice`, `package` (ID and names, or `null`), `items` (`id`, `name`, `type`, `count`, `encumbrance`), `silver`, `encumbrance`, `complete`, and `issues`. All grants come from catalogues or the validated roll. Failed selections return no items and `silver: null`, distinguishing unfinished choices from a valid package granting zero coins. The silver method returns no items and `package: null`. Equipment issues enter the overall API issues and prevent the `equipment` checkpoint from completing.

`encumbrance` contains `listed` (sum of numeric row loads), `unlisted` (IDs of rows without numeric loads), and `complete` (whether every granted item row has a numeric load). This completeness describes the listed item rows only, not carried-load or coin-encumbrance rules. An invalid selection has no complete load summary. Package rows already include their counts and are never expanded or multiplied a second time.

### Purchases, Loadout, and AC

Separate draft fields store shopping and equipped choices:

```json
{
  "equipmentPurchases": [{ "id": "dagger", "count": 2 }],
  "equipmentLoadout": { "armorId": "", "shieldId": "", "weaponId": "dagger" }
}
```

Missing fields default to no purchases and an empty loadout, preserving old starting choices without auto-equipping their items. Purchase rows accept only `id` and a positive safe-integer `count`; duplicate IDs and cached prices/totals are rejected. Loadouts accept only three string fields. Empty armor/weapon slots use inherent `unarmored`/`unarmed_attack`; an empty shield slot means none. Malformed saved structures clear with a notice, while unresolved IDs remain visible for correction.

The API adds `equipmentInventory`: `starting` (the unchanged `equipmentSelection`), validated-shape `purchases` and `loadout`, owned `items`, `spentCopper`, `remainingCopper`, `encumbrance`, `complete`, `issues`, and `armorClass`. Costs are recomputed using the confirmed 10 copper per silver. Unpriced/unknown goods or an over-budget cart grant no purchased items; verified package items remain visible and coin totals are `null`. Catalogue and package grants are never accepted from the client.

Owned rows retain `id/name/type/count/encumbrance`, adding `packageCount` and `purchasedCount`. Counts merge by item ID. Existing package loads remain unchanged; purchase-lot loads are added using the catalogue's numeric load and explicit groups of three (`bundle_of_three`) or five (`numerous`). These groups affect load, not prices or granted quantities. Missing loads stay `null`. Inventory `encumbrance` returns `listed`, `complete`, and `reviewIds`; ambiguous footnotes prevent a complete numeric summary. This is not a carried-capacity calculation.

Changing starting package/method or rerolling clears purchases and loadout. Removing/decreasing a purchase refunds its catalogue cost and prunes now-unowned equipped IDs in the UI. API requests with stale/unowned equipment are rejected instead of silently repaired. Package quantities and coins cannot be edited or sold. Two-handed active weapons conflict with held shields; a shield attack must use the held shield.

`armorClass` returns `value`, `complete`, `base`, `shieldBonus`, `dexterity`, resolved `armor/shield/weapon` definitions, `skillPenalties`, and `issues`. With valid equipment choices, `value = base + shieldBonus + dexterity`: base is armor AC (10 unarmored), replaced by shield AC if higher; shield bonus applies only when armor base equals or exceeds shield base. DEX is the final focus-adjusted modifier. Invalid starting funds, purchases, or loadout leave `value` and `derived.ac` null.

The `equipment` checkpoint tracks starting method and purchase validity; `armorClass` tracks valid equipped state. Equipment issues enter overall validation. Unencoded focus/art armor exceptions and combat-time property effects remain manual; neither checkpoint certifies those rules, carried capacity, or coin loads.

## Skill Evaluation Fields

The evaluation API returns `skillStates`, keyed by skill ID. Each entry contains:

- `id`: the skill ID from `frontend/data/skills.json`.
- `level`: -1 when untrained, 0 after one allotment, and at most 1 during creation.
- `allotments`: the number of accepted or forced allotments, excluding invalid direct choices.
- `advancementPoints`: 2 when a third fixed focus allotment overflows into advancement; otherwise 0.

`skillGrantCounts` mirrors each skill's allotment count. `skillIssues` contains source-specific validation messages with `key`, `scope`, and `message`. Undefined forced overflow is included in the allotment count but requires manual review and cannot increase the starting level.

These values are derived from the draft's source selections, not independently editable or trusted from saved/client-supplied totals. The existing conceptual skill `rank` corresponds to the evaluated `level` field.

## Class Bonus Choices

The draft's `classBonusChoices` stores voluntary class skill picks, keyed by class ID and zero-based `bonus` index. Each bonus contains an array of skill IDs in choice order:

```json
{
  "classBonusChoices": {
    "wise": { "0": ["know"] }
  }
}
```

Only `choice_skill` entries and their configured `count` create choices. Fixed skills are reconstructed from `classes.json`, never accepted from this field. Class bonuses apply once per distinct class ID. Unselected classes, non-choice bonus indices, and excess array entries cannot grant skills.

Missing or malformed choices are unfinished; unknown skill IDs and choices above the two-allotment cap are invalid. The API reports them in `skillIssues` with scope `class` and key `class:<classId>:<bonusIndex>:<choiceIndex>`, and marks the class checkpoint incomplete. Fixed class grants precede voluntary class choices; foci and the free skill follow them.

Restoration and class changes retain choices for selected classes only, preserving invalid skill values for correction. Missing fields in older drafts do not automatically select a skill. Accepted choices appear in the usual `skillStates` and `skillGrantCounts` fields.

## Ability Evaluation

The API returns `abilitySelection: { abilities, issues, complete }`, combining validated class grants and eligible focus grants against `abilities.json`. The existing `classAbilities` field retains its class-only subset for compatibility. No new draft field or player selection is required, and client-supplied ability lists are ignored.

Each granted ability includes `id`, `name`, `englishName`, `desc`, `src`, optional `manual_review` notes, and a `sources` array. Class sources have `{ type: "class", classIds: [id] }`; exact-pair sources have `{ type: "combination", classIds: [id, id] }` (two distinct IDs for a mixed pair); focus sources have `{ type: "focus", focusId, instanceId }`. Abilities appear once per ID even if multiple sources grant them, retaining each distinct source.

Classes reference abilities through `fixed_ability` bonuses and `fullclass_abilities.json` grants. Foci reference them through optional `ability_ids: ["accipiter_flight"]` arrays, separate from `bonus` to preserve saved bonus-choice indices. Only the focus evaluator's `applied` instances supply grants; raw selections and cached ability totals are never authoritative. Invalid class pairs grant nothing. The old embedded special-ability fields are no longer used.

Missing/ambiguous references and malformed grant metadata produce issues. Ability issues also enter the API's overall `issues` and prevent the class checkpoint from completing. `abilitySelection.complete` describes ability resolution, not completion of every focus skill/modifier choice; the existing focus and skill validation still controls those choices. Review notes concern unresolved text or unautomated effects and do not make an otherwise valid grant incomplete. Ability descriptions do not themselves modify derived stats or implement play-time actions.

### Hit-Dice Effect Evaluation

Ability definitions may carry `effects: [{ type: "override_hit_dice", when: { class_pair: ["warrior", "duelist"] }, value: "1d6" }]`. These are catalogue metadata, never accepted from a draft. The shared effect evaluator receives only resolved grants and requires an exact legal class pair, independent of slot order.

The API returns `hitDiceEvaluation: { baseHitDice, hitDice, adjustments, issues, complete }`. Each adjustment has `abilityId`, `name`, `englishName`, `from`, and `to`. `derived.baseHitDice` preserves progression data; `derived.hitDice` and `derived.hitDie` reflect the effective result, and `derived.hitDiceAdjustments` supplies the sheet explanation. `derived.hitPoints` uses the maximum effective expression plus the final CON modifier, minimum 1.

Malformed or conflicting applicable effects produce overall validation issues and prevent the class/combat checkpoints from completing. No override is applied in that case; the base value is retained as an invalid-draft preview. Agreeing effects do not stack. Changes and reloads recalculate from progression rather than trusting cached hit dice, HP, or adjustment lists. Grant resolution (`abilitySelection.complete`) and effect validation (`hitDiceEvaluation.complete`) are separate checks.

## Focus Instances and Rule Choices

Modern drafts store `focusInstances`, an ordered array of `{ instanceId, focusId, parentInstanceId? }`. `focusId` references the catalogue; `instanceId` is stable and unique within the draft. Only definitions marked `repeatable` may appear more than once. Upgrades reference one parent instance and still spend a pick. Specialist's `unique_skill` requires different skills across its Level 1 instances; Level 2 inherits its parent's skill.

Legacy `focus: string[]` migrates to one instance per unique catalogue ID, using that ID as `instanceId` so old choices survive. Legacy Level 2 requirements infer the parent. If `focusInstances` is present, it is authoritative, including an empty list; malformed modern input never falls back to legacy selections. The frontend saves the modern form. One origin family, including explicitly linked upgrades, is permitted.

`focusRuleChoices` maps instance IDs to `{ packageId?, attributeId?, retainedAttribute? }`. `packageId` selects a Half-Elves or Xenoblooded package; empty means no optional package, but is invalid when required. `attributeId` selects Deepfolk's physical score or the literal `none` to decline. `retainedAttribute` selects Penal's one score above 13 when several are above that threshold. Stale choices for removed instances never contribute effects.

Catalogue metadata separates these mechanics from ordinary bonuses:

- `packages: { required, options: [{ id, name, description, bonus }] }` selects one atomic package. Current packages append fixed modifier bonuses and a description note.
- `score_effect` is `{ kind: "raise_to", value, tags, optional }` or `{ kind: "cap_except_one", value }`.
- `extra_focus_picks` adds an integer allowance to the progression total; an eligible Penal adds 2 while still costing 1 pick itself.
- `derived_bonus` contains optional integer `attack`, `saves: { physical?, evasion?, mental?, luck? }`, `encumbrance_str`, and `system_strain_max`. Positive saves improve rolls by lowering targets.
- `sheet_notes` describes play-time effects. `{skill}` is replaced by the selected instance's skill, inherited from its parent for upgrades.

The API returns `focusSelection` with `instances`, `baseLimit`, `extraPicks`, `limit`, `complete`, and `issues`. Skill-allocation issues are also required for the class checkpoint. Removing a parent cascades to its upgrades; reducing allowance removes surplus newest-first and any resulting orphan upgrades.

The API's `allocatedAttributes` contains allocation scores before focus score effects, and `attributes` contains effective scores. `focusScoreChanges` is an array of `{ instanceId, id, before, after }`; `focusRuleNotes` is an array of `{ instanceId, text }`. Recompute effective scores from the allocation every time; never write Deepfolk/Penal results back into the draft's allocation.

`derived.baseAttackBonus` remains the class base; `focusAttackBonus` and `attackBonus` expose the focus adjustment and combined attack bonus. `saveBonuses` exposes unconditional adjustments already applied to save targets. `encumbranceStrengthBonus` and `systemStrainMaxBonus` are adjustments only, not inventory totals or current System Strain.

## Focus Bonus Fields

The draft's `focusBonusChoices` maps an **instance ID** to zero-based bonus indices containing arrays of selected IDs. For example, a migrated Warlike's choices are `{ "warlike1": { "2": ["STR"], "3": ["INT", "WIS"] } }`; a newly selected instance uses its UUID instead. Fixed grants are reconstructed from the catalogue, not stored here. Reload drops unselected instances and indices that no longer represent choices; invalid choice IDs remain available for correction. API validation rejects malformed and excess submitted choices rather than silently normalizing them into validity.

`foci.json` separates modifier contributions (`value`) from absolute cap permissions (`cap_override`). For example:

```json
{
  "action": "choice_attribute_modifier",
  "count": 1,
  "value": 1,
  "cap_override": { "max": 3 }
}
```

This is one attribute choice: it grants a +1 contribution and permits a maximum of +3 on that same attribute. A fixed `attribute_modifier` uses `id` instead. Omitting `value` with a valid override represents a cap-only effect; omitting both is invalid. `cap_override` must contain integer `min <= -2` and/or `max >= 2`, with no unknown fields. The old `min_limit` and `max_limit` fields are no longer supported. Bonus indices and saved choices are unchanged by this migration.

Default final modifier bounds are -2/+2. Resolve the most permissive eligible override for each bound and attribute; repeated +3 overrides remain +3. Only resolved, allowed attribute targets can supply a contribution or override. Sum contributions, add the score-derived base modifier, then clamp once. Focus and bonus ordering does not affect modifier totals, and scores remain unchanged. Removing or retargeting a source recomputes its contribution and cap permission. Class exclusions use `not_class`; focus exclusions use `not_focus`. Both are checked alongside positive requirements by the shared eligibility evaluator.

The API returns `baseModifiers`, raw `focusModifierContributions`, resolved `modifierCaps` (`{ min, max }` per attribute), actual net `focusModifierBonuses` after clamping, and final `modifiers`. Final modifiers equal base modifiers plus net focus bonuses, not necessarily base plus raw contributions. All values are derived from definitions and validated choices; cached client caps and totals are not authoritative.

`focusBonuses` contains one detail per eligible applied focus, with `focusId`, `skills`, raw `modifierChanges` before character caps, `capOverrides` (`{ id, min?, max? }` entries), required `choices`, validation `issues`, and `manualReview` notes. Per-focus raw contributions are deliberately not attributed individual capped deltas, since that attribution would depend on ordering. Each choice includes its `bonusIndex`, `slotIndex`, `kind`, encoded `value` (0 for a cap-only effect), legal `options`, validated `selected` ID, and human-readable override `limits`.

In `focusBonuses`, the legacy field name `focusId` now identifies the selected **instance**, not the catalogue definition. Use `focusSelection.instances` to resolve its catalogue ID. Per-instance skill issue keys likewise use `focus:<instanceId>:<bonusIndex>:<slotIndex>`. `baseModifiers` derives from effective scores after score effects; modifier bonuses themselves still do not change scores.

`manualReview` comes from the optional `manual_review` array in the focus definition. These notes make deferred mechanics explicit, without granting them or making an otherwise valid automated result invalid. They are distinct from resolved play notes, unresolved choices, and data errors in `issues`.

## Spell Selection Fields

The builder creates level-1 characters only; the evaluation API returns `characterLevel: 1`.

The draft's `spellChoicesByClassSlot` field is a two-element array: `[slotASpellIds, slotBSpellIds]`. Each spellcasting slot (`high`, `elem`, `necro`, or `invoker`) requires exactly two distinct first-level spell IDs from its allowed schools. Non-spellcasting slots contain empty arrays. The same spell cannot appear twice, including across slots. In-progress drafts may contain fewer than two picks.

The API returns `spellSelection` with `complete`, `issues`, `required` (the total allowance), `selected` (validated per-slot IDs), and `slots`. Each slot entry contains its numeric `slot` (0 or 1), `required` count, validated `selected` IDs, and `complete` status. The spell checkpoint is the final creation checkpoint, step 15, after class arts in step 14.

The old flat `spellChoices` field is only a frontend migration input for saved drafts. It is removed when the draft is restored and replaced by `spellChoicesByClassSlot`; nonempty flat spell lists are not valid API selections.

## Class Build Name

The API's `fullClass` contains the derived display name for the two `classChoices`. After class validation, identical IDs use `classes.json`'s `name`; different IDs use an unordered pair match in `combinations.json`'s `groups`, or its `default_name` when no pair matches. Invalid or incomplete selections return `Unfinished (invalid class selection)`.

`combinations.json` contains `{ "default_name": "...", "groups": [{ "name": "...", "pairs": [["elem", "high"]] }] }`. Each unordered pair appears at most once. Names have no effect on progression, eligibility, skills, arts, or spells. Do not store the name in the draft; the frontend derives the same value for the Class build section on the live sheet.

## Class Eligibility and Arts Fields

Every class definition includes the boolean `can_be_full_class`. A duplicate class ID in `classChoices` is legal only when this flag is true; otherwise that class can appear in only one of the two slots. Both frontend and backend use this flag.

Optional `incompatible_classes` and `incompatible_archetypes` arrays exclude partner class IDs or archetypes. Missing or empty arrays impose no exclusions. Validate both classes' arrays, so reversing slot order cannot bypass a restriction. Saved incompatible pairs remain flagged for correction instead of silently changing either class. They cannot pass the class checkpoint or overall API validation.

The draft stores only player choices in `artChoicesByClass`, keyed by distinct class ID:

```json
{
  "artChoicesByClass": {
    "accursed": {
      "groups": { "index:0": ["accursed_blade"] },
      "chosen": ["bewitching_distraction"]
    }
  }
}
```

`groups` maps a restricted group's optional ID (`id:<id>`) or zero-based fallback (`index:<position>`) to selected art IDs. `chosen` holds additional picks. Omitted choices mean unfinished selections. Fixed arts are not saved as choices; they are reconstructed from the level-1 rule in `starting_arts.json`.

The API returns `artSelection` with `complete`, `issues`, `selected` (validated draft choices), `required` (total arts including fixed grants), and `classes`. Each class result contains `classId`, `mode` (`partial` or `full`), `fixed`, `choices`, `learned` (fixed plus selected IDs), `required`, `complete`, and `issues`. Art references are scoped to their class catalogue, not globally unique IDs.

Restoring drafts or changing classes discards illegal, stale, or excess arts while preserving eligible choices for the same class. Class slot order does not change art ownership. The API rejects invalid selections rather than silently accepting a cleaned version as complete.
