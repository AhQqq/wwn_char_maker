import { ko, nameFor, rulesText } from './korean'
import { artChoiceReason } from '../../shared/artSelection'
import type { ArtChoices, ArtOption, ArtPlan, ClassArtChoices } from '../../shared/artSelection'

type Props = {
  plans: ArtPlan[]
  choices: ArtChoices
  notice: string
  onToggle: (classId: string, groupKey: string | null, id: string) => void
}

function ArtDescription({ art }: { art: ArtOption }) {
  return <details className="spell-description">
    <summary>전체 설명 읽기</summary>
    <p>{rulesText(art.description) || '등록된 설명이 없습니다.'}</p>
  </details>
}

export function ArtPicker({ plans, choices, notice, onToggle }: Props) {
  function choiceSection(plan: ArtPlan, current: ClassArtChoices, key: string | null,
    label: string, required: number, options: ArtOption[]) {
    const selected = key === null ? current.chosen : current.groups[key] ?? []
    return <section className="art-choice-section" key={key ?? 'additional'} aria-label={`${nameFor(plan.classId)}: ${ko(label)}`}>
      <div className="focus-category-header">
        <h4>{ko(label)}</h4><span role="status">{selected.length}/{required}개 선택</span>
      </div>
      <div className="focus-grid">
        {options.map((art) => {
          const picked = selected.includes(art.id)
          const reason = artChoiceReason(plan, current, key, art.id)
          const statusId = `art-${plan.classId}-${key ?? 'additional'}-${art.id}-status`
          return <article key={art.id} className={`spell-option art-option${picked ? ' is-learned' : ''}`} data-art-id={art.id}>
            <h5>{art.name}</h5><p className="focus-english-name">{art.eng_name}</p>
            <ArtDescription art={art} />
            <button type="button" className={`focus-level-button${picked ? ' selected' : ''}`}
              aria-pressed={picked} aria-describedby={statusId} disabled={!picked && Boolean(reason)}
              onClick={() => onToggle(plan.classId, key, art.id)}>{picked ? '기교 해제' : '기교 선택'}</button>
            <small className="focus-level-status" id={statusId}>{picked ? '선택됨' : reason ? ko(reason) : '선택할 수 있습니다.'}</small>
          </article>
        })}
      </div>
    </section>
  }

  return <section className="card art-selection" aria-labelledby="art-selection-title">
    <div className="card-header">
      <div><p className="step-label">14단계</p><h2 id="art-selection-title">클래스 기교 선택</h2></div>
    </div>
    <p className="support-text">시작 기교는 클래스별로 한 번만 부여됩니다. 고정 기교는 자동으로 습득하며, 지정 목록에서 고르는 기교와 추가 기교는 각각 따로 선택합니다.</p>
    {notice && <p className="spell-notice" role="status">{ko(notice)}</p>}
    {!plans.length && <p className="info-panel">선택한 클래스는 기교 선택이 필요하지 않습니다.</p>}
    {plans.map((plan) => {
      const current = choices[plan.classId] ?? { groups: {}, chosen: [] }
      const picked = Object.values(current.groups).flat().length + current.chosen.length
      const required = plan.groups.reduce((sum, group) => sum + group.choose, plan.choose)
      return <section className="spell-class-slot" key={plan.classId} data-art-class={plan.classId}
        aria-label={`${nameFor(plan.classId)} 기교`}>
        <div className="focus-category-header"><h3>{nameFor(plan.classId)} / {plan.mode === 'full' ? '순수 클래스' : '부분 클래스'}</h3>
          {plan.configured && <span role="status">자동 습득 {plan.fixed.length}개 / {picked}/{required}개 선택</span>}
        </div>
        {!plan.configured ? <div className="skill-review" role="status">
          <strong>클래스 기교 선택 불가</strong>
          <ul>{plan.issues.map((issue, index) => <li key={index}>{ko(issue)}</li>)}</ul>
        </div> : <>
          {plan.fixed.length > 0 && <section className="art-choice-section" aria-label={`${nameFor(plan.classId)}: 자동 습득 기교`}>
            <h4>클래스에서 자동 습득</h4>
            <div className="focus-grid">{plan.fixed.map((id) => {
              const art = plan.options.find((option) => option.id === id)!
              return <article key={id} className="spell-option art-option is-granted" data-art-id={id}>
                <h5>{art.name}</h5><p className="focus-english-name">{art.eng_name}</p>
                <span className="focus-state-badge">클래스에서 자동 습득 / 해제 불가</span>
                <ArtDescription art={art} />
              </article>
            })}</div>
          </section>}
          {plan.groups.map((group, index) => <div key={group.key}>
            <p className="support-text">{group.exclusive
              ? '이 목록의 기교는 여기서만 선택할 수 있으며, 나머지는 추가 기교로 고를 수 없습니다.'
              : '여기서 고르지 않은 기교는 추가 기교로 선택할 수 있습니다.'}</p>
            {choiceSection(plan, current, group.key, group.label || `지정 목록 ${index + 1}`,
              group.choose, plan.options.filter((art) => group.options.includes(art.id)))}
          </div>)}
          {plan.choose > 0 && choiceSection(plan, current, null, '추가 기교', plan.choose,
            plan.options.filter((art) => !plan.fixed.includes(art.id)))}
          {required === 0 && <p className="support-text">시작 기교를 모두 자동으로 습득하므로 추가 선택이 필요하지 않습니다.</p>}
        </>}
      </section>
    })}
  </section>
}
