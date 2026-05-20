import endingsData from '~/data/endings.json'
import type { Ending, PlayerStats, Range } from '~/types/game'

const ALL_ENDINGS = (endingsData as Ending[])
  .slice()
  .sort((a, b) => b.priority - a.priority)

export const useEndings = () => {
  const matchesRange = (value: number, range: Range): boolean => {
    if (range.lte !== undefined && value > range.lte) return false
    if (range.gte !== undefined && value < range.gte) return false
    return true
  }

  const matches = (stats: PlayerStats, ending: Ending): boolean => {
    const c = ending.condition
    for (const key of Object.keys(c) as (keyof typeof c)[]) {
      const range = c[key]
      if (!range) continue
      const value = stats[key as keyof PlayerStats]
      if (typeof value !== 'number') return false
      if (!matchesRange(value, range)) return false
    }
    return true
  }

  const checkEnding = (stats: PlayerStats): Ending | null => {
    for (const e of ALL_ENDINGS) {
      if (matches(stats, e)) return e
    }
    return null
  }

  const findEnding = (id: string | null): Ending | null => {
    if (!id) return null
    return ALL_ENDINGS.find((e) => e.id === id) ?? null
  }

  return { endings: ALL_ENDINGS, checkEnding, findEnding }
}
