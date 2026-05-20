import endingsData from '~/data/endings.json'
import type { Ending } from '~/types/game'

const STORAGE_KEY = 'ghost-island-dex-v1'

const ALL = endingsData as Ending[]

const loadUnlocked = (): string[] => {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data.unlocked) ? data.unlocked : []
  } catch (_) {
    return []
  }
}

const persist = (unlocked: string[]) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked }))
}

export const useEndingDex = () => {
  const unlocked = useState<string[]>('ending-dex-unlocked', () => loadUnlocked())

  const refresh = () => {
    unlocked.value = loadUnlocked()
  }

  const isUnlocked = (id: string) => unlocked.value.includes(id)

  /** 紀錄解鎖一個結局，回傳是否為「新解鎖」（之前沒有過） */
  const recordUnlock = (id: string): boolean => {
    if (unlocked.value.includes(id)) return false
    unlocked.value = [...unlocked.value, id]
    persist(unlocked.value)
    return true
  }

  const reset = () => {
    unlocked.value = []
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  const total = computed(() => ALL.length)
  const unlockedCount = computed(() => unlocked.value.length)
  const progress = computed(() =>
    total.value === 0 ? 0 : Math.round((unlockedCount.value / total.value) * 100)
  )

  /** 圖鑑用：每個結局加上 unlocked 標記。順序依 priority 高至低 */
  const gallery = computed(() => {
    return ALL.slice()
      .sort((a, b) => b.priority - a.priority)
      .map((e) => ({
        ending: e,
        unlocked: unlocked.value.includes(e.id),
      }))
  })

  return reactive({
    unlocked,
    total,
    unlockedCount,
    progress,
    gallery,
    isUnlocked,
    recordUnlock,
    refresh,
    reset,
  })
}
