import { ko, nameFor, rulesText } from './korean'
import { useState } from 'react'
import { COPPER_PER_SILVER, equipmentPriceCopper } from '../../shared/equipment'
import type { EquipmentLoadout, EquipmentPurchase, InventoryEvaluation } from '../../shared/equipment'
import type { EquipmentDefinition, EquipmentProperty } from '../../shared/startingEquipment'
import { EquipmentTable } from './EquipmentPicker'

export function coinLabel(copper: number | null) {
  if (copper === null) return '미정'
  const silver = Math.floor(copper / COPPER_PER_SILVER)
  const remainder = copper % COPPER_PER_SILVER
  return `${silver}은화${remainder ? ` + ${remainder}동화` : ''}`
}

function priceLabel(item: EquipmentDefinition) {
  if (!item.price) return item.availability === 'inherent' ? '기본 제공' : '가격 미기재'
  return `${item.price.amount} ${item.price.currency === 'silver' ? '은화' : '동화'}`
}

export function EquipmentItemDetails({ item, properties }: { item: EquipmentDefinition; properties: EquipmentProperty[] }) {
  return <div className="equipment-item-details">
    <dl className="equipment-stats">
      <div><dt>가격</dt><dd>{priceLabel(item)}</dd></div>
      <div><dt>표기 하중</dt><dd>{item.encumbrance.raw}</dd></div>
      {item.weapon && <>
        <div><dt>기본 피해</dt><dd>{item.weapon.damage}</dd></div>
        <div><dt>충격</dt><dd>{item.weapon.shock ? `${item.weapon.shock.damage} / 방어도 ${item.weapon.shock.maxAc}` : '없음'}</dd></div>
        <div><dt>능력치</dt><dd>{item.weapon.attributes.map(nameFor).join(' / ')}</dd></div>
        <div><dt>사거리</dt><dd>{item.weapon.range ? `${item.weapon.range.normal} / ${item.weapon.range.maximum}피트` : '미기재'}</dd></div>
      </>}
      {item.armor && <>
        <div><dt>기본 방어도</dt><dd>{item.armor.baseAc}</dd></div>
        <div><dt>갑옷 분류</dt><dd>{nameFor(item.armor.category)}</dd></div>
        <div><dt>잠행 판정</dt><dd>{item.armor.skillPenalties.sneak}</dd></div>
        <div><dt>운동 판정</dt><dd>{item.armor.skillPenalties.exert}</dd></div>
      </>}
      {item.shield && <div><dt>방패 방어도</dt><dd>{item.shield.baseAc} / +{item.shield.armorBonus}</dd></div>}
    </dl>
    {item.propertyIds.length > 0 && <dl className="equipment-property-list">
      {item.propertyIds.map((id) => {
        const property = properties.find((entry) => entry.id === id)
        return <div key={id}><dt>{property?.name ?? '알 수 없는 특성'}</dt><dd>{property ? rulesText(property.description) : '특성 설명이 등록되지 않았습니다.'}</dd></div>
      })}
    </dl>}
    {item.encumbrance.raw.includes('*') && <p className="support-text">출처의 하중 각주에 불일치가 있습니다. 원문의 수치와 기호를 유지했으므로 하중을 직접 확인하세요.</p>}
    {item.availability === 'grant_only' && <p className="support-text">가격이 등록되지 않아 구매할 수 없습니다. 꾸러미 지급 또는 규칙 참고용 항목이며, 무료 장비가 아닙니다.</p>}
    {item.type === 'bundle' && <p className="support-text">하나의 묶음으로 취급합니다. 구성품, 가격, 개별 하중은 임의로 계산하지 않습니다.</p>}
  </div>
}

export function InventorySummary({ evaluation, equipment, properties }: {
  evaluation: InventoryEvaluation; equipment: EquipmentDefinition[]; properties: EquipmentProperty[]
}) {
  const { starting, armorClass } = evaluation
  return <div className="equipment-summary">
    <p><strong>{starting.package ? starting.package.name : starting.complete ? '주사위로 정한 시작 은화' : '시작 장비 미완료'}</strong></p>
    {starting.choice.method === 'silver' && starting.complete &&
      <p>({starting.choice.rolls.join(' + ')}) &times; 10 = {starting.silver}은화.</p>}
    <p>시작 자금: {starting.silver ?? '--'}은화. 사용: {coinLabel(evaluation.spentCopper)}. 잔액: <strong>{coinLabel(evaluation.remainingCopper)}</strong>.</p>
    {evaluation.items.length > 0 && <EquipmentTable items={evaluation.items} caption="보유 장비: 꾸러미와 구매한 장비" />}
    <p className="support-text">표기 하중 합계: {evaluation.encumbrance.listed}{!evaluation.encumbrance.complete && ' (일부만 합산하거나 검토가 필요함)'}. 꾸러미의 행별 하중은 수량을 이미 반영하며, 구매한 장비에는 묶음 특성을 적용합니다. 실제 휴대 하중이나 운반 한도는 계산하지 않습니다.</p>
    {evaluation.encumbrance.reviewIds.length > 0 && <p className="support-text">하중 확인 필요: {evaluation.encumbrance.reviewIds.map((id) => equipment.find((item) => item.id === id)?.name ?? id).join(', ')}.</p>}
    <div className="info-panel equipment-ac" aria-live="polite">
      <strong>장비 적용 방어도: {armorClass.value ?? '미정'}</strong>
      {armorClass.complete ? <>
        <p>기본 {armorClass.base} + 방패 보너스 {armorClass.shieldBonus} + 민첩 수정치 ({armorClass.dexterity}) = {armorClass.value}.</p>
        <p>갑옷: {armorClass.armor?.name}. 손에 든 방패: {armorClass.shield?.name ?? '없음'}.</p>
        <p>잠행 판정 {armorClass.skillPenalties.sneak} / 운동 판정 {armorClass.skillPenalties.exert}. 기술 레벨이 아니라 판정에 적용되는 페널티입니다.</p>
        {armorClass.shield && <p>{properties.find((item) => item.id === 'shield_protection')?.description}</p>}
      </> : <ul className="issue-list">{armorClass.issues.map((issue, index) => <li key={index}>{ko(issue)}</li>)}</ul>}
    </div>
    {armorClass.complete && armorClass.weapon && <details className="equipment-details">
      <summary>사용 무기: {armorClass.weapon.name}</summary>
      <EquipmentItemDetails item={armorClass.weapon} properties={properties} />
      <p className="support-text">무기의 기본 수치입니다. 기술·능력치·포커스 및 상황에 따른 공격과 피해 보정은 반영하지 않습니다.</p>
    </details>}
    <p className="support-text">미구현된 포커스·기교의 방어도 예외와 일시적 효과는 직접 적용하세요. 준비·보관 장비의 한도, 운송 수단, 동전 하중은 추적하지 않습니다.</p>
  </div>
}

export function EquipmentInventory({ evaluation, purchases, loadout, equipment, properties, onPurchase, onLoadout }: {
  evaluation: InventoryEvaluation; purchases: EquipmentPurchase[]; loadout: EquipmentLoadout
  equipment: EquipmentDefinition[]; properties: EquipmentProperty[]
  onPurchase: (id: string, count: number) => void
  onLoadout: (choice: EquipmentLoadout) => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('weapon')
  const needle = search.trim().toLocaleLowerCase()
  const filtered = equipment.filter((item) => (category === 'all' || item.category === category) &&
    [item.name, item.id, ...item.sources.map((source) => source.name),
      ...item.propertyIds.map((id) => properties.find((property) => property.id === id)?.name ?? id)]
      .some((value) => value.toLocaleLowerCase().includes(needle)))
  const owned = equipment.filter((item) => evaluation.items.some((row) => row.id === item.id && row.count > 0))
  const activeWeapon = equipment.find((item) => item.id === loadout.weaponId)
  const heldShield = equipment.find((item) => item.id === loadout.shieldId)
  const slotOptions = {
    armorId: owned.filter((item) => item.armor),
    shieldId: owned.filter((item) => item.shield),
    weaponId: owned.filter((item) => item.weapon),
  }
  function unavailable(item: EquipmentDefinition, slot: keyof EquipmentLoadout) {
    if (slot === 'shieldId' && activeWeapon?.propertyIds.includes('two_handed')) return '사용 무기에 양손이 필요합니다'
    if (slot === 'weaponId' && item.propertyIds.includes('two_handed') && loadout.shieldId) return '먼저 손에 든 방패를 해제하세요'
    if (slot === 'weaponId' && item.shield && item.id !== loadout.shieldId) return '먼저 이 방패를 손에 들어야 합니다'
    return ''
  }
  function changeSlot(slot: keyof EquipmentLoadout, id: string) {
    const next = { ...loadout, [slot]: id }
    if (slot === 'shieldId' && activeWeapon?.shield && next.shieldId !== next.weaponId) next.weaponId = ''
    onLoadout(next)
  }
  return <section className="card equipment-inventory" aria-labelledby="equipment-inventory-title">
    <div className="card-header"><div><p className="step-label">10-11단계</p><h2 id="equipment-inventory-title">장비 구매와 착용</h2></div></div>
    <p className="support-text">꾸러미에 포함된 돈이나 굴려서 받은 은화로 장비를 구매한 뒤, 착용하거나 손에 들 장비를 선택하세요. 수량 1은 목록에 표시된 단위입니다. 예를 들어 화살은 20개 한 묶음이지만 투척용 단검은 한 자루입니다. 10동화 = 1은화입니다.</p>
    <div className="equipment-budget" role="status">
      <span>시작 자금 <strong>{evaluation.starting.silver ?? '--'}은화</strong></span>
      <span>사용 <strong>{coinLabel(evaluation.spentCopper)}</strong></span>
      <span>잔액 <strong>{coinLabel(evaluation.remainingCopper)}</strong></span>
    </div>
    <h3>구매한 장비</h3>
    <p className="support-text">꾸러미로 받은 장비는 수정하거나 판매할 수 없습니다. 구매 취소 시 비용이 반환됩니다. 시작 꾸러미·획득 방식을 바꾸거나 은화를 다시 굴리면 구매 및 착용 내역이 초기화됩니다.</p>
    {purchases.length === 0 ? <p>아직 구매한 장비가 없습니다.</p> : <div className="equipment-cart">
      {purchases.map((row) => {
        const item = equipment.find((entry) => entry.id === row.id)
        const price = item ? equipmentPriceCopper(item) : null
        const maximum = price !== null && evaluation.remainingCopper !== null ? row.count + Math.floor(evaluation.remainingCopper / price) : row.count
        return <div className="equipment-cart-row" key={row.id}>
          <div><strong>{item?.name ?? row.id}</strong><small>{price === null ? '구매 불가' : `개당 ${coinLabel(price)} / 합계 ${coinLabel(price * row.count)}`}</small></div>
          <label><span>수량</span><input type="number" min="1" max={Math.max(1, maximum)} step="1" value={row.count}
            aria-label={`${item?.name ?? '알 수 없는 장비'} 수량`}
            onChange={(event) => { const count = event.currentTarget.valueAsNumber; if (Number.isSafeInteger(count) && count > 0) onPurchase(row.id, count) }} /></label>
          <button type="button" className="secondary" onClick={() => onPurchase(row.id, 0)}>해제<span className="sr-only"> {item?.name ?? row.id}</span></button>
        </div>
      })}
    </div>}
    <details className="equipment-catalogue">
      <summary>장비 목록 살펴보기 ({equipment.length}종)</summary>
      <div className="form-grid two-up equipment-filters">
        <label><span>장비 이름 또는 특성 검색</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span>분류</span><select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">전체 장비</option><option value="weapon">무기</option><option value="armor">갑옷</option>
          <option value="shield">방패</option><option value="gear">모험 장비</option><option value="bundle">묶음</option>
        </select></label>
      </div>
      <p className="support-text">검색 결과 {filtered.length}종. 자금이 부족하거나 가격이 없는 장비의 설명도 읽을 수 있습니다.</p>
      <div className="focus-grid equipment-catalogue-grid">
        {filtered.map((item) => {
          const price = equipmentPriceCopper(item)
          const count = purchases.find((row) => row.id === item.id)?.count ?? 0
          const disabled = !evaluation.complete ? '먼저 시작 장비를 정하고 구매 오류를 해결하세요'
            : price === null ? item.availability === 'inherent' ? '항상 사용할 수 있으며 구매할 필요가 없습니다' : '가격이 등록되지 않았습니다'
              : price > (evaluation.remainingCopper ?? 0) ? '자금이 부족합니다' : ''
          return <article className="equipment-package" key={item.id}>
            <h4>{item.name}</h4><p className="equipment-package-meta">{priceLabel(item)} / 하중 {item.encumbrance.raw}</p>
            <details className="equipment-details"><summary>수치와 특성</summary><EquipmentItemDetails item={item} properties={properties} /></details>
            {disabled && <p className="support-text" id={`equipment-unavailable-${item.id}`}>{disabled}</p>}
            <button type="button" disabled={Boolean(disabled)} aria-describedby={disabled ? `equipment-unavailable-${item.id}` : undefined}
              onClick={() => onPurchase(item.id, count + 1)}>{item.name} 1개 구매</button>
          </article>
        })}
      </div>
      {!filtered.length && <p>검색 결과가 없습니다.</p>}
    </details>
    <h3>착용하고 손에 든 장비</h3>
    <p className="support-text">장비는 자동으로 착용되지 않습니다. 선택하지 않으면 맨몸·방패 없음·비무장 상태입니다. 방패는 보유만 해서는 방어도가 적용되지 않으며, 손에 들어야 합니다.</p>
    <div className="form-grid equipment-loadout">
      {(['armorId', 'shieldId', 'weaponId'] as const).map((slot) => <label key={slot}>
        <span>{slot === 'armorId' ? '착용한 갑옷' : slot === 'shieldId' ? '손에 든 방패' : '사용 무기'}</span>
        <select value={loadout[slot]} disabled={!evaluation.complete} onChange={(event) => changeSlot(slot, event.target.value)}>
          <option value="">{slot === 'armorId' ? '맨몸' : slot === 'shieldId' ? '방패 없음' : '비무장 공격'}</option>
          {loadout[slot] && !slotOptions[slot].some((item) => item.id === loadout[slot]) &&
            <option value={loadout[slot]}>선택 불가 (다시 선택하세요)</option>}
          {slotOptions[slot].map((item) => {
            const reason = unavailable(item, slot)
            return <option key={item.id} value={item.id} disabled={Boolean(reason)}>{item.name}{reason ? ` - ${reason}` : ''}</option>
          })}
        </select>
      </label>)}
    </div>
    {evaluation.armorClass.armor && <details className="equipment-details"><summary>착용한 갑옷 규칙 보기</summary>
      <EquipmentItemDetails item={evaluation.armorClass.armor} properties={properties} /></details>}
    {heldShield && <details className="equipment-details"><summary>손에 든 방패 규칙 보기</summary>
      <EquipmentItemDetails item={heldShield} properties={properties} /></details>}
    {evaluation.issues.length > 0 && <ul className="issue-list" role="status">{evaluation.issues.map((issue, index) => <li key={index}>{ko(issue)}</li>)}</ul>}
    <p className="support-text"><a href="https://ahqqq.github.io/equipment.html" target="_blank" rel="noreferrer">장비 출처</a>. 원문의 수치를 유지했으며, 알려진 불일치는 장비 데이터 검토 문서에 기록되어 있습니다.</p>
    <details className="equipment-details"><summary>장비 특성 전체 목록</summary>
      <dl className="equipment-property-list">{properties.map((property) => <div key={property.id}>
        <dt>{property.name}</dt><dd>{rulesText(property.description)}</dd>
      </div>)}</dl>
    </details>
  </section>
}
