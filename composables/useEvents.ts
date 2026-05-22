import eventsData from '~/data/events.json'
import type { ChoiceCondition, GameEvent, PlayerStats, Range, ScheduledEvent, TimeSlot } from '~/types/game'

const ALL_EVENTS = eventsData as GameEvent[]
const EVENTS_BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]))

interface PickContext {
  seenIds?: string[]
  scheduled?: ScheduledEvent[]
  currentDay?: number
  characterId?: string | null
  timeOfDay?: TimeSlot
  stats?: PlayerStats
}

const matchesRange = (value: number, range: Range): boolean => {
  if (range.gte !== undefined && value < range.gte) return false
  if (range.lte !== undefined && value > range.lte) return false
  return true
}

const meetsCondition = (
  cond: ChoiceCondition | undefined,
  stats: PlayerStats | undefined
): boolean => {
  if (!cond) return true
  if (!stats) return false
  for (const key of Object.keys(cond) as (keyof ChoiceCondition)[]) {
    const range = cond[key]
    if (!range) continue
    const value = stats[key as keyof PlayerStats]
    if (typeof value !== 'number') return false
    if (!matchesRange(value, range)) return false
  }
  return true
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
    const {
      seenIds = [],
      scheduled = [],
      currentDay = 1,
      characterId = null,
      timeOfDay,
      stats,
    } = ctx
    const matchTime = (e: GameEvent) =>
      !e.timeOfDay || !timeOfDay || e.timeOfDay === timeOfDay
    const matchCondition = (e: GameEvent) =>
      !e.condition || meetsCondition(e.condition, stats)

    // 1. chain event 到期
    const due = scheduled.find((s) => s.triggerDay <= currentDay)
    if (due) {
      const ev = EVENTS_BY_ID.get(due.eventId)
      if (ev) return { event: ev, fromSchedule: true }
    }

    // 2. 特殊日子：requiredDay 對應且未看過 → 從所有符合的變體中加權隨機
    const forcedPool = ALL_EVENTS.filter(
      (e) =>
        e.requiredDay === currentDay &&
        !e.chainOnly &&
        !seenIds.includes(e.id) &&
        (!e.characters || !characterId || e.characters.includes(characterId))
    )
    if (forcedPool.length > 0) {
      const totalW = forcedPool.reduce((s, e) => s + (e.weight ?? 1), 0)
      let r = Math.random() * totalW
      for (const e of forcedPool) {
        r -= e.weight ?? 1
        if (r <= 0) return { event: e, fromSchedule: false }
      }
      return { event: forcedPool[forcedPool.length - 1], fromSchedule: false }
    }

    // 3. 過濾 + 隨機
    let pool = ALL_EVENTS.filter((e) => {
      if (e.chainOnly) return false
      if (e.requiredDay) return false
      if (e.characters && characterId && !e.characters.includes(characterId)) return false
      if (!matchTime(e)) return false
      if (!matchCondition(e)) return false
      if (seenIds.includes(e.id)) return false
      return true
    })
    if (pool.length === 0) {
      pool = ALL_EVENTS.filter((e) => {
        if (e.chainOnly) return false
        if (e.requiredDay) return false
        if (e.characters && characterId && !e.characters.includes(characterId)) return false
        if (!matchTime(e)) return false
        if (!matchCondition(e)) return false
        return true
      })
    }
    if (pool.length === 0) return { event: null, fromSchedule: false }

    // 專屬事件加權：characters.length === 1 = 純角色專屬 → × 4 倍機率
    // 2-3 個角色限定 → × 2 倍。其他通用 = 原始 weight
    const weightOf = (e: GameEvent) => {
      const base = e.weight ?? 1
      const n = e.characters?.length ?? 0
      if (n === 1) return base * 4
      if (n >= 2 && n <= 3) return base * 2
      return base
    }
    const totalWeight = pool.reduce((sum, e) => sum + weightOf(e), 0)
    if (totalWeight <= 0) return { event: pool[0], fromSchedule: false }
    let roll = Math.random() * totalWeight
    for (const e of pool) {
      roll -= weightOf(e)
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
