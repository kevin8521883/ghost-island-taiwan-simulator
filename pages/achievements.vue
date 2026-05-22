<script setup lang="ts">
const ach = useAchievements()

onMounted(() => {
  ach.refresh()
  ach.checkMeta()
})
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-2 pb-2">
      <h1 class="text-lg text-amber-400">成就圖鑑</h1>
      <p class="text-xs text-muted">
        已解鎖 {{ ach.unlockedCount }} / {{ ach.total }}
      </p>
      <div class="h-1 bg-[#2a2a2a]">
        <div
          class="h-full bg-amber-400 transition-all duration-500"
          :style="{ width: ach.progress + '%' }"
        />
      </div>
    </header>

    <div class="space-y-2">
      <div
        v-for="item in ach.gallery"
        :key="item.ach.id"
        :class="item.unlocked ? 'pixel-card-accent' : 'pixel-card opacity-60'"
        class="flex items-center gap-3"
      >
        <span
          class="text-3xl flex-shrink-0"
          :class="!item.unlocked ? 'opacity-40 grayscale' : ''"
        >
          {{ item.unlocked ? item.ach.icon : '🔒' }}
        </span>
        <div class="flex-1 min-w-0 space-y-0.5">
          <p
            class="text-sm font-bold"
            :class="item.unlocked ? 'text-amber-400' : 'text-muted'"
          >
            {{ item.unlocked ? item.ach.title : '???' }}
          </p>
          <p
            v-if="item.unlocked"
            class="text-[11px] leading-relaxed text-paper"
          >
            {{ item.ach.description }}
          </p>
          <p
            v-else-if="item.ach.hint"
            class="text-[11px] italic text-muted"
          >
            線索：{{ item.ach.hint }}
          </p>
        </div>
      </div>
    </div>

    <div class="pt-4 space-y-2 pb-6">
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
