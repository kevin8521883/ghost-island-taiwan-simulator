<script setup lang="ts">
const store = useGameStore()
const bgm = useBgm()
const dex = useEndingDex()
const history = useRunHistory()
const ach = useAchievements()
const endingStats = useEndingStats()
const fortune = useDailyFortune()
const hasSave = ref(false)

onMounted(() => {
  hasSave.value = store.hasSave()
  dex.refresh()
  history.refresh()
  ach.refresh()
  ach.checkMeta()
  endingStats.fetchAll()
  // 連抽日曆打卡 + 連續登入成就
  const s = fortune.touchStreak()
  ach.checkStreak(s)
})

const globalTotalRuns = computed(() => endingStats.stats.value?.totalRuns ?? 0)
const todayFortune = computed(() => fortune.todayFortune)

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
      <header class="space-y-2 mb-6">
        <h1 class="text-2xl text-amber-400 leading-relaxed">鬼島台灣模擬器</h1>
        <h2 class="text-base text-paper">社畜篇</h2>
        <p class="text-xs text-muted pt-4">活著就已經很了不起</p>
      </header>

      <!-- 連抽日曆 + 今日運勢 -->
      <div class="pixel-card-accent text-left space-y-2 mb-6">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-amber-400">📅 連續報到</span>
          <span class="text-[11px] text-paper">
            <span class="text-amber-400 font-bold tabular-nums">{{ fortune.streak }}</span> 天
            <span v-if="fortune.best > fortune.streak" class="text-muted">
              （最長 {{ fortune.best }}）
            </span>
          </span>
        </div>
        <div class="flex gap-1">
          <span
            v-for="i in 7"
            :key="i"
            class="flex-1 text-center text-sm"
            :class="i <= Math.min(fortune.streak, 7) ? '' : 'opacity-25 grayscale'"
          >🔥</span>
        </div>
        <div class="border-t border-[#333] pt-2 flex items-center gap-3">
          <span class="text-2xl">{{ todayFortune.emoji }}</span>
          <div class="text-[11px] leading-relaxed flex-1">
            <p>
              <span class="text-emerald-400">宜</span>
              <span class="text-paper">{{ todayFortune.good }}</span>
              <span class="text-muted px-1">·</span>
              <span class="text-rose-400">忌</span>
              <span class="text-paper">{{ todayFortune.bad }}</span>
            </p>
            <p class="text-muted text-[10px]">{{ todayFortune.buff.name }}（開局生效）</p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <PixelButton variant="primary" @click="startNew">開始新人生</PixelButton>
        <PixelButton v-if="hasSave" @click="continueGame">繼續遊戲</PixelButton>
        <PixelButton to="/gallery">結局圖鑑（{{ dex.unlockedCount }} / {{ dex.total }}）</PixelButton>
        <PixelButton to="/achievements">
          成就（{{ ach.unlockedCount }} / {{ ach.total }}）
        </PixelButton>
        <PixelButton v-if="history.totalRuns > 0" to="/history">
          歷史紀錄（{{ history.totalRuns }} 局）
        </PixelButton>
        <PixelButton to="/stats">
          全球統計{{ globalTotalRuns > 0 ? `（${globalTotalRuns.toLocaleString()} 場）` : '' }}
        </PixelButton>
        <PixelButton to="/settings">設定</PixelButton>
      </div>

      <footer class="text-[10px] text-muted pt-6 space-y-1">
        <p>Ghost Island Taiwan Simulator · v0.3</p>
        <p>200+ 事件 · 12 結局 · 9 種人生 · 含 AI 即興篇</p>
      </footer>
    </div>
  </div>
</template>
