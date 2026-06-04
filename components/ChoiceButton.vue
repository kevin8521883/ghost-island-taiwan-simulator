<script setup lang="ts">
import type { EventChoice } from '~/types/game'

const props = withDefaults(
  defineProps<{
    choice: EventChoice
    index: number
    state?: 'idle' | 'pressed' | 'dimmed'
  }>(),
  { state: 'idle' }
)
const emit = defineEmits<{ select: [index: number] }>()

// 音效/觸覺由 game.vue 的 handleChoice 統一處理（press → 揭曉）
const onClick = () => {
  if (props.state === 'dimmed') return
  emit('select', props.index)
}
</script>

<template>
  <button
    type="button"
    class="pixel-button-choice choice-btn"
    :class="{
      'choice-pressed': state === 'pressed',
      'choice-dimmed': state === 'dimmed',
    }"
    :disabled="state === 'dimmed'"
    @click="onClick"
  >
    {{ choice.text }}
  </button>
</template>
