<script setup lang="ts">
const store = useGameStore()
const { findEnding } = useEndings()
const sfx = useSfx()

const ending = computed(() => findEnding(store.endingId))

const titleShown = ref('')
const descShown = ref('')
const titleDone = ref(false)
const descDone = ref(false)
let cancelToken = { stop: false }

const typewrite = async (
  text: string,
  setter: (v: string) => void,
  delayMs: number,
  token: { stop: boolean }
) => {
  setter('')
  for (let i = 0; i < text.length; i++) {
    if (token.stop) {
      setter(text)
      return
    }
    setter(text.slice(0, i + 1))
    await new Promise((r) => setTimeout(r, delayMs))
  }
}

const playAnimation = async () => {
  if (!ending.value) return
  cancelToken = { stop: false }
  titleDone.value = false
  descDone.value = false
  await typewrite(ending.value.title, (v) => (titleShown.value = v), 80, cancelToken)
  titleDone.value = true
  await new Promise((r) => setTimeout(r, 250))
  await typewrite(
    ending.value.description,
    (v) => (descShown.value = v),
    28,
    cancelToken
  )
  descDone.value = true
}

const skip = () => {
  if (descDone.value) return
  cancelToken.stop = true
  if (ending.value) {
    titleShown.value = ending.value.title
    descShown.value = ending.value.description
    titleDone.value = true
    descDone.value = true
  }
}

onMounted(() => {
  store.hydrate()
  if (!store.endingId) {
    navigateTo('/')
    return
  }
  playAnimation()
})

const playAgain = () => {
  store.reset()
  navigateTo('/character')
}

const shareText = computed(() => {
  if (!ending.value) return ''
  return `我在《鬼島台灣模擬器：社畜篇》第 ${store.stats.day} 天迎來「${ending.value.title}」結局。`
})

const share = async () => {
  sfx.play('click')
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: '鬼島台灣模擬器', text: shareText.value })
    } catch (_) {
      // user cancelled
    }
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareText.value)
    alert('結果已複製到剪貼簿')
  }
}
</script>

<template>
  <div class="min-h-dvh p-6 max-w-md mx-auto flex flex-col justify-center space-y-6">
    <template v-if="ending">
      <div class="pixel-card-accent space-y-3" @click="skip">
        <p class="text-[11px] text-amber-400">第 {{ store.stats.day }} 天 · 結局</p>
        <h1 class="text-xl text-amber-400 leading-relaxed min-h-[2em]">
          {{ titleShown }}<span
            v-if="!titleDone"
            class="typing-cursor text-amber-400"
          >▍</span>
        </h1>
        <p class="text-sm leading-relaxed text-paper min-h-[6em]">
          {{ descShown }}<span
            v-if="titleDone && !descDone"
            class="typing-cursor text-paper"
          >▍</span>
        </p>
        <p v-if="!descDone" class="text-[10px] text-muted text-right pt-1">
          點擊跳過
        </p>
      </div>

      <Transition name="fade">
        <div v-if="descDone" class="pixel-card text-xs space-y-1">
          <p class="text-amber-400 pb-2">最終數值</p>
          <p>💰 金錢 {{ store.stats.money.toLocaleString() }}</p>
          <p>🔥 壓力 {{ store.stats.stress }}</p>
          <p>❤️ 健康 {{ store.stats.health }}</p>
          <p>😊 快樂 {{ store.stats.happiness }}</p>
          <p>📈 職涯 {{ store.stats.career }}</p>
          <p>👥 評價 {{ store.stats.reputation }}</p>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="descDone" class="space-y-2">
          <PixelButton variant="primary" @click="playAgain">再玩一次</PixelButton>
          <PixelButton @click="share">分享結果</PixelButton>
          <PixelButton to="/">回到首頁</PixelButton>
        </div>
      </Transition>
    </template>
  </div>
</template>
