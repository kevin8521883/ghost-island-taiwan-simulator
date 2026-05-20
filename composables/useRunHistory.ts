import type { PlayerStats, RunRecord } from '~/types/game'

const STORAGE_KEY = 'ghost-island-runs-v1'
const MAX_RUNS = 100

interface NewRunInput {
  characterId: string
  characterName: string
  endingId: string
  endingTitle: string
  day: number
  finalStats: PlayerStats
}

const loadRuns = (): RunRecord[] => {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (_) {
    return []
  }
}

const persist = (runs: RunRecord[]) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)))
}

export const useRunHistory = () => {
  const runs = useState<RunRecord[]>('run-history', () => loadRuns())

  const refresh = () => {
    runs.value = loadRuns()
  }

  const record = (input: NewRunInput) => {
    const newRun: RunRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      endedAt: Date.now(),
      ...input,
    }
    runs.value = [newRun, ...runs.value].slice(0, MAX_RUNS)
    persist(runs.value)
    return newRun
  }

  const reset = () => {
    runs.value = []
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  const totalRuns = computed(() => runs.value.length)
  const avgDay = computed(() => {
    if (runs.value.length === 0) return 0
    const sum = runs.value.reduce((s, r) => s + r.day, 0)
    return Math.round(sum / runs.value.length * 10) / 10
  })
  const longestDay = computed(() => {
    if (runs.value.length === 0) return 0
    return Math.max(...runs.value.map((r) => r.day))
  })
  const richestRun = computed(() => {
    if (runs.value.length === 0) return null
    return runs.value.reduce((best, r) =>
      r.finalStats.money > best.finalStats.money ? r : best
    )
  })

  /** 各結局拿到次數 */
  const endingCounts = computed(() => {
    const counts: Record<string, number> = {}
    for (const r of runs.value) {
      counts[r.endingId] = (counts[r.endingId] ?? 0) + 1
    }
    return counts
  })

  /** 各角色玩過次數 */
  const charCounts = computed(() => {
    const counts: Record<string, number> = {}
    for (const r of runs.value) {
      counts[r.characterId] = (counts[r.characterId] ?? 0) + 1
    }
    return counts
  })

  return reactive({
    runs,
    totalRuns,
    avgDay,
    longestDay,
    richestRun,
    endingCounts,
    charCounts,
    record,
    refresh,
    reset,
  })
}
