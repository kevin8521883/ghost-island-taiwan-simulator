<script setup lang="ts">
const bgm = useBgm()
const sfx = useSfx()

const handleClick = () => {
  sfx.play('click')
  if (bgm.isPlaying) {
    bgm.toggle(false)
  } else {
    bgm.toggle(true)
  }
}
</script>

<template>
  <button
    type="button"
    class="fixed top-3 right-3 z-50 w-11 h-11 flex items-center justify-center bg-[#161616] border-[3px] transition-colors"
    :class="bgm.isPlaying ? 'border-amber-400 text-amber-400' : 'border-[#555] text-[#777]'"
    :style="{
      boxShadow: bgm.isPlaying ? '3px 3px 0 #b08a16' : '3px 3px 0 #333',
    }"
    :aria-label="bgm.isPlaying ? '關閉背景音樂' : '播放背景音樂'"
    :title="bgm.isPlaying ? '關閉背景音樂' : '播放背景音樂'"
    @click="handleClick"
  >
    <span class="text-base leading-none relative">
      ♪
      <span
        v-if="!bgm.isPlaying"
        class="absolute inset-0 flex items-center justify-center text-[#777]"
      >
        ／
      </span>
    </span>
  </button>
</template>
