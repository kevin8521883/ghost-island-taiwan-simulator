<script setup lang="ts">
import type { PlayerStats } from '~/types/game'

interface Props {
  stats: PlayerStats
}
const props = defineProps<Props>()

const CX = 120
const CY = 120
const MAX_R = 78
const LABEL_R = 100

// 六軸（順時針，從正上方開始）。norm() 把各值正規化到 0-1
const AXES: {
  key: keyof PlayerStats
  emoji: string
  label: string
  norm: (s: PlayerStats) => number
  fmt: (s: PlayerStats) => string
}[] = [
  { key: 'money', emoji: '💰', label: '金錢', norm: (s) => clamp((s.money + 50000) / 250000), fmt: (s) => s.money.toLocaleString() },
  { key: 'career', emoji: '📈', label: '職涯', norm: (s) => clamp(s.career / 100), fmt: (s) => String(s.career) },
  { key: 'reputation', emoji: '👥', label: '評價', norm: (s) => clamp(s.reputation / 100), fmt: (s) => String(s.reputation) },
  { key: 'happiness', emoji: '😊', label: '快樂', norm: (s) => clamp(s.happiness / 100), fmt: (s) => String(s.happiness) },
  { key: 'health', emoji: '❤️', label: '健康', norm: (s) => clamp(s.health / 100), fmt: (s) => String(s.health) },
  { key: 'stress', emoji: '🔥', label: '壓力', norm: (s) => clamp(s.stress / 100), fmt: (s) => String(s.stress) },
]

function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

// 第 i 軸的角度（弧度），從正上方 -90° 順時針
const angleOf = (i: number) => (-90 + i * 60) * (Math.PI / 180)

const pointAt = (i: number, r: number) => {
  const a = angleOf(i)
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

// 背景網格（4 圈同心六邊形）
const gridLevels = [0.25, 0.5, 0.75, 1]
const gridPolys = computed(() =>
  gridLevels.map((lv) =>
    AXES.map((_, i) => {
      const p = pointAt(i, MAX_R * lv)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')
  )
)

// 軸線（中心到頂點）
const spokes = computed(() => AXES.map((_, i) => pointAt(i, MAX_R)))

// 資料多邊形頂點
const dataPoints = computed(() =>
  AXES.map((ax, i) => {
    const r = MAX_R * ax.norm(props.stats)
    return pointAt(i, r)
  })
)
const dataPolyStr = computed(() =>
  dataPoints.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
)

// 軸標籤位置 + 對齊
const labels = computed(() =>
  AXES.map((ax, i) => {
    const p = pointAt(i, LABEL_R)
    const cos = Math.cos(angleOf(i))
    const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
    return {
      ...ax,
      x: p.x,
      y: p.y,
      anchor,
      value: ax.fmt(props.stats),
    }
  })
)
</script>

<template>
  <div class="hex-wrap pixel-card">
    <p class="text-amber-400 text-xs pb-1">這一局的人生形狀</p>
    <svg viewBox="0 0 240 240" class="hex-svg">
      <!-- 網格 -->
      <g class="hex-grid">
        <polygon
          v-for="(poly, i) in gridPolys"
          :key="'g' + i"
          :points="poly"
          fill="none"
          stroke="#333"
          stroke-width="1"
        />
        <line
          v-for="(p, i) in spokes"
          :key="'s' + i"
          :x1="CX"
          :y1="CY"
          :x2="p.x"
          :y2="p.y"
          stroke="#333"
          stroke-width="1"
        />
      </g>

      <!-- 資料多邊形（從中心長出來）-->
      <g class="hex-data">
        <polygon
          :points="dataPolyStr"
          fill="rgba(251, 191, 36, 0.25)"
          stroke="#fbbf24"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <circle
          v-for="(p, i) in dataPoints"
          :key="'v' + i"
          class="hex-vertex"
          :cx="p.x"
          :cy="p.y"
          r="3.5"
          fill="#fbbf24"
          :style="{ animationDelay: 0.55 + i * 0.06 + 's' }"
        />
      </g>

      <!-- 標籤 + 數值 -->
      <g class="hex-labels">
        <text
          v-for="(l, i) in labels"
          :key="'l' + i"
          :x="l.x"
          :y="l.y"
          :text-anchor="l.anchor"
          class="hex-label-text"
          :style="{ animationDelay: 0.7 + i * 0.06 + 's' }"
        >
          <tspan :x="l.x" dy="-2">{{ l.emoji }}{{ l.label }}</tspan>
          <tspan :x="l.x" dy="13" class="hex-label-val">{{ l.value }}</tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hex-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hex-svg {
  width: 100%;
  max-width: 280px;
  height: auto;
  overflow: visible;
}

/* 網格淡入 */
.hex-grid {
  opacity: 0;
  animation: hex-fade 0.5s ease both;
}

/* 資料多邊形：從中心長出來（帶 overshoot 彈跳）*/
.hex-data {
  transform-origin: 120px 120px;
  animation: hex-grow 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
@keyframes hex-grow {
  0% { transform: scale(0); opacity: 0; }
  60% { opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* 頂點圓點 pop */
.hex-vertex {
  transform-box: fill-box;
  transform-origin: center;
  animation: hex-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
@keyframes hex-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* 標籤淡入 */
.hex-label-text {
  fill: #e8e6e3;
  font-size: 11px;
  opacity: 0;
  animation: hex-fade 0.4s ease both;
}
.hex-label-val {
  fill: #fbbf24;
  font-size: 12px;
  font-weight: bold;
}
@keyframes hex-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .hex-grid, .hex-data, .hex-vertex, .hex-label-text {
    animation-duration: 0.01s;
    animation-delay: 0s;
  }
}
</style>
