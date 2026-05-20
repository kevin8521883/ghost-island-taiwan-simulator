import charactersData from '~/data/characters.json'
import type { Character } from '~/types/game'

const CHARACTERS = charactersData as Character[]

export const useGameEngine = () => {
  const store = useGameStore()
  const { pickNextEvent } = useEvents()
  const { checkEnding } = useEndings()

  const startGame = (character: Character) => {
    store.startNewLife(character)
    rollNextEvent()
  }

  const rollNextEvent = () => {
    const event = pickNextEvent(store.seenEventIds)
    store.setCurrentEvent(event)
  }

  const chooseOption = (index: number) => {
    store.applyChoice(index)
  }

  const advanceDay = (): boolean => {
    const ending = checkEnding(store.stats)
    if (ending) {
      store.setEnding(ending.id)
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
