<script setup lang="ts">
const store = useGameStore()
const bgm = useBgm()
const dex = useEndingDex()
const history = useRunHistory()
const hasSave = ref(false)

onMounted(() => {
  hasSave.value = store.hasSave()
  dex.refresh()
  history.refresh()
})

const startNew = () => {
  bgm.play()
  navigateTo('/character')
}

const continueGame = () => {
  bgm.play()
  store.hydrate()
  if (store.endingId) {
    navigateTo('/ending')
  } else if (store.selectedCharacter) {
    navigateTo('/game')
  } else {
    navigateTo('/character')
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center p-6">
    <div class="w-full max-w-md space-y-6 text-center">
      <header class="space-y-2 mb-8">
        <h1 class="text-2xl text-amber-400 leading-relaxed">鬼島台灣模擬器</h1>
        <h2 class="text-base text-paper">社畜篇</h2>
        <p class="text-xs text-muted pt-4">活著就已經很了不起</p>
      </header>

      <div class="space-y-3">
        <PixelButton variant="primary" @click="startNew">開始新人生</PixelButton>
        <PixelButton v-if="hasSave" @click="continueGame">繼續遊戲</PixelButton>
        <PixelButton to="/gallery">結局圖鑑（{{ dex.unlockedCount }} / {{ dex.total }}）</PixelButton>
        <PixelButton v-if="history.totalRuns > 0" to="/history">
          歷史紀錄（{{ history.totalRuns }} 局）
        </PixelButton>
        <PixelButton to="/settings">設定</PixelButton>
      </div>

      <footer class="text-[10px] text-muted pt-6 space-y-1">
        <p>Ghost Island Taiwan Simulator · v0.2</p>
        <p>45 events · 6 endings · 含 AI 時事篇</p>
      </footer>
    </div>
  </div>
</template>
