import endingsData from '~/data/endings.json'
import charactersData from '~/data/characters.json'
import type { Character, Ending } from '~/types/game'

const STORAGE_KEY = 'ghost-island-dex-v1'

const ALL_ENDINGS = endingsData as Ending[]
const ALL_CHARACTERS = charactersData as Character[]

interface DexData {
  unlocked: string[]
  characters: string[]
  /** 哪些角色解鎖過哪些結局：{ [endingId]: characterId[] } */
  unlockedByChar: Record<string, string[]>
}

const loadDex = (): DexData => {
  if (!import.meta.client) return { unlocked: [], characters: [], unlockedByChar: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { unlocked: [], characters: [], unlockedByChar: {} }
    const data = JSON.parse(raw)
    const ubc =
      data.unlockedByChar && typeof data.unlockedByChar === 'object'
        ? (data.unlockedByChar as Record<string, string[]>)
        : {}
    return {
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      characters: Array.isArray(data.characters) ? data.characters : [],
      unlockedByChar: ubc,
    }
  } catch (_) {
    return { unlocked: [], characters: [], unlockedByChar: {} }
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
  const unlockedByChar = useState<Record<string, string[]>>(
    'ending-dex-by-char',
    () => loadDex().unlockedByChar
  )

  const refresh = () => {
    const d = loadDex()
    unlocked.value = d.unlocked
    unlockedChars.value = d.characters
    unlockedByChar.value = d.unlockedByChar
  }

  const isUnlocked = (id: string) => unlocked.value.includes(id)

  /** 紀錄解鎖一個結局；若該結局會解鎖角色，連帶處理。回傳是否新解鎖 */
  const recordUnlock = (
    id: string,
    characterId: string | null = null
  ): { newEnding: boolean; newChar: Character | null } => {
    const newEnding = !unlocked.value.includes(id)
    if (newEnding) {
      unlocked.value = [...unlocked.value, id]
    }

    // 紀錄角色 × 結局
    if (characterId) {
      const existing = unlockedByChar.value[id] ?? []
      if (!existing.includes(characterId)) {
        unlockedByChar.value = {
          ...unlockedByChar.value,
          [id]: [...existing, characterId],
        }
      }
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

    persist({
      unlocked: unlocked.value,
      characters: unlockedChars.value,
      unlockedByChar: unlockedByChar.value,
    })
    return { newEnding, newChar }
  }

  const unlockCharacter = (charId: string): boolean => {
    if (unlockedChars.value.includes(charId)) return false
    unlockedChars.value = [...unlockedChars.value, charId]
    persist({
      unlocked: unlocked.value,
      characters: unlockedChars.value,
      unlockedByChar: unlockedByChar.value,
    })
    return true
  }

  const isCharUnlocked = (charId: string) => unlockedChars.value.includes(charId)

  const reset = () => {
    unlocked.value = []
    unlockedChars.value = []
    unlockedByChar.value = {}
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
      .map((e) => {
        const charIds = unlockedByChar.value[e.id] ?? []
        const variants = charIds
          .map((cid) => {
            const char = ALL_CHARACTERS.find((c) => c.id === cid)
            if (!char) return null
            const v = e.variants?.[cid]
            return {
              characterId: cid,
              characterName: char.name,
              variantTitle: v?.title ?? e.title,
              variantDescription: v?.description ?? e.description,
            }
          })
          .filter(
            (x): x is {
              characterId: string
              characterName: string
              variantTitle: string
              variantDescription: string
            } => x !== null
          )
        return {
          ending: e,
          unlocked: unlocked.value.includes(e.id),
          variants,
        }
      })
  })

  const totalChars = computed(() => ALL_CHARACTERS.filter((c) => c.hidden).length)
  const unlockedCharCount = computed(() => unlockedChars.value.length)

  return reactive({
    unlocked,
    unlockedChars,
    unlockedByChar,
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
