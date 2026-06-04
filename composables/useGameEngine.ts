import charactersData from '~/data/characters.json'
import type { Character, Ending, GameEvent } from '~/types/game'
import { pickReviveMethod, type ReviveMethod } from '~/composables/useRevive'

const CHARACTERS = charactersData as Character[]
const AI_EVENT_DAY = 13

/** advanceDay 的結果：繼續 / 進結局 / 跳出封棺前續命 */
export type AdvanceResult = 'continue' | 'ended' | 'revive-offer'

export const useGameEngine = () => {
  const store = useGameStore()
  const { pickNext } = useEvents()
  const { checkEnding, findEnding } = useEndings()
  const dex = useEndingDex()
  const history = useRunHistory()
  const achievements = useAchievements()
  const analytics = useAnalytics()
  const aiLoading = useState<boolean>('ai-event-loading', () => false)
  const aiError = useState<string>('ai-event-error', () => '')
  /** 封棺前續命：當前要 offer 的續命方式（null = 沒在 offer）*/
  const pendingReviveMethod = useState<ReviveMethod | null>(
    'revive-method',
    () => null
  )

  const startGame = (character: Character, playerName: string | null = null) => {
    store.startNewLife(character, playerName)
    // 注入今日運勢 buff（連抽日曆的反差梗）
    const fortune = useDailyFortune()
    store.addBuff(fortune.todayFortune.buff)
    analytics.track('run_start')
    rollNextEvent()
  }

  const fetchAiEvent = async (): Promise<GameEvent | null> => {
    if (!store.selectedCharacter) return null
    aiLoading.value = true
    aiError.value = ''
    try {
      const cb = store.callbackMoment
      const res = await $fetch<{ event: GameEvent | null; error?: string }>(
        '/api/generate-event',
        {
          method: 'POST',
          body: {
            character: {
              id: store.selectedCharacter.id,
              name: store.displayName,
              description: store.selectedCharacter.description,
            },
            stats: store.stats,
            // 回馬槍：把最有戲的過去選擇整筆塞給 AI，讓它續寫成今天的事件
            callbackMoment: cb
              ? {
                  day: cb.day,
                  eventTitle: cb.eventTitle,
                  choiceText: cb.choiceText,
                  effects: cb.effects,
                }
              : null,
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

  // 把結局正式寫入：圖鑑 / 歷史 / 成就 / endingId
  const commitEnding = (ending: Ending) => {
    const characterId = store.selectedCharacter?.id ?? null
    store.setEnding(ending.id)
    dex.recordUnlock(ending.id, characterId)
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
    achievements.checkEnding(ending.id, characterId, store.stats)
    achievements.checkMeta()
    analytics.track('run_end')
  }

  const advanceDay = async (): Promise<AdvanceResult> => {
    // 結局只在「日期變動」or「stat 死局」時 check；timeOfDay 推進不算結局判定
    const ending = checkEnding(store.stats, store.selectedCharacter?.id ?? null)
    if (ending) {
      // 致命結局 + 本局還沒續過命 → 先攔住、不寫入任何紀錄，offer 封棺前續命
      if (ending.fatal && !store.reviveUsed) {
        store.setPendingDeath(ending.id)
        pendingReviveMethod.value = pickReviveMethod(store.stats)
        return 'revive-offer'
      }
      commitEnding(ending)
      return 'ended'
    }
    store.advanceDay()
    achievements.checkStats(store.stats)
    if (store.stats.day === 15) analytics.track('reach_day15')
    await rollNextEvent()
    return 'continue'
  }

  // 封棺前續命：付代價、脫離致命狀態、接續下一天
  const doRevive = async () => {
    const method = pendingReviveMethod.value
    if (!method) return
    store.applyRevive(method.cost)
    pendingReviveMethod.value = null
    achievements.checkRevive()
    analytics.track('revive_used')
    store.advanceDay()
    if (store.stats.day === 15) analytics.track('reach_day15')
    achievements.checkStats(store.stats)
    await rollNextEvent()
  }

  // 放棄續命：把暫存的致命結局正式寫入、進結局頁
  const acceptFate = () => {
    const id = store.pendingDeathEndingId
    pendingReviveMethod.value = null
    if (!id) return
    const ending = findEnding(id, store.selectedCharacter?.id ?? null)
    if (!ending) return // 防守：找不到結局就不清狀態、不亂跳（理論上不會發生）
    store.clearPendingDeath()
    commitEnding(ending)
  }

  // reload 後若仍卡在續命決定中、依當前 stats 重算 offer
  const restoreReviveOffer = () => {
    if (store.pendingDeathEndingId && !pendingReviveMethod.value) {
      pendingReviveMethod.value = pickReviveMethod(store.stats)
    }
  }

  return {
    characters: CHARACTERS,
    aiLoading,
    aiError,
    pendingReviveMethod,
    startGame,
    rollNextEvent,
    chooseOption,
    advanceDay,
    doRevive,
    acceptFate,
    restoreReviveOffer,
  }
}
