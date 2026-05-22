import endingsData from '~/data/endings.json'
import type { Ending, PlayerStats, Range } from '~/types/game'

const ALL_ENDINGS = (endingsData as Ending[])
  .slice()
  .sort((a, b) => b.priority - a.priority)

const applyVariant = (ending: Ending, characterId: string | null): Ending => {
  if (!characterId) return ending
  const v = ending.variants?.[characterId]
  if (!v) return ending
  return {
    ...ending,
    title: v.title ?? ending.title,
    description: v.description ?? ending.description,
  }
}

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

  const checkEnding = (
    stats: PlayerStats,
    characterId: string | null = null
  ): Ending | null => {
    for (const e of ALL_ENDINGS) {
      if (matches(stats, e)) return applyVariant(e, characterId)
    }
    return null
  }

  const findEnding = (
    id: string | null,
    characterId: string | null = null
  ): Ending | null => {
    if (!id) return null
    const e = ALL_ENDINGS.find((x) => x.id === id) ?? null
    return e ? applyVariant(e, characterId) : null
  }

  return { endings: ALL_ENDINGS, checkEnding, findEnding }
}
