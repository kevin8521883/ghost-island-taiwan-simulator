<script setup lang="ts">
const props = defineProps<{ endingId?: string | null }>()

const particle = (count: number, jitterDelay = 4, jitterDuration = 3, baseDuration = 4) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * jitterDelay,
    duration: baseDuration + Math.random() * jitterDuration,
    size: 0.8 + Math.random() * 0.8,
  }))
}

const bankruptcyParts = computed(() => particle(15, 4, 3, 5))
const tycoonParts = computed(() => particle(28, 3, 2, 3))
const influencerParts = computed(() => particle(18, 4, 3, 5))
const enlightenmentParts = computed(() => particle(8, 8, 6, 14))
const crashParts = computed(() => particle(12, 2, 2, 3))
const servantParts = computed(() => particle(10, 5, 4, 7))
const survivorParts = computed(() => particle(6, 4, 4, 8))
const emigrationParts = computed(() => particle(2, 6, 2, 10))
</script>

<template>
  <div
    v-if="endingId"
    :class="['ending-effect-layer', `effect-${endingId}`]"
    aria-hidden="true"
  >
    <!-- 破產：紙鈔狂飛 -->
    <template v-if="endingId === 'bankruptcy'">
      <span
        v-for="p in bankruptcyParts"
        :key="p.id"
        class="particle particle-fall"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: p.size + 'rem',
        }"
      >💸</span>
    </template>

    <!-- 鬼島大亨：金光閃閃 -->
    <template v-if="endingId === 'tycoon'">
      <span
        v-for="p in tycoonParts"
        :key="p.id"
        class="particle particle-sparkle"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: p.size + 'rem',
        }"
      >✨</span>
    </template>

    <!-- 網紅出道：粉紅愛心 -->
    <template v-if="endingId === 'influencer'">
      <span
        v-for="p in influencerParts"
        :key="p.id"
        class="particle particle-rise"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: p.size + 'rem',
        }"
      >❤️</span>
    </template>

    <!-- 中庸頓悟：雲淡風輕 -->
    <template v-if="endingId === 'enlightenment'">
      <span
        v-for="p in enlightenmentParts"
        :key="p.id"
        class="particle particle-drift"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: (p.size * 2) + 'rem',
        }"
      >☁️</span>
    </template>

    <!-- 創業失敗：火焰 -->
    <template v-if="endingId === 'startup_crash'">
      <span
        v-for="p in crashParts"
        :key="p.id"
        class="particle particle-flicker"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: (p.size * 1.5) + 'rem',
        }"
      >🔥</span>
    </template>

    <!-- 考上公務員：公文飄 -->
    <template v-if="endingId === 'civil_servant_dream'">
      <span
        v-for="p in servantParts"
        :key="p.id"
        class="particle particle-papers"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: p.size + 'rem',
        }"
      >📋</span>
    </template>

    <!-- 社畜倖存：日出溫暖 -->
    <template v-if="endingId === 'survivor'">
      <span
        v-for="p in survivorParts"
        :key="p.id"
        class="particle particle-shine"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: (p.size * 1.5) + 'rem',
        }"
      >☀️</span>
    </template>

    <!-- 潤了：飛機橫過天空 -->
    <template v-if="endingId === 'emigration'">
      <span
        v-for="p in emigrationParts"
        :key="p.id"
        class="particle particle-fly-across"
        :style="{
          top: (10 + p.left * 0.3) + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: '2.5rem',
        }"
      >✈️</span>
    </template>
  </div>
</template>
