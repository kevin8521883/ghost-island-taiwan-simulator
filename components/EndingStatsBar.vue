<script setup lang="ts">
import type { Ending } from '~/types/game'

interface Props {
  ending: Ending
}

const props = defineProps<Props>()
const statsApi = useEndingStats()

const pct = computed(() => statsApi.percentageFor(props.ending.id))
const total = computed(() => statsApi.stats.value?.totalRuns ?? 0)
const count = computed(() => statsApi.countFor(props.ending.id))

const ready = computed(
  () => !statsApi.loading.value && total.value > 0
)

const flavor = computed(() => {
  if (!ready.value) return ''
  if (total.value < 10) return '🌱 你是早期玩家、樣本還不夠'
  if (pct.value >= 30) return '🫂 你不孤單，這是大眾解'
  if (pct.value >= 10) return '🚶 算是常見路線'
  if (pct.value >= 3) return '🌚 少見路線、有點獨特'
  return '👻 極少數人才走到這、罕見'
})
</script>

<template>
  <div class="pixel-card-accent space-y-2">
    <p class="text-[11px] text-amber-400">📊 全球結局分布</p>
    <template v-if="ready">
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-bold text-amber-400 tabular-nums">{{ pct }}%</span>
        <span class="text-xs text-muted">
          走到「{{ ending.title }}」
        </span>
      </div>
      <div class="h-2 bg-[#0a0a0a] border border-[#333] overflow-hidden">
        <div
          class="h-full bg-amber-400 transition-all duration-700"
          :style="{ width: `${Math.max(pct, 2)}%` }"
        />
      </div>
      <p class="text-[10px] text-muted">
        累計 {{ total.toLocaleString() }} 場 · 此結局 {{ count.toLocaleString() }} 人
      </p>
      <p class="text-[11px] text-paper pt-1">{{ flavor }}</p>
    </template>
    <template v-else-if="statsApi.loading.value">
      <p class="text-xs text-muted">統計載入中…</p>
    </template>
    <template v-else>
      <p class="text-xs text-muted">尚無足夠樣本</p>
    </template>
  </div>
</template>
