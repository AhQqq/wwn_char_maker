import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import './App.css'
import { ko, nameFor } from './korean'
import rawAttributes from '../data/attributes.json'
import rawBackgrounds from '../data/backgrounds.json'
import rawClasses from '../data/classes.json'
import rawCombinations from '../data/combinations.json'
import rawAbilities from '../data/abilities.json'
import rawClassAbilityRules from '../data/fullclass_abilities.json'
import rawFoci from '../data/foci.json'
import rawProgressionTables from '../data/progression_tables.json'
import rawSkills from '../data/skills.json'
import rawSpells from '../data/spells.json'
import rawEquipment from '../data/equipment.json'
import rawEquipmentProperties from '../data/equipment_properties.json'
import rawStartingEquipment from '../data/starting_equipment.json'
import {
  ATTRIBUTE_KEYS, ARRAY_VALUES, allocatedAttributes, createArrayAllocation,
  restoreAttributeAllocation, rollAttributeAllocation, selectAttributeOverride, swapArrayScore,
} from './attributeAllocation'
import type { AttributeAllocation, AttributeKey } from './attributeAllocation'
import { FocusPicker } from './FocusPicker'
import { focusInstanceLabel } from './focusSelection'
import type { FocusOption as FocusData } from './focusSelection'
import { evaluateBackground } from '../../shared/background'
import { getModifier } from '../../shared/attributeModifier'
import { evaluateFocusBonuses, modifierLimitText, normalizeFocusBonusChoices } from '../../shared/focusBonuses'
import { evaluateFocusCreation, evaluateFocusInstances, instanceFocusData, normalizeFocusRuleChoices, pruneFocusInstances, readFocusInstances, removeFocusInstance } from '../../shared/focusCreation'
import type { BaseAttackAdjustment, FocusInstance, FocusRuleChoice, FocusRuleChoices } from '../../shared/focusCreation'
import { FOCUS_ALLOWANCE_LABELS } from './korean'
import type { FocusAllowance } from '../../shared/focusAllowances'
import { FocusInstances } from './FocusInstances'
import { classSkillGrants, evaluateCreationSkills, normalizeClassBonusChoices, skillChoiceReason } from '../../shared/skillAllocation'
import type { ClassBonusChoices, ClassSkillGrant } from '../../shared/skillAllocation'
import { SkillChoiceFeedback, SkillChoiceOptions } from './SkillChoices'
import { SKILL_ICONS } from './skillIcons'
import { isFirstLevelSpell, normalizeSpellChoices, restoreSpellChoices, toggleSpellChoice } from '../../shared/spellSelection'
import type { ClassSlot, SpellChoices, SpellOption as SpellData } from '../../shared/spellSelection'
import { SpellPicker } from './SpellPicker'
import { classChoiceReason, evaluateClassChoices } from '../../shared/classSelection'
import type { SelectableClass } from '../../shared/classSelection'
import { classBuildName } from '../../shared/classBuild'
import type { ClassCombinations } from '../../shared/classBuild'
import { evaluateArtChoices, getArtPlans, normalizeArtChoices, restoreArtChoices, toggleArtChoice } from '../../shared/artSelection'
import type { ArtChoices } from '../../shared/artSelection'
import { ARTS, STARTING_ARTS } from './artData'
import { ArtPicker } from './ArtPicker'
import { evaluateClassAbilities } from '../../shared/classAbilities'
import type { AbilityDefinition, ClassAbilityRules } from '../../shared/classAbilities'
import { mergeAbilityEvaluations } from '../../shared/abilities'
import { resolveFocusAbilities } from '../../shared/focusAbilities'
import { AbilitySheet } from './AbilitySheet'
import type { HitDiceAdjustment } from '../../shared/abilityEffects'
import { evaluateStartingEquipment, restoreStartingEquipment } from '../../shared/startingEquipment'
import type { EquipmentDefinition, EquipmentPackage, EquipmentProperty, StartingEquipmentChoice } from '../../shared/startingEquipment'
import { emptyLoadout, evaluateEquipmentInventory, pruneEquipmentLoadout, restoreEquipmentInventory } from '../../shared/equipment'
import type { EquipmentLoadout, EquipmentPurchase } from '../../shared/equipment'
import { EquipmentPicker } from './EquipmentPicker'
import { EquipmentInventory, InventorySummary } from './EquipmentInventory'

const LOCAL_STORAGE_KEY = 'wwn-character-draft'

type Archetype = 'warrior' | 'expert' | 'mage'
type BackgroundRollTable = 'growth' | 'learn'
type BackgroundMethod = '' | 'pick' | 'roll'
type FocusBonusChoices = Record<string, Record<string, string[]>>
type FocusBonusDetail = ReturnType<typeof evaluateFocusBonuses>['details'][number]

type AttributeData = {
  id: AttributeKey
  name: string
  description: string
  tags: string[]
}

type SkillData = {
  id: string
  name: string
  description: string
  tags: string[]
}

type DataAction = {
  action: string
  id?: string
  count?: number
  filter?: {
    tags?: string[]
  }
}

type BackgroundData = {
  id: string
  name: string
  description: string
  free_skill: DataAction[]
  sugg_skill: DataAction[]
  growth: DataAction[]
  learn: DataAction[]
}

type ClassData = SelectableClass & {
  name: string
  archetype: Archetype
  spells: boolean
  arts: boolean
  bonus: DataAction[]
  art_prog: unknown[]
}

type ProgressionTable = {
  id: string
  hd: string
  ab: string
  focus: FocusAllowance[]
}

type BackgroundRollResult = {
  table: BackgroundRollTable
  roll: number
  label: string
  action: string
  actionId?: string
  count?: number
  choiceId?: string
  skillId?: string
}

type Draft = AttributeAllocation & {
  name: string
  goal: string
  notes: string
  background: string
  classChoices: string[]
  classBonusChoices: ClassBonusChoices
  focusInstances: FocusInstance[]
  focusRuleChoices: FocusRuleChoices
  focusBonusChoices: FocusBonusChoices
  freeSkill: string
  backgroundSkill: string
  backgroundMethod: BackgroundMethod
  backgroundPicks: string[]
  backgroundRollTables: BackgroundRollTable[]
  backgroundRollResults: BackgroundRollResult[]
  selectedSkills: string[]
  spellChoicesByClassSlot: SpellChoices
  artChoicesByClass: ArtChoices
  startingEquipment: StartingEquipmentChoice
  equipmentPurchases: EquipmentPurchase[]
  equipmentLoadout: EquipmentLoadout
}

type Evaluation = {
  valid: boolean
  issues: string[]
  assumptions: string[]
  fullClass: string
  modifiers: Record<AttributeKey, number>
  baseModifiers: Record<AttributeKey, number>
  focusModifierBonuses: Record<AttributeKey, number>
  modifierCaps: ReturnType<typeof evaluateFocusBonuses>['modifierCaps']
  attributes: Record<string, number>
  focusBonuses: FocusBonusDetail[]
  skillGrantCounts: Record<string, number>
  derived: {
    hitPoints: number
    hitDie: number
    hitDice: string
    baseHitDice: string
    hitDiceAdjustments: HitDiceAdjustment[]
    focusLimit: number
    physicalSave: number
    evasionSave: number
    mentalSave: number
    luckSave: number
    ac: number | null
    baseAttackBonus: number
    progressionAttackBonus: number
    baseAttackBonusAdjustment: number
    baseAttackAdjustments: BaseAttackAdjustment[]
    focusAttackBonus: number
    attackBonus: number
    saveBonuses: Record<string, number>
    encumbranceStrengthBonus: number
    systemStrainMaxBonus: number
  }
  selectedSkills: string[]
  stepStatus: Array<{
    key: string
    label: string
    complete: boolean
  }>
}

const ATTRIBUTES = rawAttributes as AttributeData[]
const SKILLS = rawSkills as SkillData[]
const BACKGROUNDS = rawBackgrounds as BackgroundData[]
const CLASSES = rawClasses as ClassData[]
const COMBINATIONS = rawCombinations as ClassCombinations
const ABILITIES = rawAbilities as AbilityDefinition[]
const CLASS_ABILITY_RULES = rawClassAbilityRules as ClassAbilityRules
const FOCI = rawFoci as FocusData[]
const PROGRESSION_TABLES = rawProgressionTables as ProgressionTable[]
const SPELLS = rawSpells as SpellData[]
const EQUIPMENT = rawEquipment as EquipmentDefinition[]
const EQUIPMENT_PROPERTIES = rawEquipmentProperties as EquipmentProperty[]
const STARTING_EQUIPMENT = rawStartingEquipment as EquipmentPackage[]

const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]))
const CLASS_BY_ID = new Map(CLASSES.map((classOption) => [classOption.id, classOption]))
const BACKGROUND_BY_ID = new Map(BACKGROUNDS.map((background) => [background.id, background]))
const FOCUS_BY_ID = new Map(FOCI.map((focus) => [focus.id, focus]))
const SPELL_BY_ID = new Map(SPELLS.map((spell) => [spell.id, spell]))
const PROGRESSION_BY_ID = new Map(PROGRESSION_TABLES.filter((table) => table.id !== 'am+e').map((table) => [table.id, table]))

const FIRST_LEVEL_SPELLS = SPELLS.filter(isFirstLevelSpell)

const DEFAULT_BACKGROUND_ROLL_TABLES: BackgroundRollTable[] = ['growth', 'learn', 'learn']

const EMPTY_EVALUATION: Evaluation = {
  valid: false,
  issues: [],
  assumptions: [],
  fullClass: 'Unfinished',
  modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
  baseModifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
  focusModifierBonuses: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
  modifierCaps: {},
  attributes: {},
  focusBonuses: [],
  skillGrantCounts: {},
  derived: {
    hitPoints: 0,
    hitDie: 0,
    hitDice: '',
    baseHitDice: '',
    hitDiceAdjustments: [],
    focusLimit: 1,
    physicalSave: 15,
    evasionSave: 15,
    mentalSave: 15,
    luckSave: 15,
    ac: null,
    baseAttackBonus: 0,
    progressionAttackBonus: 0,
    baseAttackBonusAdjustment: 0,
    baseAttackAdjustments: [],
    focusAttackBonus: 0,
    attackBonus: 0,
    saveBonuses: {},
    encumbranceStrengthBonus: 0,
    systemStrainMaxBonus: 0,
  },
  selectedSkills: [],
  stepStatus: [],
}

function skillName(id: string) {
  return SKILL_BY_ID.get(id)?.name ?? '알 수 없는 기술'
}

function skillLabel(id: string) {
  const skill = SKILL_BY_ID.get(id)
  return skill?.name ?? '알 수 없는 기술'
}

function classLabel(classOption: ClassData) {
  return classOption.name
}

function progressionKeyForClasses(classOptions: ClassData[]) {
  const shorthand = classOptions.map((classOption) => classOption.archetype[0]).sort().join('+')
  const reverseShorthand = shorthand.split('+').reverse().join('+')
  if (PROGRESSION_BY_ID.has(shorthand)) return shorthand
  if (PROGRESSION_BY_ID.has(reverseShorthand)) return reverseShorthand
  return ''
}

function focusBudgetForProgression(table?: ProgressionTable): FocusAllowance[] {
  return table?.focus ?? []
}

function describeAction(action: DataAction) {
  if (action.action === 'fixed_skill' && action.id) return skillName(action.id)
  if (action.action === 'tag_skill' && action.id === 'combat') return '전투 기술'
  if (action.action === 'tag_skill' && action.id === 'any') return '아무 기술'
  if (action.action === 'tag_attr' && action.id === 'any') return '+1 능력치'
  if (action.action === 'tag_attr' && action.id === 'phys') return '+2 육체'
  if (action.action === 'tag_attr' && action.id === 'mental') return '+2 정신'
  if (action.action === 'choice_skill') return '기술 선택'
  return '직접 확인이 필요한 효과'
}

function fixedSkillIds(actions: DataAction[]) {
  return actions
    .filter((action) => action.action === 'fixed_skill' && action.id && SKILL_BY_ID.has(action.id))
    .map((action) => action.id as string)
}

function defaultBackgroundSkill(background: BackgroundData) {
  return fixedSkillIds(background.free_skill)[0] ?? ''
}

function actionSkillOptions(action: DataAction) {
  if (action.action === 'fixed_skill') return SKILLS.filter((skill) => skill.id === action.id)
  if (action.action === 'tag_skill') {
    return SKILLS.filter((skill) => action.id === 'any' || skill.tags.includes(action.id ?? ''))
  }
  return []
}

function learningSkillOptions(background: BackgroundData) {
  const ids = new Set(background.learn
    .filter((action) => !(action.action === 'tag_skill' && action.id === 'any'))
    .flatMap(actionSkillOptions)
    .map((skill) => skill.id))
  return SKILLS.filter((skill) => ids.has(skill.id))
}

function getBackgroundTable(background: BackgroundData, table: BackgroundRollTable) {
  return table === 'growth' ? background.growth : background.learn
}

function tableDieLabel(background: BackgroundData, table: BackgroundRollTable) {
  return table === 'growth' ? `성장 표 (d${background.growth.length})` : `학습 표 (d${background.learn.length})`
}

function actionSkillId(action: DataAction) {
  return action.action === 'fixed_skill' && action.id && SKILL_BY_ID.has(action.id) ? action.id : undefined
}

function rollBackgroundTable(background: BackgroundData, table: BackgroundRollTable): BackgroundRollResult {
  const rows = getBackgroundTable(background, table)
  const roll = randomInt(1, rows.length)
  return backgroundRollResult(background, table, roll)
}

function backgroundRollResult(background: BackgroundData, table: BackgroundRollTable, roll: number): BackgroundRollResult {
  const action = getBackgroundTable(background, table)[roll - 1]
  return {
    table,
    roll,
    label: action ? describeAction(action) : '결과 없음',
    action: action?.action ?? 'none',
    actionId: action?.id,
    count: action?.count,
    skillId: action ? actionSkillId(action) : undefined,
  }
}

function selectedSkillsFromRollResults(results: BackgroundRollResult[]) {
  return results.map((result) => result.skillId).filter((skillId): skillId is string => Boolean(skillId))
}

function backgroundChoiceOptions(result: BackgroundRollResult) {
  if (result.action === 'tag_skill' && result.actionId === 'any') {
    return SKILLS.map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))
  }
  if (result.action === 'tag_skill' && result.actionId === 'combat') {
    return SKILLS
      .filter((skill) => skill.tags.includes('combat'))
      .map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))
  }
  if (result.action === 'tag_attr' && result.actionId === 'any') {
    return ATTRIBUTES.map((attribute) => ({ id: attribute.id, label: attribute.name }))
  }
  if (result.action === 'tag_attr' && result.actionId) {
    return ATTRIBUTES
      .filter((attribute) => attribute.tags.includes(result.actionId ?? ''))
      .map((attribute) => ({ id: attribute.id, label: attribute.name }))
  }
  return []
}

function backgroundChoiceLabel(result: BackgroundRollResult) {
  if (result.action === 'tag_skill') return '기술 선택'
  if (result.action === 'tag_attr') return `${result.label}: 능력치 선택`
  return ''
}

function keepFocusBonusChoices(source: unknown, instances: FocusInstance[]): FocusBonusChoices {
  return normalizeFocusBonusChoices(source, instances.map((item) => item.instanceId), instanceFocusData(instances, FOCI))
}

function createInitialDraft(): Draft {
  const background = BACKGROUNDS[0]
  const classChoices = CLASSES.slice(0, 2).map((classOption) => classOption.id)
  const selectedClasses = classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter(Boolean) as ClassData[]
  const budget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(selectedClasses)))
  const focus = FOCI.find((item) => evaluateFocusInstances([{ instanceId: item.id, focusId: item.id }], undefined, FOCI, selectedClasses, budget).complete)?.id ?? ''

  return {
    name: '',
    goal: '',
    notes: '',
    background: background.id,
    ...createArrayAllocation(),
    classChoices,
    classBonusChoices: {},
    focusInstances: focus ? [{ instanceId: focus, focusId: focus }] : [],
    focusRuleChoices: {},
    focusBonusChoices: {},
    freeSkill: '',
    backgroundSkill: defaultBackgroundSkill(background),
    backgroundMethod: '',
    backgroundPicks: ['', ''],
    backgroundRollTables: DEFAULT_BACKGROUND_ROLL_TABLES,
    backgroundRollResults: [],
    selectedSkills: [],
    spellChoicesByClassSlot: [[], []],
    artChoicesByClass: {},
    startingEquipment: { method: '' },
    equipmentPurchases: [],
    equipmentLoadout: emptyLoadout(),
  }
}

function plusModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function readSavedDraft(): { draft: Draft; spellNotice: string; artNotice: string; equipmentNotice: string } {
  const fallback = createInitialDraft()
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) return { draft: fallback, spellNotice: '', artNotice: '', equipmentNotice: '' }

  try {
    const { spellChoices: legacySpells, focus: legacyFocus, armor: legacyArmor, ...parsed } = JSON.parse(raw) as Partial<Draft> & { spellChoices?: unknown; focus?: unknown; armor?: unknown }
    const restoredEquipment = restoreStartingEquipment(parsed.startingEquipment, legacyArmor)
    const restoredInventory = restoreEquipmentInventory(parsed.equipmentPurchases, parsed.equipmentLoadout)
    const background = parsed.background && BACKGROUND_BY_ID.has(parsed.background) ? parsed.background : fallback.background
    const classChoices = (parsed.classChoices ?? fallback.classChoices)
      .map((classId) => (CLASS_BY_ID.has(classId) ? classId : ''))
      .filter(Boolean)
      .slice(0, 2)
    const restoredClasses = (classChoices.length > 0 ? classChoices : fallback.classChoices)
      .map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
    const focusInstances = readFocusInstances(parsed.focusInstances, legacyFocus ?? fallback.focusInstances.map((item) => item.focusId), FOCI).instances
    const restoredSpells = restoreSpellChoices(parsed.spellChoicesByClassSlot, legacySpells,
      classChoices.length > 0 ? classChoices : fallback.classChoices, SPELLS)
    const restoredArts = restoreArtChoices(parsed.artChoicesByClass,
      classChoices.length > 0 ? classChoices : fallback.classChoices, CLASSES, STARTING_ARTS, ARTS)
    const activeBackground = BACKGROUND_BY_ID.get(background) ?? BACKGROUNDS[0]
    const backgroundRollTables = (parsed.backgroundRollTables ?? fallback.backgroundRollTables)
      .filter((table): table is BackgroundRollTable => table === 'growth' || table === 'learn')
      .slice(0, 3)
    const rollTables = backgroundRollTables.length === 3 ? backgroundRollTables : fallback.backgroundRollTables
    const savedResults = Array.isArray(parsed.backgroundRollResults) ? parsed.backgroundRollResults : []
    const backgroundMethod: BackgroundMethod = parsed.backgroundMethod === 'pick' || parsed.backgroundMethod === 'roll'
      ? parsed.backgroundMethod
      : parsed.backgroundMethod === undefined && savedResults.length > 0 ? 'roll' : ''
    const pickIds = new Set(learningSkillOptions(activeBackground).map((skill) => skill.id))
    const backgroundPicks = [0, 1].map((index) => {
      const id = parsed.backgroundPicks?.[index] ?? ''
      return backgroundMethod === 'pick' && pickIds.has(id) ? id : ''
    })
    // Rebuild saved results from the table, not cached labels or skill IDs.
    const validRolls = savedResults.length === 3 && savedResults.every((result, index) =>
      result && result.table === rollTables[index] && Number.isInteger(result.roll) &&
      result.roll >= 1 && result.roll <= getBackgroundTable(activeBackground, result.table).length)
    const backgroundRollResults = backgroundMethod === 'roll' && validRolls
      ? savedResults.map((saved) => {
        const result = backgroundRollResult(activeBackground, saved.table, saved.roll)
        if (backgroundChoiceOptions(result).some((option) => option.id === saved.choiceId)) {
          result.choiceId = saved.choiceId
          if (result.action === 'tag_skill') result.skillId = saved.choiceId
        }
        return result
      }) : []
    const freeSkillOptions = activeBackground.free_skill.flatMap(actionSkillOptions)
    const backgroundSkill = defaultBackgroundSkill(activeBackground) ||
      (freeSkillOptions.some((skill) => skill.id === parsed.backgroundSkill) ? parsed.backgroundSkill! : '')
    const freeSkill = parsed.freeSkill && SKILL_BY_ID.has(parsed.freeSkill) ? parsed.freeSkill : fallback.freeSkill

    return { spellNotice: restoredSpells.notice, artNotice: restoredArts.notice, equipmentNotice: [restoredEquipment.notice, restoredInventory.notice].filter(Boolean).join(' '), draft: {
      ...fallback,
      ...parsed,
      background,
      ...restoreAttributeAllocation(parsed),
      startingEquipment: restoredEquipment.choice,
      equipmentPurchases: restoredInventory.purchases,
      equipmentLoadout: restoredInventory.loadout,
      classChoices: classChoices.length > 0 ? classChoices : fallback.classChoices,
      classBonusChoices: normalizeClassBonusChoices(parsed.classBonusChoices, restoredClasses),
      focusInstances,
      focusRuleChoices: normalizeFocusRuleChoices(parsed.focusRuleChoices, focusInstances),
      focusBonusChoices: keepFocusBonusChoices(parsed.focusBonusChoices, focusInstances),
      freeSkill,
      backgroundSkill,
      backgroundMethod,
      backgroundPicks,
      backgroundRollTables: rollTables,
      backgroundRollResults,
      selectedSkills: backgroundMethod === 'pick' ? backgroundPicks.filter(Boolean) : selectedSkillsFromRollResults(backgroundRollResults),
      spellChoicesByClassSlot: restoredSpells.choices,
      artChoicesByClass: restoredArts.choices,
    } }
  } catch {
    return { draft: fallback, spellNotice: '', artNotice: '', equipmentNotice: '' }
  }
}

function evaluateDraftSkills(draft: Draft) {
  const classes = draft.classChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
  const budget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(classes)))
  const background = evaluateBackground(draft, BACKGROUNDS, SKILLS, ATTRIBUTES)
  const focusCreation = evaluateFocusCreation({ instances: draft.focusInstances, bonusChoices: draft.focusBonusChoices,
    ruleChoices: draft.focusRuleChoices, foci: FOCI, classes, baseLimit: budget, skills: SKILLS,
    attributes: ATTRIBUTES, scores: allocatedAttributes(draft) })
  const bonuses = focusCreation.bonuses
  const allocation = evaluateCreationSkills(background.skillGrants, classes, bonuses.skillGrants, draft.freeSkill, SKILLS.map((skill) => skill.id), draft.classBonusChoices)
  return { allocation, bonuses, focusCreation }
}

function App() {
  const [loadedDraft] = useState(() => readSavedDraft())
  const [draft, setDraft] = useState<Draft>(loadedDraft.draft)
  const [spellNotice, setSpellNotice] = useState(loadedDraft.spellNotice)
  const [artNotice, setArtNotice] = useState(loadedDraft.artNotice)
  const [equipmentNotice, setEquipmentNotice] = useState(loadedDraft.equipmentNotice)
  const [evaluation, setEvaluation] = useState<Evaluation>(EMPTY_EVALUATION)
  const [backendOnline, setBackendOnline] = useState(false)
  const [evaluationError, setEvaluationError] = useState('')

  const deferredDraft = useDeferredValue(draft)

  const activeBackground = useMemo(
    () => BACKGROUND_BY_ID.get(draft.background) ?? BACKGROUNDS[0],
    [draft.background],
  )

  const selectedClasses = useMemo(
    () => draft.classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter(Boolean) as ClassData[],
    [draft.classChoices],
  )

  const learningOptions = learningSkillOptions(activeBackground)
  const backgroundFreeOptions = activeBackground.free_skill.flatMap(actionSkillOptions)
  const fixedBackgroundSkill = defaultBackgroundSkill(activeBackground)

  const activeProgression = useMemo(
    () => PROGRESSION_BY_ID.get(progressionKeyForClasses(selectedClasses)),
    [selectedClasses],
  )

  const allocatedScores = allocatedAttributes(draft)
  const equipmentEvaluation = evaluateStartingEquipment(draft.startingEquipment, STARTING_EQUIPMENT, EQUIPMENT)
  const { allocation: skillAllocation, bonuses: localFocusBonuses, focusCreation } = evaluateDraftSkills(draft)
  const localDexterity = (focusCreation.baseModifiers.DEX ?? 0) + (localFocusBonuses.modifierBonuses.DEX ?? 0)
  const equipmentInventory = evaluateEquipmentInventory({ startingEquipment: draft.startingEquipment,
    purchases: draft.equipmentPurchases, loadout: draft.equipmentLoadout, dexterity: localDexterity },
    STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES)
  const focusLimit = focusCreation.limit
  const skillOptions = SKILLS.map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))
  const classGrants = classSkillGrants(selectedClasses, draft.classBonusChoices)
  const fixedClassGrants = classGrants.filter((grant) => grant.kind === 'fixed')
  const classSkillChoices = classGrants.filter((grant) => grant.kind === 'choice')
  const classValidation = evaluateClassChoices(draft.classChoices, CLASSES)
  const resolvedClassBuild = classBuildName(draft.classChoices, CLASSES, COMBINATIONS)
  const classAbilities = evaluateClassAbilities(draft.classChoices, CLASSES, ABILITIES, CLASS_ABILITY_RULES)
  const focusAbilities = resolveFocusAbilities(classValidation.complete ? focusCreation.applied : [], FOCI, ABILITIES)
  const abilitySelection = mergeAbilityEvaluations(classAbilities, focusAbilities)
  const artPlans = getArtPlans(draft.classChoices, CLASSES, STARTING_ARTS, ARTS)
  const artEvaluation = evaluateArtChoices(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS)

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    let cancelled = false

    async function evaluateDraft() {
      try {
        const response = await fetch('/api/character/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deferredDraft),
        })

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`)
        }

        const data = (await response.json()) as Evaluation
        if (!cancelled) {
          setEvaluation(data)
          setBackendOnline(true)
          setEvaluationError('')
        }
      } catch {
        if (!cancelled) {
          setBackendOnline(false)
          setEvaluation(EMPTY_EVALUATION)
          setEvaluationError('규칙 검증 서버에 연결할 수 없습니다. 서버를 실행해야 규칙 검증과 최종 수치 계산을 사용할 수 있습니다.')
        }
      }
    }

    evaluateDraft()
    return () => {
      cancelled = true
    }
  }, [deferredDraft])

  function updateArrayAttribute(key: AttributeKey, value: number) {
    setDraft((current) => ({ ...current, ...swapArrayScore(current, key, value) }))
  }

  function rerollInOrder() {
    const allocation = rollAttributeAllocation()
    setDraft((current) => ({ ...current, ...allocation }))
  }

  function resetToArray() {
    setDraft((current) => ({ ...current, ...createArrayAllocation() }))
  }

  function updateClassChoice(index: number, choice: string) {
    if (classChoiceReason(choice, draft.classChoices[index === 0 ? 1 : 0], CLASSES)) return
    setSpellNotice('클래스가 바뀌어 주문 선택을 다시 확인했습니다. 원래 클래스에서 여전히 배울 수 있는 주문만 유지됩니다.')
    setArtNotice('클래스가 바뀌어 기교 선택을 다시 확인했습니다. 유효한 기교는 유지하고, 선택할 수 없거나 개수를 초과한 기교는 해제했습니다.')
    setDraft((current) => {
      if (classChoiceReason(choice, current.classChoices[index === 0 ? 1 : 0], CLASSES)) return current
      const nextChoices = [...current.classChoices]
      nextChoices[index] = choice
      const nextClasses = nextChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
      const nextBudget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(nextClasses)))
      const focusInstances = pruneFocusInstances(current.focusInstances, FOCI, nextClasses, nextBudget)
      const spellChoicesByClassSlot = normalizeSpellChoices(current.spellChoicesByClassSlot, nextChoices, SPELLS)
      const artChoicesByClass = normalizeArtChoices(current.artChoicesByClass, nextChoices, CLASSES, STARTING_ARTS, ARTS)
      const classBonusChoices = normalizeClassBonusChoices(current.classBonusChoices, nextClasses)
      return { ...current, classChoices: nextChoices, classBonusChoices, focusInstances,
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances),
        focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances), spellChoicesByClassSlot, artChoicesByClass }
    })
  }

  function updateClassBonusChoice(grant: ClassSkillGrant, skillId: string) {
    if (skillId && !SKILL_BY_ID.has(skillId)) return
    setDraft((current) => {
      const classes = current.classChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
      if (!classSkillGrants(classes).some((item) => item.key === grant.key && item.kind === 'choice')) return current
      if (skillId && skillChoiceReason(evaluateDraftSkills(current).allocation, grant.key, skillId)) return current
      const classBonusChoices = normalizeClassBonusChoices(current.classBonusChoices, classes)
      classBonusChoices[grant.classId][String(grant.bonusIndex)][grant.slotIndex] = skillId
      return { ...current, classBonusChoices }
    })
  }

  function handleBackgroundChange(backgroundId: string) {
    const background = BACKGROUND_BY_ID.get(backgroundId) ?? BACKGROUNDS[0]
    setDraft((current) => ({
      ...current,
      background: background.id,
      backgroundSkill: defaultBackgroundSkill(background),
      backgroundMethod: '',
      backgroundPicks: ['', ''],
      backgroundRollTables: DEFAULT_BACKGROUND_ROLL_TABLES,
      backgroundRollResults: [],
      selectedSkills: [],
    }))
  }

  function updateBackgroundMethod(backgroundMethod: BackgroundMethod) {
    setDraft((current) => current.backgroundMethod === backgroundMethod ? current : ({
      ...current,
      backgroundMethod,
      backgroundPicks: ['', ''],
      backgroundRollTables: DEFAULT_BACKGROUND_ROLL_TABLES,
      backgroundRollResults: [],
      selectedSkills: [],
    }))
  }

  function updateBackgroundPick(index: number, skillId: string) {
    if (skillId && !learningOptions.some((skill) => skill.id === skillId)) return
    setDraft((current) => {
      if (current.backgroundMethod !== 'pick') return current
      if (skillId && skillChoiceReason(evaluateDraftSkills(current).allocation, `background:pick:${index}`, skillId)) return current
      const backgroundPicks = [...current.backgroundPicks]
      backgroundPicks[index] = skillId
      return { ...current, backgroundPicks, selectedSkills: backgroundPicks.filter(Boolean) }
    })
  }

  function updateBackgroundRollTable(index: number, table: BackgroundRollTable) {
    setDraft((current) => {
      if (current.backgroundMethod !== 'roll') return current
      const nextTables = [...current.backgroundRollTables]
      nextTables[index] = table
      return {
        ...current,
        backgroundRollTables: nextTables.slice(0, 3),
        backgroundRollResults: [],
        selectedSkills: [],
      }
    })
  }

  function rollBackgroundTables() {
    if (draft.backgroundMethod !== 'roll') return
    const results = draft.backgroundRollTables.map((table) => rollBackgroundTable(activeBackground, table))
    setDraft((current) => ({
      ...current,
      backgroundRollResults: results,
      selectedSkills: selectedSkillsFromRollResults(results),
    }))
  }

  function updateBackgroundRollChoice(index: number, choiceId: string) {
    setDraft((current) => {
      if (current.backgroundMethod !== 'roll') return current
      if (current.backgroundRollResults[index]?.action === 'tag_skill' && choiceId &&
        skillChoiceReason(evaluateDraftSkills(current).allocation, `background:roll:${index}`, choiceId)) return current
      const nextResults = current.backgroundRollResults.map((result, resultIndex) => {
        if (resultIndex !== index) return result
        if (choiceId && !backgroundChoiceOptions(result).some((option) => option.id === choiceId)) return result
        const skillId = result.action === 'tag_skill' ? choiceId : result.skillId
        return { ...result, choiceId, skillId }
      })
      return {
        ...current,
        backgroundRollResults: nextResults,
        selectedSkills: selectedSkillsFromRollResults(nextResults),
      }
    })
  }

  function toggleFocus(id: string) {
    setDraft((current) => {
      const currentClasses = current.classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter((item): item is ClassData => Boolean(item))
      const budget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(currentClasses)))
      const definition = FOCUS_BY_ID.get(id)
      if (!definition) return current
      const existing = current.focusInstances.find((item) => item.focusId === id)
      let focusInstances: FocusInstance[]
      if (existing && !definition.repeatable) focusInstances = removeFocusInstance(current.focusInstances, existing.instanceId, FOCI, currentClasses, budget)
      else {
        if (definition.repeatable && definition.level > 1) return current
        const parentDefinition = definition.level > 1 ? definition.requirements.find((rule) => rule.condition === 'has_focus')?.id : undefined
        const parent = current.focusInstances.find((item) => item.focusId === parentDefinition)
        const instance: FocusInstance = { instanceId: crypto.randomUUID(), focusId: id, ...(parent ? { parentInstanceId: parent.instanceId } : {}) }
        focusInstances = [...current.focusInstances, instance]
        if (!evaluateFocusInstances(focusInstances, undefined, FOCI, currentClasses, budget).complete) return current
      }
      return { ...current, focusInstances, focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances),
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances) }
    })
  }

  function removeSelectedFocus(id: string) {
    setDraft((current) => {
      const classes = current.classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter((item): item is ClassData => Boolean(item))
      const budget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(classes)))
      const focusInstances = removeFocusInstance(current.focusInstances, id, FOCI, classes, budget)
      return { ...current, focusInstances, focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances),
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances) }
    })
  }

  function upgradeFocus(parentInstanceId: string, focusId: string) {
    setDraft((current) => {
      const classes = current.classChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
      const budget = focusBudgetForProgression(PROGRESSION_BY_ID.get(progressionKeyForClasses(classes)))
      const focusInstances = [...current.focusInstances, { instanceId: crypto.randomUUID(), focusId, parentInstanceId }]
      return evaluateFocusInstances(focusInstances, undefined, FOCI, classes, budget).complete ? { ...current, focusInstances } : current
    })
  }

  function updateFocusRuleChoice(id: string, key: keyof FocusRuleChoice, value: string) {
    setDraft((current) => current.focusInstances.some((item) => item.instanceId === id) ? {
      ...current, focusRuleChoices: { ...current.focusRuleChoices, [id]: { ...current.focusRuleChoices[id], [key]: value } },
    } : current)
  }

  function updateFocusBonusChoice(focusId: string, bonusIndex: number, slotIndex: number, choiceId: string) {
    setDraft((current) => {
      const instance = current.focusInstances.find((item) => item.instanceId === focusId)
      if (!instance) return current
      const definition = FOCUS_BY_ID.get(instance.focusId)
      const detail = evaluateDraftSkills(current).bonuses.details.find((item) => item.focusId === focusId)
      const option = detail?.choices.find((item) => item.bonusIndex === bonusIndex && item.slotIndex === slotIndex)
      if (!option || (choiceId && !option.options.includes(choiceId))) return current
      if (choiceId && current.focusBonusChoices[focusId]?.[String(bonusIndex)]?.some((id, index) => index !== slotIndex && id === choiceId)) return current
      if (definition?.unique_skill && choiceId && current.focusInstances.some((item) => item.instanceId !== focusId && item.focusId === instance.focusId && current.focusBonusChoices[item.instanceId]?.['0']?.[0] === choiceId)) return current
      if (definition?.bonus[bonusIndex]?.action === 'choice_skill' && choiceId &&
        skillChoiceReason(evaluateDraftSkills(current).allocation, `focus:${focusId}:${bonusIndex}:${slotIndex}`, choiceId)) return current
      const choices = keepFocusBonusChoices(current.focusBonusChoices, current.focusInstances)
      const focusChoices = { ...choices[focusId] }
      const slots = [...(focusChoices[String(bonusIndex)] ?? [])]
      slots[slotIndex] = choiceId
      focusChoices[String(bonusIndex)] = slots
      return { ...current, focusBonusChoices: { ...choices, [focusId]: focusChoices } }
    })
  }

  function updateDirectSkill(field: 'backgroundSkill' | 'freeSkill', id: string) {
    if (id && !SKILL_BY_ID.has(id)) return
    const key = field === 'backgroundSkill' ? 'background:free:0' : 'free-skill'
    setDraft((current) => id && skillChoiceReason(evaluateDraftSkills(current).allocation, key, id)
      ? current : { ...current, [field]: id })
  }

  function toggleSpell(slot: ClassSlot, id: string) {
    setSpellNotice('')
    setDraft((current) => {
      const spellChoicesByClassSlot = toggleSpellChoice(current.spellChoicesByClassSlot, slot, id, current.classChoices, SPELLS)
      return { ...current, spellChoicesByClassSlot }
    })
  }

  function toggleArt(classId: string, groupKey: string | null, id: string) {
    setArtNotice('')
    setDraft((current) => ({ ...current, artChoicesByClass: toggleArtChoice(current.artChoicesByClass,
      classId, groupKey, id, current.classChoices, CLASSES, STARTING_ARTS, ARTS) }))
  }

  function restoreSavedDraft() {
    startTransition(() => {
      const saved = readSavedDraft()
      setDraft(saved.draft)
      setSpellNotice(saved.spellNotice)
      setArtNotice(saved.artNotice)
      setEquipmentNotice(saved.equipmentNotice)
    })
  }

  function updateStartingEquipment(choice: StartingEquipmentChoice) {
    setEquipmentNotice('')
    setDraft((current) => ({ ...current, startingEquipment: choice, equipmentPurchases: [], equipmentLoadout: emptyLoadout() }))
  }

  function rollEquipmentSilver() {
    const rolls = Array.from({ length: 3 }, () => randomInt(1, 6))
    setEquipmentNotice('')
    setDraft((current) => current.startingEquipment.method === 'silver'
      ? { ...current, startingEquipment: { method: 'silver', rolls }, equipmentPurchases: [], equipmentLoadout: emptyLoadout() } : current)
  }

  function updateEquipmentPurchase(id: string, count: number) {
    if (!Number.isSafeInteger(count) || count < 0) return
    const previousCount = draft.equipmentPurchases.find((row) => row.id === id)?.count ?? 0
    const purchases = draft.equipmentPurchases.filter((row) => row.id !== id)
    if (count > 0) purchases.push({ id, count })
    const next = evaluateEquipmentInventory({ startingEquipment: draft.startingEquipment,
      purchases, loadout: draft.equipmentLoadout, dexterity: localDexterity },
      STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES)
    // Reductions always remain available so stale or over-budget saved carts can be repaired.
    if (!next.complete && count > previousCount) {
      setEquipmentNotice(next.issues.map(ko).join(' '))
      return
    }
    setEquipmentNotice('')
    setDraft((current) => ({ ...current, equipmentPurchases: purchases,
      equipmentLoadout: pruneEquipmentLoadout(current.equipmentLoadout, next.items) }))
  }

  function clearDraft() {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    startTransition(() => {
      setDraft(createInitialDraft())
      setSpellNotice('')
      setArtNotice('')
      setEquipmentNotice('')
    })
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Worlds Without Number</p>
          <h1>1레벨 캐릭터 만들기</h1>
          <p className="hero-text">
            능력치부터 배경, 클래스, 장비, 기교와 주문까지 차례로 선택해 캐릭터를 만드세요.
            선택한 내용은 자동으로 저장되며, 오른쪽 시트에서 결과를 확인할 수 있습니다.
          </p>
        </div>

        <div className="hero-status">
          <div className={`status-pill ${backendOnline ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            {backendOnline ? '규칙 검증 연결됨' : '규칙 검증 연결 안 됨'}
          </div>
          <div className="status-card">
            <span>불러온 선택지</span>
            <strong>배경 {BACKGROUNDS.length}종 · 포커스 {FOCI.length}종 · 1레벨 주문 {FIRST_LEVEL_SPELLS.length}종</strong>
          </div>
        </div>
      </section>

      <section className="layout-grid">
        <div className="builder-column">
          <section className="card">
            <div className="card-header">
              <div>
                <p className="step-label">1-2단계</p>
                <h2>능력치와 수정치</h2>
              </div>
            </div>

            <div className="segmented attribute-method" role="group" aria-label="능력치 배정 방식">
              <button type="button" className={draft.attributeMethod === 'array' ? 'active' : ''}
                aria-pressed={draft.attributeMethod === 'array'} onClick={() => { if (draft.attributeMethod !== 'array') resetToArray() }}>고정 수치 배정</button>
              <button type="button" className={draft.attributeMethod === 'rolled' ? 'active' : ''}
                aria-pressed={draft.attributeMethod === 'rolled'} onClick={() => { if (draft.attributeMethod !== 'rolled') rerollInOrder() }}>순서대로 3d6 굴리기</button>
            </div>

            {draft.attributeMethod === 'array' ? (
              <p className="support-text allocation-help">14, 12, 11, 10, 9, 7을 각각 한 번씩 배정하세요. 이미 사용한 수치를 고르면 두 능력치의 수치가 서로 바뀝니다.</p>
            ) : (
              <div className="info-panel allocation-help">
                <p>3d6 결과 여섯 개를 근력, 민첩, 건강, 지능, 지혜, 매력 순서대로 배정합니다. 주사위 결과를 직접 수정하거나 순서를 바꿀 수 없습니다.</p>
                <label>
                  <span>주사위로 정한 능력치 하나를 14로 대체 (선택 사항)</span>
                  <select aria-label="14로 대체할 능력치" value={draft.attributeOverride}
                    onChange={(event) => setDraft((current) => ({ ...current, ...selectAttributeOverride(current, event.target.value) }))}>
                    <option value="">모든 주사위 결과 유지</option>
                    {ATTRIBUTE_KEYS.map((key) => (
                      <option key={key} value={key}>{nameFor(key)}: {draft.attributes[key]} → 14</option>
                    ))}
                  </select>
                </label>
                <p>선택을 바꾸거나 해제하면 이전 능력치는 원래 주사위 결과로 돌아갑니다.</p>
                <button type="button" onClick={rerollInOrder}>능력치 여섯 개 모두 다시 굴리기</button>
              </div>
            )}

            <div className="attribute-grid">
              {ATTRIBUTE_KEYS.map((key) => {
                const attribute = ATTRIBUTES.find((item) => item.id === key)
                return (
                  <label key={key} className="attribute-card">
                    <span>{attribute?.name ?? nameFor(key)}</span>
                    {draft.attributeMethod === 'array' ? (
                      <select aria-label={`${nameFor(key)} 수치`} value={draft.attributes[key]} onChange={(event) => updateArrayAttribute(key, Number(event.target.value))}>
                        {ARRAY_VALUES.map((value) => (
                          <option key={`${key}-${value}`} value={value}>{value}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input aria-label={`${nameFor(key)} 수치`} type="number" readOnly value={allocatedScores[key]} />
                        <small>주사위 결과 {draft.attributes[key]}{draft.attributeOverride === key ? ' / 14로 대체됨' : ''}</small>
                      </>
                    )}
                    <strong title="배정한 능력치의 수정치입니다. 포커스에 의한 능력치 변화와 보너스는 최종 시트에 반영됩니다.">{plusModifier(getModifier(allocatedScores[key]))}</strong>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="step-label">3-4단계</p>
                <h2>배경과 시작 기술</h2>
              </div>
            </div>

            <div className="form-grid">
              <label>
                <span>배경</span>
                <select value={draft.background} onChange={(event) => handleBackgroundChange(event.target.value)}>
                  {BACKGROUNDS.map((background) => (
                    <option key={background.id} value={background.id}>{background.name}</option>
                  ))}
                </select>
              </label>

              <div className="info-panel">
                <strong>{activeBackground.name}</strong>
                <p>{activeBackground.description}</p>
                <p><strong>보너스 기술:</strong> {activeBackground.free_skill.map(describeAction).join(', ')}</p>
                {!fixedBackgroundSkill && (
                  <label className="background-bonus-choice">
                    <span className="sr-only">보너스 기술 선택</span>
                    <select value={draft.backgroundSkill} aria-label="보너스 기술 선택" aria-describedby="background:free:0-feedback"
                      onChange={(event) => updateDirectSkill('backgroundSkill', event.target.value)}>
                      <option value="">보너스 기술 선택</option>
                      <SkillChoiceOptions options={backgroundFreeOptions.map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))}
                        allocation={skillAllocation} choiceKey="background:free:0" />
                    </select>
                    <SkillChoiceFeedback allocation={skillAllocation} choiceKey="background:free:0" />
                    <small>이 배경에서 허용하는 기술 중 하나를 선택하세요.</small>
                  </label>
                )}
                <p><strong>추천 기술:</strong> {activeBackground.sugg_skill.map(describeAction).join(', ')}</p>
              </div>
            </div>

            <div className="background-roll-tables">
              {(['growth', 'learn'] as const).map((table) => {
                const rows = getBackgroundTable(activeBackground, table)
                return (
                  <table key={table} className="background-roll-table">
                    <caption>{table === 'growth' ? '성장 표' : '학습 표'}</caption>
                    <thead>
                      <tr><th scope="col">d{rows.length}</th><th scope="col">결과</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((action, index) => (
                        <tr key={index}>
                          <th scope="row">{index + 1}</th>
                          <td>{describeAction(action)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })}
            </div>

            <div className="background-method">
              <h3>추가 배경 기술 획득 방식</h3>
              <div className="segmented" role="group" aria-label="배경 기술 획득 방식">
                <button type="button" className={draft.backgroundMethod === 'pick' ? 'active' : ''}
                  aria-pressed={draft.backgroundMethod === 'pick'} onClick={() => updateBackgroundMethod('pick')}>
                  기술 2개 선택
                </button>
                <button type="button" className={draft.backgroundMethod === 'roll' ? 'active' : ''}
                  aria-pressed={draft.backgroundMethod === 'roll'} onClick={() => updateBackgroundMethod('roll')}>
                  주사위 3번 굴리기
                </button>
              </div>
              <p className="support-text">배경의 보너스 기술에 더해, 위 방식 중 하나로 추가 기술을 얻습니다. 방식을 바꾸면 이전 선택이나 주사위 결과는 초기화됩니다.</p>
            </div>

            {draft.backgroundMethod === 'pick' && (
              <>
                <p className="support-text">이 배경의 학습 표에서 기술 두 개를 고르세요. '아무 기술' 항목은 고를 수 없으며, '전투 기술' 항목에서는 전투 기술만 선택할 수 있습니다.</p>
                <div className="form-grid two-up">
                  {[0, 1].map((index) => (
                    <label key={index}>
                      <span>학습 기술 {index + 1}</span>
                      <select value={draft.backgroundPicks[index] ?? ''} aria-label={`학습 기술 ${index + 1}`}
                        aria-describedby={`background:pick:${index}-feedback`}
                        aria-invalid={skillAllocation.issues.some((issue) => issue.key === `background:pick:${index}`)}
                        onChange={(event) => updateBackgroundPick(index, event.target.value)}>
                        <option value="">학습 기술 선택</option>
                        <SkillChoiceOptions options={learningOptions.map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))}
                          allocation={skillAllocation} choiceKey={`background:pick:${index}`} />
                      </select>
                      <SkillChoiceFeedback allocation={skillAllocation} choiceKey={`background:pick:${index}`} />
                    </label>
                  ))}
                </div>
              </>
            )}

            {draft.backgroundMethod === 'roll' && (
              <>
                <div className="card-header inline-header">
                  <div>
                    <p className="subheading">배경 주사위 배정</p>
                    <h3>세 번의 주사위를 표에 배정</h3>
                  </div>
                  <button type="button" onClick={rollBackgroundTables}>배정한 주사위 굴리기</button>
                </div>
                <p className="support-text">성장 표와 학습 표에 원하는 조합으로 나누어 총 세 번 굴립니다.</p>
                <div className="form-grid three-up">
                  {[0, 1, 2].map((index) => {
                    const result = draft.backgroundRollResults[index]
                    const options = result ? backgroundChoiceOptions(result) : []
                    return (
                      <div key={index} className="roll-card">
                        <label>
                          <span>주사위 {index + 1}</span>
                          <select value={draft.backgroundRollTables[index] ?? 'learn'}
                            onChange={(event) => updateBackgroundRollTable(index, event.target.value as BackgroundRollTable)}>
                            <option value="growth">{tableDieLabel(activeBackground, 'growth')}</option>
                            <option value="learn">{tableDieLabel(activeBackground, 'learn')}</option>
                          </select>
                        </label>
                        {result ? (
                          <>
                            <small className="roll-result">{`${result.table === 'growth' ? '성장' : '학습'} ${result.roll}: ${result.label}`}</small>
                            {options.length > 0 ? (
                              <label>
                                <span>{backgroundChoiceLabel(result)}</span>
                                <select aria-label={`주사위 ${index + 1}: ${backgroundChoiceLabel(result)}`}
                                  aria-describedby={result.action === 'tag_skill' ? `background:roll:${index}-feedback` : undefined}
                                  value={result.choiceId ?? ''} onChange={(event) => updateBackgroundRollChoice(index, event.target.value)}>
                                  <option value="">결과 선택</option>
                                  {result.action === 'tag_skill' ? <SkillChoiceOptions options={options}
                                    allocation={skillAllocation} choiceKey={`background:roll:${index}`} /> : options.map((option) => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                  ))}
                                </select>
                                {result.action === 'tag_skill' && <SkillChoiceFeedback allocation={skillAllocation} choiceKey={`background:roll:${index}`} />}
                              </label>
                            ) : result.skillId ? (
                              <p className="locked-result">획득 기술: {skillLabel(result.skillId)}</p>
                            ) : null}
                          </>
                        ) : <small className="roll-result">아직 굴리지 않음</small>}
                      </div>
                    )
                  })}
                </div>
                <p className="support-text">
                  고정 기술은 변경할 수 없습니다. 능력치 증가, 아무 기술, 전투 기술 결과는 허용된 선택지에서 골라 적용하세요.
                </p>
              </>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="step-label">5-7단계</p>
                <h2>클래스·포커스·자유 기술</h2>
              </div>
            </div>

            <p className="support-text">순수 클래스 가능: {CLASSES.filter((option) => option.can_be_full_class).map((option) => option.name).join(', ')}. 그 외 클래스는 부분 클래스로만 선택할 수 있으므로 다른 클래스와 조합해야 합니다. 기교와 주문은 아래에서 선택합니다.</p>
            {!classValidation.complete && <div className="skill-review" role="status">
              <strong>클래스 선택을 확인하세요</strong>
              <ul>{classValidation.issues.map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>
            </div>}
            {fixedClassGrants.length > 0 && <p className="support-text">클래스의 고정 기술: {fixedClassGrants.map((grant) => skillLabel(grant.skillId)).join(', ')}. 클래스 보너스는 서로 다른 클래스마다 한 번씩 적용합니다.</p>}
            <div className="form-grid two-up">
              {[0, 1].map((index) => {
                const options = CLASSES.map((classOption) => ({
                  classOption, reason: classChoiceReason(classOption.id, draft.classChoices[index === 0 ? 1 : 0], CLASSES),
                }))
                const unavailable = options.filter((option) => option.reason)
                const helpId = `class-slot-${index}-restrictions`
                return <div key={index}>
                <label>
                  <span>{index === 0 ? '첫 번째 클래스' : '두 번째 클래스'}</span>
                  <select
                    aria-invalid={!classValidation.complete}
                    aria-describedby={unavailable.length > 0 ? helpId : undefined}
                    value={draft.classChoices[index] ?? CLASSES[0]?.id ?? ''}
                    onChange={(event) => updateClassChoice(index, event.target.value)}
                  >
                    {options.map(({ classOption, reason }) => (
                      <option key={`${index}-${classOption.id}`} value={classOption.id}
                        disabled={Boolean(reason)} title={reason ? ko(reason) : undefined}>
                        {classLabel(classOption)} · {nameFor(classOption.archetype)}{classOption.spells ? ' · 주문' : ''}{classOption.arts ? ' · 기교' : ''}
                        {!classOption.can_be_full_class ? ' / 부분 전용' : ''}
                        {reason ? ` / 선택 불가: ${ko(reason)}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <small className="focus-english-name" lang="en">{CLASS_BY_ID.get(draft.classChoices[index])?.eng_name}</small>
                {unavailable.length > 0 && <details className="spell-description" id={helpId}>
                  <summary>{index + 1}번째 클래스에서 선택할 수 없는 이유</summary>
                  <ul>{unavailable.map(({ classOption, reason }) => <li key={classOption.id}>{ko(reason)}</li>)}</ul>
                </details>}
                </div>
              })}
            </div>

            <div className="info-panel compact">
              <strong>클래스 성장 수치{!activeProgression && ' 미정'}</strong>
              <p>
                히트 주사위 {activeProgression?.hd ?? '미정'} · 공격 보너스 {activeProgression?.ab ?? '미정'} ·
                포커스 선택권 {focusLimit}개
              </p>
            </div>

            {classSkillChoices.length > 0 && <section className="info-panel" aria-label="클래스 보너스 기술">
              <h3>클래스 보너스 기술 선택</h3>
              <p className="support-text">클래스 보너스는 서로 다른 클래스마다 한 번씩 적용합니다. 배경이나 클래스의 고정 기술로 이미 두 번 배정되지 않은 기술을 고르세요. 이 선택은 포커스와 별도의 자유 기술보다 먼저 계산합니다.</p>
              <div className="form-grid two-up">
                {classSkillChoices.map((grant) => <label key={grant.key}>
                  <span>{ko(grant.label)}</span>
                  <select value={grant.skillId} aria-label={ko(grant.label)}
                    aria-describedby={`${grant.key}-feedback`}
                    aria-invalid={skillAllocation.issues.some((issue) => issue.key === grant.key)}
                    onChange={(event) => updateClassBonusChoice(grant, event.target.value)}>
                    <option value="">기술 선택</option>
                    {grant.skillId && !SKILL_BY_ID.has(grant.skillId) && <option value={grant.skillId} disabled>알 수 없는 기술 (다시 선택하세요)</option>}
                    <SkillChoiceOptions options={skillOptions} allocation={skillAllocation} choiceKey={grant.key} />
                  </select>
                  <SkillChoiceFeedback allocation={skillAllocation} choiceKey={grant.key} />
                </label>)}
              </div>
            </section>}

            <div className="form-grid">
              <label>
                <span>자유 기술</span>
                <select value={draft.freeSkill} aria-label="자유 기술" aria-describedby="free-skill-feedback"
                  aria-invalid={skillAllocation.issues.some((issue) => issue.key === 'free-skill')}
                  onChange={(event) => updateDirectSkill('freeSkill', event.target.value)}>
                  <option value="">자유 기술 선택</option>
                  <SkillChoiceOptions options={skillOptions} allocation={skillAllocation} choiceKey="free-skill" />
                </select>
                <SkillChoiceFeedback allocation={skillAllocation} choiceKey="free-skill" />
              </label>
            </div>

            <div>
              <p className="subheading">포커스 ({draft.focusInstances.length}/{focusLimit})</p>
              <p className="support-text">전사 선택권은 전투, 전문가 선택권은 비전투 분류의 포커스에 사용합니다. 자유 선택권은 조건에 맞는 모든 포커스에 사용할 수 있습니다. 분류가 없거나 주문 전용인 포커스는 자유 선택권을 사용하며, 선택권 배정은 자동으로 조정됩니다.</p>
              <ul className="support-text" aria-label="포커스 선택권" aria-live="polite">
                {focusCreation.allowances.counts.map((count) => <li key={count.type}>{FOCUS_ALLOWANCE_LABELS[count.type]}: {count.used}/{count.total}개 사용 / {count.remaining}개 남음</li>)}
              </ul>
              <FocusInstances instances={draft.focusInstances} foci={FOCI} classes={selectedClasses}
                budget={focusBudgetForProgression(activeProgression)} assignments={focusCreation.allowances.assignments}
                ruleChoices={draft.focusRuleChoices} scores={allocatedScores} attributes={ATTRIBUTES}
                onRemove={removeSelectedFocus} onUpgrade={upgradeFocus} onRuleChoice={updateFocusRuleChoice} />
              {focusCreation.issues.length > 0 && <ul className="issue-list" role="status">{focusCreation.issues.map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>}
              <div className="focus-bonus-list">
                {localFocusBonuses.details.map((detail) => {
                  const instance = draft.focusInstances.find((item) => item.instanceId === detail.focusId)
                  const focus = instance && FOCUS_BY_ID.get(instance.focusId)
                  if (!focus || !instance) return null
                  const instanceLabel = focusInstanceLabel(instance, draft.focusInstances, FOCI)
                  return (
                    <section key={instance.instanceId} className="info-panel focus-bonus-panel" aria-label={`${instanceLabel} 보너스`}>
                      <h4>{instanceLabel}: 보너스</h4>
                      {focus.bonus.length === 0 && !detail.skills.length && !detail.modifierChanges.length && !detail.capOverrides.length && <p className="support-text">이 선택에는 기술·수정치 보정이 없습니다. 다른 효과는 특성 묶음, 능력치 규칙, 플레이 참고사항을 확인하세요.</p>}
                      {detail.skills.length > 0 && <p>기술 배정 (레벨은 시트 참고): {detail.skills.map(skillLabel).join(', ')}</p>}
                      {detail.modifierChanges.length > 0 && <p>수정치 보정 (최종 한계 적용 전): {detail.modifierChanges.map((change) => `${nameFor(change.id)} ${plusModifier(change.value)}`).join(', ')}</p>}
                      {detail.capOverrides.length > 0 && <p>수정치 한계 변경: {detail.capOverrides.map((cap) => `${nameFor(cap.id)} ${ko(modifierLimitText({ action: 'attribute_modifier', cap_override: cap }))}`).join('; ')}. 수정치 보너스가 아니라 최종 한계값입니다.</p>}
                      {detail.manualReview.length > 0 && <div className="skill-review">
                        <strong>수동으로 적용할 규칙</strong>
                        <ul>{detail.manualReview.map((note) => <li key={note}>{ko(note)}</li>)}</ul>
                      </div>}
                      {detail.issues.length > 0 && <ul className="issue-list" role="status">{detail.issues.map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>}
                      {detail.choices.map((choice) => {
                        const selected = draft.focusBonusChoices?.[instance.instanceId]?.[String(choice.bonusIndex)]?.[choice.slotIndex] ?? ''
                        const label = choice.kind === 'skill' ? '보너스 기술' : focus.bonus[choice.bonusIndex].value === undefined ? '수정치 한계' : `능력치 수정치 ${plusModifier(choice.value)}`
                        const otherChoices = (draft.focusBonusChoices[instance.instanceId]?.[String(choice.bonusIndex)] ?? []).filter((_, index) => index !== choice.slotIndex)
                        if (focus.unique_skill && choice.kind === 'skill') otherChoices.push(...draft.focusInstances
                          .filter((item) => item.focusId === focus.id && item.instanceId !== instance.instanceId)
                          .flatMap((item) => draft.focusBonusChoices[item.instanceId]?.['0'] ?? []))
                        return (
                          <label key={`${choice.bonusIndex}-${choice.slotIndex}`}>
                            <span>{label} (보너스 {choice.bonusIndex + 1}, 선택 {choice.slotIndex + 1})</span>
                            <select aria-label={`${instanceLabel}: ${label}, 선택 ${choice.slotIndex + 1}`}
                              aria-describedby={choice.kind === 'skill' ? `focus:${instance.instanceId}:${choice.bonusIndex}:${choice.slotIndex}-feedback` : undefined}
                              aria-invalid={!choice.selected}
                              value={choice.options.includes(selected) ? selected : ''}
                              onChange={(event) => updateFocusBonusChoice(instance.instanceId, choice.bonusIndex, choice.slotIndex, event.target.value)}>
                              <option value="">{choice.kind === 'skill' ? '기술' : '능력치'} 선택</option>
                              {choice.kind === 'skill' ? <SkillChoiceOptions
                                options={choice.options.map((id) => ({ id, label: skillLabel(id) }))}
                                excludedIds={otherChoices}
                                excludedReason={focus.unique_skill ? '다른 항목에서 이미 선택한 기술입니다. 다른 기술을 고르세요' : undefined}
                                allocation={skillAllocation} choiceKey={`focus:${instance.instanceId}:${choice.bonusIndex}:${choice.slotIndex}`} />
                                : choice.options.map((id) => (
                                  <option key={id} value={id} disabled={otherChoices.includes(id)}>{nameFor(id)}{otherChoices.includes(id) ? ' - 이 보너스에서 이미 선택함' : ''}</option>
                                ))}
                            </select>
                            {choice.limits && <small className="support-text">수정치 한계 변경: {ko(choice.limits)}. 이 능력치에만 적용합니다. 모든 보정치를 합산한 뒤 최종 한계로 제한합니다.</small>}
                            {choice.kind === 'skill' && <SkillChoiceFeedback allocation={skillAllocation}
                              choiceKey={`focus:${instance.instanceId}:${choice.bonusIndex}:${choice.slotIndex}`} />}
                          </label>
                        )
                      })}
                    </section>
                  )
                })}
              </div>
              <p className="support-text">포커스의 고정 기술 부여로 같은 기술을 세 번째 받으면 2레벨이 되는 대신 다음 레벨을 위한 성장 점수 2점을 얻습니다. 직접 선택하는 기술은 두 번까지만 배정할 수 있습니다. 수정치의 기본 범위는 -2부터 +2까지이며, 명시된 한계 변경은 중첩 없이 적용합니다. 모든 보정치를 합산한 뒤 한계로 제한합니다. 미구현 효과는 직접 확인해 적용하세요.</p>
              <FocusPicker foci={FOCI} classes={CLASSES} selectedClasses={selectedClasses}
                instances={draft.focusInstances} budget={focusBudgetForProgression(activeProgression)}
                selectedIds={draft.focusInstances.map((item) => item.focusId)} limit={focusLimit} skills={SKILLS} attributes={ATTRIBUTES} abilities={ABILITIES} onToggle={toggleFocus} />
            </div>

          </section>

          <EquipmentPicker choice={draft.startingEquipment} packages={STARTING_EQUIPMENT} equipment={EQUIPMENT}
            evaluation={equipmentEvaluation} notice={equipmentNotice} onChange={updateStartingEquipment} onRoll={rollEquipmentSilver} />
          <EquipmentInventory evaluation={equipmentInventory} purchases={draft.equipmentPurchases} loadout={draft.equipmentLoadout}
            equipment={EQUIPMENT} properties={EQUIPMENT_PROPERTIES} onPurchase={updateEquipmentPurchase}
            onLoadout={(equipmentLoadout) => setDraft((current) => ({ ...current, equipmentLoadout }))} />
          <section className="card">
            <div className="card-header">
              <div>
                <p className="step-label">12-13단계</p>
                <h2>전투 수치·인물 정보·메모</h2>
              </div>
            </div>

            <div className="info-panel allocation-help">
              <strong>방어도는 실제로 착용하거나 손에 든 장비로 계산합니다</strong>
              <p>10-11단계에서 보유한 갑옷과 방패를 착용하세요. 갑옷과 방패 중 높은 기본 방어도를 사용합니다. 갑옷의 기본 방어도가 방패 이상이면 방패로 +1을 받고, 마지막으로 최종 민첩 수정치를 더합니다.</p>
            </div>

            <div className="form-grid two-up">
              <label>
                <span>이름</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="알드렌 보스" />
              </label>
              <label>
                <span>목표</span>
                <input value={draft.goal} onChange={(event) => setDraft((current) => ({ ...current, goal: event.target.value }))} placeholder="잃어버린 기록 보관소를 되찾기" />
              </label>
            </div>

            <label>
              <span>메모</span>
              <textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="장비, 세력과의 관계, 캠페인 기록, 아직 정하지 못한 내용을 적으세요." />
            </label>

          </section>
          <ArtPicker plans={artPlans} choices={artEvaluation.selected} notice={artNotice} onToggle={toggleArt} />
          <SpellPicker classIds={draft.classChoices} classes={CLASSES} spells={FIRST_LEVEL_SPELLS}
            choices={draft.spellChoicesByClassSlot} notice={spellNotice} onToggle={toggleSpell} />
          <div className="button-row">
            <button type="button" onClick={restoreSavedDraft}>저장된 캐릭터 불러오기</button>
            <button type="button" onClick={clearDraft}>캐릭터 초기화</button>
          </div>
        </div>

        <aside className="summary-column">
          <section className="card summary-card">
            <div className="card-header">
              <div>
                <p className="step-label">실시간 캐릭터 시트</p>
                <h2>최종 캐릭터 시트</h2>
              </div>
            </div>

            <section className="class-build-summary" aria-label="클래스 조합" aria-live="polite">
              <h3>클래스 조합</h3>
              <strong className="class-build-name">{ko(resolvedClassBuild)}</strong>
              <p className="support-text">{[0, 1].map((slot) => CLASS_BY_ID.get(draft.classChoices[slot])?.name ?? '미선택').join(' / ')}</p>
              <p className="focus-english-name" lang="en">{[0, 1].map((slot) => CLASS_BY_ID.get(draft.classChoices[slot])?.eng_name).filter(Boolean).join(' / ')}</p>
            </section>

            <AbilitySheet evaluation={abilitySelection} classes={CLASSES} foci={FOCI} instances={draft.focusInstances} />

            <div className="summary-block">
              <h3>능력치 수정치</h3>
              <div className="modifier-grid">
                {ATTRIBUTE_KEYS.map((key) => (
                  <div key={key}>
                    <span>{nameFor(key)}</span>
                    <strong>{backendOnline ? plusModifier(evaluation.modifiers[key]) : '--'}</strong>
                    <small>능력치 {backendOnline ? evaluation.attributes?.[key] ?? allocatedScores[key] : allocatedScores[key]}</small>
                    {backendOnline && evaluation.attributes?.[key] !== undefined && evaluation.attributes[key] !== allocatedScores[key] && <small>원래 배정값 {allocatedScores[key]}</small>}
                    {backendOnline && <small>기본 {plusModifier(evaluation.baseModifiers?.[key] ?? 0)} / 포커스 {plusModifier(evaluation.focusModifierBonuses?.[key] ?? 0)}</small>}
                    {backendOnline && evaluation.modifierCaps?.[key] && <small>한계 {plusModifier(evaluation.modifierCaps[key].min)} ~ {plusModifier(evaluation.modifierCaps[key].max)}</small>}
                  </div>
                ))}
              </div>
            </div>

            <div className="sheet-grid">
              <div><span>체력</span><strong>{evaluation.derived.hitPoints}</strong></div>
              <div><span>히트 주사위</span><strong>{evaluation.derived.hitDice || `d${evaluation.derived.hitDie || 0}`}</strong></div>
              <div><span>방어도</span><strong>{evaluation.derived.ac ?? '미정'}</strong></div>
              <div><span>기본 공격 보너스</span><strong>{plusModifier(evaluation.derived.baseAttackBonus)}</strong></div>
              <div><span>포커스 공격 보너스</span><strong>{plusModifier(evaluation.derived.focusAttackBonus ?? 0)}</strong></div>
              <div><span>총 공격 보너스</span><strong>{plusModifier(evaluation.derived.attackBonus ?? evaluation.derived.baseAttackBonus)}</strong></div>
              <div><span>육체 내성</span><strong>{evaluation.derived.physicalSave}</strong></div>
              <div><span>회피 내성</span><strong>{evaluation.derived.evasionSave}</strong></div>
              <div><span>정신 내성</span><strong>{evaluation.derived.mentalSave}</strong></div>
              <div><span>행운 내성</span><strong>{evaluation.derived.luckSave}</strong></div>
            </div>

            {backendOnline && Boolean(evaluation.derived.hitDiceAdjustments?.length) && <div className="info-panel" aria-label="히트 주사위 조정">
              <strong>히트 주사위 조정</strong>
              <p>{evaluation.derived.baseHitDice} &rarr; {evaluation.derived.hitDice}: {evaluation.derived.hitDiceAdjustments.map((item) => nameFor(item.abilityId)).join(', ')}.</p>
              <p className="support-text">시작 체력은 최종 히트 주사위의 최댓값에 최종 건강 수정치를 더하며, 최소 1입니다.</p>
            </div>}

            {backendOnline && Boolean(evaluation.derived.baseAttackAdjustments?.length) && <div className="info-panel" aria-label="기본 공격 보너스 조정">
              <strong>기본 공격 보너스 조정</strong>
              <p>클래스 성장 수치 {plusModifier(evaluation.derived.progressionAttackBonus)} + 조정 ({plusModifier(evaluation.derived.baseAttackBonusAdjustment)}) = 기본 공격 보너스 {plusModifier(evaluation.derived.baseAttackBonus)}.</p>
              <ul>{evaluation.derived.baseAttackAdjustments.map((item) => <li key={item.instanceId}>{FOCUS_BY_ID.get(item.focusId)?.name || '알 수 없는 포커스'}: {plusModifier(item.value)}</li>)}</ul>
              <p className="support-text">일반적인 포커스 공격 보너스는 별도로 더합니다. 연결된 상위 레벨은 하위 레벨의 조정을 유지하며 중복 적용하지 않습니다.</p>
            </div>}

            <p className="support-text">내성은 목표값이므로 낮을수록 유리합니다. 포커스의 상시 내성 보너스는 반영되어 있으며, 조건부 보정은 플레이 참고사항에 표시합니다.</p>
            {Object.values(evaluation.derived.saveBonuses ?? {}).some(Boolean) && <p>포커스 내성 보너스: {Object.entries(evaluation.derived.saveBonuses).map(([id, value]) => `${nameFor(id)} ${plusModifier(value)}`).join(', ')}.</p>}
            {Boolean(evaluation.derived.encumbranceStrengthBonus || evaluation.derived.systemStrainMaxBonus) && <div className="info-panel">
              <p>하중 계산용 근력 보정: {plusModifier(evaluation.derived.encumbranceStrengthBonus ?? 0)}</p>
              <p>최대 기관계 부담 보정: {plusModifier(evaluation.derived.systemStrainMaxBonus ?? 0)}</p>
              <small>보정치만 표시합니다. 장비 운반 한도와 현재 기관계 부담은 추적하지 않습니다.</small>
            </div>}

            <section className="summary-block" aria-label="캐릭터 시트의 시작 장비">
              <h3>시작 장비</h3>
              <InventorySummary evaluation={equipmentInventory} equipment={EQUIPMENT} properties={EQUIPMENT_PROPERTIES} />
            </section>

            <div className="summary-block">
              <h3>기술 레벨</h3>
              <p className="support-text">미숙련 기술은 -1, 생성 시 최고 레벨은 1입니다. 성장 점수로 시작 레벨이 오르지는 않습니다.</p>
              <table className="skill-table">
                <caption>생성 시 기술과 성장 점수</caption>
                <thead><tr><th scope="col">기술</th><th scope="col">레벨</th><th scope="col">성장</th></tr></thead>
                <tbody>{SKILLS.map((skill) => {
                  const state = skillAllocation.states[skill.id]!
                  return <tr key={skill.id} data-skill-id={skill.id} className={state.level === -1 ? 'untrained' : 'trained'}>
                    <th scope="row">
                      <span className="skill-name">
                        {SKILL_ICONS[skill.id] && <span className="material-symbols-outlined skill-icon" aria-hidden="true">{SKILL_ICONS[skill.id]}</span>}
                        <span className="skill-name-text">{skill.name}<small>{skill.id}</small></span>
                      </span>
                    </th>
                    <td><strong>{state.level}</strong></td>
                    <td>{state.advancementPoints ? <strong>2레벨을 위한 성장 점수 {state.advancementPoints}점</strong>
                      : state.allotments ? `${state.allotments}회 배정` : '미숙련'}</td>
                  </tr>
                })}</tbody>
              </table>
              {skillAllocation.issues.length > 0 && <div className="skill-review" role="status">
                <strong>기술 선택을 확인하세요</strong>
                <ul>{skillAllocation.issues.map((issue) => <li key={issue.key}>{ko(issue.message)}</li>)}</ul>
                <p>규칙에 맞지 않는 직접 선택은 기술 레벨이나 성장 점수를 부여하지 않습니다.</p>
              </div>}
            </div>

            <div className="summary-block">
              <p className="subheading">선택한 포커스</p>
              <div className="tag-row">
                {draft.focusInstances.map((instance) => {
                  return <span key={instance.instanceId} className="tag">{focusInstanceLabel(instance, draft.focusInstances, FOCI)}</span>
                })}
              </div>
            </div>
            {focusCreation.scoreChanges.length > 0 && <section className="summary-block" aria-label="포커스로 인한 능력치 변화">
              <h3>포커스로 인한 능력치 변화</h3>
              <ul>{focusCreation.scoreChanges.map((change) => <li key={`${change.instanceId}-${change.id}`}>{nameFor(change.id)}: {change.before} → {change.after}</li>)}</ul>
            </section>}
            {focusCreation.notes.length > 0 && <section className="summary-block" aria-label="포커스 플레이 참고사항">
              <h3>포커스 플레이 참고사항</h3>
              <ul>{focusCreation.notes.map((note, index) => <li key={`${note.instanceId}-${index}`}>{ko(note.text)}</li>)}</ul>
            </section>}

            {artEvaluation.classes.length > 0 && <div className="summary-block">
              <p className="subheading">클래스 기교</p>
              {artEvaluation.classes.map((result) => <div className="learned-spell-summary" key={result.classId}>
                <h4>{CLASS_BY_ID.get(result.classId)?.name} ({result.learned.length}/{result.required})</h4>
                <div className="tag-row">{result.learned.map((id) => {
                  const art = ARTS.find((option) => option.class_id === result.classId && option.id === id)
                  return <span className="tag bilingual-tag" key={id}>
                    <span>{art?.name ?? '알 수 없는 기교'}{result.fixed.includes(id) ? ' / 자동 습득' : ''}</span>
                    {art?.eng_name && <small lang="en">{art.eng_name}</small>}
                  </span>
                })}</div>
                {!result.complete && <p className="warning-text">시작 기교 선택을 확인하세요.</p>}
              </div>)}
            </div>}

            {draft.spellChoicesByClassSlot.flat().length > 0 ? (
              <div className="summary-block">
                <p className="subheading">습득한 1레벨 주문</p>
                {draft.spellChoicesByClassSlot.map((ids, slot) => ids.length > 0 && <div key={slot} className="learned-spell-summary">
                  <h4>{slot + 1}번째 클래스: {CLASS_BY_ID.get(draft.classChoices[slot])?.name} ({ids.length}/2)</h4>
                  <div className="tag-row">{ids.map((spellId) => {
                    const spell = SPELL_BY_ID.get(spellId)
                    return <span key={spellId} className="tag">{spell?.name ?? '알 수 없는 주문'} / 1레벨</span>
                  })}</div>
                </div>)}
              </div>
            ) : null}

            <div className="summary-block">
              <p className="subheading">생성 단계 확인</p>
              <ul className="checklist">
                {evaluation.stepStatus.map((step) => (
                  <li key={step.key} className={step.complete ? 'complete' : 'incomplete'}>{ko(step.label)}</li>
                ))}
              </ul>
            </div>

            <div className="summary-block">
              <p className="subheading">확인이 필요한 항목</p>
              {evaluationError ? (
                <p className="warning-text">{evaluationError}</p>
              ) : evaluation.issues.length > 0 ? (
                <ul className="issue-list">
                  {evaluation.issues.map((issue) => (
                    <li key={issue}>{ko(issue)}</li>
                  ))}
                </ul>
              ) : (
                <p className="support-text">현재 확인된 규칙 위반이 없습니다.</p>
              )}
            </div>

            <div className="summary-block">
              <p className="subheading">적용 중인 규칙과 제한</p>
              <ul className="issue-list muted">
                {evaluation.assumptions.map((assumption) => (
                  <li key={ko(assumption)}>{ko(assumption)}</li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
