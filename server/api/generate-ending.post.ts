import OpenAI from 'openai'

interface LogEntry {
  day: number
  eventTitle: string
  choiceText: string
}

interface RequestBody {
  character: {
    id: string
    name: string
    description?: string
  }
  ending: {
    id: string
    title: string
    description: string
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
  log: LogEntry[]
}

const SYSTEM_PROMPT = `你是《鬼島台灣模擬器》的結局生成器。

【最重要規則 — 寫之前先做這步】
玩家可能做了 20+ 個選擇、log 會塞給你。**你只能挑「兩個」**，其他完全不要碰。
不是挑「最大」的兩個、是挑「放一起最有戲」的兩個 — 一個反差、一個諷刺、或一個情境連到結局數值的呼應。

【口氣】
朋友在 LINE 嘴你的口氣、不是旁白、不是日記、不是 voice over。
看穿、有溫度、有梗、不講教訓。

【結構】
1. 一個畫面開場（具體的物、聲音、動作 — 不是抽象敘述）
2. 把你挑的 2 個選擇放進那個畫面、寫出來
3. 一個反差、笑點、或刺中要害的觀察結尾（可以是動作、可以是物、不要是道理）

【絕對禁令 — 違反會被 reject 重生】
✗ 提到超過 2 個 log 裡的具體選擇
✗ 「在這座鬼島上...」「也許...就是」「最...的成就」「最精準的...」
✗ 結尾出現「至少」「只是」「但至少」「也許」「終究」「就是」這種轉折詞
✗ 「妳比誰都清楚...」「妳明白...」「你知道你...」這種 voice over 結語
✗ 「這座島」「這個城市」「這個時代」這種抽象指涉
✗ 「快樂值 X、存款 Y。也許 / 至少 / 就是...」這種數值+雞湯句型
✗ 重複結局標題、結局描述

【可以加】
- 沒在 log 裡但合理的腦補細節（風、椅子、媽的滷蛋、冷掉的咖啡、御飯糰）
- 對話片段、貼圖、已讀不回
- 自嘲、酸、戲謔、突然的溫柔

【字數】80-150 字　【人稱】第二人稱

【❌ 反面教材 — 不要這樣寫】
「你借錢 ALL IN 股市、卻在朋友喊進 NVDA 時罵他瘋了。凌晨搶登記普發 6000、卻在超商看到 12 塊雞蛋就空手離開。你在颱風夜回網路斷線、在主管說公司像家時準時下班、甚至預約了真的心理師——妳比誰都清楚、這座島上沒有內線消息、只有每一次微小的、清醒的選擇。快樂值 120、存款 -4250。也許倖存本身、就是最精準的投資報酬率。」
（壞在哪：列了 6 個選擇、雞湯結尾、voice over「妳比誰都清楚」、強行哲理「也許...就是」）

【✓ 正面教材】
範例 A：「股票跌剩 5% 那天、你媽 LINE 問你『最近還順利嗎』。你回了一張貼圖。冰箱還剩她寄的滷蛋 3 顆、你比那 3 顆更不想動。」
範例 B：「妳那台 5 年的 Uniqlo 學長還是說『欸這件好像很貴』。妳沒糾正他。包整桌單的時候妳笑得跟那件 Uniqlo 一樣便宜。」
範例 C：「他升職那天你回了第三遍才看到的訊息。颱風來那天你回『網路斷線』、人在 Netflix 第 6 集。咖啡冷了你才肯喝完。」`

const TOOL_SCHEMA = {
  type: 'function' as const,
  function: {
    name: 'create_ending_narrative',
    description: '生成個性化結局敘述',
    parameters: {
      type: 'object',
      properties: {
        picked_moments: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
          items: { type: 'string' },
          description: '從 log 中挑出「正好 2 個」最有戲的選擇（用一句話描述）、其他絕不能寫進 narrative',
        },
        narrative: {
          type: 'string',
          description: '個性化結局敘述、80-150 字、只能用 picked_moments 兩個事件',
        },
      },
      required: ['picked_moments', 'narrative'],
    },
  },
}

const validateNarrative = (raw: unknown): { narrative: string | null; reason?: string } => {
  if (!raw || typeof raw !== 'object') return { narrative: null, reason: 'not an object' }
  const r = raw as Record<string, unknown>
  if (typeof r.narrative !== 'string') {
    return { narrative: null, reason: `narrative not string (got ${typeof r.narrative})` }
  }
  const trimmed = r.narrative.trim()
  if (trimmed.length < 50) {
    return { narrative: null, reason: `narrative too short: ${trimmed.length} chars` }
  }
  if (trimmed.length > 250) {
    return { narrative: null, reason: `narrative too long: ${trimmed.length} chars` }
  }
  return { narrative: trimmed }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return { narrative: null, error: 'OPENROUTER_API_KEY not set' }
  }

  if (!body?.character || !body?.ending || !body?.stats || !Array.isArray(body?.log)) {
    throw createError({ statusCode: 400, statusMessage: 'character / ending / stats / log required' })
  }

  const { character, ending, stats, log } = body

  // 把 log 整理成 prompt-friendly 格式：全選列出（30 天）
  const logLines = log
    .map((e) => `Day ${e.day}：「${e.eventTitle}」→ 選「${e.choiceText}」`)
    .join('\n')

  const userPrompt = `玩家身分：${character.name}${character.description ? `（${character.description}）` : ''}
最終結局：${ending.title}
最終狀態：💰${stats.money.toLocaleString()} 🔥壓力${stats.stress} ❤️健康${stats.health} 😊快樂${stats.happiness} 📈職涯${stats.career} 👥評價${stats.reputation}

30 天選擇紀錄：
${logLines}

請依以上紀錄、為這位玩家寫一段個人化結局敘述。`

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
      tool_choice: { type: 'function', function: { name: 'create_ending_narrative' } },
      max_tokens: 600,
      temperature: 1.0,
    })

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0]
    if (!toolCall || toolCall.type !== 'function') {
      return { narrative: null, reason: 'no tool_call', usage: completion.usage }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(toolCall.function.arguments)
    } catch (parseErr) {
      console.error(`[generate-ending] attempt ${attempt} JSON parse failed:`, toolCall.function.arguments)
      return {
        narrative: null,
        reason: `parse fail: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
        usage: completion.usage,
      }
    }

    const { narrative, reason } = validateNarrative(parsed)
    if (!narrative) {
      console.error(`[generate-ending] attempt ${attempt} validation failed:`, reason)
      return { narrative: null, reason, usage: completion.usage }
    }
    return { narrative, reason: null, usage: completion.usage }
  }

  try {
    let last = await tryOnce(1)
    if (!last.narrative) {
      last = await tryOnce(2)
    }

    if (!last.narrative) {
      return { narrative: null, error: `invalid narrative: ${last.reason ?? 'unknown'}` }
    }

    return { narrative: last.narrative, usage: last.usage }
  } catch (e) {
    console.error('[generate-ending] error:', e)
    return {
      narrative: null,
      error: e instanceof Error ? e.message : String(e),
    }
  }
})
