<script setup lang="ts">
const STORAGE_KEY = 'ghost-island-onboarded-v1'

const steps = [
  {
    title: '🎮 鬼島生存 30 天',
    body: '你會經歷 30 天的台灣社畜人生。每天會遇到一個事件、你的選擇會改變 6 個數值。',
  },
  {
    title: '📊 數值與關係',
    body: '畫面上方是你的 6 個基本數值（💰金錢、🔥壓力、❤️健康、😊快樂、📈職涯、👥評價），下面是跟主管、同事、家人的關係。',
  },
  {
    title: '🔗 連環事件 / 隱藏選項',
    body: '有些事件選了會在幾天後出現後續（例如借錢買幣可能被地下錢莊找上）。關係累積到 70+ 還會解鎖隱藏選項。',
  },
  {
    title: '🎁 道具與成就',
    body: '路上會碰到買道具的機會（維他命、健身房、PS5），會每天自動加數值。完成事情會解鎖成就、回首頁可看圖鑑。',
  },
  {
    title: '🏆 30 天後',
    body: '撐到第 30 天會依數值跑結局（12 種）。再玩可選 NG+ 起始 +5000、解鎖隱藏角色。Have fun。',
  },
]

const open = ref(false)
const step = ref(0)

const advance = () => {
  if (step.value < steps.length - 1) {
    step.value++
  } else {
    close()
  }
}

const close = () => {
  open.value = false
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, 'true')
  }
}

const skip = () => close()

onMounted(() => {
  if (!import.meta.client) return
  if (localStorage.getItem(STORAGE_KEY) !== 'true') {
    open.value = true
  }
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center px-6"
    >
      <div class="pixel-card-accent max-w-md w-full space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-[10px] text-muted">
            {{ step + 1 }} / {{ steps.length }}
          </p>
          <button
            class="text-[10px] text-muted underline"
            type="button"
            @click="skip"
          >
            跳過
          </button>
        </div>

        <h2 class="text-base text-amber-400 leading-relaxed">
          {{ steps[step].title }}
        </h2>
        <p class="text-sm leading-relaxed text-paper">
          {{ steps[step].body }}
        </p>

        <div class="h-1 bg-[#2a2a2a]">
          <div
            class="h-full bg-amber-400 transition-all duration-300"
            :style="{ width: ((step + 1) / steps.length) * 100 + '%' }"
          />
        </div>

        <PixelButton variant="primary" @click="advance">
          {{ step === steps.length - 1 ? '開始我的人生 →' : '繼續' }}
        </PixelButton>
      </div>
    </div>
  </Transition>
</template>
