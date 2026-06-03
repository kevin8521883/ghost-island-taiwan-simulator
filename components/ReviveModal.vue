<script setup lang="ts">
import type { ReviveMethod } from '~/composables/useRevive'
import type { EventEffect } from '~/types/game'

interface Props {
  method: ReviveMethod
}
const props = defineProps<Props>()
const emit = defineEmits<{ revive: []; accept: [] }>()

const statLabel: Record<string, string> = {
  money: '💰 金錢',
  stress: '🔥 壓力',
  health: '❤️ 健康',
  happiness: '😊 快樂',
  career: '📈 職涯',
  reputation: '👥 評價',
  boss: '👔 主管',
  coworker: '🧑‍🤝‍🧑 同事',
  family: '🏠 家人',
}

// stress 反向：負 = 好
const isGood = (k: string, v: number) => (k === 'stress' ? v < 0 : v > 0)

const costRows = computed(() =>
  (Object.keys(props.method.cost) as (keyof EventEffect)[])
    .filter((k) => (props.method.cost[k] ?? 0) !== 0)
    .map((k) => ({ key: k, val: props.method.cost[k] as number }))
)
</script>

<template>
  <Teleport to="body">
    <div class="revive-overlay">
      <div class="revive-card pixel-card-accent">
        <p class="text-[11px] text-rose-400 tracking-widest text-center">
          ⚰️ 封棺前一刻
        </p>
        <h2 class="text-base text-amber-400 leading-relaxed text-center">
          {{ method.title }}
        </h2>
        <p class="text-xs text-paper leading-relaxed">
          {{ method.desc }}
        </p>

        <div class="border-t border-[#333] pt-2 space-y-1">
          <p class="text-[10px] text-muted">續命代價</p>
          <ul class="text-xs space-y-0.5">
            <li
              v-for="row in costRows"
              :key="row.key"
              class="flex justify-between"
            >
              <span>{{ statLabel[row.key] ?? row.key }}</span>
              <span :class="isGood(row.key, row.val) ? 'text-green-400' : 'text-red-400'">
                {{ row.val > 0 ? '+' : '' }}{{ row.val.toLocaleString() }}
              </span>
            </li>
          </ul>
          <p class="text-[10px] text-muted pt-0.5">
            ＋瀕死的數值會被穩住、但你仍站在邊緣
          </p>
        </div>

        <div class="space-y-2 pt-1">
          <PixelButton variant="primary" @click="emit('revive')">
            {{ method.buttonLabel }}
          </PixelButton>
          <PixelButton @click="emit('accept')">放棄，接受結局</PixelButton>
        </div>
        <p class="text-[10px] text-muted text-center">一局只能續命一次</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.revive-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.revive-card {
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: revive-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes revive-in {
  0% { transform: scale(0.85) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
</style>
