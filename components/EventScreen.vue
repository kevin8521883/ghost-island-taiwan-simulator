<script setup lang="ts">
import type { SceneType } from '~/composables/useEventScene'
import type { Character } from '~/types/game'

interface Props {
  scene: SceneType
  character: Character | null
}
const props = defineProps<Props>()

const sceneClass = computed(() => `es-scene-${props.scene}`)

// 依場景挑情緒（對應 portrait <id>_happy.webp / _sad.webp / 預設）
const mood = computed<'normal' | 'happy' | 'sad'>(() => {
  if (props.scene === 'payday' || props.scene === 'luck') return 'happy'
  if (props.scene === 'accident' || props.scene === 'shop') return 'sad'
  return 'normal'
})

const portraitSrc = computed(() => {
  if (!props.character) return ''
  const id = props.character.id
  if (mood.value === 'happy') return `/portraits/${id}_happy.webp`
  if (mood.value === 'sad') return `/portraits/${id}_sad.webp`
  return `/portraits/${id}.webp`
})

const sceneLabel: Record<SceneType, string> = {
  idle: '日常',
  office: '辦公室',
  payday: '發薪日',
  shop: '消費',
  luck: '好運',
  social: '社交',
  home: '回家',
  accident: '意外',
  health: '健康',
  ai: '時事',
}
</script>

<template>
  <div class="event-screen" :class="sceneClass" aria-hidden="true">
    <!-- 背景層 -->
    <div class="es-bg" />

    <!-- 場景專屬粒子層 -->
    <div class="es-fx">
      <template v-if="scene === 'payday'">
        <span
          v-for="i in 6"
          :key="i"
          class="es-particle es-money"
          :style="{ left: (i * 16 - 8) + '%', animationDelay: (i * 0.12) + 's' }"
        >💵</span>
      </template>
      <template v-else-if="scene === 'luck'">
        <span
          v-for="i in 5"
          :key="'s' + i"
          class="es-particle es-spark"
          :style="{ left: (10 + i * 18) + '%', animationDelay: (i * 0.18) + 's' }"
        >✦</span>
      </template>
      <template v-else-if="scene === 'office'">
        <span
          v-for="i in 3"
          :key="'t' + i"
          class="es-particle es-typing"
          :style="{ animationDelay: (i * 0.18) + 's' }"
        >▌</span>
      </template>
      <template v-else-if="scene === 'shop'">
        <span
          v-for="i in 4"
          :key="'mf' + i"
          class="es-particle es-money-flee"
          :style="{ animationDelay: (i * 0.15) + 's' }"
        >💸</span>
      </template>
      <template v-else-if="scene === 'social'">
        <span
          v-for="i in 3"
          :key="'c' + i"
          class="es-particle es-chat"
          :style="{ animationDelay: (i * 0.4) + 's' }"
        >💬</span>
      </template>
      <template v-else-if="scene === 'home'">
        <span
          v-for="i in 4"
          :key="'h' + i"
          class="es-particle es-warm"
          :style="{ left: (i * 22) + '%', animationDelay: (i * 0.25) + 's' }"
        >·</span>
      </template>
      <template v-else-if="scene === 'accident'">
        <span class="es-particle es-warn">⚠</span>
        <span
          v-for="i in 3"
          :key="'f' + i"
          class="es-particle es-flash"
          :style="{ animationDelay: (i * 0.1) + 's' }"
        />
      </template>
      <template v-else-if="scene === 'health'">
        <span
          v-for="i in 3"
          :key="'hp' + i"
          class="es-particle es-heart"
          :style="{ animationDelay: (i * 0.3) + 's', left: (20 + i * 20) + '%' }"
        >♥</span>
      </template>
      <template v-else-if="scene === 'ai'">
        <span
          v-for="i in 6"
          :key="'a' + i"
          class="es-particle es-ai"
          :style="{ left: (i * 14) + '%', animationDelay: (i * 0.12) + 's' }"
        >▓</span>
      </template>
    </div>

    <!-- 主角：用真的 portrait 圖、依場景切 mood -->
    <div class="es-char" :class="`es-char-${mood}`">
      <img
        v-if="portraitSrc"
        :src="portraitSrc"
        :alt="character?.name ?? ''"
        class="es-char-img"
        draggable="false"
      />
      <span v-else class="es-char-emoji">🧑‍💻</span>
    </div>

    <!-- 場景標籤 -->
    <p class="es-label">{{ sceneLabel[scene] }}</p>
  </div>
</template>
