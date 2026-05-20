import endingsData from '~/data/endings.json'
import charactersData from '~/data/characters.json'
import type { Character, Ending } from '~/types/game'

const STORAGE_KEY = 'ghost-island-dex-v1'

const ALL_ENDINGS = endingsData as Ending[]
const ALL_CHARACTERS = charactersData as Character[]

interface DexData {
  unlocked: string[]
  characters: string[]
}

const loadDex = (): DexData => {
  if (!import.meta.client) return { unlocked: [], characters: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { unlocked: [], characters: [] }
    const data = JSON.parse(raw)
    return {
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      characters: Array.isArray(data.characters) ? data.characters : [],
    }
  } catch (_) {
    return { unlocked: [], characters: [] }
  }
}

const persist = (data: DexData) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useEndingDex = () => {
  const unlocked = useState<string[]>('ending-dex-unlocked', () => loadDex().unlocked)
  const unlockedChars = useState<string[]>(
    'ending-dex-chars',
    () => loadDex().characters
  )

  const refresh = () => {
    const d = loadDex()
    unlocked.value = d.unlocked
    unlockedChars.value = d.characters
  }

  const isUnlocked = (id: string) => unlocked.value.includes(id)

  /** 紀錄解鎖一個結局；若該結局會解鎖角色，連帶處理。回傳是否新解鎖 */
  const recordUnlock = (id: string): { newEnding: boolean; newChar: Character | null } => {
    const newEnding = !unlocked.value.includes(id)
    if (newEnding) {
      unlocked.value = [...unlocked.value, id]
    }

    // 連動：是否有角色需要從這個結局解鎖
    let newChar: Character | null = null
    const charToUnlock = ALL_CHARACTERS.find(
      (c) => c.unlock === `ending:${id}` && !unlockedChars.value.includes(c.id)
    )
    if (charToUnlock) {
      unlockedChars.value = [...unlockedChars.value, charToUnlock.id]
      newChar = charToUnlock
    }

    if (newEnding || newChar) {
      persist({ unlocked: unlocked.value, characters: unlockedChars.value })
    }
    return { newEnding, newChar }
  }

  const unlockCharacter = (charId: string): boolean => {
    if (unlockedChars.value.includes(charId)) return false
    unlockedChars.value = [...unlockedChars.value, charId]
    persist({ unlocked: unlocked.value, characters: unlockedChars.value })
    return true
  }

  const isCharUnlocked = (charId: string) => unlockedChars.value.includes(charId)

  const reset = () => {
    unlocked.value = []
    unlockedChars.value = []
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  const total = computed(() => ALL_ENDINGS.length)
  const unlockedCount = computed(() => unlocked.value.length)
  const progress = computed(() =>
    total.value === 0 ? 0 : Math.round((unlockedCount.value / total.value) * 100)
  )

  const gallery = computed(() => {
    return ALL_ENDINGS.slice()
      .sort((a, b) => b.priority - a.priority)
      .map((e) => ({
        ending: e,
        unlocked: unlocked.value.includes(e.id),
      }))
  })

  const totalChars = computed(() => ALL_CHARACTERS.filter((c) => c.hidden).length)
  const unlockedCharCount = computed(() => unlockedChars.value.length)

  return reactive({
    unlocked,
    unlockedChars,
    total,
    unlockedCount,
    progress,
    gallery,
    totalChars,
    unlockedCharCount,
    isUnlocked,
    isCharUnlocked,
    recordUnlock,
    unlockCharacter,
    refresh,
    reset,
  })
}
