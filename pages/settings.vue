<script setup lang="ts">
const store = useGameStore()
const bgm = useBgm()
const sfx = useSfx()
const hasSave = ref(false)

onMounted(() => {
  hasSave.value = store.hasSave()
})

const clearSave = () => {
  if (!confirm('確定要清除存檔嗎？無法復原。')) return
  store.reset()
  hasSave.value = false
}

const onBgmVolume = (e: Event) => {
  bgm.setVolume(Number((e.target as HTMLInputElement).value))
}
const onSfxVolume = (e: Event) => {
  sfx.setVolume(Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="min-h-dvh p-6 max-w-md mx-auto space-y-6">
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

      <p class="text-muted">存檔狀態：{{ hasSave ? '有' : '無' }}</p>
    </div>

    <div class="space-y-2">
      <PixelButton :disabled="!hasSave" @click="clearSave">清除存檔</PixelButton>
      <PixelButton to="/">回到首頁</PixelButton>
    </div>
  </div>
</template>
