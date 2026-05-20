import eventsData from '~/data/events.json'
import type { GameEvent } from '~/types/game'

const ALL_EVENTS = eventsData as GameEvent[]

export const useEvents = () => {
  const pickNextEvent = (seenIds: string[] = []): GameEvent | null => {
    let pool = ALL_EVENTS.filter((e) => !seenIds.includes(e.id))
    if (pool.length === 0) pool = ALL_EVENTS
    const totalWeight = pool.reduce((sum, e) => sum + (e.weight ?? 1), 0)
    if (totalWeight <= 0) return pool[0] ?? null
    let roll = Math.random() * totalWeight
    for (const e of pool) {
      roll -= e.weight ?? 1
      if (roll <= 0) return e
    }
    return pool[pool.length - 1] ?? null
  }

  return { events: ALL_EVENTS, pickNextEvent }
}
