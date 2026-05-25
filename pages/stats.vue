<script setup lang="ts">
import endingsData from '~/data/endings.json'
import type { Ending } from '~/types/game'

const ALL_ENDINGS = endingsData as Ending[]
const endingStats = useEndingStats()
const dex = useEndingDex()

onMounted(() => {
  endingStats.fetchAll()
  dex.refresh()
})

const totalRuns = computed(() => endingStats.stats.value?.totalRuns ?? 0)

// 把所有結局照 % 由大到小排
interface Row {
  ending: Ending
  count: number
  pct: number
  unlocked: boolean
  /** 對玩家而言要不要遮（未解鎖 且 hidden 才遮、跟圖鑑一致）*/
  masked: boolean
}

const rows = computed<Row[]>(() => {
  const total = totalRuns.value
  const rows = ALL_ENDINGS.map((e) => {
    const count = endingStats.countFor(e.id)
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    const unlocked = dex.isUnlocked(e.id)
    return {
      ending: e,
      count,
      pct,
      unlocked,
      masked: !unlocked && !!e.hidden,
    }
  })
  return rows.sort((a, b) => b.pct - a.pct)
})

const moodColor = (mood?: string) => {
  if (mood === 'happy') return 'bg-emerald-400'
  if (mood === 'sad') return 'bg-rose-400'
  return 'bg-amber-400'
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-1 pb-2">
      <h1 class="text-lg text-amber-400">全球結局統計</h1>
      <p class="text-xs text-muted">
        所有玩家通關後的匿名分布
      </p>
    </header>

    <div class="pixel-card-accent text-center space-y-1">
      <p class="text-[11px] text-amber-400">累計通關</p>
      <p class="text-4xl text-amber-400 font-bold tabular-nums">
        {{ totalRuns.toLocaleString() }}
      </p>
      <p class="text-[10px] text-muted">場</p>
    </div>

    <div v-if="totalRuns === 0 && !endingStats.loading.value" class="pixel-card text-center text-xs text-muted py-6">
      尚無資料、第一個通關的就是你
    </div>

    <div v-else-if="endingStats.loading.value" class="pixel-card text-center text-xs text-muted py-6">
      載入中…
    </div>

    <div v-else class="space-y-2">
      <p class="text-[10px] text-muted text-center pb-1">
        未解鎖的結局只顯示比例、不暴雷
      </p>
      <div
        v-for="row in rows"
        :key="row.ending.id"
        class="pixel-card space-y-1"
        :class="{ 'opacity-70': !row.unlocked }"
      >
        <div class="flex items-baseline justify-between gap-2">
          <p
            class="text-sm flex-1 min-w-0 truncate"
            :class="row.unlocked ? 'text-paper' : 'text-muted italic'"
          >
            <span v-if="row.masked">??? 未解鎖</span>
            <span v-else>{{ row.ending.title }}</span>
            <span v-if="!row.unlocked && !row.masked" class="text-[10px] text-muted pl-2">
              （未解鎖）
            </span>
          </p>
          <p
            class="text-lg tabular-nums font-bold"
            :class="row.pct > 0 ? 'text-amber-400' : 'text-muted'"
          >
            {{ row.pct }}%
          </p>
        </div>
        <div class="h-2 bg-[#0a0a0a] border border-[#333] overflow-hidden">
          <div
            class="h-full transition-all duration-700"
            :class="moodColor(row.ending.mood)"
            :style="{ width: `${row.pct}%` }"
          />
        </div>
        <p class="text-[10px] text-muted">
          <span>{{ row.count.toLocaleString() }} 人達成</span>
          <span v-if="row.unlocked">
            · {{ row.ending.hint || row.ending.description.slice(0, 24) }}
          </span>
          <span v-else-if="row.ending.hint" class="italic">
            · 線索：{{ row.ending.hint }}
          </span>
        </p>
      </div>
    </div>

    <div class="pt-3">
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
