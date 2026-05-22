<script setup lang="ts">
import type { Character } from '~/types/game'

defineProps<{ character: Character; selected?: boolean }>()
defineEmits<{ select: [character: Character] }>()
</script>

<template>
  <button
    type="button"
    class="pixel-card w-full text-left space-y-2 transition"
    :class="{ 'ring-4 ring-amber-400': selected }"
    @click="$emit('select', character)"
  >
    <div class="flex items-start gap-3">
      <CharacterPortrait :character="character" size="md" />
      <div class="flex-1 min-w-0 space-y-1">
        <h3 class="text-base text-amber-400">{{ character.name }}</h3>
        <p v-if="character.description" class="text-xs leading-relaxed text-paper">
          {{ character.description }}
        </p>
      </div>
    </div>
    <dl class="grid grid-cols-2 gap-1 text-[11px] pt-2 text-muted">
      <div>💰 {{ character.money.toLocaleString() }}</div>
      <div>🔥 壓力 {{ character.stress }}</div>
      <div>❤️ 健康 {{ character.health }}</div>
      <div>😊 快樂 {{ character.happiness }}</div>
      <div>📈 職涯 {{ character.career }}</div>
      <div>👥 評價 {{ character.reputation }}</div>
    </dl>
  </button>
</template>
