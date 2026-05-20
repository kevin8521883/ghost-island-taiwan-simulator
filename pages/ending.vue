<script setup lang="ts">
const store = useGameStore()
const { findEnding } = useEndings()
const sfx = useSfx()
const shareCard = useShareCard()
const dex = useEndingDex()

const ending = computed(() => findEnding(store.endingId))
const wasNewUnlock = ref(false)
const newCharUnlock = ref<{ id: string; name: string } | null>(null)

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
  // 紀錄到圖鑑（如果是第一次拿到此結局或連動解鎖角色，標記新解鎖）
  const result = dex.recordUnlock(store.endingId)
  wasNewUnlock.value = result.newEnding
  if (result.newChar) {
    newCharUnlock.value = { id: result.newChar.id, name: result.newChar.name }
  }
  playAnimation()
})

const playAgain = () => {
  store.reset()
  navigateTo('/character')
}

const shareToast = ref<string>('')

const handleShare = async () => {
  if (!ending.value) return
  sfx.play('click')
  const result = await shareCard.share({
    ending: ending.value,
    stats: store.stats,
    character: store.selectedCharacter,
  })
  if (result === 'downloaded') {
    shareToast.value = '已下載結局圖'
  } else if (result === 'shared') {
    shareToast.value = '已開啟分享'
  } else if (shareCard.lastError) {
    shareToast.value = `產生失敗：${shareCard.lastError}`
  }
  if (shareToast.value) {
    setTimeout(() => (shareToast.value = ''), 3500)
  }
}

const handleDownload = () => {
  if (!ending.value) return
  sfx.play('click')
  const ok = shareCard.download({
    ending: ending.value,
    stats: store.stats,
    character: store.selectedCharacter,
  })
  if (ok) {
    shareToast.value = '已下載到本機'
  } else if (shareCard.lastError) {
    shareToast.value = `產生失敗：${shareCard.lastError}`
  }
  if (shareToast.value) {
    setTimeout(() => (shareToast.value = ''), 3500)
  }
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto flex flex-col justify-center space-y-6 relative">
    <EndingEffect :ending-id="store.endingId" />
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
        <div v-if="descDone && wasNewUnlock" class="pixel-card-accent text-center text-xs space-y-1 animate-pulse">
          <p class="text-amber-400">🎉 新解鎖結局！</p>
          <p class="text-muted">圖鑑進度：{{ dex.unlockedCount }} / {{ dex.total }}</p>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="descDone && newCharUnlock" class="pixel-card-accent text-center text-xs space-y-1">
          <p class="text-amber-400">🔓 解鎖隱藏人生：{{ newCharUnlock.name }}</p>
          <p class="text-muted">下次選擇人生時可以選</p>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="descDone" class="space-y-2">
          <PixelButton variant="primary" @click="playAgain">再玩一次</PixelButton>
          <PixelButton :disabled="shareCard.generating" @click="handleShare">
            {{ shareCard.generating ? '產生圖片中…' : '分享結局圖' }}
          </PixelButton>
          <PixelButton :disabled="shareCard.generating" @click="handleDownload">
            下載結局圖
          </PixelButton>
          <PixelButton to="/gallery">查看結局圖鑑</PixelButton>
          <PixelButton to="/">回到首頁</PixelButton>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="shareToast"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 pixel-card text-xs whitespace-nowrap z-50"
        >
          {{ shareToast }}
        </div>
      </Transition>
    </template>
  </div>
</template>
