/**
 * 全球結局統計 client hook
 *
 * - submit: 上報一次結局（localStorage dedupe、同一結局 24h 內只報一次）
 * - fetchAll: 抓全球統計
 */
interface AllStatsResponse {
  totalRuns: number
  byEnding: Record<string, number>
  storage: 'redis' | 'memory'
}

const DEDUPE_KEY = 'ghost-island-stats-submitted-v1'
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000

interface DedupeEntry {
  endingId: string
  ts: number
}

const loadDedupe = (): DedupeEntry[] => {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(DEDUPE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as DedupeEntry[]
    const cutoff = Date.now() - DEDUPE_WINDOW_MS
    return arr.filter((e) => e.ts > cutoff)
  } catch {
    return []
  }
}

const saveDedupe = (entries: DedupeEntry[]) => {
  if (!import.meta.client) return
  localStorage.setItem(DEDUPE_KEY, JSON.stringify(entries))
}

export const useEndingStats = () => {
  const stats = useState<AllStatsResponse | null>('ending-stats', () => null)
  const loading = useState<boolean>('ending-stats-loading', () => false)

  const fetchAll = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const res = await $fetch<AllStatsResponse>('/api/ending-stats/all')
      stats.value = res
    } catch (e) {
      console.warn('[stats] fetch failed', e)
    } finally {
      loading.value = false
    }
  }

  const submit = async (endingId: string, characterId: string | null) => {
    if (!import.meta.client) return
    const dedupe = loadDedupe()
    if (dedupe.find((e) => e.endingId === endingId)) return
    try {
      await $fetch('/api/ending-stats/submit', {
        method: 'POST',
        body: { endingId, characterId },
      })
      dedupe.push({ endingId, ts: Date.now() })
      saveDedupe(dedupe)
    } catch (e) {
      console.warn('[stats] submit failed', e)
    }
  }

  const percentageFor = (endingId: string): number => {
    if (!stats.value || stats.value.totalRuns === 0) return 0
    const count = stats.value.byEnding[endingId] ?? 0
    return Math.round((count / stats.value.totalRuns) * 100)
  }

  const countFor = (endingId: string): number =>
    stats.value?.byEnding[endingId] ?? 0

  return {
    stats,
    loading,
    fetchAll,
    submit,
    percentageFor,
    countFor,
  }
}
