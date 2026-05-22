<script setup lang="ts">
import type { Achievement } from '~/types/game'

const achievements = useAchievements()
const current = ref<Achievement | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const showNext = () => {
  if (current.value) return
  const next = achievements.consumeJustUnlocked()
  if (!next) return
  current.value = next
  timer = setTimeout(() => {
    current.value = null
    timer = null
    showNext()
  }, 3500)
}

watch(
  () => achievements.justUnlocked.length,
  () => {
    showNext()
  }
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="current"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 pixel-card-accent flex items-center gap-3 px-4 py-3 max-w-sm"
    >
      <span class="text-3xl">{{ current.icon }}</span>
      <div>
        <p class="text-[10px] text-amber-400">🏆 成就解鎖</p>
        <p class="text-sm text-paper font-bold">{{ current.title }}</p>
        <p class="text-[11px] text-muted leading-snug">{{ current.description }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  transform: translate(-50%, -120%);
  opacity: 0;
}
.toast-leave-to {
  transform: translate(-50%, -120%);
  opacity: 0;
}
</style>
