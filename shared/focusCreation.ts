import { evaluateFocusBonuses, focusCreationLevelReason, focusRequirementMet, normalizeFocusBonusChoices, originFamilyId } from './focusBonuses.js';
import type { FocusData } from './focusBonuses.js';
import { getModifier } from './attributeModifier.js';
import { evaluateFocusAllowances } from './focusAllowances.js';
import type { FocusBudget } from './focusAllowances.js';
import { evaluateFocusTraditions } from './focusTraditions.js';
import { evaluateFocusBaseAc } from './focusArmorClass.js';
import { SAVE_IDS, validConditionalSaves, validSaveModifiers } from './savingThrows.js';
import type { FocusSaveEffects } from './savingThrows.js';
import { refundGrantedFocusPicks } from './artFocusGrants.js';
import type { ArtFocusGrant, ArtFocusSource } from './artFocusGrants.js';

export type FocusInstance = { instanceId: string; focusId: string; parentInstanceId?: string; grantedBy?: ArtFocusSource[] };
export type FocusRuleChoice = { packageId?: string; attributeId?: string; retainedAttribute?: string; traditionId?: string };
export type FocusRuleChoices = Record<string, FocusRuleChoice>;
export type BaseAttackAdjustment = { instanceId: string; focusId: string; value: number };
type FocusClass = { id: string; archetype: string };
type Tagged = { id: string; tags: string[] };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const own = (value: unknown, key: string): unknown => record(value) && Object.hasOwn(value, key) ? value[key] : undefined;
const parentFocusId = (focus: FocusData) => (focus.level ?? 1) > 1
  ? focus.requirements.find((rule) => rule.condition === 'has_focus')?.id : undefined;

export function readFocusInstances(source: unknown, legacyIds: unknown, foci: FocusData[]): { instances: FocusInstance[]; issues: string[] } {
  const issues: string[] = [];
  if (source === undefined) {
    if (legacyIds !== undefined && (!Array.isArray(legacyIds) || legacyIds.some((id) => typeof id !== 'string'))) {
      return { instances: [] as FocusInstance[], issues: ['Invalid legacy focus selections.'] };
    }
    const instances = [...new Set((legacyIds ?? []) as string[])].map((focusId) => {
      const focus = foci.find((item) => item.id === focusId);
      const parent = focus && parentFocusId(focus);
      return { instanceId: focusId, focusId, ...(parent ? { parentInstanceId: parent } : {}) };
    });
    return { instances, issues };
  }
  if (!Array.isArray(source)) return { instances: [] as FocusInstance[], issues: ['Focus instances must be a list.'] };
  const instances: FocusInstance[] = [];
  for (const item of source) {
    if (!record(item) || typeof item.instanceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.instanceId) ||
        ['__proto__', 'prototype', 'constructor'].includes(item.instanceId) || typeof item.focusId !== 'string' ||
        (item.parentInstanceId !== undefined && typeof item.parentInstanceId !== 'string')) {
      issues.push('Malformed focus instance; remove it and select the focus again.');
      continue;
    }
    instances.push({ instanceId: item.instanceId, focusId: item.focusId,
      ...(typeof item.parentInstanceId === 'string' ? { parentInstanceId: item.parentInstanceId } : {}) });
  }
  return { instances, issues };
}

export function evaluateFocusInstances(source: unknown, legacyIds: unknown, foci: FocusData[], classes: FocusClass[], budget: FocusBudget, grants: ArtFocusGrant[] = []) {
  const parsed = readFocusInstances(source, legacyIds, foci);
  const instances = refundGrantedFocusPicks(parsed.instances, grants);
  const refundedInstances = parsed.instances.filter((item) => !instances.includes(item));
  const allInstances: FocusInstance[] = [...grants, ...instances];
  const issues = [...parsed.issues];
  const byId = new Map(foci.map((focus) => [focus.id, focus]));
  const requested = new Set(allInstances.map((item) => item.focusId));
  const invalid = new Set<string>();
  const origins = allInstances.filter((item) => byId.get(item.focusId)?.type === 'origin');
  if (new Set(origins.map((item) => originFamilyId(byId.get(item.focusId)!, foci))).size > 1) {
    issues.push('Only one origin focus family is allowed. Linked upgrades count as the same family but cost another pick.');
    origins.forEach((item) => invalid.add(item.instanceId));
  }
  for (const instance of allInstances) {
    const focus = byId.get(instance.focusId);
    if (!focus) { issues.push(`Unknown focus: ${instance.focusId}.`); invalid.add(instance.instanceId); continue; }
    const levelReason = focusCreationLevelReason(focus);
    if (levelReason) { issues.push(levelReason); invalid.add(instance.instanceId); continue; }
    if (allInstances.filter((item) => item.instanceId === instance.instanceId).length > 1) {
      issues.push(`Duplicate focus instance ID: ${instance.instanceId}.`); invalid.add(instance.instanceId);
    }
    if (!focus.repeatable && allInstances.filter((item) => item.focusId === instance.focusId).length > 1) {
      issues.push(`${focus.name} cannot be selected more than once.`); invalid.add(instance.instanceId);
    }
    const parentId = parentFocusId(focus);
    const parent = allInstances.find((item) => item.instanceId === instance.parentInstanceId);
    if (parentId ? !parent || parent.focusId !== parentId || parent === instance : Boolean(instance.parentInstanceId)) {
      issues.push(`${focus.name}: select a valid parent focus instance for this upgrade.`); invalid.add(instance.instanceId);
    }
    if (parentId && allInstances.filter((item) => item.focusId === instance.focusId && item.parentInstanceId === instance.parentInstanceId).length > 1) {
      issues.push(`${focus.name}: a focus instance can receive this upgrade only once.`); invalid.add(instance.instanceId);
    }
    if (focus.extra_focus_picks !== undefined && (!Number.isSafeInteger(focus.extra_focus_picks) || focus.extra_focus_picks < 0)) {
      issues.push(`${focus.name}: invalid extra focus allowance in foci.json.`); invalid.add(instance.instanceId);
    }
  }
  const eligible = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    const eligibleDefinitions = new Set(allInstances.filter((item) => eligible.has(item.instanceId)).map((item) => item.focusId));
    for (const instance of allInstances) {
      if (invalid.has(instance.instanceId) || eligible.has(instance.instanceId)) continue;
      const focus = byId.get(instance.focusId)!;
      if (instance.parentInstanceId && !eligible.has(instance.parentInstanceId)) continue;
      if (!focus.requirements.every((rule) => focusRequirementMet(rule, classes, eligibleDefinitions, requested))) continue;
      eligible.add(instance.instanceId); changed = true;
    }
  }
  const eligibleInstances = instances.filter((item) => eligible.has(item.instanceId));
  const grantedInstances = grants.filter((item) => eligible.has(item.instanceId));
  for (const item of allInstances) if (!eligible.has(item.instanceId) && !invalid.has(item.instanceId)) {
    issues.push(`Focus requirements not met: ${byId.get(item.focusId)?.name ?? item.focusId}.`);
  }
  const extraPicks = [...grantedInstances, ...eligibleInstances].reduce((sum, item) => sum + (byId.get(item.focusId)?.extra_focus_picks ?? 0), 0);
  const allowances = evaluateFocusAllowances(eligibleInstances, foci, budget, extraPicks);
  const { baseLimit, limit } = allowances;
  issues.push(...allowances.issues);
  if (instances.length > limit) issues.push(`Too many foci selected: ${instances.length}/${limit}.`);
  const applied: FocusInstance[] = [...grantedInstances, ...(instances.length <= limit && allowances.complete ? eligibleInstances : [])];
  return { instances, eligibleInstances, grantedInstances, refundedInstances, baseLimit, extraPicks, limit, allowances, issues: [...new Set(issues)],
    complete: issues.length === 0, applied };
}

export function pruneFocusInstances(instances: FocusInstance[], foci: FocusData[], classes: FocusClass[], budget: FocusBudget, grants: ArtFocusGrant[] = []) {
  let kept = instances;
  for (;;) {
    const result = evaluateFocusInstances(kept, undefined, foci, classes, budget, grants);
    const next = result.eligibleInstances.filter((item) => !result.allowances.unassigned.includes(item.instanceId));
    if (next.length === kept.length) return next;
    kept = next;
  }
}

export function removeFocusInstance(instances: FocusInstance[], id: string, foci: FocusData[], classes: FocusClass[], budget: FocusBudget, grants: ArtFocusGrant[] = []) {
  const removed = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of instances) if (item.parentInstanceId && removed.has(item.parentInstanceId) && !removed.has(item.instanceId)) {
      removed.add(item.instanceId); changed = true;
    }
  }
  return pruneFocusInstances(instances.filter((item) => !removed.has(item.instanceId)), foci, classes, budget, grants);
}

export function normalizeFocusRuleChoices(source: unknown, instances: FocusInstance[]): FocusRuleChoices {
  return Object.fromEntries(instances.map((item) => {
    const raw = own(source, item.instanceId);
    const choice: FocusRuleChoice = {};
    for (const key of ['packageId', 'attributeId', 'retainedAttribute', 'traditionId'] as const) {
      const value = own(raw, key);
      if (typeof value === 'string') choice[key] = value;
    }
    return [item.instanceId, choice];
  }));
}

export function instanceFocusData(instances: FocusInstance[], foci: FocusData[]) {
  return instances.flatMap((instance) => {
    const focus = foci.find((item) => item.id === instance.focusId);
    return focus ? [{ ...focus, id: instance.instanceId }] : [];
  });
}

export function evaluateFocusCreation(input: {
  instances?: unknown; legacyIds?: unknown; bonusChoices?: unknown; ruleChoices?: unknown;
  grants?: ArtFocusGrant[];
  foci: FocusData[]; classes: FocusClass[]; baseLimit: FocusBudget; skills: Tagged[]; attributes: Tagged[]; scores: Record<string, number>;
}) {
  const selection = evaluateFocusInstances(input.instances, input.legacyIds, input.foci, input.classes, input.baseLimit, input.grants);
  const issues = [...selection.issues];
  const ruleChoices = normalizeFocusRuleChoices(input.ruleChoices, selection.instances);
  const traditions = evaluateFocusTraditions(selection.applied, input.ruleChoices, input.foci, input.classes.map((item) => item.id));
  issues.push(...traditions.issues);
  const baseAc = evaluateFocusBaseAc(selection.applied, input.foci);
  issues.push(...baseAc.issues);
  const scores = { ...input.scores };
  const scoreChanges: Array<{ instanceId: string; id: string; before: number; after: number }> = [];
  const notes: Array<{ instanceId: string; text: string }> = [];
  const saveEffects: FocusSaveEffects = { sources: [], conditional: [] };
  const derived = { baseAttackBonusAdjustment: 0, baseAttackAdjustments: [] as BaseAttackAdjustment[],
    attack: 0, saves: { physical: 0, evasion: 0, mental: 0, luck: 0 }, encumbranceStrengthBonus: 0, systemStrainMaxBonus: 0 };
  const expanded = instanceFocusData(selection.applied, input.foci);
  // Keep submitted choice shapes intact for strict API validation; normalization is only a display preview.
  const choices: Record<string, unknown> = Object.fromEntries(selection.instances.map((item) => [item.instanceId, own(input.bonusChoices, item.instanceId)]));
  const choicePreview = normalizeFocusBonusChoices(choices, selection.instances.map((item) => item.instanceId), instanceFocusData(selection.instances, input.foci));
  const usedSkills = new Map<string, Set<string>>();
  for (const instance of selection.applied) {
    const definition = input.foci.find((focus) => focus.id === instance.focusId)!;
    const focus = expanded.find((item) => item.id === instance.instanceId)!;
    const choice = ruleChoices[instance.instanceId] ?? {};
    if (definition.unique_skill) {
      const skill = choicePreview[instance.instanceId]?.['0']?.[0];
      const used = usedSkills.get(definition.id) ?? new Set<string>();
      if (skill && used.has(skill)) {
        issues.push(`${definition.name}: each instance must choose a different skill.`);
        const raw = choices[instance.instanceId];
        choices[instance.instanceId] = { ...(record(raw) ? raw : {}), '0': [''] };
        choicePreview[instance.instanceId]!['0'] = [''];
      } else if (skill) used.add(skill);
      usedSkills.set(definition.id, used);
    }
    if (definition.packages) {
      const packageId = choice.packageId ?? '';
      const option = definition.packages.options.find((item) => item.id === packageId);
      if (option) {
        focus.bonus = [...focus.bonus, ...option.bonus];
        notes.push({ instanceId: instance.instanceId, text: `${option.name}: ${option.description}` });
      } else if (packageId || definition.packages.required) issues.push(`${definition.name}: choose one valid package.`);
    }
    const effect = definition.score_effect;
    const changeScore = (id: string, after: number) => {
      const before = scores[id]!;
      if (before !== after) scoreChanges.push({ instanceId: instance.instanceId, id, before, after });
      scores[id] = after;
    };
    if (effect && (!Number.isInteger(effect.value) || effect.value < 3 || effect.value > 18 ||
        (effect.kind === 'raise_to' && (!Array.isArray(effect.tags) || !effect.tags.length)))) {
      issues.push(`${definition.name}: invalid score effect in foci.json.`);
    } else if (effect?.kind === 'raise_to') {
      const options = input.attributes.filter((item) => effect.tags.some((tag) => item.tags.includes(tag)) &&
        Number.isInteger(scores[item.id]) && scores[item.id]! >= 3 && scores[item.id]! < effect.value).map((item) => item.id);
      if (effect.optional && choice.attributeId === 'none') { /* Explicitly declined. */ }
      else if (choice.attributeId && options.includes(choice.attributeId)) changeScore(choice.attributeId, effect.value);
      else issues.push(`${definition.name}: choose an eligible attribute${effect.optional ? ' or decline the optional increase' : ''}.`);
    } else if (effect?.kind === 'cap_except_one') {
      const high = Object.keys(scores).filter((id) => scores[id]! > effect.value);
      const retained = high.length <= 1 ? high[0] : choice.retainedAttribute;
      if (high.length > 1 && (!retained || !high.includes(retained))) issues.push(`${definition.name}: choose the one attribute allowed above ${effect.value}.`);
      else for (const id of high) if (id !== retained) changeScore(id, effect.value);
    }
    const extra = definition.derived_bonus;
    if (extra) {
      const values = [extra.base_attack_bonus, extra.attack, extra.encumbrance_str, extra.system_strain_max, ...Object.values(extra.saves ?? {})];
      if (values.some((value) => value !== undefined && !Number.isSafeInteger(value)) ||
          (extra.saves !== undefined && !validSaveModifiers(extra.saves))) issues.push(`${definition.name}: invalid derived bonus in foci.json.`);
      else {
        derived.baseAttackBonusAdjustment += extra.base_attack_bonus ?? 0;
        if (extra.base_attack_bonus) derived.baseAttackAdjustments.push({ instanceId: instance.instanceId, focusId: instance.focusId, value: extra.base_attack_bonus });
        derived.attack += extra.attack ?? 0;
        derived.encumbranceStrengthBonus += extra.encumbrance_str ?? 0;
        derived.systemStrainMaxBonus += extra.system_strain_max ?? 0;
        if (extra.saves && Object.values(extra.saves).some(Boolean)) {
          saveEffects.sources.push({ ...instance, name: definition.name, saves: { ...extra.saves } });
          for (const id of SAVE_IDS) derived.saves[id] += extra.saves[id] ?? 0;
        }
      }
    }
    if (definition.conditional_saves !== undefined) {
      if (!validConditionalSaves(definition.conditional_saves)) issues.push(`${definition.name}: invalid conditional saves in foci.json.`);
      else for (const rule of definition.conditional_saves) {
        saveEffects.conditional.push({ ...instance, name: definition.name, ...rule, saves: { ...rule.saves } });
      }
    }
    const upgraded = selection.applied.some((item) => item.parentInstanceId === instance.instanceId);
    const owner = instance.parentInstanceId ?? instance.instanceId;
    const skill = choicePreview[owner]?.['0']?.[0] || 'unresolved skill';
    if (!upgraded) for (const note of definition.sheet_notes ?? []) notes.push({ instanceId: instance.instanceId, text: note.replaceAll('{skill}', skill) });
  }
  const baseModifiers = Object.fromEntries(Object.entries(scores).map(([id, value]) => [id, getModifier(value)]));
  const bonuses = evaluateFocusBonuses(expanded, choices, input.skills, input.attributes, baseModifiers);
  issues.push(...bonuses.issues);
  return { ...selection, scores, scoreChanges, baseModifiers, bonuses, ruleChoices, derived, saveEffects, notes, traditions: traditions.grants, baseAc,
    issues: [...new Set(issues)], complete: issues.length === 0 };
}
