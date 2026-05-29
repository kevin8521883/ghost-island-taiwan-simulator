<script setup lang="ts">
import type { EndingMood } from '~/types/game'

interface Props {
  mood: EndingMood | undefined
}
const props = defineProps<Props>()

// 12 個粒子隨機初始延遲 + 水平位置
interface Particle {
  left: string
  delay: string
  duration: string
  drift: string
}

const seed = (i: number) => {
  // 偽隨機、但每次 mount 都同樣（避免 hydration mismatch；其實 ssr false 不會、但安全）
  const x = Math.sin(i * 9.7) * 10000
  return x - Math.floor(x)
}

const particles = computed<Particle[]>(() => {
  return Array.from({ length: 14 }).map((_, i) => ({
    left: `${Math.floor(seed(i + 1) * 100)}%`,
    delay: `${(seed(i + 7) * 6).toFixed(2)}s`,
    duration: `${(6 + seed(i + 13) * 5).toFixed(2)}s`,
    drift: `${((seed(i + 19) - 0.5) * 80).toFixed(1)}px`,
  }))
})

const moodClass = computed(() => {
  if (props.mood === 'happy') return 'ambient-happy'
  if (props.mood === 'sad') return 'ambient-sad'
  return 'ambient-normal'
})

const symbol = computed(() => {
  if (props.mood === 'happy') return '✦'
  if (props.mood === 'sad') return '·'
  return '◇'
})
</script>

<template>
  <div class="ending-ambient" :class="moodClass" aria-hidden="true">
    <span
      v-for="(p, i) in particles"
      :key="i"
      class="ambient-particle"
      :style="{
        left: p.left,
        animationDelay: p.delay,
        animationDuration: p.duration,
        '--drift': p.drift,
      }"
    >{{ symbol }}</span>
  </div>
</template>
