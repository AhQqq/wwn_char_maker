import { ko, nameFor, rulesText } from './korean'
import type { FocusClass, FocusOption } from './focusSelection'
import { focusInstanceLabel } from './focusSelection'
import { evaluateFocusInstances } from '../../shared/focusCreation'
import type { FocusInstance, FocusRuleChoice, FocusRuleChoices } from '../../shared/focusCreation'
import { FOCUS_ALLOWANCE_LABELS } from './korean'
import type { FocusAllowance, FocusAllowanceType } from '../../shared/focusAllowances'

export function FocusInstances({ instances, foci, classes, budget, assignments, ruleChoices, scores, attributes, onRemove, onUpgrade, onRuleChoice }: {
  instances: FocusInstance[]
  foci: FocusOption[]
  classes: FocusClass[]
  budget: FocusAllowance[]
  assignments: Array<{ instanceId: string; type: FocusAllowanceType }>
  ruleChoices: FocusRuleChoices
  scores: Record<string, number>
  attributes: Array<{ id: string; name: string; tags: string[] }>
  onRemove: (id: string) => void
  onUpgrade: (parentId: string, focusId: string) => void
  onRuleChoice: (id: string, key: keyof FocusRuleChoice, value: string) => void
}) {
  return <section aria-label="선택한 포커스 목록" className="focus-bonus-list">
    <h3>선택한 포커스</h3>
    <p className="support-text">기원 포커스는 연결된 상위 레벨을 포함해 한 계열만 선택할 수 있습니다. 각각의 선택과 레벨 향상에 선택권 하나가 필요합니다. 여기에서 개별 포커스를 해제하거나 향상할 수 있습니다.</p>
    {instances.map((instance) => {
      const focus = foci.find((item) => item.id === instance.focusId)
      const label = focusInstanceLabel(instance, instances, foci)
      const choice = ruleChoices[instance.instanceId] ?? {}
      const upgrades = foci.filter((item) => item.level === (focus?.level ?? 1) + 1 && item.requirements.some((rule) => rule.condition === 'has_focus' && rule.id === focus?.id))
      const effect = focus?.score_effect
      const physical = effect?.kind === 'raise_to' ? attributes.filter((item) => item.tags.some((tag) => effect.tags.includes(tag)) && scores[item.id] < effect.value) : []
      const high = effect?.kind === 'cap_except_one' ? attributes.filter((item) => scores[item.id] > effect.value) : []
      const parent = instances.find((item) => item.instanceId === instance.parentInstanceId)
      const assigned = assignments.find((item) => item.instanceId === instance.instanceId)
      return <section key={instance.instanceId} className="info-panel focus-bonus-panel" aria-label={`${label} 선택`}>
        <h4>{label}</h4>
        <p className={assigned ? 'support-text' : 'skill-choice-error'}>{assigned ? `${FOCUS_ALLOWANCE_LABELS[assigned.type]} 선택권을 사용합니다.` : '배정할 수 있는 선택권이 없습니다. 아래 선택 오류를 확인하세요.'}</p>
        {parent && <p>{focusInstanceLabel(parent, instances, foci)}에서 향상되었습니다.{foci.find((item) => item.id === parent.focusId)?.unique_skill ? ' 기존에 선택한 기술을 이어받으며 추가 기술을 얻지는 않습니다.' : ''}</p>}
        <div className="button-row">
          <button type="button" onClick={() => onRemove(instance.instanceId)} aria-label={`${label} 해제`}>이 포커스{instances.some((item) => item.parentInstanceId === instance.instanceId) ? '와 연결된 상위 레벨' : ''} 해제</button>
          {upgrades.map((upgrade) => {
            const already = instances.some((item) => item.focusId === upgrade.id && item.parentInstanceId === instance.instanceId)
            let previewId = 'preview_upgrade'
            while (instances.some((item) => item.instanceId === previewId)) previewId += '_'
            const candidate = { instanceId: previewId, focusId: upgrade.id, parentInstanceId: instance.instanceId }
            const preview = evaluateFocusInstances([...instances, candidate], undefined, foci, classes, budget)
            const allowed = !already && preview.complete
            const reasonId = `upgrade-${instance.instanceId}-${upgrade.id}`
            return <div key={upgrade.id}><button type="button" disabled={!allowed} aria-describedby={reasonId} onClick={() => onUpgrade(instance.instanceId, upgrade.id)} aria-label={`${label}을 ${upgrade.level}레벨로 향상`}>
              {already ? `${upgrade.level}레벨 습득함` : `${upgrade.level}레벨로 향상 (선택권 1개)`}
            </button><p id={reasonId} className="support-text">{already ? '이미 이 상위 레벨을 습득했습니다.' : allowed ? '조건에 맞는 포커스 선택권 하나를 사용합니다.' : `선택 불가: ${preview.issues.map(ko).join(' ')}`}</p></div>
          })}
        </div>
        {Boolean(focus?.extra_focus_picks) && <p className="support-text">자유 선택권 {focus!.extra_focus_picks}개를 추가합니다. 이 포커스를 해제하면 선택권을 다시 배정합니다. 먼저 고른 유효한 포커스는 유지하며, 조건을 잃은 연결 상위 레벨은 해제됩니다.</p>}
        {focus?.packages && <label>
          <span>{focus.packages.required ? '필수 선택 특성' : '선택 특성'}</span>
          <select aria-label={`${label} 특성 묶음`} value={choice.packageId ?? ''} aria-invalid={Boolean(focus.packages.required && !choice.packageId)}
            onChange={(event) => onRuleChoice(instance.instanceId, 'packageId', event.target.value)}>
            <option value="">{focus.packages.required ? '꾸러미 선택' : '추가 특성 없음'}</option>
            {choice.packageId && !focus.packages.options.some((option) => option.id === choice.packageId) && <option value={choice.packageId} disabled>유효하지 않은 특성 (다시 선택하세요)</option>}
            {focus.packages.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
          {focus.packages.options.find((option) => option.id === choice.packageId)?.description &&
            <p className="support-text">{rulesText(focus.packages.options.find((option) => option.id === choice.packageId)!.description)}</p>}
        </label>}
        {effect?.kind === 'raise_to' && <label>
          <span>육체 능력치 하나를 {effect.value}(으)로 증가 (선택 사항)</span>
          <select aria-label={`${label} 능력치 증가`} value={choice.attributeId ?? ''} onChange={(event) => onRuleChoice(instance.instanceId, 'attributeId', event.target.value)}>
            <option value="">능력치를 선택하거나 증가를 포기하세요</option>
            {effect.optional && <option value="none">능력치를 증가시키지 않음</option>}
            {physical.map((item) => <option key={item.id} value={item.id}>{item.name}: {scores[item.id]} → {effect.value}</option>)}
            {choice.attributeId && choice.attributeId !== 'none' && !physical.some((item) => item.id === choice.attributeId) && <option value={choice.attributeId} disabled>조건에 맞지 않는 능력치 (다시 선택하세요)</option>}
          </select>
        </label>}
        {effect?.kind === 'cap_except_one' && <div>
          <p>{effect.value}보다 높은 능력치는 최대 하나만 유지할 수 있습니다. 다른 능력치의 초과분은 최종 시트에서 낮아지며, 원래 배정값은 보존됩니다.</p>
          {high.length > 1 ? <label><span>유지할 능력치</span>
            <select aria-label={`${label} 유지할 능력치`} value={choice.retainedAttribute ?? ''} onChange={(event) => onRuleChoice(instance.instanceId, 'retainedAttribute', event.target.value)}>
              <option value="">능력치 하나 선택</option>
              {choice.retainedAttribute && !high.some((item) => item.id === choice.retainedAttribute) && <option value={choice.retainedAttribute} disabled>조건에 맞지 않는 능력치 (다시 선택하세요)</option>}
              {high.map((item) => <option key={item.id} value={item.id}>{item.name}: {scores[item.id]}</option>)}
            </select>
          </label> : <p className="support-text">{high.length === 1 ? `${nameFor(high[0].id)}만 ${effect.value}보다 높으므로 자동으로 유지됩니다.` : '낮아지는 능력치가 없습니다.'}</p>}
        </div>}
      </section>
    })}
  </section>
}
