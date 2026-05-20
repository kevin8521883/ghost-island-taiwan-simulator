import { defineStore } from 'pinia'
import type {
  Character,
  EventEffect,
  GameEvent,
  LogEntry,
  PlayerStats,
  StatKey,
} from '~/types/game'

const STORAGE_KEY = 'ghost-island-save-v1'

interface GameState {
  selectedCharacter: Character | null
  stats: PlayerStats
  currentEvent: GameEvent | null
  seenEventIds: string[]
  endingId: string | null
  log: LogEntry[]
}

const emptyStats = (): PlayerStats => ({
  money: 0,
  stress: 0,
  health: 0,
  happiness: 0,
  career: 0,
  reputation: 0,
  day: 1,
})

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    selectedCharacter: null,
    stats: emptyStats(),
    currentEvent: null,
    seenEventIds: [],
    endingId: null,
    log: [],
  }),

  getters: {
    isGameOver: (s) => s.endingId !== null,
  },

  actions: {
    startNewLife(character: Character) {
      this.selectedCharacter = character
      this.stats = {
        money: character.money,
        stress: character.stress,
        health: character.health,
        happiness: character.happiness,
        career: character.career,
        reputation: character.reputation,
        day: 1,
      }
      this.currentEvent = null
      this.seenEventIds = []
      this.endingId = null
      this.log = []
      this.persist()
    },

    setCurrentEvent(event: GameEvent | null) {
      this.currentEvent = event
      this.persist()
    },

    applyChoice(choiceIndex: number) {
      if (!this.currentEvent) return
      const choice = this.currentEvent.choices[choiceIndex]
      if (!choice) return
      const keys = Object.keys(choice.effects) as StatKey[]
      for (const key of keys) {
        const delta = choice.effects[key] ?? 0
        this.stats[key] += delta
      }
      this.log.push({
        day: this.stats.day,
        eventTitle: this.currentEvent.title,
        choiceText: choice.text,
        effects: choice.effects,
      })
      this.seenEventIds.push(this.currentEvent.id)
      this.persist()
    },

    advanceDay() {
      this.stats.day += 1
      this.currentEvent = null
      this.persist()
    },

    setEnding(endingId: string) {
      this.endingId = endingId
      this.persist()
    },

    reset() {
      this.selectedCharacter = null
      this.stats = emptyStats()
      this.currentEvent = null
      this.seenEventIds = []
      this.endingId = null
      this.log = []
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
    },

    persist() {
      if (!import.meta.client) return
      const snapshot = {
        selectedCharacter: this.selectedCharacter,
        stats: this.stats,
        currentEvent: this.currentEvent,
        seenEventIds: this.seenEventIds,
        endingId: this.endingId,
        log: this.log,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    },

    hydrate() {
      if (!import.meta.client) return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        this.selectedCharacter = data.selectedCharacter ?? null
        this.stats = { ...emptyStats(), ...(data.stats ?? {}) }
        this.currentEvent = data.currentEvent ?? null
        this.seenEventIds = data.seenEventIds ?? []
        this.endingId = data.endingId ?? null
        this.log = data.log ?? []
      } catch (_) {
        // ignore corrupted save
      }
    },

    hasSave(): boolean {
      if (!import.meta.client) return false
      return localStorage.getItem(STORAGE_KEY) !== null
    },
  },
})
