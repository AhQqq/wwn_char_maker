import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import './App.css'
import { CreationNavigation } from './CreationNavigation'
import { RulesLink } from './RulesLink'
import { CharacterSheet } from './CharacterSheet'
import { plusModifier } from './formatting'
import { evaluateCreationEffects, progressionForClasses } from '../../shared/characterCreation'
import type { CharacterEvaluation } from '../../shared/characterEvaluation'
import type { AttributeData, SkillData, BackgroundOption as BackgroundData, ClassData, DataAction, ProgressionTable, CharacterData } from '../../shared/characterData'
import { evaluatePreviewCore } from './characterPreview'
import { refundGrantedFocusPicks, resolveArtFocusGrants } from '../../shared/artFocusGrants'
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
import { getModifier } from '../../shared/attributeModifier'
import { focusCreationLevelReason, modifierLimitText, normalizeFocusBonusChoices } from '../../shared/focusBonuses'
import { evaluateFocusInstances, instanceFocusData, normalizeFocusRuleChoices, pruneFocusInstances, readFocusInstances, removeFocusInstance } from '../../shared/focusCreation'
import type { FocusInstance, FocusRuleChoice, FocusRuleChoices } from '../../shared/focusCreation'
import { evaluateFocusTraditions } from '../../shared/focusTraditions'
import { FOCUS_ALLOWANCE_LABELS } from './korean'
import type { FocusAllowance } from '../../shared/focusAllowances'
import { FocusInstances } from './FocusInstances'
import { classSkillGrants, normalizeClassBonusChoices, skillChoiceReason } from '../../shared/skillAllocation'
import type { ClassBonusChoices, ClassSkillGrant } from '../../shared/skillAllocation'
import { SkillChoiceFeedback, SkillChoiceOptions } from './SkillChoices'
import { isFirstLevelSpell, normalizeSpellChoices, restoreSpellChoices, toggleSpellChoice } from '../../shared/spellSelection'
import type { ClassSlot, SpellChoices, SpellOption as SpellData } from '../../shared/spellSelection'
import { SpellPicker } from './SpellPicker'
import { classChoiceReason, evaluateClassChoices } from '../../shared/classSelection'
import { classBuildName } from '../../shared/classBuild'
import type { ClassCombinations } from '../../shared/classBuild'
import { evaluateArtChoices, getArtPlans, normalizeArtChoices, restoreArtChoices, toggleArtChoice } from '../../shared/artSelection'
import type { ArtChoices } from '../../shared/artSelection'
import { ARTS, STARTING_ARTS } from './artData'
import { ArtPicker } from './ArtPicker'
import type { AbilityDefinition, ClassAbilityRules } from '../../shared/classAbilities'
import { restoreStartingEquipment } from '../../shared/startingEquipment'
import type { EquipmentDefinition, EquipmentPackage, EquipmentProperty, StartingEquipmentChoice } from '../../shared/startingEquipment'
import { emptyLoadout, evaluateEquipmentInventory, pruneEquipmentLoadout, restoreEquipmentInventory } from '../../shared/equipment'
import type { EquipmentLoadout, EquipmentPurchase } from '../../shared/equipment'
import { EquipmentPicker } from './EquipmentPicker'
import { EquipmentInventory } from './EquipmentInventory'

const LOCAL_STORAGE_KEY = 'wwn-character-draft'

type BackgroundRollTable = 'growth' | 'learn'
type BackgroundMethod = '' | 'pick' | 'roll'
type FocusBonusChoices = Record<string, Record<string, string[]>>

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
  spellChoicesByClassSlot: SpellChoices
  artChoicesByClass: ArtChoices
  startingEquipment: StartingEquipmentChoice
  equipmentPurchases: EquipmentPurchase[]
  equipmentLoadout: EquipmentLoadout
}

type Evaluation = Pick<CharacterEvaluation,
  'valid' | 'issues' | 'assumptions' | 'fullClass' | 'modifiers' | 'baseModifiers' | 'focusModifierBonuses' |
  'modifierCaps' | 'attributes' | 'backgroundAttributeBonuses' | 'focusBonuses' | 'skillGrantCounts' |
  'derived' | 'selectedSkills' | 'stepStatus'> & Partial<Pick<CharacterEvaluation, 'armorClass' | 'savingThrows'>>

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
const CHARACTER_DATA = { SKILLS, ATTRIBUTES, CLASSES, COMBINATIONS, ABILITIES, CLASS_ABILITY_RULES, BACKGROUNDS,
  FOCI, SPELLS, EQUIPMENT, EQUIPMENT_PROPERTIES, STARTING_EQUIPMENT, STARTING_ARTS, ARTS, PROGRESSION_TABLES } satisfies CharacterData

const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]))
const CLASS_BY_ID = new Map(CLASSES.map((classOption) => [classOption.id, classOption]))
const BACKGROUND_BY_ID = new Map(BACKGROUNDS.map((background) => [background.id, background]))
const FOCUS_BY_ID = new Map(FOCI.map((focus) => [focus.id, focus]))

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
  backgroundAttributeBonuses: {},
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
    saveBonuses: { physical: 0, evasion: 0, mental: 0, luck: 0 },
    encumbranceStrengthBonus: 0,
    systemStrainMaxBonus: 0,
  },
  selectedSkills: [],
  stepStatus: [],
}

function skillLabel(id: string) {
  return SKILL_BY_ID.get(id)?.name ?? '알 수 없는 기술'
}

function classLabel(classOption: ClassData) {
  return `${classOption.name} (${nameFor(classOption.archetype)})`
}

function classProgression(classOptions: ClassData[]) {
  return progressionForClasses(classOptions, PROGRESSION_TABLES).progression
}

function focusBudgetForProgression(table?: ProgressionTable): FocusAllowance[] {
  return table?.focus ?? []
}

function describeAction(action: DataAction) {
  if (action.action === 'fixed_skill' && action.id) return skillLabel(action.id)
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
  const budget = focusBudgetForProgression(classProgression(selectedClasses))
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
    spellChoicesByClassSlot: [[], []],
    artChoicesByClass: {},
    startingEquipment: { method: '' },
    equipmentPurchases: [],
    equipmentLoadout: emptyLoadout(),
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function draftArtFocusGrants(draft: Pick<Draft, 'classChoices'> & { artChoicesByClass?: unknown }) {
  return resolveArtFocusGrants(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS, FOCI)
}

function draftTraditions(draft: Pick<Draft, 'classChoices' | 'focusInstances' | 'focusRuleChoices'> & { artChoicesByClass?: unknown }) {
  if (!evaluateClassChoices(draft.classChoices, CLASSES).complete) return []
  const classes = draft.classChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
  const budget = focusBudgetForProgression(classProgression(classes))
  const selection = evaluateFocusInstances(draft.focusInstances, undefined, FOCI, classes, budget, draftArtFocusGrants(draft).grants)
  return evaluateFocusTraditions(selection.applied, draft.focusRuleChoices, FOCI, draft.classChoices).grants
}

function draftAppliedFoci(draft: Pick<Draft, 'classChoices' | 'focusInstances'> & { artChoicesByClass?: unknown }) {
  if (!evaluateClassChoices(draft.classChoices, CLASSES).complete) return []
  const classes = draft.classChoices.map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
  return evaluateFocusInstances(draft.focusInstances, undefined, FOCI, classes,
    focusBudgetForProgression(classProgression(classes)), draftArtFocusGrants(draft).grants).applied
}

function reconcileMagicChoices(draft: Draft): Draft {
  const traditions = draftTraditions(draft)
  const artChoicesByClass = normalizeArtChoices(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS, traditions, draftAppliedFoci(draft))
  const grants = draftArtFocusGrants({ ...draft, artChoicesByClass }).grants
  const focusInstances = refundGrantedFocusPicks(draft.focusInstances, grants)
  return { ...draft,
    focusInstances,
    focusRuleChoices: normalizeFocusRuleChoices(draft.focusRuleChoices, focusInstances),
    focusBonusChoices: keepFocusBonusChoices(draft.focusBonusChoices, focusInstances),
    spellChoicesByClassSlot: normalizeSpellChoices(draft.spellChoicesByClassSlot, draft.classChoices, SPELLS, traditions),
    artChoicesByClass,
  }
}

function readSavedDraft(): { draft: Draft; spellNotice: string; artNotice: string; equipmentNotice: string } {
  const fallback = createInitialDraft()
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) return { draft: fallback, spellNotice: '', artNotice: '', equipmentNotice: '' }

  try {
    const { spellChoices: legacySpells, focus: legacyFocus, armor: legacyArmor, ...parsed } = JSON.parse(raw) as Partial<Draft> & { spellChoices?: unknown; focus?: unknown; armor?: unknown; selectedSkills?: unknown }
    // Old drafts cached skills; actual grants are the only source of skill levels.
    delete parsed.selectedSkills
    const restoredEquipment = restoreStartingEquipment(parsed.startingEquipment, legacyArmor)
    const restoredInventory = restoreEquipmentInventory(parsed.equipmentPurchases, parsed.equipmentLoadout)
    const background = parsed.background && BACKGROUND_BY_ID.has(parsed.background) ? parsed.background : fallback.background
    const classChoices = (parsed.classChoices ?? fallback.classChoices)
      .map((classId) => (CLASS_BY_ID.has(classId) ? classId : ''))
      .filter(Boolean)
      .slice(0, 2)
    const restoredClasses = (classChoices.length > 0 ? classChoices : fallback.classChoices)
      .map((id) => CLASS_BY_ID.get(id)).filter((item): item is ClassData => Boolean(item))
    const savedInstances = readFocusInstances(parsed.focusInstances, legacyFocus ?? fallback.focusInstances.map((item) => item.focusId), FOCI).instances
    const nativeArtChoices = normalizeArtChoices(parsed.artChoicesByClass, classChoices.length > 0 ? classChoices : fallback.classChoices, CLASSES, STARTING_ARTS, ARTS)
    const grants = draftArtFocusGrants({ classChoices: classChoices.length > 0 ? classChoices : fallback.classChoices, artChoicesByClass: nativeArtChoices }).grants
    const focusInstances = refundGrantedFocusPicks(savedInstances, grants)
    const focusRuleChoices = normalizeFocusRuleChoices(parsed.focusRuleChoices, focusInstances)
    const traditions = draftTraditions({ classChoices: classChoices.length > 0 ? classChoices : fallback.classChoices, focusInstances, focusRuleChoices, artChoicesByClass: nativeArtChoices })
    const restoredSpells = restoreSpellChoices(parsed.spellChoicesByClassSlot, legacySpells,
      classChoices.length > 0 ? classChoices : fallback.classChoices, SPELLS, traditions)
    const restoredArts = restoreArtChoices(parsed.artChoicesByClass,
      classChoices.length > 0 ? classChoices : fallback.classChoices, CLASSES, STARTING_ARTS, ARTS, traditions, draftAppliedFoci({ classChoices: classChoices.length > 0 ? classChoices : fallback.classChoices, focusInstances, artChoicesByClass: nativeArtChoices }))
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

    return { spellNotice: restoredSpells.notice, artNotice: [restoredArts.notice, savedInstances.length !== focusInstances.length
      ? '기교로 자동 습득하는 포커스의 중복 선택을 해제하고 선택권을 반환했습니다.' : ''].filter(Boolean).join(' '), equipmentNotice: [restoredEquipment.notice, restoredInventory.notice].filter(Boolean).join(' '), draft: {
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
      focusRuleChoices,
      focusBonusChoices: keepFocusBonusChoices(parsed.focusBonusChoices, focusInstances),
      freeSkill,
      backgroundSkill,
      backgroundMethod,
      backgroundPicks,
      backgroundRollTables: rollTables,
      backgroundRollResults,
      spellChoicesByClassSlot: restoredSpells.choices,
      artChoicesByClass: restoredArts.choices,
    } }
  } catch {
    return { draft: fallback, spellNotice: '', artNotice: '', equipmentNotice: '' }
  }
}

function evaluateDraftSkills(draft: Draft) {
  const core = evaluatePreviewCore(draft, CHARACTER_DATA)
  return { ...core, allocation: core.skillAllocation, bonuses: core.focusCreation.bonuses, artFocusIssues: core.artFocusGrants.issues }
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
  const [evaluatedDraft, setEvaluatedDraft] = useState<Draft | null>(null)
  const evaluationCurrent = backendOnline && evaluatedDraft === draft

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
    () => classProgression(selectedClasses),
    [selectedClasses],
  )

  const allocatedScores = allocatedAttributes(draft)
  const core = evaluateDraftSkills(draft)
  const { allocation: skillAllocation, bonuses: localFocusBonuses, focusCreation, backgroundAttributes, artFocusIssues } = core
  const selectedFocusInstances = focusCreation.instances
  const allFocusInstances = [...selectedFocusInstances, ...focusCreation.grantedInstances]
  const classValidation = evaluateClassChoices(draft.classChoices, CLASSES)
  const { modifiers: localModifiers, savingThrows: localSavingThrows, equipmentInventory, abilitySelection, focusTraditions, focusEffort } =
    evaluateCreationEffects(draft, CHARACTER_DATA, core, classValidation)
  const equipmentEvaluation = equipmentInventory.starting
  const displayedSaves = evaluationCurrent && evaluation.savingThrows ? evaluation.savingThrows : localSavingThrows
  const localDexterity = localModifiers.DEX
  const displayedArmorClass = evaluationCurrent && evaluation.armorClass ? evaluation.armorClass : equipmentInventory.armorClass
  const focusLimit = focusCreation.limit
  const skillOptions = SKILLS.map((skill) => ({ id: skill.id, label: skillLabel(skill.id) }))
  const classGrants = classSkillGrants(selectedClasses, draft.classBonusChoices)
  const fixedClassGrants = classGrants.filter((grant) => grant.kind === 'fixed')
  const classSkillChoices = classGrants.filter((grant) => grant.kind === 'choice')
  const resolvedClassBuild = classBuildName(draft.classChoices, CLASSES, COMBINATIONS)
  const artPlans = getArtPlans(draft.classChoices, CLASSES, STARTING_ARTS, ARTS, focusTraditions, focusCreation.applied)
  const artEvaluation = evaluateArtChoices(draft.artChoicesByClass, draft.classChoices, CLASSES, STARTING_ARTS, ARTS, focusTraditions, focusCreation.applied)

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
          setEvaluatedDraft(deferredDraft)
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
      const nextBudget = focusBudgetForProgression(classProgression(nextClasses))
      const nextArtChoices = normalizeArtChoices(current.artChoicesByClass, nextChoices, CLASSES, STARTING_ARTS, ARTS)
      const grants = draftArtFocusGrants({ classChoices: nextChoices, artChoicesByClass: nextArtChoices }).grants
      const paidInstances = refundGrantedFocusPicks(current.focusInstances, draftArtFocusGrants(current).grants)
      const focusInstances = pruneFocusInstances(paidInstances, FOCI, nextClasses, nextBudget, grants)
      const classBonusChoices = normalizeClassBonusChoices(current.classBonusChoices, nextClasses)
      return reconcileMagicChoices({ ...current, classChoices: nextChoices, classBonusChoices, focusInstances,
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances),
        focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances) })
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
    }))
  }

  function updateBackgroundMethod(backgroundMethod: BackgroundMethod) {
    setDraft((current) => current.backgroundMethod === backgroundMethod ? current : ({
      ...current,
      backgroundMethod,
      backgroundPicks: ['', ''],
      backgroundRollTables: DEFAULT_BACKGROUND_ROLL_TABLES,
      backgroundRollResults: [],
    }))
  }

  function updateBackgroundPick(index: number, skillId: string) {
    if (skillId && !learningOptions.some((skill) => skill.id === skillId)) return
    setDraft((current) => {
      if (current.backgroundMethod !== 'pick') return current
      if (skillId && skillChoiceReason(evaluateDraftSkills(current).allocation, `background:pick:${index}`, skillId)) return current
      const backgroundPicks = [...current.backgroundPicks]
      backgroundPicks[index] = skillId
      return { ...current, backgroundPicks }
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
      }
    })
  }

  function rollBackgroundTables() {
    if (draft.backgroundMethod !== 'roll') return
    const results = draft.backgroundRollTables.map((table) => rollBackgroundTable(activeBackground, table))
    setDraft((current) => ({
      ...current,
      backgroundRollResults: results,
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
      }
    })
  }

  function toggleFocus(id: string) {
    setDraft((current) => {
      const currentClasses = current.classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter((item): item is ClassData => Boolean(item))
      const budget = focusBudgetForProgression(classProgression(currentClasses))
      const definition = FOCUS_BY_ID.get(id)
      if (!definition) return current
      const grants = draftArtFocusGrants(current).grants
      if (grants.some((grant) => grant.focusId === id)) return current
      const existing = current.focusInstances.find((item) => item.focusId === id)
      let focusInstances: FocusInstance[]
      if (existing && (!definition.repeatable || focusCreationLevelReason(definition))) focusInstances = removeFocusInstance(current.focusInstances, existing.instanceId, FOCI, currentClasses, budget, grants)
      else {
        if (focusCreationLevelReason(definition)) return current
        const instance: FocusInstance = { instanceId: crypto.randomUUID(), focusId: id }
        focusInstances = [...current.focusInstances, instance]
        if (!evaluateFocusInstances(focusInstances, undefined, FOCI, currentClasses, budget, grants).complete) return current
      }
      return reconcileMagicChoices({ ...current, focusInstances, focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances),
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances) })
    })
  }

  function removeSelectedFocus(id: string) {
    setDraft((current) => {
      const classes = current.classChoices.map((classId) => CLASS_BY_ID.get(classId)).filter((item): item is ClassData => Boolean(item))
      const budget = focusBudgetForProgression(classProgression(classes))
      const focusInstances = removeFocusInstance(current.focusInstances, id, FOCI, classes, budget, draftArtFocusGrants(current).grants)
      return reconcileMagicChoices({ ...current, focusInstances, focusBonusChoices: keepFocusBonusChoices(current.focusBonusChoices, focusInstances),
        focusRuleChoices: normalizeFocusRuleChoices(current.focusRuleChoices, focusInstances) })
    })
  }

  function updateFocusRuleChoice(id: string, key: keyof FocusRuleChoice, value: string) {
    if (key === 'traditionId') {
      setSpellNotice('전통에 맞춰 주문 선택을 다시 확인했습니다. 계속 배울 수 있는 주문만 유지됩니다.')
      setArtNotice('전통이 바뀌어 기교 선택을 다시 확인했습니다. 이전 전통에서만 얻었던 기교는 해제됩니다.')
    }
    setDraft((current) => {
      const instance = current.focusInstances.find((item) => item.instanceId === id)
      if (!instance) return current
      if (key === 'traditionId' && value && !FOCUS_BY_ID.get(instance.focusId)?.tradition_choice?.options.includes(value)) return current
      const next = { ...current, focusRuleChoices: { ...current.focusRuleChoices, [id]: { ...current.focusRuleChoices[id], [key]: value } } }
      return key === 'traditionId' ? reconcileMagicChoices(next) : next
    })
  }

  function updateFocusBonusChoice(focusId: string, bonusIndex: number, slotIndex: number, choiceId: string) {
    setDraft((current) => {
      const instance = current.focusInstances.find((item) => item.instanceId === focusId)
      if (!instance) return current
      const definition = FOCUS_BY_ID.get(instance.focusId)
      const { bonuses, allocation } = evaluateDraftSkills(current)
      const detail = bonuses.details.find((item) => item.focusId === focusId)
      const option = detail?.choices.find((item) => item.bonusIndex === bonusIndex && item.slotIndex === slotIndex)
      if (!option || (choiceId && !option.options.includes(choiceId))) return current
      if (choiceId && current.focusBonusChoices[focusId]?.[String(bonusIndex)]?.some((id, index) => index !== slotIndex && id === choiceId)) return current
      if (definition?.unique_skill && choiceId && current.focusInstances.some((item) => item.instanceId !== focusId && item.focusId === instance.focusId && current.focusBonusChoices[item.instanceId]?.['0']?.[0] === choiceId)) return current
      if (definition?.bonus[bonusIndex]?.action === 'choice_skill' && choiceId &&
        skillChoiceReason(allocation, `focus:${focusId}:${bonusIndex}:${slotIndex}`, choiceId)) return current
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
      const spellChoicesByClassSlot = toggleSpellChoice(current.spellChoicesByClassSlot, slot, id, current.classChoices, SPELLS, draftTraditions(current))
      return { ...current, spellChoicesByClassSlot }
    })
  }

  function toggleArt(classId: string, groupKey: string | null, id: string) {
    setArtNotice('')
    setDraft((current) => reconcileMagicChoices({ ...current, artChoicesByClass: toggleArtChoice(current.artChoicesByClass,
      classId, groupKey, id, current.classChoices, CLASSES, STARTING_ARTS, ARTS, draftTraditions(current), draftAppliedFoci(current)) }))
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
      STARTING_EQUIPMENT, EQUIPMENT, EQUIPMENT_PROPERTIES, classValidation.complete ? focusCreation.baseAc : undefined)
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
      <a className="skip-link" href="#stage-attributes">캐릭터 생성으로 바로 가기</a>
      <header className="site-banner">
        <h1>
          <img src={`${import.meta.env.BASE_URL}wwn.png`} alt="수 없는 세계 캐릭터 만들기"
            width={1800} height={600} fetchPriority="high" />
        </h1>
      </header>

      <CreationNavigation steps={evaluation.stepStatus} ready={evaluationCurrent} offline={Boolean(evaluationError)} />

      <section className="layout-grid">
        <div className="builder-column">
          <section className="card creation-section" id="stage-attributes" aria-labelledby="attributes-title">
            <div className="card-header">
              <div>
                <p className="step-label">01 / 타고난 자질</p>
                <h2 id="attributes-title">능력치와 수정치</h2>
              </div>
              <RulesLink topic="attributes" />
            </div>

            <div className="segmented attribute-method" role="group" aria-label="능력치 배정 방식">
              <button type="button" className={draft.attributeMethod === 'array' ? 'active' : ''}
                aria-pressed={draft.attributeMethod === 'array'} onClick={() => { if (draft.attributeMethod !== 'array') resetToArray() }}>고정 수치 배정</button>
              <button type="button" className={draft.attributeMethod === 'rolled' ? 'active' : ''}
                aria-pressed={draft.attributeMethod === 'rolled'} onClick={() => { if (draft.attributeMethod !== 'rolled') rerollInOrder() }}>순서대로 3d6 굴리기</button>
            </div>

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
                    <strong title="배정한 능력치의 수정치입니다. 배경 성장과 포커스 보너스는 최종 시트에 반영됩니다.">{plusModifier(getModifier(allocatedScores[key]))}</strong>
                  </label>
                )
              })}
            </div>

            {draft.attributeMethod === 'array' ? (
              <p className="support-text allocation-help">사용 중인 수치를 고르면 서로 바뀝니다.</p>
            ) : (
              <div className="info-panel allocation-help">
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
                <button type="button" onClick={rerollInOrder}>능력치 여섯 개 모두 다시 굴리기</button>
              </div>
            )}
          </section>

          <section className="card creation-section" id="stage-background" aria-labelledby="background-title">
            <div className="card-header">
              <div>
                <p className="step-label">02 / 모험 이전의 삶</p>
                <h2 id="background-title">배경과 시작 기술</h2>
              </div>
              <RulesLink topic="background" />
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
              <p className="support-text">방식을 바꾸면 이전 배경 선택과 주사위 결과가 초기화됩니다.</p>
            </div>

            {draft.backgroundMethod === 'pick' && (
              <>
                <p className="support-text">학습 기술 두 개를 고르세요.</p>
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

              </>
            )}
          </section>

          <section className="card creation-section" id="stage-class" aria-labelledby="class-title">
            <div className="card-header">
              <div>
                <p className="step-label">03 / 나만의 길</p>
                <h2 id="class-title">클래스·포커스·자유 기술</h2>
              </div>
              <RulesLink topic="classes" />
            </div>

            {!classValidation.complete && <div className="skill-review" role="status">
              <strong>클래스 선택을 확인하세요</strong>
              <ul>{classValidation.issues.map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>
            </div>}
            {fixedClassGrants.length > 0 && <p className="support-text">클래스의 고정 기술: {fixedClassGrants.map((grant) => skillLabel(grant.skillId)).join(', ')}.</p>}
            <div className="form-grid two-up class-choice-grid">
              {[0, 1].map((index) => {
                const options = CLASSES.map((classOption) => ({
                  classOption, reason: classChoiceReason(classOption.id, draft.classChoices[index === 0 ? 1 : 0], CLASSES),
                }))
                const unavailable = options.filter((option) => option.reason)
                const helpId = `class-slot-${index}-restrictions`
                const selectedClass = CLASS_BY_ID.get(draft.classChoices[index])
                const detailsId = `class-slot-${index}-details`
                return <div key={index}>
                <label>
                  <span>{index === 0 ? '첫 번째 클래스' : '두 번째 클래스'}</span>
                  <select
                    aria-invalid={!classValidation.complete}
                    aria-describedby={[selectedClass ? detailsId : '', unavailable.length > 0 ? helpId : ''].filter(Boolean).join(' ') || undefined}
                    value={draft.classChoices[index] ?? CLASSES[0]?.id ?? ''}
                    onChange={(event) => updateClassChoice(index, event.target.value)}
                  >
                    {options.map(({ classOption, reason }) => (
                      <option key={`${index}-${classOption.id}`} value={classOption.id}
                        disabled={Boolean(reason)}>
                        {classLabel(classOption)}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedClass && <div id={detailsId} className="class-choice-details">
                  <small className="focus-english-name" lang="en">{selectedClass.eng_name}</small>
                  <p className="support-text">{selectedClass.can_be_full_class ? '순수·부분 클래스 선택 가능' : '부분 클래스 전용'}<br />
                    주문 {selectedClass.spells ? '있음' : '없음'} · 클래스 기교 {selectedClass.arts ? '있음' : '없음'}
                  </p>
                </div>}
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
              <RulesLink topic="skills">기술 배정 규칙</RulesLink>
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
                <span>자유 기술 <RulesLink topic="skills" /></span>
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
              <p className="subheading">포커스 선택권 ({selectedFocusInstances.length}/{focusLimit}){focusCreation.grantedInstances.length > 0 && ` · 자동 습득 ${focusCreation.grantedInstances.length}개`}</p>
              <RulesLink topic="foci">포커스 선택 규칙</RulesLink>
              <ul className="support-text" aria-label="포커스 선택권" aria-live="polite">
                {focusCreation.allowances.counts.map((count) => <li key={count.type}>{FOCUS_ALLOWANCE_LABELS[count.type]}: {count.used}/{count.total}개 사용 / {count.remaining}개 남음</li>)}
              </ul>
              <FocusInstances instances={allFocusInstances} foci={FOCI} assignments={focusCreation.allowances.assignments}
                ruleChoices={draft.focusRuleChoices} scores={backgroundAttributes.attributes} attributes={ATTRIBUTES}
                onRemove={removeSelectedFocus} onRuleChoice={updateFocusRuleChoice} />
              {focusCreation.issues.length + artFocusIssues.length > 0 && <ul className="issue-list" role="status">{[...focusCreation.issues, ...artFocusIssues].map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>}
              <div className="focus-bonus-list">
                {localFocusBonuses.details.map((detail) => {
                  const instance = draft.focusInstances.find((item) => item.instanceId === detail.focusId)
                  const focus = instance && FOCUS_BY_ID.get(instance.focusId)
                  if (!focus || !instance) return null
                  const instanceLabel = focusInstanceLabel(instance, draft.focusInstances, FOCI)
                  return (
                    <section key={instance.instanceId} className="info-panel focus-bonus-panel" aria-label={`${instanceLabel} 보너스`}>
                      <h4>{instanceLabel}: 보너스</h4>
                      {focus.bonus.length === 0 && !detail.skills.length && !detail.modifierChanges.length && !detail.capOverrides.length && <p className="support-text">기술·수정치 보정 없음</p>}
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
                            {choice.limits && <small className="support-text">수정치 한계: {ko(choice.limits)}</small>}
                            {choice.kind === 'skill' && <SkillChoiceFeedback allocation={skillAllocation}
                              choiceKey={`focus:${instance.instanceId}:${choice.bonusIndex}:${choice.slotIndex}`} />}
                          </label>
                        )
                      })}
                    </section>
                  )
                })}
              </div>
              <FocusPicker foci={FOCI} classes={CLASSES} selectedClasses={selectedClasses}
                instances={selectedFocusInstances} budget={focusBudgetForProgression(activeProgression)} grants={focusCreation.grantedInstances}
                selectedIds={selectedFocusInstances.map((item) => item.focusId)} limit={focusLimit} skills={SKILLS} attributes={ATTRIBUTES} abilities={ABILITIES} onToggle={toggleFocus} />
            </div>

          </section>

          <EquipmentPicker choice={draft.startingEquipment} packages={STARTING_EQUIPMENT} equipment={EQUIPMENT}
            evaluation={equipmentEvaluation} notice={equipmentNotice} onChange={updateStartingEquipment} onRoll={rollEquipmentSilver} />
          <EquipmentInventory evaluation={equipmentInventory} purchases={draft.equipmentPurchases} loadout={draft.equipmentLoadout}
            equipment={EQUIPMENT} properties={EQUIPMENT_PROPERTIES} onPurchase={updateEquipmentPurchase}
            onLoadout={(equipmentLoadout) => setDraft((current) => ({ ...current, equipmentLoadout }))} />
          <section className="card creation-section" id="stage-identity" aria-labelledby="identity-title">
            <div className="card-header">
              <div>
                <p className="step-label">05 / 인물의 이야기</p>
                <h2 id="identity-title">이름과 목표</h2>
              </div>
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
            choices={draft.spellChoicesByClassSlot} traditions={focusTraditions} notice={spellNotice} onToggle={toggleSpell} />
          {(evaluationError || !evaluationCurrent || evaluation.issues.length > 0) && <section className="card creation-validation" aria-label="선택 확인" role="status">
            <h2>선택 확인</h2>
            {evaluationError ? <p className="warning-text">{evaluationError}</p>
              : !evaluationCurrent ? <p className="support-text">현재 선택을 확인하고 있습니다.</p>
              : <ul className="issue-list">{evaluation.issues.map((issue) => <li key={issue}>{ko(issue)}</li>)}</ul>}
          </section>}
          <div className="draft-actions">
            <div><strong>선택은 이 브라우저에 자동 저장됩니다.</strong><p className="support-text">다른 기기나 브라우저와는 공유되지 않습니다.</p></div>
            <div className="button-row">
              <button type="button" onClick={restoreSavedDraft}>저장된 캐릭터 불러오기</button>
              <button type="button" className="danger-button" onClick={() => {
                if (window.confirm('저장된 캐릭터와 현재 선택을 모두 초기화할까요? 이 작업은 되돌릴 수 없습니다.')) clearDraft()
              }}>캐릭터 초기화</button>
            </div>
          </div>
        </div>

        <aside className="summary-column">
          <CharacterSheet character={draft} catalogues={CHARACTER_DATA}
            evaluation={evaluation} evaluationCurrent={evaluationCurrent} backendOnline={backendOnline}
            evaluationError={evaluationError} allocatedScores={allocatedScores} resolvedClassBuild={resolvedClassBuild}
            displayedArmorClass={displayedArmorClass} displayedSaves={displayedSaves} abilitySelection={abilitySelection}
            equipmentInventory={equipmentInventory} skillAllocation={skillAllocation} focusCreation={focusCreation}
            allFocusInstances={allFocusInstances} focusEffort={focusEffort} artEvaluation={artEvaluation} />
        </aside>
      </section>
    </main>
  )
}

export default App
