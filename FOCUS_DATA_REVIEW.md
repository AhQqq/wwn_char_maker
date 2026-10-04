# Focus Data Fidelity Review

Status: skill/modifier corrections, cap schema, and character-creation mechanics implemented through 2026-10-04. Play-time effects are notes rather than simulated actions.

This work uses the existing `effect` and `desc` text in `frontend/data/foci.json`. It is not an external rulebook verification or a complete semantic audit of all 153 entries. The prose itself may contain mistakes. Confirmed decisions: Alchemy is a normal skill; Warlike's "knowledge" means INT; Specialist instances require different skills; only one origin family is allowed, including linked upgrades that each cost a pick. The initial skill/modifier pass preceded this creation-mechanics follow-up.

## Reviewed Entries

| Focus ID | Applied or verified | Still deferred |
|----------|---------------------|----------------|
| `developed_attribute1` | Repeatable independent +1 modifier choices, maximum +3; repeated cap permissions do not stack. Excludes every mage-archetype class and Penal. Does not change the score. | External-source verification. |
| `orcs1` | Existing Survive grant, Stab/Punch choice, STR +1, CON +1, INT -1 already matched the local prose; preserved. | External-source verification. |
| `specialist1`, `specialist2` | Repeatable instances choose distinct skills, excluding Magic/Stab/Shoot/Punch. Level 2 belongs to one parent instance and inherits its skill without another allotment. Check dice appear as skill-specific notes. | Dice are resolved during play. Level 2's local wording says discard the lowest die from 4d6; verify against the intended source before changing it. |
| `automatons1` | Choose one modifier for -1, minimum -2. | Non-modifier special abilities are not automated by this pass. |
| `laborer1` | Exert; CHA/WIS/INT -1 each, minimum -2; STR/CON +1 each, maximum +3. Conditional -2 Mental saving-roll penalty and food/rest benefits are sheet notes. | Conditional penalty is not applied to every Mental save. |
| `warlike1` | Punch/Stab; choose STR/DEX/CON +1 (maximum +3) and two distinct INT/WIS/CHA -1 (minimum -2). Attack +1 is separate from class base attack; non-intimidation social -1 is a note. | Social rolls are resolved during play. |
| `focus_0291` (bison beastfolk) | Exert, STR modifier +1, DEX modifier -1. Encumbrance STR +4 and maximum System Strain +2 are separate sheet adjustments, not actual attribute changes. | Inventory, carrying totals, and current System Strain are not tracked. |
| `focus_0351` (rat beastfolk) | Notice; +1 choice restricted to DEX/WIS; -1 choice restricted to STR/CON. | Other unencoded abilities and external-source verification. |
| `usagi_beastfolk1` | Exert/Sneak, DEX +1, STR/CON -1; all save targets improve by 1. Movement and weekly automatic Luck-save benefits are notes. | Usage counters and temporary movement are not simulated. |
| `elves_civilized1` | Know and Magic; choose DEX/INT for +1; fixed CON -1. | Other unencoded abilities and external-source verification. |
| `elves_half_elves1` | Connect and an unrestricted skill choice. Optional elven-parent package applies DEX +1 / CON -1 together only after explicit opt-in. | Vision is a play note. |
| `xenoblooded1` | Requires one package. Heat, aquatic, radiation, or one of two gravity orientations; gravity applies both linked modifiers together. Non-numeric benefits are notes. | Aquatic's local "120-degree" wording is preserved, not silently converted to a distance; verify the intended source. |
| `mundane_alchemy1` | Normal Alchemy skill with one fixed allotment; recipe and laboratory benefits are sheet notes. | Recipe selection, crafting, and laboratory inventory remain manual. |
| `deepfolk1` | Explicit choice to raise one eligible physical score below 14 to 14, or decline. Effective scores recalculate derived values; original allocation is preserved. | Vision, resources, sunlight saves/System Strain/collapse are play notes. |
| `penal1` | Choose modifier -2 (minimum -3); retain at most one score above 13; two extra focus picks; all save targets improve by 2. Excludes Developed Attribute and other origin families. | External-source verification. |

## Automated Behavior

- `fixed_skill` grants the referenced skill without a replacement choice. `choice_skill` uses its count, allowed IDs, tags, and exclusions. Multiple slots in one bonus must use different IDs.
- Skills start at -1; one allotment gives level 0 and two give level 1. Direct third choices are rejected. A third fixed focus allotment grants 2 skill-specific advancement points without increasing the starting level. Other forced overflow still needs a rules decision.
- `attribute_modifier` and `choice_attribute_modifier` change modifiers, not scores. `value` supplies the contribution; `cap_override` independently supplies absolute permitted bounds for the same fixed or chosen attribute. A cap-only effect omits `value` without granting modifier points.
- Final modifiers default to -2/+2. Resolve all eligible cap exceptions, sum signed contributions with the score-derived base modifier, then clamp once. Focus/bonus order cannot change modifier totals. Overrides combine by the most permissive bound, not addition: two maximum +3 overrides still mean +3. Overrides on unchosen or invalid targets do not apply.
- Migrated all ten explicit bounds across Automatons, Laborer, Penal, Warlike, and Developed Attribute from `min_limit`/`max_limit` to `cap_override.min`/`.max`. Preserved values, bonus order, counts, and target lists, so saved choices retain their meaning. Explicit minimum -2 entries merely restate the default; they do not erase a valid minimum -3 exception from another source.
- Frontend and backend share the modifier evaluator. Selected-focus panels list raw contributions and separate cap overrides; the derived sheet reports actual net focus adjustments and resolved limits, and uses final modifiers for normal HP, AC, and saves. Missing both a value and override, invalid overrides, and legacy limit fields produce data errors instead of inferred effects.
- Requirements support `is_class`, `not_class`, `has_focus`, and `not_focus`. A class condition matches IDs or archetypes. Penal and Developed Attribute have symmetric exclusions; a forged draft containing both is invalid and neither grants bonuses.
- Only eligible selected foci within the total allowance grant bonuses. Removing a focus removes its choices and effects. Reload removes choices for deleted or converted-to-fixed bonus indices; now-invalid IDs remain unresolved for correction rather than being silently replaced.
- Stable instance IDs keep repeatable choices and upgrades independent. Legacy unique focus IDs migrate with their choices. One origin family is allowed; linked levels share that family but spend separate picks.
- Packages are atomic. Score effects are derived from the retained allocation before calculating modifiers. Penal's valid selection unlocks its extra allowance while its unresolved choices still block completion. Removal trims surplus newest-first and removes orphan upgrades.
- Positive save bonuses lower targets. Static attacks, save bonuses, encumbrance STR, and maximum System Strain have separate fields. Conditional benefits, restrictions, and crafting are readable notes, not simulated gameplay.
- Optional `manual_review` notes appear in focus details, selected-focus panels, and API bonus details. They describe missing automation, not additional grants. They do not block automated validation; a valid draft may still require manual adjudication of these listed mechanics.

## Remaining Work

1. Verify local descriptions against the intended sources and audit the remaining catalogue entries semantically.
2. Verify the flagged Specialist Level 2 and Xenoblooded aquatic wording against those sources; do not invent corrections from memory.
3. Other unencoded catalogue abilities still need the full semantic audit. This pass implements the creation mechanics identified in the reviewed entries, not every ability in all 153 foci.
4. Combat actions, conditional roll resolution, inventory/encumbrance totals, System Strain tracking, and crafting are intentionally manual in this level-1 creator. Add them only if the project expands into a play-time sheet/simulator.

## Verification

- [x] Correct the reviewed encoded skill/modifier discrepancies using local descriptions and confirmed user decisions.
- [x] Exercise every focus's encoded bonuses with legal choices.
- [x] Add regression coverage for restrictions, distinct choices, bounds, stale saved choices, deselection, derived values, and deferred-effect visibility.
- [x] Migrate cap metadata and verify default -2/+2 limits, absolute non-stacking overrides, order-independent totals, target changes, and cap-only effects.
- [ ] Verify all local prose against external sources.
- [ ] Complete a semantic audit of the full focus catalogue.
- [x] Implement and test repeatable instances, distinct Specialist skills, owned upgrades, one origin family, packages, score effects, Penal's allowance, static derived adjustments, and play-note visibility.
