import type { ReactNode } from 'react'

export type RuleTopic = 'attributes' | 'background' | 'skills' | 'classes' | 'foci' | 'equipment' | 'combat' | 'arts' | 'spells' | 'scope'

export function RulesLink({ topic, children = '관련 규칙' }: { topic: RuleTopic; children?: ReactNode }) {
  return <a className="rules-link" href={'#rules-' + topic}>{children}<span aria-hidden="true"> ↗</span></a>
}
