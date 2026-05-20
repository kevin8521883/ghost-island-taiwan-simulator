<script setup lang="ts">
import type { GameEvent } from '~/types/game'

defineProps<{ event: GameEvent }>()
</script>

<template>
  <article class="pixel-card-accent space-y-3">
    <h2 class="text-base text-amber-400 leading-relaxed">{{ event.title }}</h2>
    <p class="text-sm leading-relaxed text-paper">{{ event.description }}</p>
  </article>
</template>
