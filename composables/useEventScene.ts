/**
 * 把事件 tags 對應到一種「動畫場景」、給 EventScreen 用
 *
 * 場景列表（CSS 已寫）:
 *   idle | office | payday | shop | luck | social | home | accident | health | ai
 */
import type { GameEvent } from '~/types/game'

export type SceneType =
  | 'idle'
  | 'office'
  | 'payday'
  | 'shop'
  | 'luck'
  | 'social'
  | 'home'
  | 'accident'
  | 'health'
  | 'ai'

const TAG_TO_SCENE: Array<[string, SceneType]> = [
  // 優先順序由上到下、第一個 match 就決定
  ['ai', 'ai'],
  ['luck', 'luck'],
  ['boss', 'office'],
  ['scam', 'accident'],
  ['weather', 'accident'],
  ['bad', 'accident'],
  ['health', 'health'],
  ['rest', 'health'],
  ['food', 'shop'],
  ['shop', 'shop'],
  ['relationship', 'social'],
  ['social', 'social'],
  ['family', 'home'],
  ['npc', 'social'],
  ['work', 'office'],
  ['career', 'office'],
  ['freelance', 'office'],
  ['investment', 'luck'],
]

export const sceneFromEvent = (event: GameEvent | null): SceneType => {
  if (!event) return 'idle'
  if (event.aiGenerated) return 'ai'
  for (const [tag, scene] of TAG_TO_SCENE) {
    if (event.tags.includes(tag)) return scene
  }
  // money tag 落到最後、看選項是 + 還是 -
  if (event.tags.includes('money')) {
    const hasGain = event.choices.some((c) => (c.effects.money ?? 0) > 0)
    return hasGain ? 'payday' : 'shop'
  }
  return 'office'
}

/** 根據結果效果挑「結算瞬間」要播的場景（覆蓋事件場景）*/
export const outcomeScene = (
  effects: Record<string, number>
): SceneType | null => {
  const money = effects.money ?? 0
  if (money >= 500) return 'payday'
  if (money <= -500) return 'shop'
  const happiness = effects.happiness ?? 0
  const stress = effects.stress ?? 0
  if (happiness >= 10 && stress < 5) return 'luck'
  return null
}
