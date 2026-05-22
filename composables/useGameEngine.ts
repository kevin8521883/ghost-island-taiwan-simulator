import charactersData from '~/data/characters.json'
import type { Character, GameEvent } from '~/types/game'

const CHARACTERS = charactersData as Character[]
const AI_EVENT_DAY = 13

export const useGameEngine = () => {
  const store = useGameStore()
  const { pickNext } = useEvents()
  const { checkEnding, findEnding } = useEndings()
  const dex = useEndingDex()
  const history = useRunHistory()
  const achievements = useAchievements()
  const aiLoading = useState<boolean>('ai-event-loading', () => false)
  const aiError = useState<string>('ai-event-error', () => '')

  const startGame = (character: Character) => {
    store.startNewLife(character)
    rollNextEvent()
  }

  const fetchAiEvent = async (): Promise<GameEvent | null> => {
    if (!store.selectedCharacter) return null
    aiLoading.value = true
    aiError.value = ''
    try {
      const res = await $fetch<{ event: GameEvent | null; error?: string }>(
        '/api/generate-event',
        {
          method: 'POST',
          body: {
            character: {
              id: store.selectedCharacter.id,
              name: store.selectedCharacter.name,
              description: store.selectedCharacter.description,
            },
            stats: store.stats,
            lastEventTitles: store.log.slice(-3).map((l) => l.eventTitle),
          },
        }
      )
      if (res.error) aiError.value = res.error
      return res.event ?? null
    } catch (e) {
      aiError.value = e instanceof Error ? e.message : String(e)
      return null
    } finally {
      aiLoading.value = false
    }
  }

  const rollNextEvent = async () => {
    // 特殊：day 13 觸發一次 AI 即興事件
    if (
      store.stats.day === AI_EVENT_DAY &&
      !store.aiEventTriggered &&
      store.selectedCharacter
    ) {
      store.markAiEventTriggered()
      store.setCurrentEvent(null)
      const aiEvent = await fetchAiEvent()
      if (aiEvent) {
        store.setCurrentEvent(aiEvent)
        achievements.checkAiEvent()
        return
      }
      // AI 失敗，silently fallback 走一般池
    }

    const { event, fromSchedule } = pickNext({
      seenIds: store.seenEventIds,
      scheduled: store.scheduledEvents,
      currentDay: store.stats.day,
      characterId: store.selectedCharacter?.id ?? null,
      stats: store.stats,
      // timeOfDay 暫不傳 → pickNext 不過濾、所有事件隨機抽
    })
    if (fromSchedule && event) {
      store.consumeScheduledEvent(event.id)
    }
    store.setCurrentEvent(event)
  }

  const chooseOption = (index: number) => {
    const choice = store.currentEvent?.choices[index]
    const eventId = store.currentEvent?.id ?? null
    store.applyChoice(index)
    // 成就 check：選擇文本 / 事件看過 / stat 達標
    if (choice) achievements.checkChoiceText(choice.text)
    if (eventId) achievements.checkEventSeen(eventId)
    achievements.checkStats(store.stats)
  }

  const advanceDay = async (): Promise<boolean> => {
    // 結局只在「日期變動」or「stat 死局」時 check；timeOfDay 推進不算結局判定
    const ending = checkEnding(store.stats, store.selectedCharacter?.id ?? null)
    if (ending) {
      store.setEnding(ending.id)
      dex.recordUnlock(ending.id, store.selectedCharacter?.id ?? null)
      if (store.selectedCharacter) {
        history.record({
          characterId: store.selectedCharacter.id,
          characterName: store.selectedCharacter.name,
          endingId: ending.id,
          endingTitle: ending.title,
          day: store.stats.day,
          finalStats: { ...store.stats },
        })
      }
      achievements.checkEnding(
        ending.id,
        store.selectedCharacter?.id ?? null,
        store.stats
      )
      achievements.checkMeta()
      return true
    }
    store.advanceDay()
    achievements.checkStats(store.stats)
    await rollNextEvent()
    return false
  }

  return {
    characters: CHARACTERS,
    aiLoading,
    aiError,
    startGame,
    rollNextEvent,
    chooseOption,
    advanceDay,
  }
}
