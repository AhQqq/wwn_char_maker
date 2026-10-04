import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let CharacterSheet
let makeProps
let cases

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ CharacterSheet } = await server.ssrLoadModule('/src/CharacterSheet.tsx'))
  const { evaluateCharacter, readCharacterData } = await server.ssrLoadModule('../backend/src/character.ts')
  const { baseDraft, characterDraftCases } = await server.ssrLoadModule('../backend/src/fixtures/characterDrafts.ts')
  const { evaluatePreviewCore } = await server.ssrLoadModule('/src/characterPreview.ts')
  const { allocatedAttributes, restoreAttributeAllocation } = await server.ssrLoadModule('/src/attributeAllocation.ts')
  const { evaluateCreationEffects } = await server.ssrLoadModule('../shared/characterCreation.ts')
  const { evaluateClassChoices } = await server.ssrLoadModule('../shared/classSelection.ts')
  const { classBuildName } = await server.ssrLoadModule('../shared/classBuild.ts')
  const { evaluateArtChoices } = await server.ssrLoadModule('../shared/artSelection.ts')
  const data = readCharacterData()
  cases = new Map(characterDraftCases())
  makeProps = (source = baseDraft()) => {
    const character = { ...source, ...restoreAttributeAllocation(source) }
    const core = evaluatePreviewCore(character, data)
    const effects = evaluateCreationEffects(character, data, core, evaluateClassChoices(character.classChoices, data.CLASSES))
    return {
      character, catalogues: data, evaluation: evaluateCharacter(character),
      evaluationCurrent: true, backendOnline: true, evaluationError: '',
      allocatedScores: allocatedAttributes(character),
      resolvedClassBuild: classBuildName(character.classChoices, data.CLASSES, data.COMBINATIONS),
      displayedArmorClass: effects.equipmentInventory.armorClass, displayedSaves: effects.savingThrows,
      abilitySelection: effects.abilitySelection, equipmentInventory: effects.equipmentInventory,
      skillAllocation: core.skillAllocation, focusCreation: core.focusCreation,
      allFocusInstances: [...core.focusCreation.instances, ...core.focusCreation.grantedInstances],
      focusEffort: effects.focusEffort,
      artEvaluation: evaluateArtChoices(character.artChoicesByClass, character.classChoices,
        data.CLASSES, data.STARTING_ARTS, data.ARTS, effects.focusTraditions),
    }
  }
})

after(async () => { await server?.close() })

const render = (props) => renderToStaticMarkup(createElement(CharacterSheet, props))
const vitals = (html) => html.match(/<div class="sheet-vitals"[\s\S]*?<details/)[0]

test('sheet preserves its anchor, level, bilingual classes, skill icons and rule links', () => {
  const props = makeProps()
  const html = render(props)
  assert.match(html, /id="character-sheet" aria-labelledby="character-sheet-title" tabindex="-1"/)
  assert.match(html, /레벨 1/)
  assert.match(html, /Warrior \/ Expert/)
  assert.match(html, /data-skill-id="administer"/)
  assert.match(html, /aria-hidden="true">account_balance/)
  assert.match(html, /href="#rules-skills"/)
  assert.match(html, /<details class="sheet-disclosure" open="">/)
})

test('sheet displays supplied combat results without recalculating them from choices', () => {
  const props = structuredClone(makeProps())
  props.evaluation.derived.hitPoints = 123
  props.evaluation.derived.attackBonus = 42
  props.displayedArmorClass.value = 77
  props.displayedSaves.targets.mental = 88
  const html = render(props)
  assert.match(vitals(html), /<span>HP<\/span><strong>123<\/strong>/)
  assert.match(vitals(html), /<span>AC<\/span><strong>77<\/strong>/)
  assert.match(vitals(html), /<span>공격 보너스<\/span><strong>\+42<\/strong>/)
  assert.match(html, /정신 내성 목표값<\/span><strong>88<\/strong>/)
})

test('pending and offline states retain the existing placeholders and local AC fallback', () => {
  const props = makeProps()
  for (const offline of [false, true]) {
    const html = render({ ...props, evaluationCurrent: false, backendOnline: !offline,
      evaluationError: offline ? 'Offline' : '' })
    assert.ok(html.includes(`class="sheet-status">${offline ? '연결 필요' : '계산 중'}`))
    assert.match(vitals(html), /<span>HP<\/span><strong>--<\/strong>/)
    assert.match(vitals(html), /<span>공격 보너스<\/span><strong>--<\/strong>/)
    assert.ok(vitals(html).includes(`<span>AC</span><strong>${props.displayedArmorClass.value}</strong>`))
    assert.ok(html.includes(`aria-busy="${!offline}"`))
  }
})

test('completion requires both valid evaluation and every completed stage', () => {
  const props = makeProps()
  const evaluation = { ...props.evaluation, valid: true, stepStatus: [{ key: 'test', complete: true }] }
  assert.match(render({ ...props, evaluation }), /sheet-status is-complete">생성 완료/)
  assert.match(render({ ...props, evaluation: { ...evaluation, valid: false } }), /sheet-status">작성 중/)
  assert.match(render({ ...props, evaluation: { ...evaluation, stepStatus: [{ key: 'test', complete: false }] } }), /sheet-status">작성 중/)
})

test('focus modifier caps and automatic focus grants remain visible', () => {
  const caps = render(makeProps(cases.get('modifier-cap')))
  assert.match(caps, /한계 -2 ~ \+3/)
  const grants = render(makeProps(cases.get('free-focus-refund')))
  assert.match(grants, /자동 습득/)
  assert.match(grants, /무화자/)
})

test('rendering does not mutate character choices, catalogues or evaluated results', () => {
  const props = makeProps(cases.get('tradition-full-elem'))
  const original = structuredClone(props)
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
  }
  freeze(props)
  assert.equal(render(props), render(props))
  assert.deepEqual(props, original)
})
