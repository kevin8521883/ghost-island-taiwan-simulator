<script setup lang="ts">
import type { Character } from '~/types/game'

const { characters, startGame } = useGameEngine()
const dex = useEndingDex()
const sfx = useSfx()

const selected = ref<Character | null>(null)
const spinning = ref(false)
const spinDisplay = ref<Character | null>(null)
const spinTick = ref(0)
const settled = ref(false)
const spinUnlockedRichKid = ref(false)
const spinResult = ref<Character | null>(null)

onMounted(() => {
  dex.refresh()
})

const visibleCharacters = computed(() => {
  return characters.filter((c) => !c.hidden || dex.isCharUnlocked(c.id))
})

const confirmAndStart = () => {
  if (!selected.value) return
  startGame(selected.value)
  navigateTo('/game')
}

const spinAndStart = async () => {
  if (spinning.value) return
  sfx.play('click')
  spinning.value = true
  settled.value = false
  spinUnlockedRichKid.value = false
  spinResult.value = null
  spinTick.value = 0

  // 決定結果
  const rand = Math.random()
  let result: Character | undefined
  if (rand < 0.05) {
    result = characters.find((c) => c.id === 'rich_kid')
    if (result && !dex.isCharUnlocked('rich_kid')) {
      dex.unlockCharacter('rich_kid')
      spinUnlockedRichKid.value = true
    }
  }
  if (!result) {
    const pool = visibleCharacters.value
    result = pool[Math.floor(Math.random() * pool.length)]
  }
  if (!result) {
    spinning.value = false
    return
  }

  // 動畫池（已解鎖角色 + 富二代如果首次抽中也加入給 cycle）
  const cyclePool = characters.filter(
    (c) => !c.hidden || dex.isCharUnlocked(c.id)
  )
  // spin tick：漸慢的隨機切換
  let delay = 55
  const totalTicks = 16
  for (let i = 0; i < totalTicks; i++) {
    let pick = cyclePool[Math.floor(Math.random() * cyclePool.length)] ?? null
    // 避免連續顯示同一個
    if (pick && spinDisplay.value && pick.id === spinDisplay.value.id) {
      pick = cyclePool[(cyclePool.indexOf(pick) + 1) % cyclePool.length] ?? pick
    }
    spinDisplay.value = pick
    spinTick.value++
    // 每 4 tick 播一次音效，模擬轉盤聲
    if (i % 4 === 0) sfx.play('click')
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay + 22, 240)
  }

  // 定格
  spinDisplay.value = result
  spinResult.value = result
  settled.value = true
  sfx.play('click')

  await new Promise((r) => setTimeout(r, spinUnlockedRichKid.value ? 2200 : 1200))

  spinning.value = false
  startGame(result)
  navigateTo('/game')
}
</script>

<template>
  <div class="min-h-dvh pt-14 px-6 pb-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-1 pb-2">
      <h1 class="text-lg text-amber-400">選擇你的人生</h1>
      <p class="text-xs text-muted">每個身分都有不同的起點</p>
      <p
        v-if="dex.unlockedCharCount > 0"
        class="text-[10px] text-muted pt-1"
      >
        已解鎖隱藏角色：{{ dex.unlockedCharCount }} / {{ dex.totalChars }}
      </p>
    </header>

    <div class="space-y-3">
      <div v-for="c in visibleCharacters" :key="c.id" class="relative">
        <span
          v-if="c.hidden"
          class="absolute top-2 right-2 z-10 text-[9px] bg-amber-400 text-black px-2 py-0.5 font-bold"
        >
          隱藏
        </span>
        <CharacterCard
          :character="c"
          :selected="selected?.id === c.id"
          @select="selected = c"
        />
      </div>
    </div>

    <div class="pt-4 space-y-2 sticky bottom-2">
      <PixelButton
        variant="primary"
        :disabled="!selected"
        @click="confirmAndStart"
      >
        {{ selected ? `以「${selected.name}」開局` : '請先選擇角色' }}
      </PixelButton>
      <PixelButton @click="spinAndStart">🎲 命運轉盤（隨機）</PixelButton>
      <PixelButton to="/">返回首頁</PixelButton>
    </div>

    <Transition name="fade">
      <div
        v-if="spinning"
        class="fixed inset-0 z-50 bg-black/95 crt-scanline flex items-center justify-center px-6"
      >
        <div
          class="pixel-card-accent w-full max-w-sm text-center space-y-4 p-8"
          :class="{ 'celebrate-flash': settled && spinUnlockedRichKid }"
        >
          <p class="text-[11px] text-amber-400 tracking-widest">
            {{ settled ? '◆ 命運已定 ◆' : '抽選中…' }}
          </p>
          <h2
            :key="settled ? 'final' : spinTick"
            :class="settled ? 'spin-settle' : 'spin-tick'"
            class="text-3xl text-amber-400 leading-tight min-h-[1.5em] font-bold"
          >
            {{ spinDisplay?.name ?? '?' }}
          </h2>
          <p class="text-xs text-paper leading-relaxed min-h-[3.5em] px-2">
            {{ settled ? (spinDisplay?.description ?? '') : '' }}
          </p>
          <p
            v-if="spinUnlockedRichKid && settled"
            class="text-xs text-amber-400 pt-2"
          >
            🔓 永久解鎖：{{ spinResult?.name }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>
