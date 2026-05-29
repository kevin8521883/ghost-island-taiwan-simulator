<script setup lang="ts">
import type { ChoiceCondition, EventEffect, PlayerStats, Range } from '~/types/game'
import { sceneFromEvent, outcomeScene, type SceneType } from '~/composables/useEventScene'

const store = useGameStore()
const { rollNextEvent, chooseOption, advanceDay, aiLoading } = useGameEngine()
const coinBurst = useCoinBurst()

// 事件動畫場景：預設跟著 currentEvent 走、選擇後若有大金額/開心瞬間切到對應結算場景
const overrideScene = ref<SceneType | null>(null)
const currentScene = computed<SceneType>(
  () => overrideScene.value ?? sceneFromEvent(store.currentEvent)
)

const lastEffects = ref<EventEffect | null>(null)
const lastChoiceText = ref('')
const showOutcome = ref(false)
const portraitReactKey = ref(0)

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
  portraitReactKey.value++

  // 金錢正增益 → 飛硬幣到 GameStatusBar 的金錢欄位
  const moneyGain = choice.effects.money ?? 0
  if (moneyGain > 0) {
    nextTick(() => {
      // 用 outcome 卡中央當起點
      const w = window.innerWidth
      const h = window.innerHeight
      coinBurst.fire({
        amount: Math.min(4 + Math.floor(moneyGain / 50), 12),
        sourceX: w / 2,
        sourceY: h / 2 + 20,
        targetSelector: '[data-stat-money]',
      })
    })
  }

  // 切到對應結算場景 1.6s 後還原
  const oScene = outcomeScene(choice.effects as Record<string, number>)
  if (oScene) {
    overrideScene.value = oScene
    setTimeout(() => {
      overrideScene.value = null
    }, 1600)
  }
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

// 對玩家是好還是壞？stress 是反向（增加 = 壞）、其他正向（增加 = 好）
const isBeneficial = (key: string, value: number): boolean => {
  if (value === 0) return false
  if (key === 'stress') return value < 0
  return value > 0
}
const isHarmful = (key: string, value: number): boolean => {
  if (value === 0) return false
  if (key === 'stress') return value > 0
  return value < 0
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-4 pb-4 max-w-md mx-auto space-y-4">
    <GameStatusBar
      :stats="store.stats"
      :character="store.selectedCharacter"
      :react-key="portraitReactKey"
    />
    <EventScreen
      :scene="currentScene"
      :character="store.selectedCharacter"
    />

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
              class="relative"
              :class="[
                isBeneficial(key, value) ? 'text-green-400 stat-value-positive' : isHarmful(key, value) ? 'text-red-400 stat-value-negative' : 'text-muted',
                isBeneficial(key, value) && Math.abs(value) >= 10 ? 'stat-sparkle' : '',
                isHarmful(key, value) && Math.abs(value) >= 10 ? 'stat-break' : '',
              ]"
              :style="{ animationDelay: idx * 0.08 + 0.2 + 's' }"
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
      <div
        v-if="store.stats.buffs && store.stats.buffs.length > 0"
        class="pixel-card space-y-2 event-enter text-xs"
        style="animation-delay: 0.3s"
      >
        <p class="text-amber-400 text-[11px]">💼 道具持續中（每天結算）</p>
        <ul class="space-y-1">
          <li
            v-for="buff in store.stats.buffs"
            :key="buff.id"
            class="flex justify-between items-center"
          >
            <span class="flex items-center gap-2">
              <span>{{ buff.icon }}</span>
              <span class="text-paper">{{ buff.name }}</span>
              <span class="text-muted text-[10px]">
                {{ buff.daysRemaining < 0 ? '∞' : '剩 ' + buff.daysRemaining + ' 天' }}
              </span>
            </span>
            <span class="flex gap-2 text-[10px]">
              <span
                v-for="(val, k) in buff.perDayEffects"
                :key="k"
                :class="isBeneficial(k, val) ? 'text-green-400' : isHarmful(k, val) ? 'text-red-400' : 'text-muted'"
              >
                {{ statLabel[k] ?? k }} {{ val > 0 ? '+' : '' }}{{ val }}
              </span>
            </span>
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
