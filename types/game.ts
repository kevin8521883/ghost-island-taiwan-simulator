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
}

export interface EventEffect {
  money?: number
  stress?: number
  health?: number
  happiness?: number
  career?: number
  reputation?: number
}

export interface EventChoice {
  text: string
  effects: EventEffect
}

export interface GameEvent {
  id: string
  title: string
  description: string
  tags: string[]
  weight?: number
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
}

export interface LogEntry {
  day: number
  eventTitle: string
  choiceText: string
  effects: EventEffect
}
