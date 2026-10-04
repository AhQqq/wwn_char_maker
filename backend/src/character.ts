import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createDataReader } from './dataReader.js';
import { applyBackgroundAttributeGrants, evaluateBackground } from "./background.js";
import type { BackgroundData, BackgroundDraft } from "./background.js";
import { evaluateAttributes } from "./attributes.js";
import type { AttributeDraft } from "./attributes.js";
import { evaluateFocusCreation } from '../../shared/focusCreation.js';
import { resolveArtFocusGrants } from '../../shared/artFocusGrants.js';
import { calculateSavingThrows } from '../../shared/savingThrows.js';
import { evaluateFocusEffort } from '../../shared/focusTraditions.js';
import type { FocusAllowance } from '../../shared/focusAllowances.js';
import type { FocusData } from "./focusBonuses.js";
import { evaluateCreationSkills } from '../../shared/skillAllocation.js';
import { evaluateSpellChoices } from '../../shared/spellSelection.js';
import type { SpellOption } from '../../shared/spellSelection.js';
import { evaluateClassChoices } from '../../shared/classSelection.js';
import type { SelectableClass } from '../../shared/classSelection.js';
import { classBuildName } from '../../shared/classBuild.js';
import type { ClassCombinations } from '../../shared/classBuild.js';
import { evaluateArtChoices } from '../../shared/artSelection.js';
import type { ArtOption, StartingArts } from '../../shared/artSelection.js';
import { evaluateClassAbilities } from '../../shared/classAbilities.js';
import type { AbilityDefinition, ClassAbilityRules } from '../../shared/classAbilities.js';
import { mergeAbilityEvaluations } from '../../shared/abilities.js';
import { resolveFocusAbilities } from '../../shared/focusAbilities.js';
import { evaluateHitDiceEffects, firstLevelHitPoints, parseHitDice } from '../../shared/abilityEffects.js';
import { evaluateEquipmentInventory } from '../../shared/equipment.js';
import type { EquipmentDefinition, EquipmentPackage, EquipmentProperty } from '../../shared/startingEquipment.js';

type Archetype = "warrior" | "expert" | "mage";

type SkillData = {
  id: string;
  name: string;
  tags: string[];
};

type ClassData = SelectableClass & {
  arts: boolean;
  name: string;
  archetype: Archetype;
  spells: boolean;
  bonus: Array<{ action: string; id?: string; count?: number }>;
};

type ProgressionTable = {
  id: string;
  hd: string;
  ab: string;
  focus: FocusAllowance[];
};

type CharacterDraft = BackgroundDraft & AttributeDraft & {
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

function resolveDataDir() {
  const fromBackend = join(process.cwd(), "..", "frontend", "data");
  if (existsSync(fromBackend)) return fromBackend;

  const fromRepoRoot = join(process.cwd(), "frontend", "data");
  if (existsSync(fromRepoRoot)) return fromRepoRoot;

  throw new Error("Could not locate frontend/data directory.");
}

const DATA_DIR = resolveDataDir();
const readData = createDataReader();

function readCharacterData() {
  const SKILLS = readData<SkillData[]>(DATA_DIR, "skills.json");
  const ATTRIBUTES = readData<Array<{ id: string; tags: string[] }>>(DATA_DIR, "attributes.json");
  const CLASSES = readData<ClassData[]>(DATA_DIR, "classes.json");
  const COMBINATIONS = readData<ClassCombinations>(DATA_DIR, 'combinations.json');
  const ABILITIES = readData<AbilityDefinition[]>(DATA_DIR, 'abilities.json');
  const CLASS_ABILITY_RULES = readData<ClassAbilityRules>(DATA_DIR, 'fullclass_abilities.json');
  const BACKGROUNDS = readData<BackgroundData[]>(DATA_DIR, "backgrounds.json");
  const FOCI = readData<FocusData[]>(DATA_DIR, "foci.json");
  const SPELLS = readData<SpellOption[]>(DATA_DIR, "spells.json");
  const EQUIPMENT = readData<EquipmentDefinition[]>(DATA_DIR, 'equipment.json');
  const EQUIPMENT_PROPERTIES = readData<EquipmentProperty[]>(DATA_DIR, 'equipment_properties.json');
  const STARTING_EQUIPMENT = readData<EquipmentPackage[]>(DATA_DIR, 'starting_equipment.json');
  const STARTING_ARTS = readData<StartingArts>(DATA_DIR, 'starting_arts.json');
  const ART_DIR = join(DATA_DIR, 'arts');
  const ARTS = existsSync(ART_DIR) ? readdirSync(ART_DIR).filter((file) => file.endsWith('_arts.json'))
    .flatMap((file) => readData<ArtOption[]>(ART_DIR, file)) : [];
  const PROGRESSION_TABLES = readData<ProgressionTable[]>(DATA_DIR, "progression_tables.json");

  return { SKILLS, ATTRIBUTES, CLASSES, COMBINATIONS, ABILITIES, CLASS_ABILITY_RULES, BACKGROUNDS,
    FOCI, SPELLS, EQUIPMENT, EQUIPMENT_PROPERTIES, STARTING_EQUIPMENT, STARTING_ARTS, ARTS, PROGRESSION_TABLES };
}

export function getDataCounts() {
  const { SKILLS, CLASSES, ABILITIES, BACKGROUNDS, FOCI, SPELLS, EQUIPMENT, EQUIPMENT_PROPERTIES,
    STARTING_EQUIPMENT, ARTS, PROGRESSION_TABLES } = readCharacterData();
  return {
    backgrounds: BACKGROUNDS.length, classes: CLASSES.length, foci: FOCI.length,
    skills: SKILLS.length, spells: SPELLS.length, progressions: PROGRESSION_TABLES.length,
    arts: ARTS.length, abilities: ABILITIES.length,
    equipment: EQUIPMENT.length, equipmentProperties: EQUIPMENT_PROPERTIES.length, startingEquipment: STARTING_EQUIPMENT.length,
  };
}

function progressionKeyForClasses(classChoices: ClassData[], progressionById: Map<string, ProgressionTable>): string {
  const shorthand = classChoices
    .map((classOption) => classOption.archetype[0])
    .sort()
    .join("+");
  const reverseShorthand = shorthand.split("+").reverse().join("+");
  if (progressionById.has(shorthand)) return shorthand;
  if (progressionById.has(reverseShorthand)) return reverseShorthand;
  return "";
}

function parseAttackBonus(attackBonus = "") {
  return Number(attackBonus.replace("+", "")) || 0;
}

export function evaluateCharacter(draft: CharacterDraft) {
  const { SKILLS, ATTRIBUTES, CLASSES, COMBINATIONS, ABILITIES, CLASS_ABILITY_RULES, BACKGROUNDS,
    FOCI, SPELLS, EQUIPMENT, EQUIPMENT_PROPERTIES, STARTING_EQUIPMENT, STARTING_ARTS, ARTS,
    PROGRESSION_TABLES } = readCharacterData();
  const SKILL_IDS = new Set(SKILLS.map((skill) => skill.id));
  const CLASS_BY_ID = new Map(CLASSES.map((classOption) => [classOption.id, classOption]));
  const PROGRESSION_BY_ID = new Map(PROGRESSION_TABLES.filter((table) => table.id !== "am+e")
    .map((table) => [table.id, table]));
  const issues: string[] = [];
  const attributeEvaluation = evaluateAttributes(draft);
  issues.push(...attributeEvaluation.issues);

  const classEvaluation = evaluateClassChoices(draft.classChoices, CLASSES);
  issues.push(...classEvaluation.issues);
  const classAbilities = evaluateClassAbilities(draft.classChoices, CLASSES, ABILITIES, CLASS_ABILITY_RULES);
  issues.push(...classAbilities.issues.filter((issue) => !issues.includes(issue)));
  const classChoices = classEvaluation.ids
    .map((classId) => CLASS_BY_ID.get(classId))
    .filter((classOption): classOption is ClassData => Boolean(classOption))
    .slice(0, 2);

  const progressionKey = progressionKeyForClasses(classChoices, PROGRESSION_BY_ID);
  const progression = PROGRESSION_BY_ID.get(progressionKey);
  if (classChoices.length === 2 && !progression) {
    issues.push(`No progression table found for selected class archetypes: ${progressionKey || "unknown"}.`);
  }

  const backgroundEvaluation = evaluateBackground(draft, BACKGROUNDS, SKILLS, ATTRIBUTES);
  issues.push(...backgroundEvaluation.issues);
  const backgroundAttributes = applyBackgroundAttributeGrants(attributeEvaluation.attributes, backgroundEvaluation.attributeGrants);

  const artFocusGrants = resolveArtFocusGrants(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS, FOCI);
  issues.push(...artFocusGrants.issues);
  const focusCreation = evaluateFocusCreation({ instances: draft.focusInstances, legacyIds: draft.focus, grants: artFocusGrants.grants,
    bonusChoices: draft.focusBonusChoices, ruleChoices: draft.focusRuleChoices, foci: FOCI, classes: classChoices,
    baseLimit: progression?.focus ?? [], skills: SKILLS, attributes: ATTRIBUTES, scores: backgroundAttributes.attributes });
  issues.push(...focusCreation.issues);
  const focusAbilities = resolveFocusAbilities(classEvaluation.complete ? focusCreation.applied : [], FOCI, ABILITIES);
  const abilitySelection = mergeAbilityEvaluations(classAbilities, focusAbilities);
  issues.push(...focusAbilities.issues);
  const selectedFocus = focusCreation.instances;
  const focusLimit = focusCreation.limit;
  const focusBonuses = focusCreation.bonuses;
  const progressionAttackBonus = parseAttackBonus(progression?.ab);
  const baseAttackBonus = progressionAttackBonus + focusCreation.derived.baseAttackBonusAdjustment;
  const baseModifiers = focusCreation.baseModifiers as typeof attributeEvaluation.modifiers;
  const modifiers = { ...baseModifiers };
  for (const key of Object.keys(modifiers) as Array<keyof typeof modifiers>) {
    modifiers[key] += focusBonuses.modifierBonuses[key] ?? 0;
  }
  const savingThrows = calculateSavingThrows(modifiers, focusCreation.saveEffects);

  const equipmentInventory = evaluateEquipmentInventory({ startingEquipment: draft.startingEquipment,
    purchases: draft.equipmentPurchases, loadout: draft.equipmentLoadout, dexterity: modifiers.DEX },
    STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES, classEvaluation.complete ? focusCreation.baseAc : undefined);
  const equipmentSelection = equipmentInventory.starting;
  const armorClass = equipmentInventory.armorClass;
  issues.push(...equipmentInventory.issues);
  const hitDiceEvaluation = evaluateHitDiceEffects(progression?.hd ?? '', draft.classChoices, CLASSES, abilitySelection.abilities);
  issues.push(...hitDiceEvaluation.issues.filter((issue) => !issues.includes(issue)));
  const hitDice = hitDiceEvaluation.hitDice;
  const parsedHitDice = parseHitDice(hitDice);
  const hitDie = parsedHitDice?.sides ?? 0;
  const hitPoints = firstLevelHitPoints(hitDice, modifiers.CON);

  const skillAllocation = evaluateCreationSkills(backgroundEvaluation.skillGrants, classChoices,
    focusBonuses.skillGrants, draft.freeSkill ?? '', SKILLS.map((skill) => skill.id), draft.classBonusChoices);
  issues.push(...skillAllocation.issues.map((issue) => issue.message));
  if (!draft.freeSkill) issues.push('Choose a free skill.');
  const selectedSkills = Object.values(skillAllocation.states).filter((skill) => skill.allotments > 0).map((skill) => skill.id);
  const skillGrantCounts = Object.fromEntries(Object.values(skillAllocation.states).map((skill) => [skill.id, skill.allotments]));
  const skillScopeComplete = (scope: string) => !skillAllocation.issues.some((issue) => issue.scope === scope);

  const focusTraditions = classEvaluation.complete ? focusCreation.traditions : [];
  const focusEffort = evaluateFocusEffort(focusTraditions, skillAllocation.states);
  const artEvaluation = evaluateArtChoices(draft.artChoicesByClass, classEvaluation.ids, CLASSES, STARTING_ARTS, ARTS, focusTraditions);
  issues.push(...artEvaluation.issues.filter((issue) => !issues.includes(issue)));
  const spellEvaluation = evaluateSpellChoices(draft.spellChoicesByClassSlot, classEvaluation.ids, SPELLS, draft.spellChoices, focusTraditions);
  issues.push(...spellEvaluation.issues);

  const stepStatus = [
    {
      key: "attributes",
      label: "1-2. Attributes and modifiers",
      complete: attributeEvaluation.complete,
    },
    {
      key: "background",
      label: "3-4. Background and background skills",
      complete: backgroundEvaluation.complete && skillScopeComplete('background'),
    },
    {
      key: "class",
      label: "5-6. Class and foci",
      complete:
        classEvaluation.complete &&
        abilitySelection.complete &&
        hitDiceEvaluation.complete &&
        Boolean(progression) &&
        selectedFocus.length >= 1 &&
        selectedFocus.length <= focusLimit &&
        focusCreation.complete && artFocusGrants.issues.length === 0 &&
        skillScopeComplete('class') && skillScopeComplete('focus'),
    },
    {
      key: "freeSkill",
      label: "7. Free skill",
      complete: Boolean(draft.freeSkill) && SKILL_IDS.has(draft.freeSkill ?? "") && skillScopeComplete('freeSkill'),
    },
    {
      key: "combat",
      label: "8-9, 12. Hit points, attack, and saves",
      complete: hitDiceEvaluation.complete && hitDie > 0,
    },
    {
      key: 'equipment',
      label: '10. Starting equipment or silver',
      complete: equipmentInventory.complete,
    },
    {
      key: 'armorClass',
      label: '11. Equipped armor, shield, and Armor Class',
      complete: armorClass.complete,
    },
    {
      key: "identity",
      label: "13. Name and goal",
      complete: Boolean(draft.name?.trim()) && Boolean(draft.goal?.trim()),
    },
    {
      key: 'arts',
      label: '14. Class arts',
      complete: classEvaluation.complete && artEvaluation.complete,
    },
    {
      key: 'spells',
      label: '15. First-level spells (final stage)',
      complete: spellEvaluation.complete,
    },
  ];

  const assumptions = [
    "Backgrounds, classes, foci, skills, equipment, arts, and spells are validated against frontend/data JSON files.",
    "Class selection uses two slots; only classes marked can_be_full_class may fill both slots.",
    "Class pairing exclusions are checked in both directions using incompatible_classes and incompatible_archetypes.",
    "Starting arts are applied once per distinct class, using partial or full rules. Fixed grants, restricted choices, and additional picks are separate.",
    "Base hit dice, attack bonus, and focus count come from progression_tables.json; applicable encoded ability overrides determine effective hit dice before HP is calculated.",
    "AC uses the higher of armor base (10 unarmored) and eligible focus base AC, then applies the usual shield rule and final DEX. Worn armor penalties remain. Legacy armor bonuses are ignored.",
    "Starting equipment grants one fixed package or the sum of three saved d6 rolls multiplied by 10 silver, never both. Client-supplied grants and money totals are not authoritative.",
    "Catalogue purchases use 10 copper per silver and cannot exceed starting funds. Missing prices are not free items. Package grants cannot be sold for extra starting funds.",
    "Only owned equipment may be equipped. A held shield conflicts with an active two-handed weapon. Armor penalties affect Sneak/Exert checks, not learned skill levels.",
    "Package row encumbrance already includes quantity. Catalogue purchase lots apply explicit groups of three or five; ambiguous footnotes remain flagged. These subtotals are not carried-load limits: storage, transport, and coin loads are not tracked.",
    "Equipment statistics and property descriptions are reference rules. Unencoded focus/art armor exceptions, attack rolls, damage modifiers, reloads, and situational effects require manual adjudication.",
    "Class skill bonuses apply once per distinct class. Skills start at -1 and cannot exceed level 1 at creation.",
    "Named abilities resolve from one catalogue using class, exact class-pair, and eligible focus grants; descriptions do not automatically apply effects.",
    "A third fixed skill allotment from a focus gives that skill 2 advancement points; other forced overflow requires manual review.",
    "Only one origin family is allowed, including linked upgrades. Each instance or upgrade costs a pick; repeatable choices belong to specific instances.",
    "Positive focus save bonuses lower the displayed save target. Situational effects and crafting are recorded as play notes, not simulated.",
    "This builder creates level-1 characters only. Each spellcasting class slot learns two first-level spells from its own allowed schools, with no duplicate spells.",
  ];

  return {
    characterLevel: 1,
    valid: issues.length === 0,
    issues,
    assumptions,
    fullClass: classBuildName(draft.classChoices, CLASSES, COMBINATIONS),
    classAbilities,
    abilitySelection,
    hitDiceEvaluation,
    equipmentSelection,
    equipmentInventory,
    armorClass,
    savingThrows,
    attributes: focusCreation.scores,
    allocatedAttributes: attributeEvaluation.attributes,
    backgroundAttributes: backgroundAttributes.attributes,
    backgroundAttributeBonuses: backgroundAttributes.bonuses,
    focusScoreChanges: focusCreation.scoreChanges,
    focusRuleNotes: focusCreation.notes,
    focusTraditions,
    focusEffort,
    focusSelection: { instances: selectedFocus, limit: focusLimit, baseLimit: focusCreation.baseLimit,
      grantedInstances: focusCreation.grantedInstances, refundedInstances: focusCreation.refundedInstances,
      extraPicks: focusCreation.extraPicks, allowances: focusCreation.allowances,
      complete: focusCreation.complete && artFocusGrants.issues.length === 0, issues: [...focusCreation.issues, ...artFocusGrants.issues] },
    baseModifiers,
    focusModifierBonuses: focusBonuses.modifierBonuses,
    focusModifierContributions: focusBonuses.modifierContributions,
    modifierCaps: focusBonuses.modifierCaps,
    focusBonuses: focusBonuses.details,
    modifiers,
    derived: {
      hitPoints,
      hitDie,
      hitDice,
      baseHitDice: hitDiceEvaluation.baseHitDice,
      hitDiceAdjustments: hitDiceEvaluation.adjustments,
      focusLimit,
      physicalSave: savingThrows.targets.physical,
      evasionSave: savingThrows.targets.evasion,
      mentalSave: savingThrows.targets.mental,
      luckSave: savingThrows.targets.luck,
      ac: armorClass.value,
      progressionAttackBonus,
      baseAttackBonusAdjustment: focusCreation.derived.baseAttackBonusAdjustment,
      baseAttackAdjustments: focusCreation.derived.baseAttackAdjustments,
      baseAttackBonus,
      focusAttackBonus: focusCreation.derived.attack,
      attackBonus: baseAttackBonus + focusCreation.derived.attack,
      saveBonuses: savingThrows.bonuses,
      encumbranceStrengthBonus: focusCreation.derived.encumbranceStrengthBonus,
      systemStrainMaxBonus: focusCreation.derived.systemStrainMaxBonus,
    },
    selectedSkills,
    skillGrantCounts,
    skillStates: skillAllocation.states,
    skillIssues: skillAllocation.issues,
    spellSelection: spellEvaluation,
    artSelection: artEvaluation,
    stepStatus,
  };
}
