import { defineStore } from 'pinia'
import type {
  Character,
  EventEffect,
  GameEvent,
  LogEntry,
  PlayerStats,
  ScheduledEvent,
  StatKey,
} from '~/types/game'

const STORAGE_KEY = 'ghost-island-save-v1'

interface GameState {
  selectedCharacter: Character | null
  stats: PlayerStats
  currentEvent: GameEvent | null
  seenEventIds: string[]
  scheduledEvents: ScheduledEvent[]
  endingId: string | null
  log: LogEntry[]
  aiEventTriggered: boolean
  endingNarrative: string | null
}

const emptyStats = (): PlayerStats => ({
  money: 0,
  stress: 0,
  health: 0,
  happiness: 0,
  career: 0,
  reputation: 0,
  day: 1,
  timeOfDay: 'morning',
  boss: 50,
  coworker: 50,
  family: 50,
})

const SLOT_ORDER: ('morning' | 'noon' | 'evening')[] = ['morning', 'noon', 'evening']

const clampRelation = (v: number) => Math.max(0, Math.min(100, v))

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    selectedCharacter: null,
    stats: emptyStats(),
    currentEvent: null,
    seenEventIds: [],
    scheduledEvents: [],
    endingId: null,
    log: [],
    aiEventTriggered: false,
    endingNarrative: null,
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
        timeOfDay: 'morning',
        boss: 50,
        coworker: 50,
        family: 50,
      }
      this.currentEvent = null
      this.seenEventIds = []
      this.scheduledEvents = []
      this.endingId = null
      this.log = []
      this.aiEventTriggered = false
      this.endingNarrative = null
      this.persist()
    },

    markAiEventTriggered() {
      this.aiEventTriggered = true
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
      const relationKeys: StatKey[] = ['boss', 'coworker', 'family']
      for (const key of keys) {
        const delta = choice.effects[key] ?? 0
        this.stats[key] += delta
        if (relationKeys.includes(key)) {
          this.stats[key] = clampRelation(this.stats[key])
        }
      }
      this.log.push({
        day: this.stats.day,
        eventTitle: this.currentEvent.title,
        choiceText: choice.text,
        effects: choice.effects,
      })
      this.seenEventIds.push(this.currentEvent.id)
      if (choice.trigger) {
        let triggerEventId: string | undefined
        if (choice.trigger.outcomes && choice.trigger.outcomes.length > 0) {
          const totalW = choice.trigger.outcomes.reduce(
            (s, o) => s + (o.weight ?? 1),
            0
          )
          let r = Math.random() * totalW
          for (const o of choice.trigger.outcomes) {
            r -= o.weight ?? 1
            if (r <= 0) {
              triggerEventId = o.eventId
              break
            }
          }
          if (!triggerEventId) {
            triggerEventId =
              choice.trigger.outcomes[choice.trigger.outcomes.length - 1].eventId
          }
        } else if (choice.trigger.eventId) {
          triggerEventId = choice.trigger.eventId
        }
        if (triggerEventId) {
          this.scheduledEvents.push({
            eventId: triggerEventId,
            triggerDay: this.stats.day + choice.trigger.afterDays,
          })
        }
      }
      this.persist()
    },

    consumeScheduledEvent(eventId: string) {
      this.scheduledEvents = this.scheduledEvents.filter(
        (s) => s.eventId !== eventId
      )
      this.persist()
    },

    advanceDay() {
      this.stats.day += 1
      this.stats.timeOfDay = 'morning'
      this.currentEvent = null
      this.persist()
    },

    /**
     * 推進到下一個時段、超過 evening 就跨日。
     * 回傳 true 表示日期跨了一天（外部可在此 check ending）。
     */
    advanceSlot(): boolean {
      const idx = SLOT_ORDER.indexOf(this.stats.timeOfDay)
      if (idx < SLOT_ORDER.length - 1) {
        this.stats.timeOfDay = SLOT_ORDER[idx + 1]
        this.currentEvent = null
        this.persist()
        return false
      }
      // evening → next day morning
      this.stats.day += 1
      this.stats.timeOfDay = 'morning'
      this.currentEvent = null
      this.persist()
      return true
    },

    setEnding(endingId: string) {
      this.endingId = endingId
      this.persist()
    },

    setEndingNarrative(narrative: string | null) {
      this.endingNarrative = narrative
      this.persist()
    },

    reset() {
      this.selectedCharacter = null
      this.stats = emptyStats()
      this.currentEvent = null
      this.seenEventIds = []
      this.scheduledEvents = []
      this.endingId = null
      this.log = []
      this.aiEventTriggered = false
      this.endingNarrative = null
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
    },

    persist() {
      if (!import.meta.client) return
      const snapshot = {
        selectedCharacter: this.selectedCharacter,
        stats: this.stats,
        currentEvent: this.currentEvent,
        seenEventIds: this.seenEventIds,
        scheduledEvents: this.scheduledEvents,
        endingId: this.endingId,
        log: this.log,
        aiEventTriggered: this.aiEventTriggered,
        endingNarrative: this.endingNarrative,
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
        const base = emptyStats()
        // 舊存檔沒有 boss/coworker/family，用預設 50 補
        this.stats = { ...base, ...(data.stats ?? {}) }
        this.currentEvent = data.currentEvent ?? null
        this.seenEventIds = data.seenEventIds ?? []
        this.scheduledEvents = data.scheduledEvents ?? []
        this.endingId = data.endingId ?? null
        this.log = data.log ?? []
        this.aiEventTriggered = data.aiEventTriggered ?? false
        this.endingNarrative = data.endingNarrative ?? null
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
