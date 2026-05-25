<script setup lang="ts">
const store = useGameStore()
const { findEnding } = useEndings()
const sfx = useSfx()
const shareCard = useShareCard()
const dex = useEndingDex()
const endingStats = useEndingStats()

const ending = computed(() =>
  findEnding(store.endingId, store.selectedCharacter?.id ?? null)
)
const wasNewUnlock = ref(false)
const newCharUnlock = ref<{ id: string; name: string } | null>(null)

const titleShown = ref('')
const descShown = ref('')
const titleDone = ref(false)
const descDone = ref(false)
let cancelToken = { stop: false }

const aiNarrativeLoading = ref(false)
const aiNarrativeError = ref(false)
const aiNarrative = computed(() => store.endingNarrative)

const fetchAiNarrative = async () => {
  if (!ending.value || !store.selectedCharacter) return
  if (store.endingNarrative) return
  aiNarrativeLoading.value = true
  aiNarrativeError.value = false
  try {
    const res = await $fetch<{ narrative: string | null; error?: string }>(
      '/api/generate-ending',
      {
        method: 'POST',
        body: {
          character: {
            id: store.selectedCharacter.id,
            name: store.selectedCharacter.name,
            description: store.selectedCharacter.description,
          },
          ending: {
            id: ending.value.id,
            title: ending.value.title,
            description: ending.value.description,
          },
          stats: store.stats,
          log: store.log.map((l) => ({
            day: l.day,
            eventTitle: l.eventTitle,
            choiceText: l.choiceText,
          })),
        },
      }
    )
    if (res.narrative) {
      store.setEndingNarrative(res.narrative)
    } else {
      aiNarrativeError.value = true
    }
  } catch (_e) {
    aiNarrativeError.value = true
  } finally {
    aiNarrativeLoading.value = false
  }
}

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
  // 描述跑完才 fetch AI 個人化敘述（避免一進頁面就 spinner）
  fetchAiNarrative()
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
  const result = dex.recordUnlock(
    store.endingId,
    store.selectedCharacter?.id ?? null
  )
  wasNewUnlock.value = result.newEnding
  if (result.newChar) {
    newCharUnlock.value = { id: result.newChar.id, name: result.newChar.name }
  }
  // 全球統計：先上報、再抓資料（順序執行讓玩家看到自己 +1 後的數字）
  ;(async () => {
    await endingStats.submit(store.endingId!, store.selectedCharacter?.id ?? null)
    await endingStats.fetchAll()
  })()
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
        <div class="flex items-center gap-3">
          <CharacterPortrait
            v-if="store.selectedCharacter"
            :character="store.selectedCharacter"
            size="md"
            :mood="ending?.mood ?? 'normal'"
          />
          <div class="flex-1 min-w-0">
            <p class="text-[10px] text-muted">{{ store.selectedCharacter?.name }}</p>
            <p class="text-[11px] text-amber-400">第 {{ store.stats.day }} 天 · 結局</p>
          </div>
        </div>
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
        <div
          v-if="descDone && (aiNarrativeLoading || aiNarrative)"
          class="pixel-card-accent space-y-2"
        >
          <p class="text-[11px] text-purple-300">⚡ 你的故事</p>
          <div
            v-if="aiNarrativeLoading"
            class="flex items-center gap-2 text-xs text-muted"
          >
            <span class="ai-dot-bounce">·</span>
            <span class="ai-dot-bounce" style="animation-delay: 0.15s">·</span>
            <span class="ai-dot-bounce" style="animation-delay: 0.3s">·</span>
            <span class="pl-2">回顧你的 30 天…</span>
          </div>
          <p
            v-else-if="aiNarrative"
            class="text-sm leading-relaxed text-paper"
          >
            {{ aiNarrative }}
          </p>
        </div>
      </Transition>

      <Transition name="fade">
        <EndingStatsBar v-if="descDone && ending" :ending="ending" />
      </Transition>

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
