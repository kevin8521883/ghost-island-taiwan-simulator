/**
 * 封棺前續命 — 條件觸發
 *
 * 玩家中途撞到致命結局（過勞/健康崩潰/破產/躺平/創業崩盤）時，
 * 依「他這 30 天怎麼經營關係/資源」決定能用哪種方式續命。一局只有一次。
 *
 * 續命方式按優先序挑「最好的一個」：家人 > 同事 > 主管 > 自費 > 蠻牛硬撐（保底）。
 * 哪一條可用，取決於玩家之前的選擇 —— 因果是自己種的。
 */
import type { EventEffect, PlayerStats } from '~/types/game'

export interface ReviveMethod {
  id: string
  /** 視窗情境標題 */
  title: string
  /** 情境描述 */
  desc: string
  /** 續命按鈕文字 */
  buttonLabel: string
  /** 續命代價（相對 deltas，套用後會再強制脫離致命狀態）*/
  cost: EventEffect
}

const METHODS = {
  mom: (): ReviveMethod => ({
    id: 'mom',
    title: '手機在棺材般的寂靜裡亮起',
    desc: '你媽匯了 3 萬，訊息只有一句「錢夠不夠用」。你盯著那行字看了很久。',
    buttonLabel: '收下這筆錢，再撐撐看',
    cost: { money: 30000, family: -10, happiness: -5 },
  }),
  coworker: (): ReviveMethod => ({
    id: 'coworker',
    title: '同事發現你趴在工位上沒動',
    desc: '他默默幫你打了卡、把今天的活接了過去，什麼也沒問。',
    buttonLabel: '欠他一個人情，撐下去',
    cost: { coworker: -8, reputation: -5 },
  }),
  boss: (): ReviveMethod => ({
    id: 'boss',
    title: '主管難得說了句人話',
    desc: '「你先去休息幾天，這邊我擋著。」你不確定該感動還是該怕。',
    buttonLabel: '請特休、喘一口氣',
    cost: { boss: -6, career: -6 },
  }),
  selfpay: (): ReviveMethod => ({
    id: 'selfpay',
    title: '救護車的紅光打在天花板上',
    desc: '你刷卡住進自費病房，點滴一滴一滴。錢能買回的，就先買回來。',
    buttonLabel: '花錢買一條命',
    cost: { money: -25000, happiness: -3 },
  }),
  energy_drink: (): ReviveMethod => ({
    id: 'energy_drink',
    title: '便利商店的燈白得刺眼',
    desc: '沒人接你電話。你灌下第三瓶蠻牛，手在抖，但還站著。',
    buttonLabel: '硬撐，沒有別的選項了',
    cost: { health: -15, stress: -5 },
  }),
}

/** 依玩家當前 stats 決定可用的續命方式（保底一定有 energy_drink）*/
export const pickReviveMethod = (stats: PlayerStats): ReviveMethod => {
  if (stats.family >= 60) return METHODS.mom()
  if (stats.coworker >= 60) return METHODS.coworker()
  if (stats.boss >= 60) return METHODS.boss()
  if (stats.money >= 50000) return METHODS.selfpay()
  return METHODS.energy_drink()
}
