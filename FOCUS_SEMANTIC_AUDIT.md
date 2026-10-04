# Full Focus Catalogue Semantic and Naming Audit

Date: 2026-10-04. Status: translator review draft; no catalogue or application changes applied.

## Scope and Evidence

This is an internal semantic audit of all **153 entries**, including both levels where present, in `frontend/data/foci.json`. It reviews `name`, `englishName`, `desc`, `effect`, special-ability text, prerequisites, encoded bonuses, packages, and creation metadata. It uses local skill/attribute/class catalogues, referenced spells/arts, `PROJECT_RULES.md`, and the current shared/backend evaluators to distinguish wording problems from implementation gaps.

**No external sources were consulted or are required for this review.** The existing English titles help assess possible names but are not evidence of missing English rules text. You, as the translator, decide intended meanings. Nothing below is an assertion that a suggested rendering is the official translation.

Names and level pairs are grouped for readability; the explicit **IDs** line in each review item records coverage. An item with a naming suggestion is not necessarily mistranslated. “Keep” means no compelling name change was found in this internal pass, not certification against an external original. Cosmetic variants may be intentional worldbuilding.

The audited catalogue's SHA-256 was `099E836518F291BDA92023411EE0C40E143E6F56260B9EE5C3377B8895A82EC1`. Stable IDs, rather than line numbers, locate entries after reformatting.

## How to Read Findings

- **P1**: resolve before relying on the entry for character creation or publishing it as an unambiguous rule. These include concrete data/prose discrepancies and high-impact unresolved readings.
- **P2**: clarify before play; different reasonable readings change targeting, timing, costs, or outcomes.
- **P3**: editorial or naming polish without an identified immediate mechanical discrepancy.
- **D (discrepancy)**: two local representations demonstrably differ. This does not establish which one should win.
- **R (ruling)**: the current text permits materially different interpretations. Proposed alternatives are not approved rules.
- **E (editing)**: terminology, syntax, scope, or units need clearer expression.
- **N (name)**: an optional title change based on the local English label and actual effect.

Korean sentences introduced as **conditional wording** assume the stated interpretation is approved. Square-bracket placeholders mark decisions still needed; they must not be pasted into published rules unresolved. Review is complete as a first pass; approval, rewriting, and implementation are not. If an established general rule already supplies a timing, distance, reroll, or action convention raised below, add a clear reference instead of inventing a special exception. An omission from one focus is not proof that the whole game lacks that rule.

## Priority Queue

| Priority | Entries | Reason to address first |
|---|---|---|
| P1 D | `authority2`, `elves2`, `chattel1`, `functionary1` | Additional or missing skill/modifier effects alter the character sheet. |
| P1 D/R | `armored_magic1`, `nullifier1`, `polymath1`, `lucky1` | Prose prerequisites are absent from requirements; Lucky's exact threshold and evaluation stage also need a ruling. |
| P1 D/R | `focus_0421`, `chattel1`, `elves1`, `gnomes1` | Creation-time score changes or variant choices are not represented. Resolve interactions with the fixed array and other bonuses first. |
| P1 D/R | `kitsune_beastfolk1`, `traditional_education1`, `spirit_familiar2`, `special_origin1` | Art grants, tradition choice, repeated upgrades, or nested focus selection are not captured by the current picker. |
| P1 D | `die_hard1`, `all_directions_edge_style1`, `impervious_defense1`, `dwarves_21` | HP/AC or HD wording affects first-level derived statistics but is not included in the current calculation. |
| P1 R | `ghoul1`, `nullifier1`, `specialist2`, `focus_0351`, `goblins_tinker1` | Contradictory feeding intervals, delayed save success, retained dice count, reversed distance wording, or “set” versus “subtract.” |
| P1/P2 R | `pyre_of_heaven_style2`, `trapmaster1`, `snipers_eye1`, `snipers_eye2`, `poisoner1`, `poisoner2` | Damage formulas, exceptions, or attack/save interactions can substantially change results. |

These are triage groups, not a claim that every issue is a bug or that unimplemented play-time effects must become a simulator. The detailed entries below are authoritative for the specific observations.

## Catalogue-Wide Wording Rules

| Topic | Observed risk | Editorial policy to approve |
|---|---|---|
| Speaker | “당신” and “여러분의 캐릭터” alternate. | Choose one rules voice; retaining “당신” consistently is concise. Flavor can remain stylistically varied. |
| Skill names | `stab` is 백병 in `skills.json`, but 접전/근접전 appear throughout foci; 잠행 also becomes 은신. | Use catalogue names when naming a skill: “백병(Stab) 기술”, “잠행(Sneak) 기술”. Reserve “근접 공격/근접전” for combat situations. |
| Attribute names | STR is 근력 in the catalogue but often 힘 in prose. | Use “근력(STR) 점수” or “근력 수정치”, never bare “능력치” when the distinction matters. |
| Actions | 주요/중요 행동; 간단/단순 행동; 즉시/즉각적인 행동 are mixed. | Define one label for each actual action type. Do not assume every ordinary phrase “즉각적인 행동” names the formal Instant action. |
| Casting | “주문을 외운다” can mean memorizing, preparing, or casting. | Distinguish “배운다”, “준비한다”, “시전한다”, and “일일 시전 횟수를 소비한다”. |
| Resource terms | 기관계 부담/기관계 부하/기관 부하; 분발/노력 vary. | Adopt one label per resource, preferably the project's established 기관계 부담 and 분발. State amount, commitment duration, recovery, and cap test. |
| Saves | “+2 내성” may be applied to a die or displayed target. | Write “내성굴림 결과에 +2 보너스” and explain once that the current sheet instead lowers its target by 2. Penalties raise it. Never apply both representations. |
| Numbers | “레벨” can mean character, focus, skill, spell, or target HD; “절반/반올림” is inconsistent. | Name the level source and parenthesize formulas. Use 올림/내림/가장 가까운 정수로 반올림 deliberately, with boundary examples. |
| Scope | “한 번”, “특정 대상”, “이 능력” have unclear owners. | Specify per user, per recipient, per attack, per round, per scene, per in-game day/week, or per session. Define whether one effect's usage is shared with another. |
| Re-rolls | Several entries omit whether the original or new result is used and whether re-rolls can chain. | Provide a shared re-roll rule or state the result-retention rule locally. Do not add “더 좋은 결과” where the text does not grant it. |
| Injury | 치명상/치명적인 피해/살상/저살상/비살상 blur states and damage modes. | Use a defined state for mortal wounds; distinguish lethal damage from an attack that happens to cause a mortal wound. Prefer one term for nonlethal damage. |
| AC and Shock | “AC10으로 취급” can be read as lowering real AC; “최소 1 피해” can negate immunity. | Limit fictitious AC to Shock eligibility and state whether immunity still applies. A minimum applies only after establishing that damage is received. |
| Units | 10’, 10ft, bare 10 + level, “무게 2”, and “120도” coexist. | Use explicit ft for distance, encumbrance points for 하중, and physical weight only when intended. Do not silently convert 120 degrees to feet. |
| Level inheritance | Many Level 2 entries have empty descriptions; prerequisites alone do not explain inherited restrictions. | State once that Level 1's applicable restrictions persist, while specific replacements override rather than stack. Repeatable exceptions require their own ownership rule. |
| Caps | “최대 +2/+3” may look like a bonus amount or an absolute limit. | Separate contribution, final cap permission, and score. Preserve the approved shared -2/+2 default and non-stacking absolute cap overrides. |
| Free skills | “보너스 기술”, “기술-0”, “기술 수준으로 간주” are not interchangeable. | Reference the approved allotment rules; distinguish actual allotments, minimum ranks, and effective ranks used only for checks. |
| Flavor versus rules | Mechanical penalties and prerequisites sometimes live in `desc`. | Preserve flavor, but repeat operative clauses in a clearly labeled rules/prerequisites block. Otherwise card previews and summaries can hide disadvantages. |
| Cross-references | Some translated spell/ability names do not match their local entries. | Link by stable local ID plus the approved display name. A higher-level spell referenced by an ability is not automatically a learned starting spell. |

### Naming and Metadata Policy

Keep setting-specific terms such as 那落種, 抱病種, 默都, 自刻人, 奴役種, and 隷屬種 unless you choose otherwise. They are not automatically errors. Because “포병” ordinarily also suggests artillery, consider displaying “포병종(抱病種)” on first use. Separate a title's translated name, English name, and hanja alias instead of putting all three into `englishName`.

Nine `englishName` fields are blank: `focus_0221`, `focus_0251`, `focus_0271`, `focus_0291`, `focus_0321`, `focus_0331`, `focus_0351`, `focus_0361`, and `focus_0381`. Do not invent supposed original English names; an optional descriptive gloss can be explicitly marked as editorial. Seven names have trailing whitespace: `focus_0531`, `halflings1`, `gnomes1`, `goblins_tinker1`, `lizardmen1`, `lizardmen2`, and `orcs1`.

Duplicate “드워프 / Dwarves” titles represent different origins, not duplicate IDs. Use category/setting qualifiers in the UI and review text; do not merge mechanics based on names. `folie_a_deux1` has `src: aotle`, while its upgrade has `src: wwn`; confirm whether that split is intentional. Source-field consistency can be resolved from your own records without external research.

The structural scan found no dangling `has_focus`/`not_focus` references and no Level 2 entry missing a parent requirement. This establishes link integrity, not semantic correctness.

## Detailed Review

The following 102 review items cover 153 catalogue entries exactly once on their IDs lines. In each item, the current Korean title is followed by the local English title where present. Both levels were read independently. Notes tagged D concern the current local representations; unencoded conditional effects are not by themselves translation errors.

## Knightly Styles

### 001 팔방의 날 유파 / All Directions Edge Style

**IDs:** `all_directions_edge_style1`, `all_directions_edge_style2`

**Priority:** P1

- **Name:** Keep; 팔방검 유파 is shorter but could falsely imply swords only. The present title is broad enough for all combat skills.
- **Observation:** D: Level 1's HP/HD penalty is in desc and absent from derived HP; only its skill choice is encoded. R: distinguish one attack per round from the free first use per day. Level 2's ranged limit needs an explicit skill-rank formula and treatment of an untrained Shoot rank.
- **Revision or ruling:** Conditional wording for the existing Level 1 reading: “라운드당 한 번, 간단 행동으로 붙잡기가 아닌 일반 공격 1회를 합니다. 그날의 첫 사용은 기관계 부담을 늘리지 않으며, 이후 사용할 때마다 1점씩 얻습니다.” For Level 2: “각 적을 최대 한 번 공격하며, 원거리 공격의 총횟수는 [사격 기술 레벨 + 1]을 넘지 않습니다.” Confirm zero/negative limits and whether the HP penalty is per character level or per rolled hit die.
- **Manual Review:** Done.

### 002 촉매혼 유파 / Catalytic Soul Style

**IDs:** `catalytic_soul_style1`, `catalytic_soul_style2`

**Priority:** P2

- **Name:** Keep as coined terminology, or consider 영혼 촉매 유파 for immediate readability. Neither implies a new resource.
- **Observation:** R: Level 1's “충격에 피해를 받는다면” can mean a prior event or susceptibility to that ally's Shock; clarify whether the ranged attack must hit. Level 2 uses 대상 for both the attacked enemy and the healed creature, leaving the HD/level source and per-scene recipient limit unclear.
- **Revision or ruling:** Replace pronouns with 공격 대상 / 지정한 아군 / 회복 대상. Conditional Level 2: “명중하면 당신 또는 지정한 아군 중 한 명을 회복 대상으로 선택합니다. 회복 대상의 기관계 부담을 1 줄이고 HP를 2d6 + [누구의 레벨/HD인지 확정]만큼 회복합니다. 각 회복 대상은 장면당 한 번만 이 혜택을 받습니다.”
- **Manual Review:** Done.

### 003 유령 궁수 유파 / Ghost Archer Style

**IDs:** `ghost_archer_style1`, `ghost_archer_style2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: desc allows bows and crossbows, while the duplicate in Level 1 repeatedly says only 활. “모든 성질” versus “추가적인 ... 보너스는 없습니다” leaves copied magical properties unclear. Level 2 omits line of sight, blocked landing positions, timing of teleport choice, and what counts as the arrow landing.
- **Revision or ruling:** Name the eligible weapon set consistently and distinguish “이 능력 자체는 명중/피해 보너스를 추가하지 않습니다” from “원본의 마법 보너스도 복제하지 않습니다”; choose one. Level 2 should identify a valid destination and whether System Strain is paid on firing or teleporting. The non-bow attack penalty remains operative even though it is in desc.
- **Manual Review:** Done.

### 004 일점격 유파 / One Point Strike Style

**IDs:** `one_point_strike_style1`, `one_point_strike_style2`

**Priority:** P2

- **Name:** Keep, or 일점 타격 유파 if a less compressed name is preferred.
- **Observation:** R: “모든 공격” does not say whether INT/WIS replaces the attack modifier, damage modifier, or both. The automatic 15 could mean a natural die value or final attack total; “최소 피해” could mean minimum dice before modifiers or all damage. Level 2 needs explicit interaction with Level 1's minimum and the decision window.
- **Revision or ruling:** Suggested structure: “명중굴림의 d20 결과를 15로 취급한 뒤 일반 보너스를 더합니다. 피해 주사위는 [모두 1 / 다른 정의]로 취급합니다.” State whether the once-per-scene maximum replaces that minimum and whether it is chosen before rolling, after hitting, or after damage.
- **Manual Review:** Done.

### 005 천상의 화염 유파 / Pyre of Heaven Style

**IDs:** `pyre_of_heaven_style1`, `pyre_of_heaven_style2`

**Priority:** P1

- **Name:** Keep for imagery; 천상의 화장불 유파 would emphasize pyre but is a stylistic alternative, not a necessary correction.
- **Observation:** R: Level 1 needs to distinguish first 5 damage per round in aggregate versus per event, and once-per-scene bonus damage per enemy versus the whole attack. Level 2's “레벨의 1/3 의 반올림 값 만큼 1d6” leaves dice count and rounding uncertain; nearest-integer rounding gives zero dice at character level 1. This matters because focus Level 2 can be bought during level-1 creation.
- **Revision or ruling:** Do not silently replace 반올림 with 올림. Write the approved expression as “Xd6, X = [올림/내림/반올림](캐릭터 레벨 / 3), 최소 [확정]개”. Add level-1/3/4 examples. Define whether the area burst and the Level 1 bonus share each enemy's once-per-scene limit and whether “라운드 종료” means the global round or the user's turn.
- **Manual Review:** Done.

### 006 의로운 강철 유파 / Righteous Iron Style

**IDs:** `righteous_iron_style1`, `righteous_iron_style2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: “1레벨에 선택” can mean focus Level 1 or character level 1; the 750-silver comparison is strictly less than, not at most. Level 2 says 갑옷 generally while desc restricts the style to heavy armor. D: the armor-specific AC bonus and starting armor entitlement are not reflected by the current generic armor calculation.
- **Revision or ruling:** Use “캐릭터 생성 시 ... 가격이 750은화 미만인 중갑 1벌”. Repeat “중갑을 착용한 동안” at Level 2 if the inherited restriction is intended. Preserve the clear replacement “AC 보너스가 +1에서 +2로 바뀝니다”; it is not +3. State that zero encumbrance does not satisfy Armored Magic's armor-weight exception.
- **Manual Review:** Done.

### 007 세계수의 창 유파 / World Tree Lance Style

**IDs:** `world_tree_lance_style1`, `world_tree_lance_style2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** E/R: Level 1's 접전 skill should match 백병. “항상 돌아옵니다” needs a return time and treatment of a failed/blocked throw. Level 2's “10 + ... 레벨” has no distance unit and 접근전 is inconsistent with 근접전; unlimited unit interpretation directly changes reach. Clarify whether the Long non-stacking clause chooses the better reach or always replaces it.
- **Revision or ruling:** Conditional wording: “이 창을 들고 있는 동안 근접 공격의 사거리는 (10 + 캐릭터 레벨)ft입니다.” Confirm ft before publication. Describe 30/60ft as normal/long range and whether +1 attack/damage stacks with a weapon's existing magic. Name the long-property reference by an approved term or local ID.
- **Manual Review:** Done. Although long-property might need a revisit in the future.

### 008 진노하는 산 유파 / Wrathful Mountain Style

**IDs:** `wrathful_mountain_style1`, `wrathful_mountain_style2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** D: desc's unconditional -2 attack penalty is absent from current total attack bonus. E: “사용이 기능” should read “사용이 가능”. R: Level 1 counters before the protected attack resolves; say whether killing the attacker cancels it. Level 2 appears to expand both range and reaction count, but it is unclear if spending Strain is required for either benefit or only the latter.
- **Revision or ruling:** Separate permanent ranged retaliation from the paid remainder-of-round option. State the per-attacker once-per-round restriction, which attack types qualify, and whether ordinary line-of-effect/weapon constraints survive “거리에 상관없이”. Keep the -2 penalty in the operative rules, not only flavor.
- **Manual Review:** Done. -2 bab penalty needs to be added in the future. 

## Bloodline Foci

### 009 위험 감각 / Danger Sense

**IDs:** `danger_sense1`, `danger_sense2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R/E: Level 1's “당신이 부상을 입히거나 죽을 수 있는” mixes inflicting injury with being killed; likely intended perspective must be confirmed. “주위 근처” has no radius. Noticing an execution attack is not necessarily automatically stopping it. Level 2 promises GM guidance, not guaranteed escape.
- **Revision or ruling:** If personal danger is intended: “당신이 부상을 입거나 사망할 위험에 처하기 전에”. Specify whether the warning lets the player cancel a declared action, grants a reaction, or only conveys information. For Level 2 explicitly say “탈출을 자동으로 성공시키는 효과는 아닙니다.” No new WIS cap exception is stated in the local text.
- **Manual Review:** Done.

### 010 둘의 광기 / Folie a Deux

**IDs:** `folie_a_deux1`, `folie_a_deux2`

**Priority:** P2

- **Name:** Keep as a deliberate metaphor; 공유된 망상 is an optional alternative. Do not rename from an assumed clinical diagnosis.
- **Observation:** R: Level 1 must distinguish believing the speaker is sincere from believing the factual claim. The immunity after exposure needs duration and scope: this user, this level, or the entire focus. Level 2 needs to specify one listener, save-penalty sign, and whether evidence can end belief before 1d4 rounds. D: the two levels have different src values.
- **Revision or ruling:** Level 1: “청자는 당신이 그 말을 진심으로 믿는다고 여깁니다. 그 말의 내용 자체를 사실로 믿게 되는지는 [확정].” Level 2: “대상은 정신 내성굴림 결과에 당신의 설득 기술 레벨만큼 페널티를 받습니다.” Record whether Level 1 immunity also prevents Level 2.
- **Manual Review:** Done.

### 011 추적의 대가 / Master Tracker

**IDs:** `master_tracker1`, `master_tracker2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: Level 1 can read as automatic tracking regardless of any resistance, or merely permission to attempt a check under otherwise impossible conditions. Distinguish faint traces from no trace at all. Level 2 reconstructs physical events, not thoughts, but does not state observation time or the amount of information.
- **Revision or ruling:** Use either “별도의 판정 없이 추적할 수 있습니다” or “흔적이 남아 있다면 ... 판정을 시도할 수 있습니다” after a ruling. Keep the city one-day and wilderness one-week windows distinct. Specify what previously meeting a person permits identifying and what magical concealment does.
- **Manual Review:** Done.

### 012 나이트워커 / Night Walker

**IDs:** `night_walker1`, `night_walker2`

**Priority:** P2

- **Name:** Optional 밤길잡이 or 밤의 보행자 for consistency with translated bloodline names; keep 나이트워커 if it is an established setting term.
- **Observation:** R: Level 1 excludes complete darkness from ordinary sight but grants acting as if sighted within 30ft even when blind; define the boundary of that alternate sense. Level 2 uses “사실상 투명” without its mechanical effects, ending triggers, or magical detection treatment.
- **Revision or ruling:** Separate “희미한 빛에서의 시야” from “시각 없이 주변을 파악하는 범위”. If intended, list actions that draw attention rather than letting any movement end concealment. Say whether the effect resumes automatically after attention ceases and whether bright light exposes the whole creature or only the illuminated part.
- **Manual Review:** Done.

### 013 짐꾼 / Pack Beast

**IDs:** `pack_beast1`, `pack_beast2`

**Priority:** P2

- **Name:** Keep; 괴력의 짐꾼 is optional but could overstate combat strength.
- **Observation:** R: Level 1 says 18, or 22 if already 18; it does not explain interaction with other encumbrance-only STR increases such as Provident Crafter. Level 2's 1,000 pounds is a physical weight, not encumbrance, and moving distance/action expenditure is unstated. D: the current sheet does not calculate this carrying-strength override.
- **Revision or ruling:** Explicitly distinguish original STR score, effective carrying STR, and modifier. Define order with additive encumbrance bonuses and whether the exceptional object can be a creature. “장면당 한 번 ... 최대 1,000파운드 ... 자신의 턴이 끝날 때 내려놓아야 합니다” preserves the existing cap without granting an attack or extra move.
- **Manual Review:** Done.

### 014 대비된 공예가 / Provident Crafter

**IDs:** `provident_crafter1`, `provident_crafter2`

**Priority:** P2

- **Name:** 대비된 공예가 is awkward passive wording. Suggested 준비성 있는 장인; distinguish it from the separate 장인 (Artisan) focus.
- **Observation:** E/R: Level 1's stored-as-readied exception needs scope over items rather than making every stowed item ready. Level 2's “무게 2” should identify encumbrance units; “같은 물건” could mean identical item, type, or the particular conjured object. The item may have been reasonably purchased, not necessarily magically created.
- **Revision or ruling:** Conditional wording: “하중이 2 이하인 비마법 물품 1개 ... 지난 일주일 동안 합리적으로 구입하거나 제작할 수 있었던 물품”. State whether seven days is rolling or calendar-based and what happens without enough money. The +4 carrying STR is not an actual STR score increase.
- **Manual Review:** Done.

### 015 바람처럼 걷다 / Walk Like Wind

**IDs:** `walk_like_wind1`, `walk_like_wind2`

**Priority:** P2

- **Name:** Optional 바람걸음 to make the title a noun; current wording is understandable.
- **Observation:** R: Level 1 permits vertical travel but omits ceiling traversal, falls when unable to end safely, and whether a handhold merely ends a move or the whole turn. Level 2 needs to say whether the jumps spend normal movement and whether the bonus Move action is additional rather than replacing the usual one.
- **Revision or ruling:** Use “자신의 턴이 끝날 때 서 있을 수 있는 수평면 또는 붙잡을 수 있는 지점에 도달해야 합니다.” Specify horizontal 20ft and vertical 10ft separately. Keep +10ft as a movement-speed increase, not an added free Move action.

### 016 야생의 혀 / Wildtongue

**IDs:** `wildtongue1`, `wildtongue2`

**Priority:** P2

- **Name:** Keep as imagery; 야생의 말 is a plainer alternative.
- **Observation:** R: The local definition deliberately includes magical animals; avoid narrowing it to mundane beasts. Level 1's “즉각적인 행동” may describe a short request rather than a formal Instant action. Level 2 needs an action cost, visible-target selection, the save timing, and what happens when commands become dangerous.
- **Revision or ruling:** Replace the casual action phrase with “그 자리에서 간단히 수행할 수 있는 부탁” if not a named action. State that only magical animals receive the listed Mental save, unless you intend otherwise. “하루에 한 번, 보이는 동물 한 마리에게 ... 한 장면 동안” preserves existing duration and target count.

## Mystic Secrets

### 017 예지술 / Divination

**IDs:** `divination1`

**Priority:** P2

- **Name:** Keep; this text concerns future events specifically, so 예지술 is more precise than a generic 점술 label.
- **Observation:** R: “첫 사용 후 일주일 내 재사용은 난이도를 +1” can mean cumulative +1 per use or one flat +1 for any repeat. Define the week/reset, what counts as the same question, and whether the 1 System Strain is paid on failed checks too.
- **Revision or ruling:** Use “같은 [7일 기간]의 두 번째 사용은 난이도 10, 세 번째는 11 ...” only if cumulative escalation is approved; otherwise state the fixed repeat difficulty. Preserve that the GM rolls secretly and failed readings sound plausible. The future horizon and retry restriction are distinct.

### 018 계약술 / Pacting

**IDs:** `pacting1`

**Priority:** P1

- **Name:** Keep.
- **Observation:** R/D: choosing a pantheon/domain is a persistent creation choice, but only Pray is encoded. The page-142 reference is not self-contained. Immediate bonuses and a later Main-action spell are conflated; duration and expiration of that permission are unstated. The caster level and authority selecting the domain-appropriate spell are missing.
- **Revision or ruling:** Split into “계약 대상을 선택합니다” and “하루에 한 번 ... 다음 효과 중 하나”. Give separate action/cost lines for +4 attack, +1 skill, and one level-1 spell. Identify the local domain list or include the allowed list. Do not equate mage archetype eligibility with automatically knowing/preparing spells; the text explicitly allows noncasters.

### 019 혈마술 / Hemomancy

**IDs:** `hemomancy1`

**Priority:** P2

- **Name:** Keep; 혈액 마법 would be less compressed but not more mechanically accurate.
- **Observation:** R: “하루에 한 번” and “사용할 때마다” coexist harmlessly if the latter describes cost, but the refund trigger after casting needs clarity. Define whether direct and indirect harm, mixed willing/unwilling targets, or a later harmful use disqualify the spell. Damage prevention and interrupted spells are unspecified.
- **Revision or ruling:** State “주문 시전을 완료한 직후 ... 그 주문의 레벨당 1d4 피해와 기관계 부담 1점을 받습니다. 그 주문은 일일 시전 횟수를 소비하지 않은 것으로 처리합니다.” This is conditional on that timing interpretation. Specify whether damage must actually be suffered to gain the refund.

### 020 문양술 / Sigilism

**IDs:** `sigilism1`

**Priority:** P2

- **Name:** Keep; 인장술 is optional if it fits the token terminology elsewhere.
- **Observation:** R: no token expiration, spell-selection rule, or handling of a second token is stated. Spending a cast now and recovering it while the token survives is significant, not merely alternate spell preparation. Clarify target/range and level determination when creating versus activating, armor restrictions, and whether silence/gesture exceptions alone are granted.
- **Revision or ruling:** Write “동시에 충전된 토큰은 1개만 보유할 수 있습니다. 새 토큰을 충전하면 기존 토큰은 [실효/제작 불가 중 확정]”. State that only the creator can activate it. If the token remains until used, say so rather than adding an invented daily expiration.

### 021 정신주술 / Mind-Sorcery

**IDs:** `mind_sorcery1`

**Priority:** P2

- **Name:** Suggested 정신 주술 for spacing; keep the term unless 마법/주술 are intentionally distinct systems.
- **Observation:** R: the exclusion for HP-damaging spells is broader than merely suppressing their nonmental damage, yet the next sentence suppresses secondary effects only. Define direct/secondary damage, hybrid spells, and whether the restriction forbids learning, preparing, or casting. E: 대게 -> 대개; 입은채로 -> 입은 채로.
- **Revision or ruling:** Separate “시전할 수 없는 주문” from “시전하되 발생하지 않는 부차적 효과”. Preserve the explicit remaining interruption/armor rules so silent casting does not imply universal stealth or armored casting. Link 비전 형태의 감정 to local spell ID apprehending_the_arcane_form.

## Nonhuman Origins

### 022 !인간 / English name absent

**IDs:** `focus_0221`

**Priority:** P2

- **Name:** Keep !인간 only if the programming-style negation is intentional. Add a pronunciation or explanatory subtitle; 인간 모사체 is a possible descriptive subtitle, not a recovered original title.
- **Observation:** R: “마법을 제외한 다른 기술” should explicitly mean one skill and does not exclude combat skills. The daily algorithm bonus lacks a before/after-roll decision window. Mental magical immunity needs scope: consent, beneficial effects, and mixed physical/mental effects.
- **Revision or ruling:** “마법 기술을 제외한 기술 1개를 보너스 기술로 얻습니다.” Distinguish fictional lack of self-awareness from removal of player choice; it must not silently change control of the PC. State that automaton traits are not granted rather than relying on a comparison readers may not know.

### 023 맹금류 나락종 / Accipiter 那落種

**IDs:** `accipiter1`

**Priority:** P1

- **Name:** Keep; alternatively 맹금형 나락종 if it denotes a humanoid form rather than a bird taxon. Preserve the setting label.
- **Observation:** R/E: flight's “절반의 반내림만 보다 적게” is not a usable inequality. Is a load exactly equal to floor(half normal stowed capacity) allowed? Flight maintenance needs an action interval; provoking “주위의 적” needs range and per-enemy limit. Carrying a cooperative adult with two flyers should specify encumbrance treatment.
- **Revision or ruling:** Publish an explicit inequality, e.g. “보관 하중이 floor(통상 한도 / 2) [이하/미만]이어야 합니다” after choosing the boundary. “매 [턴] 이동 행동 1회를 비행 유지에 사용하지 않으면 추락합니다” likewise needs the interval confirmed. Keep outdoor/large-room eligibility and 60 miles per 10 travel hours distinct from combat speed.

### 024 귀족 나락종 / Aristoi 那落種

**IDs:** `aristoi1`

**Priority:** P2

- **Name:** Keep; 귀족 is descriptive of the origin and need not prove an actual legal title in every setting.
- **Observation:** R: “마법을 제외한 다른 기술과 지휘” leaves choosing Lead again unclear; current bonus data permits Lead as the open choice in addition to its fixed grant, subject to allocation rules. WIS as weapon attribute needs to identify attack rolls, damage, and whether replacing STR/DEX is optional.
- **Revision or ruling:** “지휘와, 마법을 제외한 기술 1개를 보너스 기술로 얻습니다. 이 선택으로 지휘를 다시 고를 수 있는지는 [확정].” For the weapon effect say “...에 쓰는 근력/민첩 수정치 대신 지혜 수정치를 사용할 수 있습니다” and enumerate its affected calculations.

### 025 카피바라 수인 / English name absent

**IDs:** `focus_0251`

**Priority:** P2

- **Name:** Keep. Do not fabricate a source-language title for the blank English field.
- **Observation:** R: “당신이 있는 곳” gives the reaction bonus no presence/participation limit; clarify whether the NPC must perceive the character. Multiple capybaras and Well Met can create an undefined stacking case. The week's language exposure needs a proficiency definition and whether exposure must be active.
- **Revision or ruling:** State who benefits from the reaction-roll bonus and whether it applies once per roll regardless of how many sources are present. “일주일간 해당 언어에 노출되면 일상적인 의사소통이 가능한 수준으로 말할 수 있습니다” is a candidate only if that is the intended meaning of 쓸만한.

### 026 구울 / Ghoul

**IDs:** `ghoul1`

**Priority:** P1

- **Name:** Keep.
- **Observation:** D: effect requires one pound of fresh human flesh per month, while Ghoulish Vigor's imported text requires one pound per week. The 21-day save and automatic state at 30 days do not settle which interval the PC uses. R: does feeding reset the timer only after a full pound, and does “이 상태” mean the compulsion or automatic save failure?
- **Revision or ruling:** Do not average or select an interval. Add an explicit PC override if intended: “이 기원으로 얻는 구울의 생명력에는 다음 식사 주기가 적용됩니다: [확정].” Define the fresh-food requirement, timer reset, attack compulsion duration, and whether any stated immunity/trait applies to ordinary ghouls but not this origin.

### 027 여우 수인 / English name absent

**IDs:** `focus_0271`

**Priority:** P2

- **Name:** Keep with an optional 늪지 여우 수인 qualifier to distinguish it from Kitsune. The two are not interchangeable packages.
- **Observation:** R: low-light sight lacks an explicit total-darkness exception; speed +10ft does not identify land versus every movement mode. The comparison with Kitsune belongs in flavor, not in inherited mechanical traits.
- **Revision or ruling:** If intended: “완전한 어둠이 아닌 희미한 빛에서 명확히 볼 수 있습니다. 기본 지상 이동속도가 10ft 증가합니다.” Do not silently generalize the speed increase to flight/swimming, or give this origin Kitsune's art.

### 028 전령 나락종 / Harbinger 那落種

**IDs:** `harbinger1`

**Priority:** P2

- **Name:** Keep; “Harbinger” can imply a portent, but 전령 is not demonstrably wrong from this local text.
- **Observation:** R: Harbinger's Face needs the reference population, required population size, sex constraint, and duration defined. “비마법적인 힘” plus detection immunity can read as immunity even to direct mundane contradictions. Language/custom knowledge may or may not persist after another transformation.
- **Revision or ruling:** Specify that an average local appearance is not impersonation of an individual. State whether transformation persists indefinitely, whether it changes anatomy versus appearance, and exactly what inspection cannot reveal. “변신한 집단의 언어와 일반 풍습을 [변신 중에만/영구히] 압니다” requires a choice.

### 029 들소 수인 / English name absent

**IDs:** `focus_0291`

**Priority:** P3

- **Name:** Keep, but reconcile the title 들소 with body text 소 수인 and the group name 후아. “신정 고기” is unclear; ask whether it means ritual meat or a typo rather than assuming 신선한 고기.
- **Observation:** E: the modifier, encumbrance-only STR, and maximum System Strain adjustments are now separately encoded and aligned with the local effect. Distinguish +4 carrying STR from the +1 STR modifier so readers do not double-apply it to all derived statistics.
- **Revision or ruling:** “근력 수정치 +1, 민첩 수정치 -1. 하중 한도를 계산할 때만 근력 점수가 4 높은 것으로 취급합니다. 기관계 부담 최대치가 2 증가합니다.” Retain the note that horns have no stated combat benefit.

### 030 키츠네 수인 / Kitsune Beastfolk

**IDs:** `kitsune_beastfolk1`

**Priority:** P1

- **Name:** Keep if differentiated from the separate 여우 수인 origin; an explanatory subtype is preferable to translating both simply as 여우 수인.
- **Observation:** D: the Elemental Sparks art and replacement art choice are absent from encoded creation effects. The local art exists as elem/elemental_sparks (원소 촉발). R: “이미 알고 있다면” needs a timing rule when Elementalist grants it during creation and a restriction on replacement art level/prerequisites.
- **Revision or ruling:** “원소 촉발 기교를 얻습니다. 다른 생성 과정에서 이미 원소 촉발을 얻는다면, [자격 조건]을 만족하는 원소술사 기교 1개를 대신 고릅니다.” Confirm access for non-Elementalists and whether the substitute ever grants Effort. Do not require learning a spell or changing class solely to record this art.

### 031 지저종 / Deepfolk

**IDs:** `deepfolk1`

**Priority:** P2

- **Name:** Keep.
- **Observation:** E/R: replace “육체적 능력” with “육체 능력치 점수” and make the optional choice explicit. Sunlight threshold is strictly exceeding maximum System Strain, not reaching it. Clarify eye exposure versus palm-sized skin exposure, protection adequacy, and whether covering a collapsed character merely halts death or also restores consciousness.
- **Revision or ruling:** “근력·민첩·건강 중 점수가 14 미만인 능력치 1개를 선택하여 점수를 14로 바꿀 수 있습니다. 선택하지 않아도 됩니다.” Preserve the current separate 1d6-minute death window rather than translating it into rounds. Creation's optional score choice is already implemented.

### 032 도마뱀 수인 / English name absent

**IDs:** `focus_0321`

**Priority:** P2

- **Name:** Keep with a subtype/category qualifier to distinguish it from 리자드맨; their benefits are different.
- **Observation:** R: “최소 1점까지 모든 충격 피해량을 1 줄일 수” could create 1 damage even when Shock immunity or AC prevented any. The swim speed should reference the character's normal land speed or another defined speed. Holding breath needs to specify whether exertion changes the 15-minute limit.
- **Revision or ruling:** Conditional reduction wording: “충격 피해를 실제로 받는 경우 그 피해를 1 줄입니다(최소 1). 이 효과는 원래 받지 않을 충격 피해를 발생시키지 않습니다.” Do not import Lizardmen's AC or breath weapon.

### 033 고양이 수인 / English name absent

**IDs:** `focus_0331`

**Priority:** P2

- **Name:** Keep; no stronger alternative is compelled by the effect.
- **Observation:** R: dagger-like claws need an associated skill and treatment as armed/unarmed, including interaction with Unarmed Combatant. The nonlethal-compulsion save lacks timing and frequency: each attack, each hit, or each damage event. “실제 전투” needs a boundary for sparring and coercion.
- **Revision or ruling:** Specify “비살상 피해를 [선언할 때/가하려 할 때] 정신 내성굴림을 합니다. 실패하면 해당 공격의 피해만 살상 피해로 바뀝니다” if only that attack is intended. The low-light wording should explicitly include or exclude complete darkness.

### 034 오니 / Oni

**IDs:** `oni1`

**Priority:** P1

- **Name:** Keep as a setting creature name rather than silently equating it with every 도깨비 tradition.
- **Observation:** D: the +4 encumbrance STR and unconditional -2 Mental-save penalty are in effect but absent from derived metadata. WIS -1 alone does not reproduce the extra save penalty. E/R: 접전 should be 백병; clarify that the +4 is not an actual score increase.
- **Revision or ruling:** “하중 계산에만 근력 점수 +4를 적용합니다. 모든 정신 내성굴림 결과에 -2 페널티를 받습니다.” The latter corresponds to raising the displayed Mental target by 2, unlike Laborer's conditional mind-affecting penalty.

### 035 쥐 수인 / English name absent

**IDs:** `focus_0351`

**Priority:** P1

- **Name:** Keep.
- **Observation:** R: “10ft 밖에 있는 물건” literally means objects outside ten feet and provides no upper range. This could reverse the likely intended short-range alternate sense, but the desired range cannot be established externally in this audit.
- **Revision or ruling:** If a ten-foot radius is intended: “완전한 어둠 속에 있거나 눈이 멀어도 10ft 이내의 물체와는 볼 수 있는 것처럼 상호작용할 수 있습니다.” Confirm inside versus outside before changing. Define whether it permits targeting creatures and detecting invisible things, not merely handling objects.

### 036 늑대 수인 / English name absent

**IDs:** `focus_0361`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: the grant of a Main action needs an execution time and whether it interrupts turn order. The giver and each recipient both have per-scene limits; neither should erase the other. Clarify whether self-targeting, ranged attacks, or nonspell supernatural abilities qualify as physical actions.
- **Revision or ruling:** “장면당 한 번, 이동 행동을 사용해 근접 사거리의 아군 1명에게 [즉시/정해진 시점에] 주요 행동 1회를 부여합니다. 각 아군은 이 효과를 장면당 한 번만 받을 수 있습니다.” Preserve the explicit bans on spellcasting and magic-item use.

### 037 묵도 언데드 / 默都 Undead

**IDs:** `undead1`

**Priority:** P2

- **Name:** Keep; consider placing 默都 beside the Korean setting name rather than inside englishName.
- **Observation:** R: undead identity with an exception for “일반적인 사령술사 주문” leaves the eligible spell list and beneficial/hostile scope undefined. Automatic stabilization is not immediate recovery at 0 HP. The eight-hour-rest rule lists HP, spell use, and Effort but omits System Strain recovery.
- **Revision or ruling:** Separate identity, ordinary healing, spell-target exceptions, and recovery. List local spell IDs or a precise scope for the necromancy exception. State that centuries-later return is narrative, not a promise of immediate player-character recovery.

### 038 돼지 수인 / English name absent

**IDs:** `focus_0381`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: “한 라운드 행동” may grant a whole new turn or allow activity until a specified time despite 0 HP. Define further damage, healing during that interval, and the ending condition. Flavor's indiscriminate rage does not appear as a mandatory control-loss rule.
- **Revision or ruling:** Name the exact end point, such as “[다음 자기 턴 종료]까지” only after approval. Preserve that this time counts against stabilization and that catastrophic destruction prevents the benefit. Do not invent an involuntary berserk check from desc.

### 039 타누키 수인 / Tanuki Beastfolk

**IDs:** `tanuki_beastfolk1`

**Priority:** P2

- **Name:** Keep if paired with Kitsune/Usagi naming; 너구리 수인 is an optional localization, not a required correction.
- **Observation:** E/R: the spell title differs from local 시뮬라크럼 가면을 취하라 (adopt_the_simulacular_visage). Its copied effects must be reconciled with self-only use, no language benefit, and 2 hours per character level; the ordinary spell targets multiple willing beings and lasts until dawn. “탈 수 있는” is unclear climbing terminology.
- **Revision or ruling:** Use “오를 수 있는 표면” and a stable spell reference. Explicitly enumerate self-only, language excluded, and replacement duration. State whether clothing changes and dismissal/reversion are inherited. Referencing a level-3 spell does not mean the creator should show it as a learned level-1 spell.

### 040 텐구 / Tengu

**IDs:** `tengu1`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: “일반 하중” is not a numeric boundary; 30ft needs a per-move interpretation. An absolute indoor ban differs from Accipiter's large-room exception. “다른 복잡한 행동” needs examples and a rule for landing before attacking. Long-distance exhaustion has no duration limit.
- **Revision or ruling:** Define carrying limit and takeoff/maintenance/landing actions. Preserve the explicit prohibition on fighting in flight unless you deliberately revise it. Do not borrow the other flying origin's capacities or exceptions merely because both have wings.

### 041 우사기 수인 / Usagi Beastfolk

**IDs:** `usagi_beastfolk1`

**Priority:** P1

- **Name:** Keep for setting consistency, or 토끼 수인 if all animal names are localized consistently.
- **Observation:** R: the once-per-scene speed doubling has no duration, allowing anything from one move to the entire scene. The weekly automatic Luck save needs a before/after-failure decision window and whether using it counts as rolling. D: saves are encoded, while the sheet note preserves but does not resolve the missing speed duration.
- **Revision or ruling:** “장면당 한 번, 간단 행동으로 기본 지상 이동속도를 [자기 턴 종료/라운드 종료/장면 종료 중 확정]까지 두 배로 합니다.” State whether the bonus doubles only base speed or also other flat increases.

### 042 자각인 / 自刻人

**IDs:** `focus_0421`

**Priority:** P1

- **Name:** Keep the hanja on first mention: without it, 자각인 readily reads as 自覺 rather than 自刻. 스스로를 새긴 자 is an optional gloss, not a replacement imposed on the setting.
- **Observation:** D: only Exert is encoded; CON's 14/18 replacement and +2 maximum Strain are missing. R: “이렇게 지친 상태” seems to penalize fulfilling the necessary labor, but could refer to exhaustion from failing it. Define actual labor, recovery sequence, penalty duration, and death strictly above the cap.
- **Revision or ruling:** “이 기원을 적용하기 전 건강 점수가 14 미만이면 14로, 14 이상이면 18로 바꿉니다” reflects the literal text but needs approval for score-effect order. Specify whether the lower-of-two roll rule uses two whole checks or individual dice. This is not Deepfolk's optional increase.

## Other Creature Origins

### 043 오토마톤 / Automatons

**IDs:** `automatons1`

**Priority:** P2

- **Name:** Keep; 자동인형 is an optional gloss if appropriate to the setting's machines, not necessarily all constructs.
- **Observation:** R: “오토마톤의 성질” invokes an absent complete trait list. An ordinary reader cannot determine sleep, poison/disease, recovery, or repair rules from this entry. The reference to acquiring System Strain from healing should not imply special immunity to all other sources.
- **Revision or ruling:** Add a local reference or concise list of the exact automaton traits. Keep the mandatory -1 chosen modifier, minimum -2, separate from those traits. Do not infer missing immunities from the English name alone.

### 044 소유품 포병종 / Chattel 抱病種

**IDs:** `chattel1`

**Priority:** P1

- **Name:** Consider 재산 취급 포병종 or retain 소유품 포병종; the latter's dehumanizing force is consistent with its flavor, not an automatic mistranslation.
- **Observation:** D: data encodes only the restricted skill, omitting STR re-roll 1d4+2, CON/CHA +1 with maximum +3, unconditional attack -2, and social-check +1. R: the re-roll instruction assumes 3d6 and does not address fixed arrays or order relative to other score changes.
- **Revision or ruling:** Decide whether STR always becomes a fresh 1d4+2 regardless of allocation mode. Specify that the CON/CHA choice changes its modifier, not its score, and record the cap permission separately. “전투 기술과 마법 기술을 제외한 기술 1개” correctly matches the current choice restrictions.

### 045 기능성 포병종 / Functionary 抱病種

**IDs:** `functionary1`

**Priority:** P1

- **Name:** Suggested 기능 특화 포병종; 기능성 sounds like a product-quality adjective rather than a being bred for a purpose. Keep if that clinical tone is intentional.
- **Observation:** D: the granted Specialist and chosen -1 modifier (minimum -2) are not encoded. R: “그 기술에 대한 ... 포커스를 얻습니다” may duplicate Specialist's skill allotment, consume or bypass a focus pick, and need an upgradeable granted instance. Existing distinct-skill rules make ownership important.
- **Revision or ruling:** Specify whether the skill is allotted once total or once here plus once through Specialist; do not infer two. State that the granted instance [does/does not] consume a pick, how it upgrades, and what its task-specific +1 covers. E: 내제된 -> 내재된. Tools waived should not automatically waive raw materials.

### 046 노동자 포병종 / Laborer 抱病種

**IDs:** `laborer1`

**Priority:** P2

- **Name:** Keep.
- **Observation:** E/R: the encoded modifier changes now agree. “절반의 휴식” can be read as halving every recovery period, not just sleep; define affected recovery systems. Its Mental-save penalty is conditional on mind-affecting effects, unlike several other origins' unconditional penalties.
- **Revision or ruling:** “정신에 영향을 미치는 효과에 대항하는 정신 내성굴림 결과에 -2 페널티” is clearer. Enumerate whether halved rest changes spell, Effort, HP, or System Strain recovery. Do not shorten that condition to “정신 내성 -2” on the sheet.

### 047 죄인 포병종 / Penal 抱病種

**IDs:** `penal1`

**Priority:** P2

- **Name:** Consider 형벌 포병종 to emphasize imposed punishment rather than an assertion of moral guilt; current name remains a stylistic choice.
- **Observation:** E: “오직 하나만 13점을 초과” might imply exactly one must exceed 13. The implemented rule permits at most one. “나머지들을 13까지” must not raise scores below 13. Extra foci means two additional picks, not two free fully upgraded families.
- **Revision or ruling:** “13을 초과하는 능력치 점수는 최대 하나만 유지할 수 있습니다. 둘 이상이면 하나를 고르고, 나머지 초과 점수만 13으로 낮춥니다.” State that the two extra picks do not waive prerequisites or the one-origin-family rule, and that this focus itself costs one pick. Replace the awkward “모든 꺾을 수 없는 의지를” clause with clear flavor plus all-save +2.

### 048 전쟁광 포병종 / Warlike 抱病種

**IDs:** `warlike1`

**Priority:** P2

- **Name:** Optional 전투형 포병종 or 호전적 포병종; 전쟁광 implies a stronger psychological characterization than the English adjective, though the local flavor supports violent impulses.
- **Observation:** E/R: current bonus data matches the approved skill/modifier choices and static attack bonus. 접전 should be 백병. “자연적인” +1 could imply a special stacking category that is otherwise undefined; intimidation's social exception needs to be tied to the purpose of the check, not simply the skill used.
- **Revision or ruling:** “모든 명중굴림에 +1 보너스 ... 서로 다른 지능·지혜·매력 두 개의 수정치 -1 ... 근력·민첩·건강 중 하나의 수정치 +1.” Retain the separate minimum -2 and maximum +3 bounds. Avoid making the flavor compulsion a mandatory berserk rule.

### 049 대형 나락종 / Greater 那落種

**IDs:** `greater1`

**Priority:** P2

- **Name:** R/N: Greater could indicate rank/power, not literal size. 대형 may cause size, reach, or equipment rulings unsupported by the effect. Consider 상위 나락종 only if your setting confirms that meaning.
- **Observation:** E: current six bonuses agree with the local text. The title and flavor do not grant a larger game size, reach, extra HP, or unlisted natural weapons. Baseline bounds -2/+2 are already global rather than an exception.
- **Revision or ruling:** If 대형 is retained without size mechanics, add “이 명칭만으로 별도의 크기·사거리 보너스를 얻지는 않습니다.” Replace 접전 with 백병 and preserve Punch and Stab as two separate fixed allotments.

### 050 소형 나락종 / Lesser 那落種

**IDs:** `lesser1`

**Priority:** P2

- **Name:** Like Greater, confirm whether 소형 describes actual size or relative rank; 하위 나락종 is only a conditional candidate.
- **Observation:** E: encoded Sneak, Stab, DEX +1 and CON -1 match. No weapon-size restriction is stated, unlike Halflings; the title alone must not import it. “인간에 가깝거나 인도적인” should distinguish appearance from humane behavior.
- **Revision or ruling:** State any actual size restriction explicitly if intended; otherwise retain normal equipment rules. Use “백병과 잠행” for the skill grants. Clarify the flavor comparison without changing the mechanical package.

### 051 노역종 / 奴役種

**IDs:** `focus_0511`

**Priority:** P1

- **Name:** Keep with hanja; distinguish the proper origin from Laborer rather than treating both as 노동자.
- **Observation:** D: Exert and four modifier adjustments are encoded, but the additional unconditional -2 Mental-save penalty is not. INT/CHA penalties alone are not that penalty. R/E: “잔혹함에 더 유능” is unclear characterization, not an executable rule.
- **Revision or ruling:** “모든 정신 내성굴림 결과에 -2 페널티를 받습니다.” On the current target-number sheet that requires an additional +2 to the target after modifiers. Keep this separate from the origin's CHA penalty and from Laborer's conditional penalty.

### 052 반인종 / 半人種; Halfmen

**IDs:** `halfmen1`

**Priority:** P1

- **Name:** Keep with the hanja/English alias if deliberate; 반인종 can otherwise be parsed as an unrelated anti-race expression. 반인 is a possible shorter display name, not a mandated setting change.
- **Observation:** D: the unconditional -2 Mental-save penalty is absent; Survive and CON +1 are encoded. R: “어떤 식물도 소화” does not clearly grant immunity to poison or nutritional sufficiency, and “극한의 추위와 더위” needs boundaries distinguishing weather from damage.
- **Revision or ruling:** List whether the trait concerns environmental exposure only, excluding fire/frost attacks unless explicitly intended. Clarify that digestibility does not necessarily mean toxin immunity. Render the independent Mental penalty with the correct die/target sign.

### 053 예속종 / 隷屬種

**IDs:** `focus_0531`

**Priority:** P1

- **Name:** Keep; trim trailing whitespace and place hanja in a dedicated alias field if the schema later supports it.
- **Observation:** D: Convince, Perform and CHA +1 are encoded, but the stated -2 to all Mental saves is not. Although the explanation mentions susceptibility to mental influence, the operative sentence says all Mental saves, unlike Laborer.
- **Revision or ruling:** Choose whether the restriction really applies to all Mental saves or only mental-influence effects; do not narrow it merely from flavor. If the existing operative sentence wins: “모든 정신 내성굴림 결과에 -2 페널티를 받습니다.”

## Other World Origins

### 054 드워프 / Dwarves, 다른 세계 variant

**IDs:** `dwarves1`

**Priority:** P3

- **Name:** Keep with an explicit category or setting qualifier; the other Dwarves focus has different traits and a Level 2.
- **Observation:** E: Craft, CON +1, and DEX/CHA -1 agree with the prose. Darkvision has a clear 60ft range. The main risk is confusing this package with dwarves_21 and inheriting its HP, magic resistance, or upgrade.
- **Revision or ruling:** Display “드워프 (다른 세계)” or a translator-chosen setting label. Keep this entry's traits self-contained. An origin-family link must use IDs, not identical translated names.

### 055 엘프, 문명 / Elves, Civilized

**IDs:** `elves_civilized1`

**Priority:** P3

- **Name:** Suggested 문명 엘프 or 도시 엘프; the latter fits the local flavor but narrows the English title, so use it only intentionally.
- **Observation:** E: both fixed skills, DEX/INT choice, and CON penalty now match. The darkvision clause explicitly excludes complete darkness; do not merge it with dwarven darkvision. 마법 as a skill does not by itself grant spellcasting or Effort.
- **Revision or ruling:** “지식과 마법을 각각 보너스 기술로 얻습니다. 민첩 또는 지능 수정치 중 하나를 +1, 건강 수정치를 -1 조정합니다.” Name all choices separately and keep this origin distinct from reincarnating elves1.

### 056 엘프, 하프 엘프 / Elves, Half-Elves

**IDs:** `elves_half_elves1`

**Priority:** P2

- **Name:** Suggested 하프엘프 as a standalone name; keep the hierarchical prefix only if every subrace is displayed that way.
- **Observation:** E/R: the optional DEX/CON pair is correctly encoded atomically. The text should explicitly bind the penalty to opting in and state selection permanence. The free skill currently permits Connect again; confirm whether “원하는 기술” intentionally includes the separately granted one.
- **Revision or ruling:** “원한다면 민첩 수정치 +1과 건강 수정치 -1을 함께 적용할 수 있습니다. 적용하지 않으면 둘 다 변하지 않습니다.” Preserve the 30ft dim-light limit. If Connect may be chosen again, say so and reference the creation allotment cap.

### 057 엘프, 숲 / Elves, Forest

**IDs:** `elves_forest1`

**Priority:** P3

- **Name:** Suggested 숲 엘프 for natural Korean word order.
- **Observation:** E: encoded Shoot, Survive, DEX +1 and CON -1 match. “완전한 어둠보다 빛이 있으면” is awkward but appears to mean any illumination short of total darkness, not a distance-based darkvision power.
- **Revision or ruling:** “완전한 어둠이 아니라면 희미한 빛에서도 명확히 볼 수 있습니다.” Do not invent a vision range or add the other elf variants' skills and score rules.

### 058 하플링 / Halflings

**IDs:** `halflings1`

**Priority:** P2

- **Name:** Keep; trim trailing whitespace.
- **Observation:** R: “효과적으로 쓰기에 너무 작습니다” does not say prohibited, penalized, or requiring special-sized equipment. Define which bows count as large and whether thrown two-handed melee weapons are affected. Sneak and the CON/DEX modifier choice agree with data.
- **Revision or ruling:** Choose “사용할 수 없습니다” versus a specified penalty rather than leaving a vague ineffectiveness rule. List weapon IDs/categories or a size criterion. This exact rule is inherited by both Goblin variants, so resolve it centrally.

### 059 노움 / Gnomes

**IDs:** `gnomes1`

**Priority:** P1

- **Name:** Keep; use 숲/지하 노움 and 발명가 노움 as variant labels if the choice is retained.
- **Observation:** D: desc explicitly allows an inventor variant replacing Sneak with Craft, but the data has a fixed Sneak grant and no variant choice. R: establish whether the player chooses the variant or the GM selects one for the setting; this is a replacement, not an extra skill.
- **Revision or ruling:** “[플레이어/GM]가 변종을 정합니다. 기본형은 잠행, 발명가형은 제작을 보너스 기술로 얻습니다. 나머지 효과는 같습니다.” Preserve the DEX bonus and STR/WIS penalty. Trim trailing name whitespace.

### 060 고블린, 발명가 / Goblins, Tinker

**IDs:** `goblins_tinker1`

**Priority:** P1

- **Name:** Suggested 발명가 고블린 or 땜장이 고블린; 발명가 emphasizes invention, 땜장이 emphasizes tinkering. Either needs stylistic approval.
- **Observation:** D/R: effect says “지혜 수정치는 -1이 됩니다” (set to -1); data subtracts 1 from the modifier. A starting +1 therefore becomes -1 by prose versus 0 in the code. This is a concrete mismatch, not merely polish. Weapon restrictions depend on Halfling wording.
- **Revision or ruling:** If subtraction is intended: “지혜 수정치가 1 감소합니다.” If assignment is intended: “기존 값과 관계없이 지혜 수정치를 -1로 설정합니다.” Define order with other modifiers before encoding an assignment. Trim title whitespace.

### 061 고블린, 야만 / Goblins, Savage

**IDs:** `goblins_savage1`

**Priority:** P2

- **Name:** Suggested 야만 고블린; 부족 고블린 is a softer thematic alternative but changes emphasis and is not intrinsically more faithful.
- **Observation:** E/R: “늪지도” appears to be a typo for 늪지 or 늪지대. The skill/modifier data agrees. Halfling weapon limits are only referenced, so an isolated card is incomplete without a linked definition.
- **Revision or ruling:** Keep Sneak and Survive as separate grants. Repeat or link the precise weapon restriction after resolving Halflings. Darkness up to 60ft is explicit and should not be converted into the elves' dim-light-only rule.

### 062 리자드맨 / Lizardmen

**IDs:** `lizardmen1`, `lizardmen2`

**Priority:** P1

- **Name:** Keep to distinguish it from 도마뱀 수인, or use a translator-approved variant qualifier. Trim whitespace on both levels.
- **Observation:** D/R: Level 1's unarmored AC 13 and armor +1 are absent from current derived AC; “비무장” can mean weaponless rather than unarmored. Clarify whether DEX/shields add and whether CHA may be both bonus and penalty (current separate choices permit it). Level 2 lacks action cost, save type, successful-save damage, and how/when breath damage type is selected.
- **Revision or ruling:** Use “갑옷을 입지 않았을 때” if that is the intent, and publish the AC formula. For breath specify “장면당 한 번, [행동] ... [내성] 실패 시 2d6 + 캐릭터 레벨, 성공 시 [확정]”. State whether immunity covers the chosen damage type broadly or only the user's own breath.

### 063 오크 / Orcs

**IDs:** `orcs1`

**Priority:** P2

- **Name:** Keep; trim trailing whitespace.
- **Observation:** E: “생존과 접전 혹은 격투” lacks grouping, but the current data clearly uses Survive plus one of Stab/Punch. STR/CON +1 and INT -1 match. The flavor's generalization is not an extra compulsory intelligence restriction beyond the modifier.
- **Revision or ruling:** “생존을 보너스 기술로 얻고, 백병 또는 격투 중 하나를 추가 보너스 기술로 선택합니다.” This removes the alternative reading of either (Survive and Stab) or Punch alone. Preserve the separate 60ft darkvision.

## Other Demihuman Origins

### 064 드워프 / Dwarves, 다른 아인 variant

**IDs:** `dwarves_21`, `dwarves_22`

**Priority:** P1

- **Name:** Keep with a setting/category qualifier distinct from dwarves1.
- **Observation:** D/R: Level 1 says “각 레벨마다 HD에 +1”; this can mean additional hit dice, hit-die result bonus, or HP per character level. Current HP does not include any such effect. Spatial sense “20ft까지 단단한 물체” needs to distinguish sensing solid objects from seeing through solid barriers. Level 2's paid 100ft option may or may not share the daily use.
- **Revision or ruling:** Resolve and write either “레벨당 최대 HP +1” or the intended dice expression, not bare HD +1. For Level 2 say whether the user negates only personal effects or cancels the effect for everyone; define the once-per-day limit, Strain cost, targeting, and persistence separately. 기관계 부하 should match the approved resource term.

### 065 엘프 / Elves, reincarnating variant

**IDs:** `elves1`, `elves2`

**Priority:** P1

- **Name:** Keep with a qualifier such as 환생 엘프 only if consistent with the setting; don't confuse it with the Civilized/Forest variants.
- **Observation:** D: Level 1's score redistribution is in desc and not encoded; Level 2 lacks its mental modifier +1 and maximum +3 permission. R: “흠집이 없습니다” and scores at least 9 sound mandatory, but “옮겨서 ... 올릴 수” and choosing attributes sound optional. Donor floors, point conservation, and interaction with fixed-array validation are unspecified.
- **Revision or ruling:** Decide which scores must reach 9, which donors may fall below 9, and whether the original total is conserved. Record redistribution separately from rolled/fixed allocation. Level 2: “지능·지혜·매력 중 하나의 수정치를 +1 조정하고, 그 수정치의 상한을 +3으로 허용합니다” if the current prose is retained. Also clarify whether Level 1's free skill can duplicate Notice and the outcome retained after its daily reroll.

## Core Foci

### 066 경계심 / Alert

**IDs:** `alert1`, `alert2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: Level 1 explicitly makes party initiative +1 non-stacking; distinguish that from the individual roll-twice rule. Level 2 exempts another character with “경계심”, without saying whether that means Level 1 or Level 2, or how multiple eligible first actors are ordered.
- **Revision or ruling:** State the exact level required for the exception and use a tie-breaker or normal initiative among those actors. Keep execution-attack immunity separate from mere early warning, unlike Danger Sense. Do not grant the entire party individual initiative rerolls from one user's focus.
- **Manual Review:** Done.

### 067 무장 마법사 / Armored Magic

**IDs:** `armored_magic1`, `armored_magic2`

**Priority:** P1

- **Name:** Suggested 갑주 마법 or 갑옷 시전. 무장 can imply weapons and 마법사 sounds like a class, whereas the rule specifically modifies casting in armor.
- **Observation:** D: desc restricts selection to casters whose armor prevents casting, but requirements is empty. A blanket mage-archetype check may still be too broad because some mage-archetype classes do not cast spells. E/R: “주문을 외울 수” should mean casting here, not learning; total armor encumbrance, shield inclusion, and two occupied hands require precise boundaries.
- **Revision or ruling:** “갑옷으로 인해 주문 시전이 제한되는 주문시전자만 선택할 수 있습니다.” Define whether the Level 1 limit includes shield encumbrance and preserve Righteous Iron's explicit exception. At Level 2 distinguish hands holding objects from hands restrained; do not imply immunity to all casting interruptions.
- **Manual Review:** Done.

### 068 중장보병 / Armsmaster

**IDs:** `armsmaster1`, `armsmaster2`

**Priority:** P2

- **Name:** Strong candidate 무기의 달인 or 백병무기의 달인. 중장보병 suggests heavy armor and infantry status absent from the actual eligibility/effect; the latter candidate must still mention thrown weapons.
- **Observation:** R/E: 접전/근접전 기술 should consistently be 백병. “피해 굴림 또는 충격 피해” may imply a choice rather than applying the skill bonus to whichever damage resolution occurs. “중첩되지 않음” with Deadeye could prohibit buying both rather than only overlapping benefits. Level 2's AC10 is a Shock calculation, not an AC reduction.
- **Revision or ruling:** Specify that non-stacking concerns the named overlapping benefit rather than focus ownership if that is intended. Keep weapon attacks separate from unarmed attacks and nonthrown projectiles. The conditional +1 attack is weapon-specific, not a universal attack bonus.
- **Manual Review:** Done.

### 069 장인 / Artisan

**IDs:** `artisan1`, `artisan2`

**Priority:** P2

- **Name:** Keep; label it as a focus to distinguish the Artisan background and any renamed Provident Crafter.
- **Observation:** R: Level 1's effective Craft rank must not grant actual levels, affect unrelated checks, or bypass prerequisites unless explicitly intended. “최소 한 개” could impose a salvage requirement even on a recipe needing none. Level 2's monthly reduction lacks target, accumulation, and timing; “첫 번째 개조” needs to identify per-item versus character-wide.
- **Revision or ruling:** “각 장비의 첫 개조” only if per-item is approved. Show one worked cost example for first-mod/masterwork discounts and whether they multiply or add. State whether the monthly salvage reduction applies to a newly made mod, an existing one, or recurring work on the same mod.
- **Manual Review:** Done.

### 070 암살자 / Assassin

**IDs:** `assassin1`, `assassin2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: “영거리” needs an actual reach/distance definition; automatic hit in a surprise round is not automatically an execution attack or save bypass. The concealment rule should identify excluded search intensity without implying magic-proof concealment. Level 2 movement before/after the execution attack needs to retain any setup requirements.
- **Revision or ruling:** Use a defined melee/point-blank range and state that only the attack roll is bypassed unless another clause says otherwise. Clarify whether the split movement spends one normal Move action and whether the target can still receive a save. Standardize 단순 행동 with the chosen action glossary.
- **Manual Review:** Done.

### 071 권위자 / Authority

**IDs:** `authority1`, `authority2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** D: authority2 encodes another fixed Lead allotment although its effect gives follower benefits and says nothing about gaining Lead again. That can change skill rank or advancement points. R: Level 2's follower bonus needs to retain the NPC-only, voluntary-help definition and distinguish direct followers from an entire commanded army.
- **Revision or ruling:** Decide whether to remove the extra grant or explicitly add it to the approved Level 2 prose; neither representation is automatically authoritative. Specify whether multiple Authority users stack and whether follower benefits apply at a distance. Level 1's Morale-as-difficulty roll should preserve harmless/reasonable-request exceptions.
- **Manual Review:** Done.

### 072 근접 전투원 / Close Combatant

**IDs:** `close_combatant1`, `close_combatant2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: Level 1's Shock immunity “주문 시전에는 방해” could mean all casting is prohibited, or only that Shock still interrupts casting despite no HP loss. Level 2's free use of withdrawal needs a precise action type, frequency, and continued movement cost. AC10 must remain restricted to Shock eligibility.
- **Revision or ruling:** State the casting consequence explicitly rather than saying only 방해. Use the same non-immunity-overriding Shock language as Shocking Assault where intended. Do not infer a free unlimited movement action from “퇴각 행동은 단순 행동”.
- **Manual Review:** Done.

### 073 연줄 / Connected

**IDs:** `connected1`, `connected2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: Level 1's one request per session and Level 2's encounter with a useful person might be independent allowances or an upgrade of one allowance. Requirements for spending a week locally apply to Level 1, but their applicability to Level 2 is unclear. The player's power to choose where/when cannot silently override “완전히 불가능한 상황”.
- **Revision or ruling:** State whether the two session allowances are separate. Define modest requests and preserve the GM's control of the contact's identity/capacity. “인력망” might be 인맥망 if the intended resource is contacts rather than hired labor.
- **Manual Review:** Done.

### 074 교양인 / Cultured

**IDs:** `cultured1`, `cultured2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: “출신 국가의 모든 언어” is broader than Diplomatic Grace's widely used languages. Confirm deliberate scope, including secret/minority languages and literacy. Level 1's session request and Level 2's reroll need independent/shared usage and reroll-result rules.
- **Revision or ruling:** Do not automatically harmonize “모든” to “널리 쓰이는”; that would change the rule. Define the request as requiring actual cooperation or merely the opportunity to ask. For Level 2 state whether the second result is mandatory or the better result may be retained.
- **Manual Review:** Done.

### 075 끝까지 간다 / Die Hard

**IDs:** `die_hard1`, `die_hard2`

**Priority:** P1

- **Name:** Keep for tone, or 질긴 생명력 for a more descriptive mechanical title.
- **Observation:** D: Level 1's +2 HP per character level is not included in current derived HP; this matters immediately at level 1. R: “불타거나, 절단” can exclude stabilization after any burn/cut rather than catastrophic destruction. Level 2's automatic daily trigger may spend the use without player choice.
- **Revision or ruling:** Use a precise destruction threshold consistent with other death-prevention foci, without inventing one. State whether Level 2 is optional, when the choice is made, and whether it prevents reaching 0 or restores HP afterward. Distinguish character level from focus level in the HP bonus.
- **Manual Review:** Done.

### 076 명사수 / Deadeye

**IDs:** `deadeye1`, `deadeye2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** R: thrown weapons are explicitly included but Level 1 adds Shoot rather than whichever attack skill was used; preserve or revise deliberately. Level 2's “사격 기술 판정에서 2” could mean unmodified dice sum, final total, or attack-roll natural 2. Action cost and the immobile/nonliving target conditions must remain distinct from attacking living enemies.
- **Revision or ruling:** Conditional wording: “사격 기술 판정의 [주사위 눈의 합/최종 결과]가 2인 경우와 물리적으로 명중할 수 없는 경우를 제외하고 ...”. State which check is actually rolled and whether roll-twice/best-dice effects change the failure criterion. Confirm that non-stacking with Armsmaster concerns overlapping benefits rather than prohibiting ownership of both foci.

### 077 협상가 / Dealmaker

**IDs:** `dealmaker1`, `dealmaker2`

**Priority:** P2

- **Name:** Keep; 거래의 달인 is an optional distinction from Diplomatic Grace's diplomacy.
- **Observation:** E/R: “반 시간의 시간” can simply be 30분. Finding a seller is not obtaining the goods; preserve rarity and adventure requirements. Level 2's “바로 죽이려고 하지 않는” means immediate intent, not general hostility, and the text does not clearly say whether fair payment guarantees agreement or only a hearing.
- **Revision or ruling:** State the negotiated outcome, request bounds, and GM role. Keep one use per session rather than per NPC unless explicitly intended. Distinguish this commercial request from Connected/Cultured/Diplomatic Grace to prevent combining their prose into unlimited compulsion.

### 078 능력치 개발 / Developed Attribute

**IDs:** `developed_attribute1`

**Priority:** P2

- **Name:** Keep with a subtitle “수정치 향상” if useful; the existing title alone can imply a score increase.
- **Observation:** E: repeatability and unchanged score are explicit, and encoded caps agree. The approved rule now needs to say the same attribute may be chosen on multiple instances, caps do not add, and mage archetype exclusion includes partial and nonspellcasting mage classes. Penal exclusion is encoded but absent from this entry's prose.
- **Revision or ruling:** “반복 선택할 때 같은 능력치를 다시 선택할 수 있습니다. 각 선택은 수정치 +1을 주지만, 상한 +3 허용은 중첩되지 않습니다. 실제 점수는 바뀌지 않습니다.” Add the already-approved class/identity exclusion precisely, not a new spellcaster-only restriction.

### 079 외교의 귀재 / Diplomatic Grace

**IDs:** `diplomatic_grace1`, `diplomatic_grace2`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: Level 1's reroll of each die showing 1 lacks a one-reroll versus repeat-until-not-1 limit, especially with extra dice. Level 2's implicit bargain needs to identify assent, save timing, forbidden demands, duration, and whether multiple targets are possible.
- **Revision or ruling:** Use “1이 나온 각 주사위를 [한 번만/1이 아닐 때까지] 다시 굴립니다” after approval. For Level 2 say whether a successful Mental save rejects the bargain and who selects its expiration; “시간적 제한” alone permits arbitrarily long obligations.

### 080 신의 / Gifted Chirurgeon

**IDs:** `gifted_chirurgeon1`, `gifted_chirurgeon2`

**Priority:** P2

- **Name:** Suggested 신의(神醫) or 천부적 의술. Bare 신의 may mean faithfulness or 'of a god', while Chirurgeon is a medical practitioner rather than necessarily divine magic.
- **Observation:** R: Level 1's 3d6-drop-lowest can overlap Specialist(Heal); define replacement rather than accumulating extra dice. “전투에서 응급처치” may intentionally exclude treatment outside combat. Level 2's Strain cap check could forbid healing that would reach the cap or only healing while already at it.
- **Revision or ruling:** Explicitly state whether the recipient at max-1 may gain the final point and receive healing. Standardize 기관 부하. Define whether self counts as an adjacent ally and whether magical healing removes an existing 쇠약 state or only avoids gaining one from this recovery.

### 081 두목 / Henchkeeper

**IDs:** `henchkeeper1`, `henchkeeper2`

**Priority:** P2

- **Name:** Keep for tone; 부하 거느리기 is a functional alternative but less like a character trait.
- **Observation:** R: “3레벨마다 부하 한 명을 추가 ... 올림” could mean ceil(level/3) total or 1 + ceil(level/3) total. At level 1 that yields one or two followers. Level 2 lacks clarity on whether the veteran upgrade applies to all existing/new focus followers and whether exceptional NPCs count toward the same limit.
- **Revision or ruling:** Publish a formula and examples for character levels 1, 3 and 4. Define capacity separately from the 24-hour recruitment time. Preserve the distinction between loyal focus followers and additional paid hirelings; reference exact local stat blocks or provide a concise block.

### 082 무적의 방어 / Impervious Defense

**IDs:** `impervious_defense1`, `impervious_defense2`

**Priority:** P1

- **Name:** Consider 철벽 방어 or 난공불락의 방어; 무적 may imply continuous immunity, whereas the effects are high AC and one daily negation.
- **Observation:** D: Level 1's base AC formula is absent from current derived AC. R: publish parentheses for 15 + ceil(character level / 2), and define armor comparison, DEX and shield additions rather than stacking armor on it. Level 2 needs its decision window and the extent of one attack versus one damage source.
- **Revision or ruling:** Conditional formula: “기본 AC는 15 + ceil(캐릭터 레벨 / 2)입니다. 여기에 민첩 수정치와 방패 보너스만 더합니다.” At character level 1 that gives base AC 16. Confirm how choosing to wear better armor works and whether area weapon attacks count as one negatable attack.

### 083 첩자 / Imposter

**IDs:** `imposter1`, `imposter2`

**Priority:** P2

- **Name:** Suggested 사칭의 달인 or 위장 전문가; 첩자 implies espionage employment not required by the actual disguise/identity mechanics.
- **Observation:** R/E: desc's 은신 should be 잠행 when naming the skill. Level 1's “완벽한 증거만 ... 관련지을” needs to identify which true identity is concealed and whether ordinary disguise detection is still possible. Level 2 changes to three outfits, not necessarily three different bodies, and its identity count/reset needs clarity.
- **Revision or ruling:** Distinguish 의상, 외모, 가짜 신분, and 실제 신원. State whether the three preset outfits can be replaced and whether they are illusory or physical. Do not silently expand clothing change into unrestricted bodily shapeshifting.

### 084 행운아 / Lucky

**IDs:** `lucky1`, `lucky2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** D/R: the prerequisite “최소한 하나의 능력 수정치가 -1” is not encoded. Does it require exactly -1 or any negative modifier including -2/-3? Does it inspect score-derived modifiers or final focus-adjusted modifiers, and must it remain true after later selections? Level 1 explicitly retains the better reroll, unlike entries that do not say so.
- **Revision or ruling:** Choose either “수정치가 정확히 -1인 능력치가 하나 이상” or “수정치가 -1 이하인 능력치가 하나 이상”, then specify evaluation stage. For Level 2 preserve both the 2-6 benefit and the 1 adverse result; state whether that d6 itself is eligible for luck rerolls.

### 085 무화자 / Nullifier

**IDs:** `nullifier1`, `nullifier2`

**Priority:** P1

- **Name:** Keep if established, but align the reference 무화사 in Mageslayer's art; 마법 상쇄자 is an optional clearer alternative.
- **Observation:** D: mage/partial-mage exclusion is only in desc. R: “첫 번째로 실패했을 때, 다음 날 그 내성굴림을 성공한 것으로” literally delays success until the next day; it may instead intend a daily first-failure conversion. Those outcomes are not equivalent. Level 2 might negate one chosen magic effect or all unwanted magic for a scene.
- **Revision or ruling:** Do not silently rewrite 다음 날. Ask whether the intended rule is immediate success once per day, next-day recovery from the effect, or something else. If approved: “매일 처음 실패한 대마법 내성굴림을 즉시 성공으로 바꿉니다.” Identify the user's own immunity versus any ally aura; the +2 applies only against magic.

### 086 독살자 / Poisoner

**IDs:** `poisoner1`, `poisoner2`

**Priority:** P1

- **Name:** Keep, or 독의 달인 if emphasizing nonlethal preparations as well. The title should not restrict the expressly allowed nonlethal option.
- **Observation:** R: detection difficulty uses “경계를 하지 않았거나 ... 귀족이 아니라면”, whose OR makes even a vigilant commoner face the higher difficulty; confirm the unusual nobility condition. A dose poisoning 5-6 people lacks a fixed target count. Level 1 attack-or-Shock poison needs a trigger and save outcome. Level 2 may apply the Heal penalty twice through its general clause and repeated explicit clause.
- **Revision or ruling:** Write a detection-condition truth table rather than replacing 귀족 with another guess. State dose size, delivery method, whether damage once per hit/poisoning or repeatedly on Shock, and whether Level 2's successful-save damage replaces or adds to ordinary poison. Explicitly say a repeated Heal penalty is applied once if that is intended.

### 087 박식가 / Polymath

**IDs:** `polymath1`, `polymath2`

**Priority:** P1

- **Name:** Keep; 만능가 is an optional practical-skills emphasis but may overpromise combat ability.
- **Observation:** D: Expert/partial-Expert restriction is absent from requirements. R: effective ranks apply only to checks, not learned ranks, advancement, damage, or prerequisites. “비전투” can include Magic/Pray/Alchemy under current skill tags; no Magic exclusion is stated here. Using rank 0 must not lower a genuinely trained rank.
- **Revision or ruling:** “비전투 기술 판정에 한해, 실제 기술 레벨과 [0/1] 중 높은 값을 사용합니다. 실제 기술 레벨이나 기술 습득 횟수는 변하지 않습니다” if that reflects intent. Confirm the allowed skill set explicitly and keep Level 2 as a replacement effective rank, not an additional +1.

### 088 기수 / Rider

**IDs:** `rider1`, `rider2`

**Priority:** P2

- **Name:** Keep; 탑승의 달인 is broader if non-equine mounts are common.
- **Observation:** R: Level 1 needs to define whether benefits apply only while mounted and whether “탈것” includes nonanimal vehicles. The AC transfer is replacement by the higher value, not addition. Level 2's telepathy “한 시간을 소비” can mean setup time, duration, or both, and the two once-per-scene benefits may be separate.
- **Revision or ruling:** “이 정신적 연결을 형성하는 데 1시간이 필요합니다” versus “연결은 1시간 동안 지속됩니다” must be chosen. Identify one linked creature at a time and range-breaking behavior. State timing/action for turning a successful hit into a miss and preserve double speed for travel, not automatically combat.

### 089 충격 돌격대 / Shocking Assault

**IDs:** `shocking_assault1`, `shocking_assault2`

**Priority:** P2

- **Name:** Suggested 충격 맹공. 돌격대 describes a unit and implies movement/charging, neither of which is required by the actual effect.
- **Observation:** R/E: Level 1 explicitly preserves Shock immunity, unlike shorter AC10 clauses elsewhere; keep those consistent. “충분한 위력” should identify a Shock-capable weapon rather than a subjective damage threshold. Level 2 adds Shock damage, not attack or ordinary hit damage automatically.
- **Revision or ruling:** “원래 충격 피해를 줄 수 있는 근접 무기 또는 비무장 공격의 충격 피해에 +2를 더합니다.” Confirm whether the global minimum-hit-damage rule incorporates this indirectly; do not encode it as a universal attack bonus or bypass immunity.

### 090 저격수의 눈 / Sniper’s Eye

**IDs:** `snipers_eye1`, `snipers_eye2`

**Priority:** P1

- **Name:** Keep.
- **Observation:** D/R within prose: desc says the benefits apply only to execution attacks, but Level 1 expressly also covers stationary nonliving targets. Decide which scope wins. Level 1's 3d6 needs to name the skill check rather than damage or attack d20. Level 2's automatic hit still leaves a Physical save, and “두 배의 피해” lacks a damage baseline.
- **Revision or ruling:** Amend the shared restriction to include the stated Level 1 exception if intended. For Level 2 identify the normal damage components to double and whether successful-save damage replaces the ordinary execution fallback. Preserve the explicit -4 save penalty without interpreting it as a lower target.

### 091 특별한 기원 / Special Origin

**IDs:** `special_origin1`

**Priority:** P1

- **Name:** Keep, but make it visibly a selection instruction if that is its intended role rather than a standalone mechanical focus.
- **Observation:** D/R: this normal-type, empty-effect focus says to choose it and then choose an origin. The picker currently charges a pick for each selected entry, with no nested origin choice or validation. That creates a possible two-pick tax or a paid entry granting nothing. It does not itself count toward the one-origin-family rule.
- **Revision or ruling:** Decide whether this is a nonselectable explanatory heading, a wrapper spending one pick for a chosen origin, or a genuine additional cost. Suggested wrapper wording only if approved: “이 선택권 1회를 사용해 기원 포커스 하나를 선택합니다. 설명용 항목과 기원을 별도로 지불하지 않습니다.” Keep purely cosmetic ancestry free as the current desc states.

### 092 특성화 인재 / Specialist

**IDs:** `specialist1`, `specialist2`

**Priority:** P1

- **Name:** Suggested 기술의 달인 or 특정 기술의 달인; avoid plain 전문가 because it is already the Expert class name. 특성화 인재 has an institutional/educational tone rather than a rules category.
- **Observation:** R: Level 2 literally rolls 4d6 and discards one die, leaving three dice; Level 1 leaves two. If the intended improvement is choosing the best two dice, that would require discarding two, but no such correction is justified from local text alone. E: approved distinct skills and owned upgrades are not yet explained in prose.
- **Revision or ruling:** Specify either “4d6을 굴려 가장 낮은 1개를 버리고 나머지 3개를 합산” or “가장 낮은 2개를 버리고 나머지 2개를 합산” after your ruling. Add that each Level 1 instance chooses a different legal skill, Level 2 upgrades that instance, and no second skill allotment is granted by the upgrade.

### 093 영체 권속 / Spirit Familiar

**IDs:** `spirit_familiar1`, `spirit_familiar2`

**Priority:** P1

- **Name:** Keep if 권속 is the chosen familiar term; use that term consistently with 패밀리어/종복 in spells. “구조물” for a construct companion may merit 피조물, subject to your terminology.
- **Observation:** D: Level 2 explicitly allows repeated purchases and two benefits per purchase, but lacks repeatable metadata and any saved choices; the engine also allows a particular upgrade only once per parent. R: duplicate benefits, replacing versus adding HP, the owner of committed Effort, and its recovery timing need rulings. The named summoning spell does not exactly match a catalogue title.
- **Revision or ruling:** Calculation of the Evoked Servitor (calculation_of_the_evoked_servitor / 불러진 종복의 계산) is a plausible local reference by content, not a confirmed identity. Confirm it. Specify two distinct benefits, whether later purchases may repeat them, and whether HP becomes 3 x character level or increases by that amount. “중요 행동” should use the approved Main-action label.

### 094 덫사냥꾼 / Trapmaster

**IDs:** `trapmaster1`, `trapmaster2`

**Priority:** P1

- **Name:** Suggested 함정의 달인; 덫사냥꾼 suggests hunting while the effects also cover alarms, containers, and magical security.
- **Observation:** R: “1d6+캐릭터 레벨의 두 배” can mean 1d6 + 2 x level or 2 x (1d6 + level). Level 1 also needs save type, round duration, and trigger boundary. Level 2 commits Effort without amount/recovery duration; it cites 마법 제거 rather than a local spell title and leaves the preliminary check's difficulty/effect unstated.
- **Revision or ruling:** Publish the exact damage expression after a ruling. Confirm whether Extirpate Arcana (extirpate_arcana / 신비를 근절하라) is the intended local spell; its description does not permanently remove fixed effects, so explain any trap-specific exception. Specify what a noncaster uses for the spell's opposed check and distinguish a stored Effort commitment from once-per-scene frequency.

### 095 공수가 / Unarmed Combatant

**IDs:** `unarmed_combatant1`, `unarmed_combatant2`

**Priority:** P2

- **Name:** Suggested 맨손 격투가 or 비무장 전투가. 공수가 can be read as a specific martial tradition or an unrelated compound; the effect applies broadly to unarmed combat.
- **Observation:** R/E: distinguish character level from Punch skill rank in the damage table. The ordinary Punch-rank damage addition and Shock already equal to that rank must not double-count. Level 2 explicitly allows additional Shock with its fixed 1d6 miss damage, but “또한 추가될 수” needs to specify remaining AC/immunity checks.
- **Revision or ruling:** Give separate formulas for hit damage and Shock. For Level 2: “빗나간 격투 공격은 수정치 없는 1d6 피해를 가합니다. 별도로 충격 피해의 통상 조건을 만족하면 충격 피해도 가합니다” only if additive resolution is intended. Clarify natural claws and weapon-like unarmed attacks.

### 096 특별한 재능 / Unique Gift

**IDs:** `unique_gift1`

**Priority:** P2

- **Name:** Keep.
- **Observation:** R: an empty effect is intentional only if a negotiated ability is recorded somewhere; current selection alone can appear complete without an agreed rule. “협의해” needs grammatical correction. Mid-session rebalancing without mutual agreement can look like unilateral revocation.
- **Revision or ruling:** “플레이어와 GM이 협의하여 효과, 사용 행동, 횟수, 비용, 지속시간, 제한을 정하고 기록합니다.” Identify whether completion requires a GM note/approval or is intentionally manual. Do not automatically invent a generic bonus for this focus.

### 097 수호자 / Valiant Defender

**IDs:** `valiant_defender1`, `valiant_defender2`

**Priority:** P2

- **Name:** Keep; 용맹한 수호자 is an optional closer title rendering without changing function.
- **Observation:** R: Level 1's extra protection count should distinguish attempted intercepts from successful ones. For spell/magical protection, the user's skill/attribute and an enemy without Magic rank are undefined. Level 2's first automatic protection may or may not bypass the magical opposed check. The +2 AC needs owner and duration.
- **Revision or ruling:** Specify whose AC rises and for which attack/interval. Define whether the first protection is per round even outside the user's turn and whether an automatic success spends the ordinary protection allowance. Retain the explicit bull-sized limit rather than treating it as unrestricted giant interception.

### 098 좋은 인상 / Well Met

**IDs:** `well_met1`, `well_met2`

**Priority:** P2

- **Name:** Keep; 좋은 첫인상 makes the once-per-creature restriction clearer, if that scope applies to the whole focus.
- **Observation:** R: desc says once per creature, while Level 2 says once per session; clarify whether both limits constrain Level 2. Define individual-versus-group reaction rolls, whether hostility becomes friendship or temporary openness, and whether multiple reaction bonuses stack.
- **Revision or ruling:** “각 크리쳐와 처음 만날 때만” only if first meeting is the intended trigger rather than any one chosen encounter. State that the speech opportunity is not a guarantee of obedience. Keep the GM's reason for friendliness distinct from the player's mechanical use.

### 099 난전 돌격대 / Whirlwind Assault

**IDs:** `whirlwind_assault1`, `whirlwind_assault2`

**Priority:** P2

- **Name:** Suggested 회오리 맹공 or 선풍 공격; 돌격대 implies a unit/charge, and 난전 loses the circular-strike image.
- **Observation:** R: Level 1's all-enemy Shock needs ordinary weapon/AC/immunity conditions and whether each target counts as hit for other effects. Level 2 triggers on killing, but the follow-up weapon, attack type, range, and timing are not named; the once-per-round limit should prevent an unbounded chain.
- **Revision or ruling:** “라운드당 한 번 ... 사거리 내 다른 대상에게 추가 공격 1회” preserves the count. Decide whether nonlethal incapacitation qualifies as killing and whether the follow-up can be ranged after a melee kill. Do not introduce a movement requirement solely from the Korean title.

### 100 외세계 영향 / Xenoblooded

**IDs:** `xenoblooded1`

**Priority:** P1

- **Name:** Suggested 이계의 혈통 or 외세계의 피; current 외세계 영향 omits the bloodline emphasis but may be deliberately broader.
- **Observation:** R: the aquatic “120도의 시야” explicitly names an angle, not a distance; confirm angle versus range, and supply whatever other limit is needed. Radiation absorption does not explicitly say immunity to all radiation damage. The focus is type normal despite ancestry-like flavor, so it currently can coexist with an origin; do not reclassify it without your decision.
- **Revision or ruling:** Keep one atomic package; gravity chooses STR +1/DEX -1 or DEX +1/STR -1 together. If 120 degrees is intended, specify viewing distance separately; if it is distance, approve a unit before editing. State whether aquatic breathing replaces or supplements breathing air. Do not silently add ordinary-origin restrictions based solely on the proposed name.

## Additional Foci

### 101 일반 연금술 / Mundane Alchemy

**IDs:** `mundane_alchemy1`, `mundane_alchemy2`

**Priority:** P2

- **Name:** Consider 비마법 연금술 only if Mundane explicitly distinguishes nonmagical practice in your terminology; 일반 연금술 is safe if it is a system label rather than a power tier.
- **Observation:** E/R: Level 1 says Alchemy-0, while the approved builder treats this as one allotment that can instead produce level 1 or overflow points. Level 2's one week for 25 silver per level of reagents lacks a production cap and whether output can be accumulated, sold, or applied to all costs. The earlier improvised-lab permission may not cover advanced work.
- **Revision or ruling:** Reference the approved skill-allotment rule rather than resetting existing skill to 0. Distinguish basic/advanced recipe access from learned recipe lists. “캐릭터 레벨 x 25은화 상당의 재료 ... 자신의 작업에만 사용” preserves the stated value and personal-use limit without inventing resale rights or an automatic weekly stipend.

### 102 전통적 교육 / Traditional Education

**IDs:** `traditional_education1`

**Priority:** P1

- **Name:** Suggested 마법 전통 수련 or 비전 전통 교육. 전통적 교육 sounds like ordinary conservative schooling rather than training in one magical tradition.
- **Observation:** D: Invoker-only selection is encoded, but tradition selection, school access, starting arts, and its Effort maximum are not. The current spell picker still grants an Invoker only High Magic and the arts evaluator only class-based plans. R: the wording can refer to the Invoker's full/partial status or a borrowed tradition's status, and does not settle duplicate arts or whether learned spells increase in count.
- **Revision or ruling:** Record the chosen tradition explicitly. Define which full/partial starting-art rule applies, how fixed arts and choices are gained, whether duplicate arts are replaced, and whether the focus expands only allowed schools or also spell count. “최대 분발 = max(1, 마법 기술 레벨)” needs to specify a separate pool versus overriding/adding to existing pools. Preserve the one-purchase limit and no later arts from this tradition.

## Coverage and Validation

| Catalogue category | Entries read | Review items |
|---|---:|---:|
| 기사 유파 | 16 | 8 |
| 성혈 | 16 | 8 |
| 신비한 비밀 | 5 | 5 |
| 비인간 | 21 | 21 |
| 다른 크리쳐 | 11 | 11 |
| 다른 세계 | 11 | 10 |
| 다른 아인 | 4 | 2 |
| 기본 | 66 | 35 |
| 기타 | 3 | 2 |
| **Total** | **153** | **102** |

Coverage was checked by matching each IDs line against the catalogue: 153 unique IDs, no omissions, no unknown IDs, and no duplicates. Structural inspection and reading are not proof of rules fidelity; the unresolved R findings intentionally remain unresolved.

The review distinguishes three application states: implemented creation rules; missing creation/static-sheet behavior; and play-time behavior intentionally left manual. Merely passing current automated tests does not establish that every benefit described in prose has been implemented. In particular, blanket claims that all selected focus effects appear on the derived sheet would be misleading until the D findings are resolved.

No source JSON, rules document, saved character, or application code was changed by this audit. External-source verification from the earlier review is not an acceptance condition for this document, per your instruction.

## Suggested Resolution Workflow

1. Approve a glossary for skill names, actions, resources, saves, and score/modifier terminology. Resolve the high-impact R items before numerical edits.
2. For each D item choose which local representation is intended. Record the ruling here or in PROJECT_RULES.md before synchronizing prose and data; do not assume an encoded value is automatically correct.
3. Approve names separately from mechanics. Keep catalogue IDs stable. If a name changes, update cross-references in foci, arts, spells, and UI labels together.
4. Turn approved creation effects into data and regression cases. Keep conditional gameplay as explicit notes where automation is out of scope; distinguish those notes from already-applied bonuses.
5. Re-read each revised rule as a player with only that card visible, then as a GM handling an adversarial boundary case. Remove unresolved placeholders before publication.

### Acceptance Cases for Approved Changes

- Test every proposed prerequisite with both valid and invalid class/attribute combinations, including partial classes and different selection order.
- Test score effects with the fixed array and rolled scores; preserve originals when removing a focus. Cover CON below/equal/above 14, Elf donor floors, and Chattel's replacement roll only after those rules are approved.
- Test the skill totals for Authority Level 2 and Functionary's granted Specialist without accidentally creating an extra allotment or charging a free grant twice.
- Test focus-granted arts, tradition school access, Effort pools, repeated Familiar benefits, and origin-wrapper costs independently of ordinary class allowances.
- For formulas, include character level 1 and rounding boundaries. State the expected number of dice, HP, AC, or followers rather than checking only that a calculation completes.
- For translated limits, include exactly-on-the-boundary examples: flight at the carrying limit, System Strain at maximum versus above it, and a target exactly 10ft away.
- For saves and damage, compare die bonuses with equivalent target-number changes, and distinguish normal damage, Shock, poison, execution-save fallback, and immunity.
- For repeated or conditional use, check per-user versus per-target limits and verify which result is retained after a reroll.
