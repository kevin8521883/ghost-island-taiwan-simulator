<script setup lang="ts">
import type { Character } from '~/types/game'

const { characters, startGame } = useGameEngine()
const selected = ref<Character | null>(null)

const confirmAndStart = () => {
  if (!selected.value) return
  startGame(selected.value)
  navigateTo('/game')
}
</script>

<template>
  <div class="min-h-dvh p-6 max-w-md mx-auto space-y-4">
    <header class="text-center space-y-1 pb-2">
      <h1 class="text-lg text-amber-400">選擇你的人生</h1>
      <p class="text-xs text-muted">每個身分都有不同的起點</p>
    </header>

    <div class="space-y-3">
      <CharacterCard
        v-for="c in characters"
        :key="c.id"
        :character="c"
        :selected="selected?.id === c.id"
        @select="selected = c"
      />
    </div>

    <div class="pt-4 space-y-2 sticky bottom-2">
      <PixelButton
        variant="primary"
        :disabled="!selected"
        @click="confirmAndStart"
      >
        {{ selected ? `以「${selected.name}」開局` : '請先選擇角色' }}
      </PixelButton>
      <PixelButton to="/">返回首頁</PixelButton>
    </div>
  </div>
</template>
