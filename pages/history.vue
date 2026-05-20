<script setup lang="ts">
const history = useRunHistory()

onMounted(() => {
  history.refresh()
})

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const clearAll = () => {
  if (!confirm('確定清空歷史紀錄嗎？這不影響結局圖鑑解鎖。')) return
  history.reset()
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-1 pb-2">
      <h1 class="text-lg text-amber-400">歷史紀錄</h1>
      <p class="text-xs text-muted">
        共 {{ history.totalRuns }} 局
      </p>
    </header>

    <div v-if="history.totalRuns === 0" class="pixel-card text-center text-xs space-y-3 py-8">
      <p class="text-muted">還沒有任何紀錄</p>
      <p class="text-muted text-[10px]">完成第一輪人生後就會出現在這裡</p>
    </div>

    <template v-else>
      <div class="pixel-card-accent text-xs space-y-2">
        <p class="text-amber-400 pb-1">統計</p>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1">
          <div>平均存活：{{ history.avgDay }} 天</div>
          <div>最長存活：{{ history.longestDay }} 天</div>
          <div v-if="history.richestRun">
            最富裕：{{ history.richestRun.finalStats.money.toLocaleString() }} 元
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="run in history.runs"
          :key="run.id"
          class="pixel-card text-xs space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-amber-400 text-sm">{{ run.endingTitle }}</p>
              <p class="text-muted text-[11px]">
                🪪 {{ run.characterName }} · DAY {{ run.day }}
              </p>
            </div>
            <p class="text-muted text-[9px] whitespace-nowrap">
              {{ formatTime(run.endedAt) }}
            </p>
          </div>
          <details class="text-[11px] text-muted">
            <summary class="cursor-pointer select-none">最終數值</summary>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 pt-2">
              <div>💰 {{ run.finalStats.money.toLocaleString() }}</div>
              <div>🔥 壓力 {{ run.finalStats.stress }}</div>
              <div>❤️ 健康 {{ run.finalStats.health }}</div>
              <div>😊 快樂 {{ run.finalStats.happiness }}</div>
              <div>📈 職涯 {{ run.finalStats.career }}</div>
              <div>👥 評價 {{ run.finalStats.reputation }}</div>
            </div>
          </details>
        </div>
      </div>
    </template>

    <div class="pt-4 space-y-2 pb-6">
      <PixelButton
        v-if="history.totalRuns > 0"
        @click="clearAll"
      >
        清空歷史
      </PixelButton>
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
