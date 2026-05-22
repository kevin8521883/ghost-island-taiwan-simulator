<script setup lang="ts">
const dex = useEndingDex()

onMounted(() => {
  dex.refresh()
})

const conditionLabels: Record<string, string> = {
  money: '💰 金錢',
  stress: '🔥 壓力',
  health: '❤️ 健康',
  happiness: '😊 快樂',
  career: '📈 職涯',
  reputation: '👥 評價',
  day: '📅 天數',
  boss: '👔 主管關係',
  coworker: '🧑‍🤝‍🧑 同事關係',
  family: '🏠 家人關係',
}

const formatRange = (key: string, range: { lte?: number; gte?: number }) => {
  const label = conditionLabels[key] ?? key
  const parts: string[] = []
  if (range.gte !== undefined) parts.push(`≥ ${range.gte.toLocaleString()}`)
  if (range.lte !== undefined) parts.push(`≤ ${range.lte.toLocaleString()}`)
  return `${label} ${parts.join(' 且 ')}`
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-2 pb-2">
      <h1 class="text-lg text-amber-400">結局圖鑑</h1>
      <p class="text-xs text-muted">
        已解鎖 {{ dex.unlockedCount }} / {{ dex.total }}
      </p>
      <div class="h-1 bg-[#2a2a2a]">
        <div
          class="h-full bg-amber-400 transition-all duration-500"
          :style="{ width: dex.progress + '%' }"
        />
      </div>
    </header>

    <div class="space-y-3">
      <div
        v-for="(item, idx) in dex.gallery"
        :key="item.ending.id"
        :class="item.unlocked ? 'pixel-card-accent' : 'pixel-card opacity-60'"
        class="space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-muted">No. {{ idx + 1 }}</span>
          <span
            class="text-[10px]"
            :class="item.unlocked ? 'text-amber-400' : 'text-muted'"
          >
            {{ item.unlocked ? '✓ 已解鎖' : '? 未解鎖' }}
          </span>
        </div>
        <h2
          class="text-base"
          :class="item.unlocked ? 'text-amber-400' : 'text-muted'"
        >
          {{ item.unlocked ? item.ending.title : (item.ending.hidden ? '???' : item.ending.title) }}
        </h2>

        <p
          v-if="item.unlocked"
          class="text-xs leading-relaxed text-paper"
        >
          {{ item.ending.description }}
        </p>
        <p
          v-else-if="item.ending.hint"
          class="text-xs text-muted italic"
        >
          線索：{{ item.ending.hint }}
        </p>
        <p
          v-else
          class="text-xs text-muted italic"
        >
          線索：完成 30 天看看
        </p>

        <div
          v-if="item.unlocked && item.variants.length > 0"
          class="pt-1 space-y-1 text-[11px]"
        >
          <p class="text-muted">你以這些身分達成：</p>
          <details
            v-for="v in item.variants"
            :key="v.characterId"
            class="text-paper"
          >
            <summary class="cursor-pointer select-none list-none flex items-center gap-1">
              <span class="text-muted text-[10px]">▸</span>
              <span class="text-amber-400">{{ v.characterName }}</span>
              <span class="text-muted">→</span>
              <span>{{ v.variantTitle }}</span>
            </summary>
            <p class="pt-1 pl-4 text-muted leading-relaxed">
              {{ v.variantDescription }}
            </p>
          </details>
        </div>

        <details v-if="item.unlocked" class="text-[11px] text-muted">
          <summary class="cursor-pointer select-none">觸發條件</summary>
          <ul class="pt-2 space-y-1">
            <li
              v-for="(range, key) in item.ending.condition"
              :key="key"
            >
              {{ formatRange(key, range) }}
            </li>
          </ul>
        </details>
      </div>
    </div>

    <div class="pt-4 space-y-2 pb-6">
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
