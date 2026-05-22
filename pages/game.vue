<script setup lang="ts">
import type { ChoiceCondition, EventEffect, PlayerStats, Range } from '~/types/game'

const store = useGameStore()
const { rollNextEvent, chooseOption, advanceDay, aiLoading } = useGameEngine()

const lastEffects = ref<EventEffect | null>(null)
const lastChoiceText = ref('')
const showOutcome = ref(false)

const matchesRange = (value: number, range: Range): boolean => {
  if (range.gte !== undefined && value < range.gte) return false
  if (range.lte !== undefined && value > range.lte) return false
  return true
}

const meetsCondition = (
  cond: ChoiceCondition | undefined,
  stats: PlayerStats
): boolean => {
  if (!cond) return true
  for (const key of Object.keys(cond) as (keyof ChoiceCondition)[]) {
    const range = cond[key]
    if (!range) continue
    const value = stats[key as keyof PlayerStats]
    if (typeof value !== 'number') return false
    if (!matchesRange(value, range)) return false
  }
  return true
}

const visibleChoices = computed(() => {
  if (!store.currentEvent) return []
  return store.currentEvent.choices
    .map((choice, originalIdx) => ({ choice, originalIdx }))
    .filter(({ choice }) => meetsCondition(choice.condition, store.stats))
})

onMounted(async () => {
  store.hydrate()
  if (!store.selectedCharacter) {
    navigateTo('/character')
    return
  }
  if (store.endingId) {
    navigateTo('/ending')
    return
  }
  if (!store.currentEvent) {
    await rollNextEvent()
  }
})

const handleChoice = (index: number) => {
  const choice = store.currentEvent?.choices[index]
  if (!choice) return
  lastChoiceText.value = choice.text
  lastEffects.value = { ...choice.effects }
  chooseOption(index)
  showOutcome.value = true
}

const quitRun = () => {
  if (!confirm('確定要結束本局重來嗎？目前的存檔會消失。')) return
  store.reset()
  navigateTo('/character')
}

const nextDay = async () => {
  showOutcome.value = false
  lastEffects.value = null
  const ended = await advanceDay()
  if (ended) navigateTo('/ending')
}

const statLabel: Record<string, string> = {
  money: '💰 金錢',
  stress: '🔥 壓力',
  health: '❤️ 健康',
  happiness: '😊 快樂',
  career: '📈 職涯',
  reputation: '👥 評價',
  boss: '👔 主管關係',
  coworker: '🧑‍🤝‍🧑 同事關係',
  family: '🏠 家人關係',
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-4 pb-4 max-w-md mx-auto space-y-4">
    <GameStatusBar :stats="store.stats" :character="store.selectedCharacter" />

    <template v-if="aiLoading">
      <div class="ai-loading-card pixel-card space-y-3 text-center py-8">
        <p class="text-xs text-purple-300 tracking-widest">⚡ AI 命運降臨</p>
        <p class="text-base text-paper">命運在凝視你…</p>
        <div class="flex justify-center gap-2 pt-2">
          <span class="ai-dot ai-dot-1">●</span>
          <span class="ai-dot ai-dot-2">●</span>
          <span class="ai-dot ai-dot-3">●</span>
        </div>
        <p class="text-[10px] text-muted pt-2">命運生成中、預計 2-3 秒</p>
      </div>
    </template>

    <template v-else-if="!showOutcome && store.currentEvent">
      <div :key="store.currentEvent.id" class="event-enter space-y-4">
        <EventCard :event="store.currentEvent" />
        <div class="space-y-2 pt-2">
          <ChoiceButton
            v-for="{ choice, originalIdx } in visibleChoices"
            :key="originalIdx"
            :choice="choice"
            :index="originalIdx"
            @select="handleChoice"
          />
        </div>
      </div>
    </template>

    <template v-else-if="showOutcome && lastEffects">
      <div class="pixel-card space-y-3 event-enter">
        <p class="text-xs text-muted">你選擇了</p>
        <p class="text-sm text-amber-400">{{ lastChoiceText }}</p>
        <hr class="border-[#333]" />
        <h3 class="text-xs text-paper">結果</h3>
        <ul class="text-xs space-y-1">
          <li
            v-for="(value, key, idx) in lastEffects"
            :key="key"
            class="flex justify-between stat-effect-row"
            :style="{ animationDelay: idx * 0.08 + 's' }"
          >
            <span>{{ statLabel[key] ?? key }}</span>
            <span
              :class="
                value > 0
                  ? 'text-green-400'
                  : value < 0
                  ? 'text-red-400'
                  : 'text-muted'
              "
            >
              {{ value > 0 ? '+' : '' }}{{ value }}
            </span>
          </li>
          <li
            v-if="Object.keys(lastEffects).length === 0"
            class="text-muted"
          >
            （人生沒什麼變化）
          </li>
        </ul>
      </div>
      <PixelButton variant="primary" @click="nextDay">下一天 →</PixelButton>
    </template>

    <div class="pt-6 text-center">
      <button
        type="button"
        class="text-[11px] text-muted underline opacity-70 hover:opacity-100"
        @click="quitRun"
      >
        結束本局重來
      </button>
    </div>
  </div>
</template>
