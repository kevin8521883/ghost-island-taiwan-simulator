export interface Character {
  id: string
  name: string
  description?: string
  money: number
  stress: number
  health: number
  happiness: number
  career: number
  reputation: number
  /** 是否為隱藏角色，預設 false */
  hidden?: boolean
  /**
   * 解鎖條件：
   *   "random"        命運轉盤抽到才會出現
   *   "ending:<id>"   通關特定結局後解鎖
   */
  unlock?: string
}

export interface EventEffect {
  money?: number
  stress?: number
  health?: number
  happiness?: number
  career?: number
  reputation?: number
}

export interface EventTrigger {
  eventId: string
  afterDays: number
}

export interface EventChoice {
  text: string
  effects: EventEffect
  trigger?: EventTrigger
}

export interface GameEvent {
  id: string
  title: string
  description: string
  tags: string[]
  weight?: number
  /** 限定哪些角色才能抽到（character id 陣列）。undefined = 所有角色 */
  characters?: string[]
  /** 隨機池排除（只能被 chain trigger 觸發）。預設 false */
  chainOnly?: boolean
  /** 特殊日子：當 day === requiredDay 時必出此事件（仍受 characters 過濾）*/
  requiredDay?: number
  choices: EventChoice[]
}

export type StatKey =
  | 'money'
  | 'stress'
  | 'health'
  | 'happiness'
  | 'career'
  | 'reputation'

export interface PlayerStats {
  money: number
  stress: number
  health: number
  happiness: number
  career: number
  reputation: number
  day: number
}

export interface Range {
  lte?: number
  gte?: number
}

export interface EndingCondition {
  money?: Range
  stress?: Range
  health?: Range
  happiness?: Range
  career?: Range
  reputation?: Range
  day?: Range
}

export interface Ending {
  id: string
  title: string
  description: string
  priority: number
  condition: EndingCondition
  /** 在圖鑑中是否隱藏（未解鎖前顯示 ???） */
  hidden?: boolean
  /** 未解鎖時在圖鑑顯示的提示 */
  hint?: string
}

export interface LogEntry {
  day: number
  eventTitle: string
  choiceText: string
  effects: EventEffect
}

export interface ScheduledEvent {
  eventId: string
  triggerDay: number
}

export interface RunRecord {
  id: string
  endedAt: number
  characterId: string
  characterName: string
  endingId: string
  endingTitle: string
  day: number
  finalStats: PlayerStats
}
