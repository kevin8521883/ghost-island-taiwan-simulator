export interface Character {
  id: string
  name: string
  description?: string
  /** 顯示用 emoji 頭像（若 public/portraits/<id>.png 存在則優先用圖檔）*/
  emoji?: string
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
  /** 跟主管的關係（0-100，起始 50）*/
  boss?: number
  /** 跟同事的關係（0-100，起始 50）*/
  coworker?: number
  /** 跟家人的關係（0-100，起始 50）*/
  family?: number
}

/** 選項解鎖條件：必須滿足才會出現此選項 */
export interface ChoiceCondition {
  money?: Range
  stress?: Range
  health?: Range
  happiness?: Range
  career?: Range
  reputation?: Range
  boss?: Range
  coworker?: Range
  family?: Range
}

export interface EventOutcome {
  eventId: string
  weight: number
}

export interface EventTrigger {
  afterDays: number
  /** 固定觸發單一事件（舊用法、和 outcomes 二擇一）*/
  eventId?: string
  /** 機率觸發其中一個（加權隨機抽、覆寫 eventId）*/
  outcomes?: EventOutcome[]
}

export interface PlayerBuff {
  /** buff 唯一 id（通常對應 item id）*/
  id: string
  name: string
  icon: string
  /** 剩餘天數、-1 = 永久 */
  daysRemaining: number
  /** 每天 advanceDay 時套用的 effects */
  perDayEffects: EventEffect
}

export interface EventChoice {
  text: string
  effects: EventEffect
  trigger?: EventTrigger
  /** 解鎖條件、未滿足則選項不出現 */
  condition?: ChoiceCondition
  /** 選擇後獲得的 buff（會加進 stats.buffs）*/
  grantBuff?: PlayerBuff
}

export type TimeSlot = 'morning' | 'noon' | 'evening'

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
  /** 限定時段（undefined = 任何時段都可抽）*/
  timeOfDay?: TimeSlot
  /** 解鎖條件、stats 達標才會出現在隨機池（chain 觸發不受影響）*/
  condition?: ChoiceCondition
  /** 這個事件是 AI 即時產生的（影響 UI 顯示） */
  aiGenerated?: boolean
  choices: EventChoice[]
}

export type StatKey =
  | 'money'
  | 'stress'
  | 'health'
  | 'happiness'
  | 'career'
  | 'reputation'
  | 'boss'
  | 'coworker'
  | 'family'

export interface PlayerStats {
  money: number
  stress: number
  health: number
  happiness: number
  career: number
  reputation: number
  day: number
  /** 一天三時段：morning / noon / evening */
  timeOfDay: TimeSlot
  /** 跟主管的關係（0-100，預設 50）*/
  boss: number
  /** 跟同事的關係（0-100，預設 50）*/
  coworker: number
  /** 跟家人的關係（0-100，預設 50）*/
  family: number
  /** 已持有的 buff（道具效果）*/
  buffs: PlayerBuff[]
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

export interface EndingVariant {
  title?: string
  description?: string
}

export type EndingMood = 'normal' | 'happy' | 'sad' | 'stressed'

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
  /** 依職業 override 的標題/描述（key 是 character id） */
  variants?: Record<string, EndingVariant>
  /** 角色在這個結局頁的情緒（影響 portrait 動畫） */
  mood?: EndingMood
}

export interface AchievementTrigger {
  type:
    | 'stat'           // stats[key] 達到 gte / lte
    | 'event_seen'     // 看過 eventIds 中任一個
    | 'ending'         // 達成 endingIds 中任一個
    | 'ending_with_char' // 用特定 character 達成特定 ending
    | 'ending_with_char_mood' // 用特定 character 達成某 mood 的 ending
    | 'all_endings'    // 解鎖全部結局
    | 'meta_endings_all' // 解鎖列表內所有結局
    | 'hidden_chars_count' // 解鎖隱藏角色數
    | 'total_runs'     // 累計遊戲場數
    | 'ai_event'       // 觸發過 AI 事件
    | 'choice_count'   // 累計選擇符合 matches 的次數
  key?: string         // for stat
  gte?: number
  lte?: number
  eventIds?: string[]
  endingIds?: string[]
  endingId?: string
  characterId?: string
  mood?: string
  count?: number
  matches?: string[]
}

export interface Achievement {
  id: string
  title: string
  icon: string
  description: string
  hint?: string
  trigger: AchievementTrigger
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
