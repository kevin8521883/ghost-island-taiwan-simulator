/**
 * 連抽日曆 + 今日運勢
 *
 * - 今日運勢：依「真實日期」決定（同一天所有 session 拿到同一個運勢、像真的農民曆）。
 *   開局時 startGame 會把運勢的 buff push 進 stats.buffs。
 * - 連抽 streak：每天回訪首頁就 +1，斷一天歸零。純 localStorage、跨局保留。
 */
import fortunesData from '~/data/fortunes.json'
import type { PlayerBuff } from '~/types/game'

export interface Fortune {
  id: string
  emoji: string
  good: string
  bad: string
  buff: PlayerBuff
}

const FORTUNES = fortunesData as Fortune[]

const STREAK_KEY = 'ghost-island-streak-v1'

interface StreakData {
  lastDate: string // YYYY-MM-DD
  streak: number
  best: number
}

const todayKey = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dayDiff = (fromKey: string, toKey: string): number => {
  const from = new Date(fromKey + 'T00:00:00')
  const to = new Date(toKey + 'T00:00:00')
  return Math.round((to.getTime() - from.getTime()) / 86400000)
}

// 用日期字串 hash 出穩定 index（同一天必同一運勢）
const hashStr = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const loadStreak = (): StreakData => {
  if (!import.meta.client) return { lastDate: '', streak: 0, best: 0 }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return { lastDate: '', streak: 0, best: 0 }
    const d = JSON.parse(raw)
    return {
      lastDate: typeof d.lastDate === 'string' ? d.lastDate : '',
      streak: typeof d.streak === 'number' ? d.streak : 0,
      best: typeof d.best === 'number' ? d.best : 0,
    }
  } catch (_) {
    return { lastDate: '', streak: 0, best: 0 }
  }
}

const persistStreak = (d: StreakData) => {
  if (!import.meta.client) return
  localStorage.setItem(STREAK_KEY, JSON.stringify(d))
}

export const useDailyFortune = () => {
  const streak = useState<number>('daily-streak', () => loadStreak().streak)
  const best = useState<number>('daily-streak-best', () => loadStreak().best)
  /** 今天是否已經算過 streak（避免同日重複觸發成就） */
  const countedToday = useState<boolean>('daily-streak-counted', () => false)

  const todayFortune = computed<Fortune>(() => {
    const idx = hashStr(todayKey()) % FORTUNES.length
    return FORTUNES[idx]
  })

  /**
   * 回訪打卡：更新連抽 streak。回傳這次的 streak 數。
   * 同一天多次呼叫只算一次。
   */
  const touchStreak = (): number => {
    if (!import.meta.client) return streak.value
    const today = todayKey()
    const data = loadStreak()

    if (data.lastDate === today) {
      // 今天已經算過
      streak.value = data.streak
      best.value = data.best
      countedToday.value = true
      return data.streak
    }

    let next: number
    if (data.lastDate === '') {
      next = 1
    } else {
      const diff = dayDiff(data.lastDate, today)
      next = diff === 1 ? data.streak + 1 : 1
    }
    const nextBest = Math.max(data.best, next)
    persistStreak({ lastDate: today, streak: next, best: nextBest })
    streak.value = next
    best.value = nextBest
    countedToday.value = true
    return next
  }

  const refresh = () => {
    const d = loadStreak()
    streak.value = d.streak
    best.value = d.best
  }

  const reset = () => {
    streak.value = 0
    best.value = 0
    countedToday.value = false
    if (import.meta.client) localStorage.removeItem(STREAK_KEY)
  }

  return reactive({
    streak,
    best,
    todayFortune,
    touchStreak,
    refresh,
    reset,
  })
}
