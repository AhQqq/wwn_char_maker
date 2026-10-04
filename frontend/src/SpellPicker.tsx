import { ko, rulesText } from './korean'
import { availableSpells, CLASS_SLOTS, isSpellcaster, spellSchoolLabel, spellSchools, spellSelectionReason } from '../../shared/spellSelection'
import type { ClassSlot, SpellChoices, SpellOption } from '../../shared/spellSelection'

type Props = {
  classIds: string[]
  classes: Array<{ id: string; name: string; eng_name: string }>
  spells: SpellOption[]
  choices: SpellChoices
  notice: string
  onToggle: (slot: ClassSlot, id: string) => void
}

export function SpellPicker({ classIds, classes, spells, choices, notice, onToggle }: Props) {
  const casterSlots = CLASS_SLOTS.filter((slot) => isSpellcaster(classIds[slot]))
  return (
    <section className="card spell-selection" aria-labelledby="spell-selection-title">
      <div className="card-header">
        <div><p className="step-label">15단계 / 마지막 단계</p><h2 id="spell-selection-title">1레벨 주문 습득</h2></div>
      </div>
      <p className="support-text">1레벨 캐릭터 생성에 맞춰 1레벨 주문만 표시합니다. 주문 시전 클래스마다 서로 다른 주문 두 개를 배우며, 두 클래스에서 같은 주문을 중복 습득할 수 없습니다.</p>
      {notice && <p className="spell-notice" role="status">{ko(notice)}</p>}
      {casterSlots.length === 0 ? <p className="info-panel">선택한 두 클래스는 주문을 시전하지 않으므로 주문 선택이 필요하지 않습니다.</p> : <>
        <p className="focus-pick-count" role="status">주문 {choices.flat().length}/{casterSlots.length * 2}개 습득</p>
        {CLASS_SLOTS.map((slot) => {
          const letter = slot + 1
          const classOption = classes.find((option) => option.id === classIds[slot])
          const className = classOption?.name || '클래스 미선택'
          const eligible = availableSpells(spells, classIds[slot])
          const caster = isSpellcaster(classIds[slot])
          const categories = [...new Set(eligible.map((spell) => spell.category))]
          return (
            <section key={slot} className="spell-class-slot" data-spell-slot={slot} aria-label={`${letter}번째 클래스 주문: ${className}`}>
              <div className="focus-category-header">
                <h3>{letter}번째 클래스: {className}</h3>
                <span role="status">{choices[slot].length}/{caster ? 2 : 0}개 습득</span>
              </div>
              {!caster ? <p className="support-text">이 클래스는 주문을 부여하지 않습니다.</p> : <>
                <p className="support-text">선택 가능한 학파: {spellSchools(classIds[slot]).map((school) => ko(spellSchoolLabel(school))).join(', ')}. 이 두 주문은 해당 클래스의 목록에서만 선택합니다.</p>
                <ol className="learned-spell-list" aria-label={`${letter}번째 클래스에서 습득한 주문`}>
                  {[0, 1].map((pick) => {
                    const spell = spells.find((item) => item.id === choices[slot][pick])
                    return <li key={pick}>
                      {spell ? <><span>{spell.name}</span>
                        <button type="button" onClick={() => onToggle(slot, spell.id)}
                          aria-label={`${letter}번째 클래스의 ${spell.name} 해제`}>해제</button></>
                        : <span className="empty-spell-pick">아래에서 {pick + 1}번째 주문을 선택하세요</span>}
                    </li>
                  })}
                </ol>
                {categories.map((category) => <section key={category} className="spell-school" aria-label={`${letter}번째 클래스: ${ko(spellSchoolLabel(category))}`}>
                  <h4>{ko(spellSchoolLabel(category))}</h4>
                  <div className="focus-grid">
                    {eligible.filter((spell) => spell.category === category).map((spell) => {
                      const selected = choices[slot].includes(spell.id)
                      const reason = spellSelectionReason(spell, slot, choices, classIds)
                      const statusId = `spell-${slot}-${spell.id}-status`
                      return <article key={spell.id} data-spell-id={spell.id} className={`spell-option${selected ? ' is-learned' : ''}`}>
                        <h5>{spell.name}</h5>
                        <p className="focus-english-name">{spell.englishName}</p>
                        <span className="focus-state-badge">1레벨{selected ? ' / 습득함' : ''}</span>
                        <details className="spell-description">
                          <summary>전체 설명 읽기</summary>
                          <p>{rulesText(spell.description) || '등록된 설명이 없습니다.'}</p>
                        </details>
                        <button type="button" className={`focus-level-button${selected ? ' selected' : ''}`}
                          aria-pressed={selected} disabled={!selected && Boolean(reason)} aria-describedby={statusId}
                          onClick={() => onToggle(slot, spell.id)}>{selected ? '주문 해제' : '주문 습득'}</button>
                        <small id={statusId} className="focus-level-status">{selected ? `${letter}번째 클래스에서 습득했습니다.` : reason ? ko(reason) : `${letter}번째 클래스의 주문 선택 2개 중 1개를 사용합니다.`}</small>
                      </article>
                    })}
                  </div>
                </section>)}
              </>}
            </section>
          )
        })}
      </>}
    </section>
  )
}
