import OpenAI from 'openai'
import type { GameEvent } from '~/types/game'

interface RequestBody {
  character: {
    id: string
    name: string
    description?: string
  }
  stats: {
    money: number
    stress: number
    health: number
    happiness: number
    career: number
    reputation: number
    day: number
  }
  lastEventTitles?: string[]
}

const SYSTEM_PROMPT = `你是《鬼島台灣模擬器：社畜篇》的事件生成器，產生符合台灣黑色幽默的單一事件。

【嚴格字數限制 — 超過會被 reject】
- title: 18-30 字，必須是一個完整句子，可帶引號、副標、誇飾
- description: 30-60 字，1-2 句通順中文，營造情境
- 每個 choice text: 8-18 字，**必須是完整動作短句、不可斷句**

【格式規則】
- choices 必須 **正好 3 個**，每個都要明顯的 trade-off
- effects 數值範圍：
  - money: -8000 ~ +5000（一般 ±2000）
  - stress / health / happiness / career / reputation: -15 ~ +15（一般 ±5 ~ ±10）
- 三個 choice 中，至少一個顯著扣 stress / happiness，至少一個顯著加（trade-off）

【風格 — 台灣口語黑色幽默】
- 用詞要正確（「結帳」不是「了帳」、「對嗆」不是「對沖」）
- 場景具體（哪家店、什麼時間、誰說了什麼）
- 結尾留白或反差（不要硬塞道理）
- 避免：政治真人、自殺、性暴力、無病呻吟

【優秀範例】

範例 A（office_worker，day 13）：
{
  "title": "主管的主管 LINE：『辛苦你了，幫我看一下這份報告』",
  "description": "凌晨 1 點。附件 60 頁。明早 9 點要回。",
  "choices": [
    { "text": "回『我看一下』、整夜不睡", "effects": { "stress": 12, "health": -8, "career": 5 } },
    { "text": "已讀不回、明早再說", "effects": { "stress": -3, "career": -5, "reputation": -3 } },
    { "text": "回『太晚了、明天上班看』", "effects": { "stress": 5, "career": -2, "reputation": 1 } }
  ]
}

範例 B（delivery_rider，day 13）：
{
  "title": "客人取餐時罵你慢、給一星評價",
  "description": "你提早 5 分鐘到、是他自己下樓晚了 10 分鐘。",
  "choices": [
    { "text": "向平台申訴、附 GPS 紀錄", "effects": { "stress": 8, "money": 50, "reputation": 2 } },
    { "text": "私訊跟客人對嗆", "effects": { "stress": -3, "happiness": 5, "reputation": -5 } },
    { "text": "認了、跑下一單", "effects": { "stress": 3, "money": 150 } }
  ]
}

請依玩家的身分、當前數值、最近事件，產生 1 個全新的事件。`

const TOOL_SCHEMA = {
  type: 'function' as const,
  function: {
    name: 'create_event',
    description: '為遊戲產生一個全新的事件',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '事件標題，35 字以內',
        },
        description: {
          type: 'string',
          description: '事件情境描述，80 字以內',
        },
        choices: {
          type: 'array',
          minItems: 2,
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', description: '選項文字，20 字以內' },
              effects: {
                type: 'object',
                properties: {
                  money: { type: 'integer' },
                  stress: { type: 'integer' },
                  health: { type: 'integer' },
                  happiness: { type: 'integer' },
                  career: { type: 'integer' },
                  reputation: { type: 'integer' },
                },
              },
            },
            required: ['text', 'effects'],
          },
        },
      },
      required: ['title', 'description', 'choices'],
    },
  },
}

const sanitizeNumber = (v: unknown, max: number): number => {
  const n = typeof v === 'number' ? v : 0
  if (!Number.isFinite(n)) return 0
  return Math.max(-max, Math.min(max, Math.round(n)))
}

const validateAndShape = (
  raw: unknown,
  day: number
): { event: GameEvent | null; reason?: string } => {
  if (!raw || typeof raw !== 'object') return { event: null, reason: 'not an object' }
  const r = raw as Record<string, unknown>
  if (typeof r.title !== 'string') return { event: null, reason: `title not string (got ${typeof r.title})` }
  if (typeof r.description !== 'string') return { event: null, reason: `description not string (got ${typeof r.description})` }
  if (!Array.isArray(r.choices)) return { event: null, reason: `choices not array (got ${typeof r.choices})` }
  if (r.choices.length !== 3) {
    return { event: null, reason: `choices length ${r.choices.length} (must be exactly 3)` }
  }

  // 字數限制：超過就 reject 觸發 retry，絕對不靜默截斷
  if (r.title.length > 35) {
    return { event: null, reason: `title too long: ${r.title.length} chars (max 35)` }
  }
  if (r.description.length > 70) {
    return { event: null, reason: `description too long: ${r.description.length} chars (max 70)` }
  }

  const shaped: GameEvent['choices'] = []
  for (let i = 0; i < r.choices.length; i++) {
    const c = r.choices[i]
    if (!c || typeof c !== 'object') {
      return { event: null, reason: `choices[${i}] not an object` }
    }
    const co = c as Record<string, unknown>
    if (typeof co.text !== 'string') {
      return { event: null, reason: `choices[${i}].text not string (got ${typeof co.text})` }
    }
    if (co.text.length > 22) {
      return {
        event: null,
        reason: `choices[${i}].text too long: ${co.text.length} chars (max 22, got: "${co.text}")`,
      }
    }
    if (co.text.length < 4) {
      return { event: null, reason: `choices[${i}].text too short: "${co.text}"` }
    }
    const e = (co.effects ?? {}) as Record<string, unknown>
    shaped.push({
      text: co.text,
      effects: {
        money: sanitizeNumber(e.money, 10000),
        stress: sanitizeNumber(e.stress, 25),
        health: sanitizeNumber(e.health, 25),
        happiness: sanitizeNumber(e.happiness, 25),
        career: sanitizeNumber(e.career, 25),
        reputation: sanitizeNumber(e.reputation, 25),
      },
    })
  }

  return {
    event: {
      id: `ai_${Date.now()}_d${day}`,
      title: r.title,
      description: r.description,
      tags: ['ai', 'special'],
      weight: 1,
      aiGenerated: true,
      choices: shaped,
    },
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return { event: null, error: 'OPENROUTER_API_KEY not set' }
  }

  if (!body?.character || !body?.stats) {
    throw createError({ statusCode: 400, statusMessage: 'character / stats required' })
  }

  const { character, stats, lastEventTitles = [] } = body

  const userPrompt = `玩家身分：${character.name}${character.description ? `（${character.description}）` : ''}
目前 Day ${stats.day} / 30
最近事件：${lastEventTitles.slice(0, 3).join(' / ') || '無'}
當前狀態：💰${stats.money.toLocaleString()} 🔥壓力${stats.stress} ❤️健康${stats.health} 😊快樂${stats.happiness} 📈職涯${stats.career} 👥評價${stats.reputation}

請為玩家產生 1 個全新的事件，符合他的身分與當前狀態。`

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://ghost-island-taiwan-simulator.vercel.app',
      'X-Title': 'Ghost Island Taiwan Simulator',
    },
  })

  const tryOnce = async (attempt: number) => {
    const completion = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'create_event' } },
      max_tokens: 800,
    })

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0]
    if (!toolCall || toolCall.type !== 'function') {
      return { event: null, reason: 'no tool_call in response', usage: completion.usage }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(toolCall.function.arguments)
    } catch (parseErr) {
      console.error(`[generate-event] attempt ${attempt} JSON parse failed:`, toolCall.function.arguments)
      return {
        event: null,
        reason: `parse fail: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
        usage: completion.usage,
      }
    }

    const { event, reason } = validateAndShape(parsed, stats.day)
    if (!event) {
      console.error(`[generate-event] attempt ${attempt} validation failed:`, reason, '— parsed:', parsed)
      return { event: null, reason, usage: completion.usage }
    }
    return { event, reason: null, usage: completion.usage }
  }

  try {
    let last = await tryOnce(1)
    if (!last.event) {
      // 一次重試
      last = await tryOnce(2)
    }

    if (!last.event) {
      return { event: null, error: `invalid event shape: ${last.reason ?? 'unknown'}` }
    }

    return { event: last.event, usage: last.usage }
  } catch (e) {
    console.error('[generate-event] error:', e)
    return {
      event: null,
      error: e instanceof Error ? e.message : String(e),
    }
  }
})
