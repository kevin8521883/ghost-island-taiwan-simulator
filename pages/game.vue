<script setup lang="ts">
import type { EventEffect } from '~/types/game'

const store = useGameStore()
const { rollNextEvent, chooseOption, advanceDay } = useGameEngine()

const lastEffects = ref<EventEffect | null>(null)
const lastChoiceText = ref('')
const showOutcome = ref(false)

onMounted(() => {
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
    rollNextEvent()
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

const nextDay = () => {
  showOutcome.value = false
  lastEffects.value = null
  const ended = advanceDay()
  if (ended) navigateTo('/ending')
}

const statLabel: Record<string, string> = {
  money: '💰 金錢',
  stress: '🔥 壓力',
  health: '❤️ 健康',
  happiness: '😊 快樂',
  career: '📈 職涯',
  reputation: '👥 評價',
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-4 pb-4 max-w-md mx-auto space-y-4">
    <GameStatusBar :stats="store.stats" :character="store.selectedCharacter" />

    <template v-if="!showOutcome && store.currentEvent">
      <div :key="store.currentEvent.id" class="event-enter space-y-4">
        <EventCard :event="store.currentEvent" />
        <div class="space-y-2 pt-2">
          <ChoiceButton
            v-for="(choice, idx) in store.currentEvent.choices"
            :key="idx"
            :choice="choice"
            :index="idx"
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
