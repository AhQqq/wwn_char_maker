import { applyBackgroundAttributeGrants, evaluateBackground } from './background.js';
import type { BackgroundDraft } from './background.js';
import type { AttributeDraft, AttributeScores } from './attributes.js';
import type { CharacterData, ClassData, ProgressionTable } from './characterData.js';
import { evaluateFocusCreation } from './focusCreation.js';
import { resolveArtFocusGrants } from './artFocusGrants.js';
import { evaluateCreationSkills } from './skillAllocation.js';
import { calculateSavingThrows } from './savingThrows.js';
import { evaluateClassAbilities } from './classAbilities.js';
import { resolveFocusAbilities } from './focusAbilities.js';
import { mergeAbilityEvaluations } from './abilities.js';
import { evaluateEquipmentInventory } from './equipment.js';
import { evaluateHitDiceEffects, firstLevelHitPoints, parseHitDice } from './abilityEffects.js';
import { evaluateFocusEffort } from './focusTraditions.js';
import type { evaluateClassChoices } from './classSelection.js';

// Submitted choices remain untrusted. Normalization for editing is a caller concern.
export type CharacterInput = BackgroundDraft & AttributeDraft & {
  name?: string;
  goal?: string;
  background?: string;
  classChoices?: unknown;
  classBonusChoices?: unknown;
  focus?: string[];
  focusInstances?: unknown;
  focusRuleChoices?: unknown;
  focusBonusChoices?: unknown;
  freeSkill?: string;
  selectedSkills?: string[];
  spellChoicesByClassSlot?: unknown;
  spellChoices?: unknown;
  artChoicesByClass?: unknown;
  startingEquipment?: unknown;
  equipmentPurchases?: unknown;
  equipmentLoadout?: unknown;
  armor?: unknown;
  notes?: string;
};

export function progressionForClasses(classes: Array<{ archetype: string }>, tables: ProgressionTable[]) {
  const byId = new Map(tables.filter((table) => table.id !== 'am+e').map((table) => [table.id, table]));
  const shorthand = classes.map((option) => option.archetype[0]).sort().join('+');
  const reverse = shorthand.split('+').reverse().join('+');
  const key = byId.has(shorthand) ? shorthand : byId.has(reverse) ? reverse : '';
  return { key, progression: byId.get(key) };
}

export function evaluateCreationCore(draft: CharacterInput, data: CharacterData,
  context: { attributes: AttributeScores; classes: ClassData[] }) {
  const { SKILLS, ATTRIBUTES, CLASSES, BACKGROUNDS, FOCI, STARTING_ARTS, ARTS, PROGRESSION_TABLES } = data;
  const { key: progressionKey, progression } = progressionForClasses(context.classes, PROGRESSION_TABLES);
  const backgroundEvaluation = evaluateBackground(draft, BACKGROUNDS, SKILLS, ATTRIBUTES);
  const backgroundAttributes = applyBackgroundAttributeGrants(context.attributes, backgroundEvaluation.attributeGrants);
  // Art grants refund paid duplicates before allowances and focus effects are evaluated.
  const artFocusGrants = resolveArtFocusGrants(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS, FOCI);
  const focusCreation = evaluateFocusCreation({ instances: draft.focusInstances, legacyIds: draft.focus, grants: artFocusGrants.grants,
    bonusChoices: draft.focusBonusChoices, ruleChoices: draft.focusRuleChoices, foci: FOCI, classes: context.classes,
    baseLimit: progression?.focus ?? [], skills: SKILLS, attributes: ATTRIBUTES, scores: backgroundAttributes.attributes });
  const skillAllocation = evaluateCreationSkills(backgroundEvaluation.skillGrants, context.classes,
    focusCreation.bonuses.skillGrants, draft.freeSkill ?? '', SKILLS.map((skill) => skill.id), draft.classBonusChoices);
  return { progressionKey, progression, backgroundEvaluation, backgroundAttributes, artFocusGrants, focusCreation, skillAllocation };
}

export type CreationCore = ReturnType<typeof evaluateCreationCore>;

export function evaluateCreationEffects(draft: CharacterInput, data: CharacterData, core: CreationCore,
  classEvaluation: ReturnType<typeof evaluateClassChoices>) {
  const { CLASSES, FOCI, ABILITIES, CLASS_ABILITY_RULES, STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES } = data;
  const { focusCreation, skillAllocation, progression } = core;
  const classAbilities = evaluateClassAbilities(draft.classChoices, CLASSES, ABILITIES, CLASS_ABILITY_RULES);
  // An invalid pair must not activate class-dependent focus abilities, AC or traditions.
  const focusAbilities = resolveFocusAbilities(classEvaluation.complete ? focusCreation.applied : [], FOCI, ABILITIES);
  const abilitySelection = mergeAbilityEvaluations(classAbilities, focusAbilities);
  const baseModifiers = focusCreation.baseModifiers as AttributeScores;
  const modifiers = { ...baseModifiers };
  for (const key of Object.keys(modifiers) as Array<keyof typeof modifiers>) {
    modifiers[key] += focusCreation.bonuses.modifierBonuses[key] ?? 0;
  }
  const savingThrows = calculateSavingThrows(modifiers, focusCreation.saveEffects);
  const equipmentInventory = evaluateEquipmentInventory({ startingEquipment: draft.startingEquipment,
    purchases: draft.equipmentPurchases, loadout: draft.equipmentLoadout, dexterity: modifiers.DEX },
    STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES, classEvaluation.complete ? focusCreation.baseAc : undefined);
  const hitDiceEvaluation = evaluateHitDiceEffects(progression?.hd ?? '', draft.classChoices, CLASSES, abilitySelection.abilities);
  const hitDice = hitDiceEvaluation.hitDice;
  const hitDie = parseHitDice(hitDice)?.sides ?? 0;
  const hitPoints = firstLevelHitPoints(hitDice, modifiers.CON);
  const progressionAttackBonus = Number((progression?.ab ?? '').replace('+', '')) || 0;
  const baseAttackBonus = progressionAttackBonus + focusCreation.derived.baseAttackBonusAdjustment;
  const focusTraditions = classEvaluation.complete ? focusCreation.traditions : [];
  const focusEffort = evaluateFocusEffort(focusTraditions, skillAllocation.states);
  return { classAbilities, focusAbilities, abilitySelection, baseModifiers, modifiers, savingThrows, equipmentInventory,
    hitDiceEvaluation, hitDice, hitDie, hitPoints, progressionAttackBonus, baseAttackBonus, focusTraditions, focusEffort };
}
