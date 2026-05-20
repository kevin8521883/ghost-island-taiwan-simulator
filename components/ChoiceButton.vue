<script setup lang="ts">
import type { EventChoice } from '~/types/game'

const props = defineProps<{ choice: EventChoice; index: number }>()
const emit = defineEmits<{ select: [index: number] }>()

const sfx = useSfx()

const onClick = () => {
  sfx.play('click')
  emit('select', props.index)
}
</script>

<template>
  <button type="button" class="pixel-button-choice" @click="onClick">
    {{ choice.text }}
  </button>
</template>
