import charactersData from '~/data/characters.json'
import type { Character } from '~/types/game'

const CHARACTERS = charactersData as Character[]

export const useGameEngine = () => {
  const store = useGameStore()
  const { pickNext } = useEvents()
  const { checkEnding, findEnding } = useEndings()
  const dex = useEndingDex()
  const history = useRunHistory()

  const startGame = (character: Character) => {
    store.startNewLife(character)
    rollNextEvent()
  }

  const rollNextEvent = () => {
    const { event, fromSchedule } = pickNext({
      seenIds: store.seenEventIds,
      scheduled: store.scheduledEvents,
      currentDay: store.stats.day,
      characterId: store.selectedCharacter?.id ?? null,
    })
    if (fromSchedule && event) {
      store.consumeScheduledEvent(event.id)
    }
    store.setCurrentEvent(event)
  }

  const chooseOption = (index: number) => {
    store.applyChoice(index)
  }

  const advanceDay = (): boolean => {
    const ending = checkEnding(store.stats)
    if (ending) {
      store.setEnding(ending.id)
      // recordUnlock 會自動連動角色解鎖
      dex.recordUnlock(ending.id)
      // 記錄這一輪到歷史
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
      return true
    }
    store.advanceDay()
    rollNextEvent()
    return false
  }

  return {
    characters: CHARACTERS,
    startGame,
    rollNextEvent,
    chooseOption,
    advanceDay,
  }
}
