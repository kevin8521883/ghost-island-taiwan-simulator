<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    /** 動畫時長（毫秒）*/
    duration?: number
    /** 格式化函式（如：(n) => n.toLocaleString()） */
    formatFn?: (n: number) => string
  }>(),
  { duration: 400 }
)

const display = ref(props.value)
let frame = 0

const animateTo = (target: number) => {
  const from = display.value
  if (from === target) return
  const startTime = performance.now()
  cancelAnimationFrame(frame)
  const tick = (now: number) => {
    const t = Math.min(1, (now - startTime) / props.duration)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = Math.round(from + (target - from) * eased)
    if (t < 1) {
      frame = requestAnimationFrame(tick)
    } else {
      display.value = target
    }
  }
  frame = requestAnimationFrame(tick)
}

watch(() => props.value, (v) => animateTo(v))

onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <span>{{ formatFn ? formatFn(display) : display }}</span>
</template>
