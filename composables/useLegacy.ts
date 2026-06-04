/**
 * 跨局記憶（輪迴）— 把一次次重玩串成「社畜輪迴」敘事。
 *
 * 不另存資料：直接從既有的 useRunHistory（每局結局/角色/天數）+ endings.json 衍生
 * 「前情提要」與輪迴次數。第一次玩（無歷史）→ hasPast=false、不顯示。
 */
import endingsData from '~/data/endings.json'
import type { Ending } from '~/types/game'

const ALL_ENDINGS = endingsData as Ending[]

export const useLegacy = () => {
  const history = useRunHistory()

  const hasPast = computed(() => history.totalRuns > 0)
  /** 即將開始的是第幾輩子 */
  const reincarnation = computed(() => history.totalRuns + 1)
  /** 最近一局（runs 是新→舊排序）*/
  const lastRun = computed(() => history.runs[0] ?? null)
  const lastEnding = computed<Ending | null>(() => {
    const r = lastRun.value
    if (!r) return null
    return ALL_ENDINGS.find((e) => e.id === r.endingId) ?? null
  })

  /** 一句「前情提要」，依上局結局情緒換口氣 */
  const recap = computed<string | null>(() => {
    const r = lastRun.value
    const e = lastEnding.value
    if (!r || !e) return null
    const title = e.title
    const day = r.day
    if (e.fatal || e.mood === 'sad') {
      return `上一輩子，你「${title}」，撐到第 ${day} 天就倒了。這輩子，學乖嗎？`
    }
    if (e.mood === 'happy') {
      return `上一輩子，你「${title}」（第 ${day} 天）。要再贏一次，還是換條路走？`
    }
    return `上一輩子，你「${title}」，撐到第 ${day} 天。這輩子，重新來過。`
  })

  const refresh = () => history.refresh()

  return reactive({ hasPast, reincarnation, lastRun, lastEnding, recap, refresh })
}
