/**
 * 六角雷達圖共用幾何 + 正規化。
 * StatHexagon.vue（SVG）與 useShareCard.ts（canvas）共用同一套算法、避免兩邊飄移。
 */
import type { PlayerStats } from '~/types/game'

export interface RadarAxis {
  key: keyof PlayerStats
  emoji: string
  label: string
  /** 正規化到 0-1 */
  norm: (s: PlayerStats) => number
  /** 顯示用數值字串 */
  fmt: (s: PlayerStats) => string
}

export const radarClamp = (v: number) => Math.max(0, Math.min(1, v))

/** 六軸（順時針、從正上方開始）。金錢正規化到同刻度、壓力保留真實值 */
export const RADAR_AXES: RadarAxis[] = [
  { key: 'money', emoji: '💰', label: '金錢', norm: (s) => radarClamp((s.money + 50000) / 250000), fmt: (s) => s.money.toLocaleString() },
  { key: 'career', emoji: '📈', label: '職涯', norm: (s) => radarClamp(s.career / 100), fmt: (s) => String(s.career) },
  { key: 'reputation', emoji: '👥', label: '評價', norm: (s) => radarClamp(s.reputation / 100), fmt: (s) => String(s.reputation) },
  { key: 'happiness', emoji: '😊', label: '快樂', norm: (s) => radarClamp(s.happiness / 100), fmt: (s) => String(s.happiness) },
  { key: 'health', emoji: '❤️', label: '健康', norm: (s) => radarClamp(s.health / 100), fmt: (s) => String(s.health) },
  { key: 'stress', emoji: '🔥', label: '壓力', norm: (s) => radarClamp(s.stress / 100), fmt: (s) => String(s.stress) },
]

/** 第 i 軸角度（弧度），從正上方 -90° 順時針每 60° */
export const radarAngle = (i: number) => (-90 + i * 60) * (Math.PI / 180)

/** 給中心點 + 半徑、算第 i 軸在 r（絕對半徑）的座標 */
export const radarPoint = (cx: number, cy: number, r: number, i: number) => ({
  x: cx + r * Math.cos(radarAngle(i)),
  y: cy + r * Math.sin(radarAngle(i)),
})

/** label text-anchor：靠左/中/右 */
export const radarAnchor = (i: number): 'start' | 'middle' | 'end' => {
  const cos = Math.cos(radarAngle(i))
  return Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
}
