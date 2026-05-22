<script setup lang="ts">
import type { GameEvent } from '~/types/game'

defineProps<{ event: GameEvent }>()
</script>

<template>
  <article
    class="relative"
    :class="event.aiGenerated ? 'ai-event-card p-4' : 'pixel-card-accent'"
  >
    <span
      v-if="event.aiGenerated"
      class="absolute -top-2 -right-2 z-10 text-[10px] bg-purple-500 text-white px-2 py-0.5 font-bold tracking-wider rotate-2"
    >
      ⚡ AI 命運
    </span>
    <div class="space-y-3">
      <h2
        class="text-base leading-relaxed"
        :class="event.aiGenerated ? 'text-purple-300' : 'text-amber-400'"
      >
        {{ event.title }}
      </h2>
      <p class="text-sm leading-relaxed text-paper">{{ event.description }}</p>
    </div>
  </article>
</template>
