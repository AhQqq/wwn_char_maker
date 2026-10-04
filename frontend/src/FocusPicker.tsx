import { ko, nameFor, rulesText, FOCUS_ALLOWANCE_LABELS } from './korean'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { buildFocusFamilies, dependentFocusIds, focusInstanceLockReasons, requirementLabel } from './focusSelection'
import type { FocusBonus, FocusClass, FocusOption } from './focusSelection'
import { modifierLimitText } from '../../shared/focusBonuses'
import { abilityById } from '../../shared/abilities'
import type { AbilityDefinition } from '../../shared/abilities'
import type { FocusInstance } from '../../shared/focusCreation'
import { compatibleFocusAllowances } from '../../shared/focusAllowances'
import type { FocusAllowance } from '../../shared/focusAllowances'

type NamedOption = { id: string; name: string; tags: string[] }
type Props = {
  foci: FocusOption[]
  classes: FocusClass[]
  selectedClasses: FocusClass[]
  selectedIds: string[]
  instances: FocusInstance[]
  budget: FocusAllowance[]
  limit: number
  skills: NamedOption[]
  attributes: NamedOption[]
  abilities: AbilityDefinition[]
  onToggle: (id: string) => void
}

const focusName = (focus: FocusOption) => focus.name
const signed = (value: number) => value >= 0 ? `+${value}` : String(value)

function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const targets = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')
  const first = targets[0]
  const last = targets[targets.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

function bonusDescription(bonus: FocusBonus, skills: NamedOption[], attributes: NamedOption[]) {
  const isSkill = bonus.action === 'fixed_skill' || bonus.action === 'choice_skill'
  const catalog = isSkill ? skills : attributes
  const label = (id: string) => catalog.find((item) => item.id === id)?.name ?? nameFor(id)
  const limits = modifierLimitText(bonus)
  const suffix = limits ? `; 수정치 한계: ${ko(limits)} (수정치 자체를 추가로 높이지 않음)` : ''
  if (bonus.action === 'fixed_skill') return `기술 배정: ${label(bonus.id ?? '?')} ${bonus.count ?? 1}회`
  if (bonus.action === 'attribute_modifier') return `${label(bonus.id ?? '?')} ${bonus.value === undefined ? '한계만 변경' : `수정치 ${signed(bonus.value)}`}${suffix}`
  if (bonus.action === 'choice_skill' || bonus.action === 'choice_attribute_modifier') {
    const options = catalog.filter((item) =>
      (!bonus.ids || bonus.ids.includes(item.id)) &&
      (!bonus.filter?.ids || bonus.filter.ids.includes(item.id)) &&
      (!bonus.filter?.tags?.length || bonus.filter.tags.some((tag) => item.tags.includes(tag))) &&
      !bonus.exclude?.ids?.includes(item.id) &&
      !bonus.exclude?.tags?.some((tag) => item.tags.includes(tag)))
    return `${isSkill ? '기술' : `능력치 (${bonus.value === undefined ? '한계만 변경' : `수정치 ${signed(bonus.value)}`}${suffix})`} ${bonus.count ?? 1}개를 중복 없이 선택: ${options.map((item) => label(item.id)).join(', ') || '등록된 선택지 없음'}`
  }
  return '자동 적용되지 않는 효과입니다. 규칙을 직접 확인하세요.'
}

function LevelAction({ focus, context, location }: { focus: FocusOption; context: Props; location: string }) {
  const { selectedIds, instances, budget, foci, selectedClasses, classes, onToggle } = context
  const selected = selectedIds.includes(focus.id)
  const reasons = focusInstanceLockReasons(focus, instances, foci, selectedClasses, classes, budget)
  const repeatRoot = focus.repeatable && focus.level === 1
  const instanceUpgrade = focus.repeatable && focus.level > 1
  const dependents = selected ? dependentFocusIds(focus.id, selectedIds, foci) : []
  const noteId = `${location}-${focus.id}-status`
  const label = instanceUpgrade ? '선택한 포커스에서 향상' : repeatRoot && selected ? '1레벨 하나 더 선택' : selected ? `${focus.level}레벨${dependents.length ? ' 및 상위 레벨' : ''} 해제` : `${focus.level}레벨 선택`
  return (
    <div className="focus-level-action">
      <button type="button" className={selected ? 'focus-level-button selected' : 'focus-level-button'}
        disabled={instanceUpgrade || ((!selected || repeatRoot) && reasons.length > 0)} aria-pressed={selected}
        aria-describedby={noteId} onClick={() => onToggle(focus.id)}>
        {label}
      </button>
      <span id={noteId} className="focus-level-status">
        {instanceUpgrade ? '선택한 포커스 목록에서 향상할 항목을 지정하세요.' : reasons.length && (!selected || repeatRoot) ? `선택 불가: ${reasons.map(ko).join(' ')}` : selected ? repeatRoot ? '반복 선택 가능. 추가로 선택할 때마다 선택권 하나를 사용합니다.' : '선택됨' : '선택 가능: 포커스 선택권 하나를 사용합니다.'}
        {dependents.length > 0 && <span className="focus-removal-warning">해제 시 다음 포커스도 함께 해제됩니다: {dependents.map((id) => {
          const dependent = foci.find((item) => item.id === id)!
          return `${focusName(dependent)} ${dependent.level}레벨`
        }).join(', ')} (관련 보너스와 선택 포함).</span>}
      </span>
    </div>
  )
}

export function FocusPicker(props: Props) {
  const { foci, classes, selectedClasses, selectedIds, instances, budget, limit, skills, attributes } = props
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const families = buildFocusFamilies(foci)
  const groups = new Map<string, typeof families>()
  for (const family of families) {
    const group = groups.get(family.category) ?? []
    group.push(family)
    groups.set(family.category, group)
  }
  const activeFamily = families.find((family) => family.id === openFamilyId)
  const activeFocus = activeFamily?.levels[0]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!openFamilyId || !dialog) return
    const trigger = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [openFamilyId])

  return (
    <>
      <p className="support-text">선택 불가한 포커스도 설명을 읽을 수 있습니다. 레벨마다 선택권 하나가 필요하며, 2레벨을 선택해도 1레벨은 유지됩니다.</p>
      <p className="focus-pick-count" role="status" aria-live="polite">포커스 선택권 {selectedIds.length}/{limit}개 사용 / {Math.max(0, limit - selectedIds.length)}개 남음</p>
      <div className="focus-categories">
        {[...groups].map(([category, group]) => (
          <section key={category} className="focus-category" aria-label={`포커스 분류: ${category}`}>
            <div className="focus-category-header"><h3>{category}</h3><span>{group.length}종 (선택 불가 포함)</span></div>
            <div className="focus-grid">
              {group.map((family) => {
                const first = family.levels[0]!
                const selectedLevels = family.levels.filter((focus) => selectedIds.includes(focus.id))
                const locked = selectedLevels.length === 0 && family.levels.every((focus) =>
                  focusInstanceLockReasons(focus, instances, foci, selectedClasses, classes, budget).length > 0)
                return (
                  <article key={family.id} data-focus-family={family.id}
                    className={`focus-family-card${selectedLevels.length ? ' has-selection' : ''}${locked ? ' is-locked' : ''}`}
                    aria-label={`${focusName(first)} (${category})`}>
                    <div className="focus-family-heading">
                      <h4>{first.name}</h4>
                      <span className="focus-state-badge">{selectedLevels.length ? `${Math.max(...selectedLevels.map((focus) => focus.level))}레벨 선택됨` : locked ? '선택 불가' : '미선택'}</span>
                    </div>
                    {first.englishName && <p className="focus-english-name">{first.englishName}</p>}
                    <p className="focus-preview">{rulesText(first.desc || first.effect)}</p>
                    <button type="button" className="focus-read-button" aria-haspopup="dialog"
                      aria-label={`자세히 보기: ${focusName(first)} (${category})`} onClick={() => setOpenFamilyId(family.id)}>
                      자세히 보기
                    </button>
                    <div className="focus-level-actions">
                      {family.levels.map((focus) => <LevelAction key={focus.id} focus={focus} context={props} location="card" />)}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <dialog ref={dialogRef} className="focus-dialog" aria-labelledby="focus-dialog-title" aria-describedby="focus-dialog-help"
        onClose={() => setOpenFamilyId(null)} onKeyDown={containDialogFocus}>
        {activeFamily && activeFocus && <>
          <header className="focus-dialog-header">
            <div>
              <p className="eyebrow">{activeFamily.category}</p>
              <h3 id="focus-dialog-title">{activeFocus.name}</h3>
              {activeFocus.englishName && <p className="focus-english-name">{activeFocus.englishName}</p>}
            </div>
            <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="포커스 설명 닫기">닫기</button>
          </header>
          <div className="focus-dialog-body" tabIndex={0} role="region" aria-label="포커스 전체 설명">
            <p id="focus-dialog-help" className="support-text">설명을 읽는 것만으로는 포커스가 선택되지 않습니다. 등록된 각 레벨의 효과를 아래에서 확인하세요.</p>
            <h4>설명</h4>
            <p className="focus-full-text">{rulesText(activeFocus.desc) || '등록된 설명이 없습니다.'}</p>
            {activeFamily.levels.map((focus) => (
              <section key={focus.id} className="focus-detail-level" aria-label={`${focusName(focus)} ${focus.level}레벨 설명`}>
                <h4>{focus.level}레벨 <span className="focus-state-badge">{selectedIds.includes(focus.id) ? '선택됨' : '선택권 1개'}</span></h4>
                {focus !== activeFocus && focus.desc && focus.desc !== activeFocus.desc && <p className="focus-full-text">{rulesText(focus.desc)}</p>}
                <p className="focus-full-text">{rulesText(focus.effect) || '등록된 레벨 효과가 없습니다.'}</p>
                {focus.ability_ids?.map((id) => {
                  const ability = abilityById(id, props.abilities)
                  return ability ? <section key={id} aria-label={`부여 능력: ${ability.name}`}>
                    <h5>{ability.name}</h5><p className="focus-english-name">{ability.englishName}</p>
                    <p className="focus-full-text" lang="ko">{rulesText(ability.desc)}</p>
                    {Boolean(ability.manual_review?.length) && <div className="skill-review">
                      <strong>규칙 문구 또는 효과 확인 필요</strong>
                      <ul>{ability.manual_review!.map((note) => <li key={note}>{ko(note)}</li>)}</ul>
                    </div>}
                  </section> : <p className="skill-choice-error" key={id}>능력의 정의가 누락되었거나 중복되었습니다.</p>
                })}
                <h5>선택 조건</h5>
                <p>사용 가능한 선택권: {compatibleFocusAllowances(focus).map((type) => FOCUS_ALLOWANCE_LABELS[type]).join(' 또는 ')}.</p>
                {focus.requirements.length ? <ul>{focus.requirements.map((rule, index) =>
                  <li key={index}>{requirementLabel(rule, foci, classes)}</li>)}</ul> : <p>등록된 선행 조건이 없습니다.</p>}
                <h5>자동 적용 보너스</h5>
                {focus.bonus.length ? <ul>{focus.bonus.map((bonus, index) =>
                  <li key={index}>{bonusDescription(bonus, skills, attributes)}</li>)}</ul> : <p>등록된 기술·수정치 보너스가 없습니다.</p>}
                {focus.repeatable && <p>반복 선택할 수 있습니다. 각 항목의 선택 결과와 상위 레벨은 개별적으로 관리됩니다.{focus.unique_skill ? ' 각 항목은 서로 다른 기술을 선택해야 합니다.' : ''}</p>}
                {focus.type === 'origin' && <p>기원 포커스는 한 계열만 선택할 수 있습니다. 연결된 상위 레벨은 같은 계열로 취급하지만 별도의 선택권이 필요합니다.</p>}
                {focus.packages && <><h5>{focus.packages.required ? '특성 묶음 하나 선택' : '선택 특성'}</h5><ul>{focus.packages.options.map((option) => <li key={option.id}><strong>{option.name}:</strong> {rulesText(option.description)}</li>)}</ul></>}
                {focus.score_effect && <p>능력치 규칙: {focus.score_effect.kind === 'raise_to' ? `조건에 맞는 ${focus.score_effect.value} 미만의 육체 능력치 하나를 ${focus.score_effect.value}(으)로 높일 수 있음` : `${focus.score_effect.value}보다 높은 능력치는 최대 하나만 유지하고 나머지 초과분은 낮춤`}. 수정치 보너스와는 별개로 적용합니다.</p>}
                {Boolean(focus.extra_focus_picks) && <p>추가 포커스 선택권: {focus.extra_focus_picks}개 (이 포커스도 선택권 하나를 사용합니다).</p>}
                {focus.derived_bonus?.base_attack_bonus !== undefined && <p>기본 공격 보너스 조정: {signed(focus.derived_bonus.base_attack_bonus)}. 일반 공격 보너스보다 먼저 클래스 성장 수치에 적용합니다. 연결된 상위 레벨은 하위 레벨의 조정을 유지합니다.</p>}
                {focus.derived_bonus && <p>시트에 적용되는 상시 보정: {focus.derived_bonus.attack ? `공격 +${focus.derived_bonus.attack}. ` : ''}{focus.derived_bonus.saves ? `내성: ${Object.entries(focus.derived_bonus.saves).map(([id, value]) => `${nameFor(id)} +${value}`).join(', ')}. ` : ''}{focus.derived_bonus.encumbrance_str ? `하중 계산용 근력 +${focus.derived_bonus.encumbrance_str}. ` : ''}{focus.derived_bonus.system_strain_max ? `최대 기관계 부담 +${focus.derived_bonus.system_strain_max}.` : ''}</p>}
                {Boolean(focus.sheet_notes?.length) && <><h5>플레이 참고사항</h5><ul>{focus.sheet_notes!.map((note) => <li key={note}>{ko(note.replaceAll('{skill}', '선택한 기술'))}</li>)}</ul></>}
                {Boolean(focus.manual_review?.length) && <div className="skill-review">
                  <h5>수동으로 적용할 규칙</h5>
                  <ul>{focus.manual_review!.map((note) => <li key={note}>{ko(note)}</li>)}</ul>
                </div>}
              </section>
            ))}
            <p className="support-text">수정치의 기본 범위는 -2부터 +2까지입니다. 명시된 한계 변경은 해당 능력치에만 적용됩니다. +3 한계가 여러 번 적용되어도 +3입니다. 모든 수정치를 합산한 뒤 최종 한계 안으로 제한합니다. 미구현 효과는 직접 확인해 적용하세요. 포커스를 고른 뒤 생성 화면에서 보너스를 선택할 수 있습니다.</p>
          </div>
          <footer className="focus-dialog-footer">
            <p className="focus-pick-count" role="status" aria-live="polite">선택권 {selectedIds.length}/{limit}개 사용. 2레벨에는 추가 선택권 하나가 필요합니다.</p>
            <div className="focus-level-actions">
              {activeFamily.levels.map((focus) => <LevelAction key={focus.id} focus={focus} context={props} location="dialog" />)}
            </div>
          </footer>
        </>}
      </dialog>
    </>
  )
}
