<script setup lang="ts">
import type { Character } from '~/types/game'

const props = withDefaults(
  defineProps<{
    character: Character
    size?: 'sm' | 'md' | 'lg'
    /** 心情狀態：normal / stressed / happy。影響 idle 動畫 */
    mood?: 'normal' | 'stressed' | 'happy' | 'sad'
    /** 觸發一次反應動畫（彈跳）的 trigger key（值改變時播放） */
    reactKey?: string | number
  }>(),
  { size: 'md', mood: 'normal' }
)

const imgErr = ref(false)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'w-10 h-10 text-2xl'
  if (props.size === 'lg') return 'w-24 h-24 text-5xl'
  return 'w-14 h-14 text-3xl'
})

const portraitSrc = computed(() => `/portraits/${props.character.id}.png`)
const showImage = computed(() => !imgErr.value)

// idle 動畫類別依 mood 切換
const idleClass = computed(() => {
  if (props.mood === 'stressed') return 'portrait-stressed'
  if (props.mood === 'happy') return 'portrait-happy'
  if (props.mood === 'sad') return 'portrait-sad'
  return 'portrait-idle'
})

// 反應動畫（一次性彈跳）
const reactPlaying = ref(false)
watch(
  () => props.reactKey,
  () => {
    if (props.reactKey === undefined || props.reactKey === null) return
    reactPlaying.value = false
    requestAnimationFrame(() => {
      reactPlaying.value = true
    })
    setTimeout(() => {
      reactPlaying.value = false
    }, 400)
  }
)
</script>

<template>
  <div
    :class="sizeClass"
    class="portrait-frame flex-shrink-0 flex items-center justify-center bg-[#1a1a1a] border border-amber-400/40 select-none overflow-hidden"
  >
    <img
      v-if="showImage"
      :src="portraitSrc"
      :alt="character.name"
      class="w-full h-full object-contain pixel-img"
      :class="[idleClass, reactPlaying ? 'portrait-react' : '']"
      @error="imgErr = true"
    />
    <span v-else aria-hidden="true">{{ character.emoji ?? '👤' }}</span>
  </div>
</template>

<style scoped>
.pixel-img {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* 平靜呼吸：上下浮動 2 步、NES 風 */
@keyframes idle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3%); }
}
.portrait-idle {
  animation: idle-bounce 1.6s steps(2) infinite;
}

/* 緊張抖動 */
@keyframes stress-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1.5%, 0); }
  50% { transform: translate(0, -1%); }
  75% { transform: translate(1.5%, 0); }
}
.portrait-stressed {
  animation: stress-shake 0.4s steps(4) infinite;
}

/* 開心彈跳：跳更高、間隔短 */
@keyframes happy-hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8%); }
}
.portrait-happy {
  animation: happy-hop 0.9s steps(2) infinite;
}

/* 沮喪低垂：往下沉 + 緩慢左右搖頭 */
@keyframes sad-slump {
  0%, 100% { transform: translateY(6%) rotate(-2deg); }
  50% { transform: translateY(6%) rotate(2deg); }
}
.portrait-sad {
  animation: sad-slump 2.8s ease-in-out infinite;
  filter: brightness(0.85) saturate(0.7);
}

/* 一次性反應彈跳（選了選項後播放） */
@keyframes react-pop {
  0% { transform: scale(1) translateY(0); }
  30% { transform: scale(1.15) translateY(-15%); }
  100% { transform: scale(1) translateY(0); }
}
.portrait-react {
  animation: react-pop 0.4s ease-out !important;
}
</style>
