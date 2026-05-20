<script setup lang="ts">
const store = useGameStore()
const bgm = useBgm()
const sfx = useSfx()
const dex = useEndingDex()
const theme = useTheme()
const hasSave = ref(false)

onMounted(() => {
  hasSave.value = store.hasSave()
  dex.refresh()
})

const clearSave = () => {
  if (!confirm('確定要清除存檔嗎？無法復原。')) return
  store.reset()
  hasSave.value = false
}

const resetDex = () => {
  if (!confirm('確定要清空結局圖鑑嗎？所有解鎖紀錄會消失。')) return
  dex.reset()
}

const onBgmVolume = (e: Event) => {
  bgm.setVolume(Number((e.target as HTMLInputElement).value))
}
const onSfxVolume = (e: Event) => {
  sfx.setVolume(Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-6">
    <header class="text-center">
      <h1 class="text-lg text-amber-400">設定</h1>
    </header>

    <div class="pixel-card space-y-4 text-xs">
      <div class="flex justify-between items-center">
        <span>背景音樂</span>
        <button
          type="button"
          class="text-amber-400 px-3 py-1 border-2 border-amber-400"
          @click="bgm.toggle(!bgm.enabled)"
        >
          {{ bgm.enabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span>BGM 音量</span>
          <span class="text-muted">{{ Math.round(bgm.volume * 100) }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="bgm.volume"
          class="w-full accent-amber-400"
          @input="onBgmVolume"
        />
      </div>

      <hr class="border-[#333]" />

      <div class="flex justify-between items-center">
        <span>點擊音效</span>
        <button
          type="button"
          class="text-amber-400 px-3 py-1 border-2 border-amber-400"
          @click="sfx.toggle(!sfx.enabled)"
        >
          {{ sfx.enabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span>音效音量</span>
          <span class="text-muted">{{ Math.round(sfx.volume * 100) }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="sfx.volume"
          class="w-full accent-amber-400"
          @input="onSfxVolume"
        />
      </div>

      <hr class="border-[#333]" />

      <div class="space-y-2">
        <p class="pb-1">主題</p>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="t in theme.themes"
            :key="t.id"
            type="button"
            class="text-left px-3 py-2 border-2 transition-colors"
            :class="
              theme.current === t.id
                ? 'border-amber-400 bg-[#222] text-amber-400'
                : 'border-[#444] text-paper hover:bg-[#1a1a1a]'
            "
            @click="theme.set(t.id); sfx.play('click')"
          >
            <div class="flex justify-between items-center">
              <span>{{ t.name }}</span>
              <span v-if="theme.current === t.id" class="text-[10px]">✓</span>
            </div>
            <p class="text-[10px] text-muted pt-0.5">{{ t.subtitle }}</p>
          </button>
        </div>
      </div>

      <hr class="border-[#333]" />

      <p class="text-muted">存檔狀態：{{ hasSave ? '有' : '無' }}</p>
      <p class="text-muted">結局圖鑑：{{ dex.unlockedCount }} / {{ dex.total }} 解鎖</p>
    </div>

    <div class="space-y-2">
      <PixelButton to="/gallery">結局圖鑑</PixelButton>
      <PixelButton to="/history">歷史紀錄</PixelButton>
      <PixelButton :disabled="!hasSave" @click="clearSave">清除存檔</PixelButton>
      <PixelButton :disabled="dex.unlockedCount === 0" @click="resetDex">重置圖鑑</PixelButton>
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
