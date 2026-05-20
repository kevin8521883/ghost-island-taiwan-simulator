<script setup lang="ts">
import type { Character, PlayerStats } from '~/types/game'

const props = defineProps<{
  stats: PlayerStats
  character?: Character | null
}>()

const dayPct = computed(() => Math.min(100, (props.stats.day / 30) * 100))
const stressDanger = computed(() => props.stats.stress >= 90)
const healthDanger = computed(() => props.stats.health <= 15)
const happyDanger = computed(() => props.stats.happiness <= 10)
const moneyDanger = computed(() => props.stats.money <= -40000)
</script>

<template>
  <div class="pixel-card">
    <div
      v-if="character"
      class="flex items-center justify-between text-[11px] pb-2 mb-2 border-b border-[#333]"
    >
      <span class="text-paper">🪪 {{ character.name }}</span>
      <span class="text-muted">{{ Math.round(dayPct) }}%</span>
    </div>
    <div class="flex items-center justify-between text-xs mb-2">
      <span class="text-amber-400 tracking-widest">DAY {{ stats.day }} / 30</span>
      <span v-if="!character" class="text-muted text-[10px]">
        {{ Math.round(dayPct) }}%
      </span>
    </div>
    <div class="h-1 bg-[#2a2a2a] mb-3">
      <div
        class="h-full bg-amber-400 transition-all duration-500"
        :style="{ width: dayPct + '%' }"
      />
    </div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      <div :class="{ 'danger-stat': moneyDanger }">💰 {{ stats.money.toLocaleString() }}</div>
      <div :class="{ 'danger-stat': stressDanger }">🔥 壓力 {{ stats.stress }}</div>
      <div :class="{ 'danger-stat': healthDanger }">❤️ 健康 {{ stats.health }}</div>
      <div :class="{ 'danger-stat': happyDanger }">😊 快樂 {{ stats.happiness }}</div>
      <div>📈 職涯 {{ stats.career }}</div>
      <div>👥 評價 {{ stats.reputation }}</div>
    </div>
  </div>
</template>
