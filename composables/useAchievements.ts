import achievementsData from '~/data/achievements.json'
import endingsData from '~/data/endings.json'
import charactersData from '~/data/characters.json'
import type {
  Achievement,
  Character,
  Ending,
  PlayerStats,
} from '~/types/game'

const STORAGE_KEY = 'ghost-island-achievements-v1'
const RUNS_KEY = 'ghost-island-runs-v1' // 既有 run history
const DEX_KEY = 'ghost-island-dex-v1'

const ALL_ACHIEVEMENTS = achievementsData as Achievement[]
const ALL_ENDINGS = endingsData as Ending[]
const ALL_CHARACTERS = charactersData as Character[]

interface AchData {
  unlocked: string[]
  /** 內部計數器：選擇符合 matches 的累計次數，用 trigger.id 當 key */
  counters: Record<string, number>
  /** 內部 set：碰過哪些選項文字、用於去重避免單一選擇重複算 */
  seenChoiceKeys: string[]
}

const loadAch = (): AchData => {
  if (!import.meta.client) return { unlocked: [], counters: {}, seenChoiceKeys: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { unlocked: [], counters: {}, seenChoiceKeys: [] }
    const data = JSON.parse(raw)
    return {
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      counters: typeof data.counters === 'object' && data.counters ? data.counters : {},
      seenChoiceKeys: Array.isArray(data.seenChoiceKeys) ? data.seenChoiceKeys : [],
    }
  } catch (_) {
    return { unlocked: [], counters: {}, seenChoiceKeys: [] }
  }
}

const persist = (d: AchData) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

export const useAchievements = () => {
  const unlocked = useState<string[]>('ach-unlocked', () => loadAch().unlocked)
  const counters = useState<Record<string, number>>('ach-counters', () => loadAch().counters)
  const seenChoiceKeys = useState<string[]>('ach-seen-choices', () => loadAch().seenChoiceKeys)
  /** 剛解鎖、用於 toast。佇列。 */
  const justUnlocked = useState<Achievement[]>('ach-just-unlocked', () => [])

  const refresh = () => {
    const d = loadAch()
    unlocked.value = d.unlocked
    counters.value = d.counters
    seenChoiceKeys.value = d.seenChoiceKeys
  }

  const save = () => {
    persist({
      unlocked: unlocked.value,
      counters: counters.value,
      seenChoiceKeys: seenChoiceKeys.value,
    })
  }

  const tryUnlock = (id: string) => {
    if (unlocked.value.includes(id)) return false
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === id)
    if (!ach) return false
    unlocked.value = [...unlocked.value, id]
    justUnlocked.value = [...justUnlocked.value, ach]
    save()
    return true
  }

  const consumeJustUnlocked = () => {
    const next = justUnlocked.value[0]
    if (next) {
      justUnlocked.value = justUnlocked.value.slice(1)
    }
    return next ?? null
  }

  // ─── 各種觸發類型的檢查 ───────────────────────────────────────────

  const checkStats = (stats: PlayerStats) => {
    for (const ach of ALL_ACHIEVEMENTS) {
      if (ach.trigger.type !== 'stat') continue
      const key = ach.trigger.key as keyof PlayerStats
      const v = stats[key]
      if (typeof v !== 'number') continue
      if (ach.trigger.gte !== undefined && v < ach.trigger.gte) continue
      if (ach.trigger.lte !== undefined && v > ach.trigger.lte) continue
      tryUnlock(ach.id)
    }
  }

  const checkEventSeen = (eventId: string) => {
    for (const ach of ALL_ACHIEVEMENTS) {
      if (ach.trigger.type !== 'event_seen') continue
      if (ach.trigger.eventIds?.includes(eventId)) tryUnlock(ach.id)
    }
  }

  const checkAiEvent = () => {
    for (const ach of ALL_ACHIEVEMENTS) {
      if (ach.trigger.type === 'ai_event') tryUnlock(ach.id)
    }
  }

  const checkStreak = (streak: number) => {
    for (const ach of ALL_ACHIEVEMENTS) {
      if (ach.trigger.type !== 'streak') continue
      if (streak >= (ach.trigger.count ?? 999)) tryUnlock(ach.id)
    }
  }

  const checkChoiceText = (text: string) => {
    for (const ach of ALL_ACHIEVEMENTS) {
      if (ach.trigger.type !== 'choice_count') continue
      const matches = ach.trigger.matches ?? []
      const target = ach.trigger.count ?? 1
      const hit = matches.some((m) => text.includes(m))
      if (!hit) return
      const choiceKey = `${ach.id}::${text}`
      if (seenChoiceKeys.value.includes(choiceKey)) continue // 同事件選項只算 1 次
      seenChoiceKeys.value = [...seenChoiceKeys.value, choiceKey]
      counters.value = {
        ...counters.value,
        [ach.id]: (counters.value[ach.id] ?? 0) + 1,
      }
      save()
      if ((counters.value[ach.id] ?? 0) >= target) tryUnlock(ach.id)
    }
  }

  const checkEnding = (
    endingId: string,
    characterId: string | null,
    stats: PlayerStats
  ) => {
    void stats
    const ending = ALL_ENDINGS.find((e) => e.id === endingId)

    for (const ach of ALL_ACHIEVEMENTS) {
      const t = ach.trigger
      if (t.type === 'ending') {
        if (t.endingIds?.includes(endingId)) tryUnlock(ach.id)
      } else if (t.type === 'ending_with_char') {
        if (t.endingId === endingId && t.characterId === characterId) tryUnlock(ach.id)
      } else if (t.type === 'ending_with_char_mood') {
        if (t.characterId === characterId && ending?.mood === t.mood) tryUnlock(ach.id)
      }
    }
  }

  const checkMeta = () => {
    // 讀取 dex 資料來判斷 endings collected / hidden chars unlocked
    if (!import.meta.client) return
    let dexUnlocked: string[] = []
    let dexChars: string[] = []
    try {
      const raw = localStorage.getItem(DEX_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (Array.isArray(d.unlocked)) dexUnlocked = d.unlocked
        if (Array.isArray(d.characters)) dexChars = d.characters
      }
    } catch (_) {}

    let totalRuns = 0
    try {
      const raw = localStorage.getItem(RUNS_KEY)
      if (raw) {
        const r = JSON.parse(raw)
        if (Array.isArray(r)) totalRuns = r.length
      }
    } catch (_) {}

    for (const ach of ALL_ACHIEVEMENTS) {
      const t = ach.trigger
      if (t.type === 'all_endings') {
        if (dexUnlocked.length >= ALL_ENDINGS.length) tryUnlock(ach.id)
      } else if (t.type === 'meta_endings_all') {
        const ids = t.endingIds ?? []
        if (ids.every((id) => dexUnlocked.includes(id))) tryUnlock(ach.id)
      } else if (t.type === 'hidden_chars_count') {
        if (dexChars.length >= (t.count ?? 999)) tryUnlock(ach.id)
      } else if (t.type === 'total_runs') {
        if (totalRuns >= (t.count ?? 999)) tryUnlock(ach.id)
      }
    }
  }

  const reset = () => {
    unlocked.value = []
    counters.value = {}
    seenChoiceKeys.value = []
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  const gallery = computed(() =>
    ALL_ACHIEVEMENTS.map((a) => ({
      ach: a,
      unlocked: unlocked.value.includes(a.id),
    }))
  )

  const unlockedCount = computed(() => unlocked.value.length)
  const total = computed(() => ALL_ACHIEVEMENTS.length)
  const progress = computed(() =>
    total.value === 0 ? 0 : Math.round((unlockedCount.value / total.value) * 100)
  )

  return reactive({
    unlocked,
    justUnlocked,
    unlockedCount,
    total,
    progress,
    gallery,
    refresh,
    tryUnlock,
    consumeJustUnlocked,
    checkStats,
    checkEventSeen,
    checkAiEvent,
    checkStreak,
    checkChoiceText,
    checkEnding,
    checkMeta,
    reset,
  })
}
