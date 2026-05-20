import eventsData from '~/data/events.json'
import type { GameEvent, ScheduledEvent } from '~/types/game'

const ALL_EVENTS = eventsData as GameEvent[]
const EVENTS_BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]))

interface PickContext {
  seenIds?: string[]
  scheduled?: ScheduledEvent[]
  currentDay?: number
  characterId?: string | null
}

interface PickResult {
  event: GameEvent | null
  fromSchedule: boolean
}

export const useEvents = () => {
  /**
   * 抽下一個事件。優先順序：
   * 1. 排程到期的 chain event
   * 2. 隨機池（過濾角色、chainOnly、已看過）
   */
  const pickNext = (ctx: PickContext): PickResult => {
    const { seenIds = [], scheduled = [], currentDay = 1, characterId = null } = ctx

    // 1. chain event 到期
    const due = scheduled.find((s) => s.triggerDay <= currentDay)
    if (due) {
      const ev = EVENTS_BY_ID.get(due.eventId)
      if (ev) return { event: ev, fromSchedule: true }
    }

    // 2. 特殊日子：requiredDay 對應且未看過就必出
    const forced = ALL_EVENTS.find(
      (e) =>
        e.requiredDay === currentDay &&
        !e.chainOnly &&
        !seenIds.includes(e.id) &&
        (!e.characters || !characterId || e.characters.includes(characterId))
    )
    if (forced) return { event: forced, fromSchedule: false }

    // 3. 過濾 + 隨機
    let pool = ALL_EVENTS.filter((e) => {
      if (e.chainOnly) return false
      if (e.characters && characterId && !e.characters.includes(characterId)) return false
      if (seenIds.includes(e.id)) return false
      return true
    })
    if (pool.length === 0) {
      // 都看過了，重置（但仍排除 chain only）
      pool = ALL_EVENTS.filter((e) => {
        if (e.chainOnly) return false
        if (e.characters && characterId && !e.characters.includes(characterId)) return false
        return true
      })
    }
    if (pool.length === 0) return { event: null, fromSchedule: false }

    const totalWeight = pool.reduce((sum, e) => sum + (e.weight ?? 1), 0)
    if (totalWeight <= 0) return { event: pool[0], fromSchedule: false }
    let roll = Math.random() * totalWeight
    for (const e of pool) {
      roll -= e.weight ?? 1
      if (roll <= 0) return { event: e, fromSchedule: false }
    }
    return { event: pool[pool.length - 1], fromSchedule: false }
  }

  // 舊 API 相容（內部沒地方用了，留著保險）
  const pickNextEvent = (seenIds: string[] = []): GameEvent | null => {
    return pickNext({ seenIds }).event
  }

  return { events: ALL_EVENTS, pickNext, pickNextEvent }
}
