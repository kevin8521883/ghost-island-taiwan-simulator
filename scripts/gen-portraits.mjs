#!/usr/bin/env node
/**
 * 為 9 個角色生成 NES 像素風 portrait（用 OpenRouter nano-banana / Gemini 2.5 Flash Image）
 *
 * 使用方式：
 *   node --env-file=.env scripts/gen-portraits.mjs           # 全部生成
 *   node --env-file=.env scripts/gen-portraits.mjs rich_kid  # 只重生某幾個（可空格分隔）
 *
 * 結果寫入 public/portraits/<id>.png（覆蓋既有）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
if (!OPENROUTER_KEY) {
  console.error('❌ OPENROUTER_API_KEY not set. 跑：node --env-file=.env scripts/gen-portraits.mjs')
  process.exit(1)
}

const CHARACTERS = [
  {
    id: 'office_worker',
    name: '普通上班族',
    prompt: 'young man wearing white shirt and black tie, tired smiling face',
  },
  {
    id: 'engineer',
    name: '科技業工程師',
    prompt: 'young man wearing glasses and grey t-shirt, smiling face, holding small laptop',
  },
  {
    id: 'delivery_rider',
    name: '外送員',
    prompt: 'young person in pink jacket, smiling face, holding food delivery bag',
  },
  {
    id: 'fresh_graduate',
    name: '剛畢業新鮮人',
    prompt: 'young man in navy suit, nervous smiling face, holding paper folder',
  },
  {
    id: 'rich_kid',
    name: '富二代',
    prompt: 'young man in fancy black suit, smug smiling face, gold watch',
  },
  {
    id: 'civil_servant',
    name: '公務員',
    prompt: 'young man in light blue shirt, glasses, calm smiling face, name badge on chest',
  },
  {
    id: 'freelancer',
    name: '接案族',
    prompt: 'young person in grey casual t-shirt, smiling face, headphones around neck',
  },
  {
    id: 'influencer_char',
    name: '全職網紅',
    prompt: 'young woman with bright pink hair, smiling face, trendy colorful outfit, holding phone',
  },
  {
    id: 'homemaker',
    name: '家庭主婦／主夫',
    prompt: 'young woman in white apron over blue dress, ponytail, smiling face, holding wooden spoon',
  },
]

const MODEL = 'google/gemini-2.5-flash-image'

const callOpenRouter = async (prompt) => {
  const fullPrompt =
    'NES Famicom retro pixel art sprite of ' + prompt +
    '. Chibi proportions with big head and small body. Standing front view facing camera. ' +
    'IMPORTANT: place the character on a solid bright magenta background (pure RGB 255,0,255 / hex FF00FF). ' +
    'The entire area around the character must be filled with this exact magenta color, ' +
    'so it can be chroma-keyed out. Do NOT use white, do NOT use checkered, ' +
    'do NOT use any color other than pure magenta for the background. ' +
    'Single isolated character. Limited 8-bit color palette for character only. ' +
    'Clear visible eyes and mouth on the face. Blocky chunky pixels.'

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ghost-island-taiwan-simulator.vercel.app',
      'X-Title': 'Ghost Island Taiwan Simulator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: fullPrompt }],
      modalities: ['image', 'text'],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  const images = json.choices?.[0]?.message?.images
  const dataUrl = images?.[0]?.image_url?.url
  if (!dataUrl) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 300)}`)
  return dataUrl
}

/**
 * 把 magenta(#FF00FF) 附近的像素設成透明、保留其他顏色
 * 用簡單顏色距離 + flood-fill 從邊緣擴散、避免角色身上零星 magenta 像素被誤刪
 */
const chromaKeyMagenta = async (inputBuf) => {
  const img = sharp(inputBuf).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info  // RGBA
  if (channels !== 4) throw new Error('expected 4 channels after ensureAlpha')

  // 是否為 magenta/粉紫系（R 高、G 低、B 中高）
  // AI 實際畫的「magenta」常為 RGB ~(240, 15, 150) 而非純 (255, 0, 255)
  const isMagenta = (r, g, b) => r > 180 && g < 80 && b > 90

  // 從 4 個邊緣 flood-fill、只 fill magenta 像素
  const visited = new Uint8Array(width * height)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const i = y * width + x
    if (visited[i]) return
    const o = i * 4
    if (!isMagenta(data[o], data[o + 1], data[o + 2])) return
    visited[i] = 1
    data[o + 3] = 0  // alpha = 0
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1)
  }
  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }
  while (stack.length > 0) {
    const y = stack.pop()
    const x = stack.pop()
    push(x, y)
  }

  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

const saveDataUrl = async (dataUrl, dest) => {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error('bad data url format')
  const rawBuf = Buffer.from(m[2], 'base64')
  const transparentBuf = await chromaKeyMagenta(rawBuf)
  await fs.writeFile(dest, transparentBuf)
  return transparentBuf.byteLength
}

const PORTRAITS_DIR = path.join(process.cwd(), 'public', 'portraits')

const filter = process.argv.slice(2)
const targets = filter.length > 0
  ? CHARACTERS.filter((c) => filter.includes(c.id))
  : CHARACTERS

if (filter.length > 0 && targets.length === 0) {
  console.error(`❌ 沒匹配到任何角色 id。可用: ${CHARACTERS.map(c => c.id).join(', ')}`)
  process.exit(1)
}

console.log(`📐 生成 ${targets.length} 張 portrait...`)
await fs.mkdir(PORTRAITS_DIR, { recursive: true })

let okCount = 0
let failCount = 0
for (const char of targets) {
  const dest = path.join(PORTRAITS_DIR, `${char.id}.png`)
  process.stdout.write(`  ${char.name.padEnd(12)} (${char.id}) ... `)
  try {
    const dataUrl = await callOpenRouter(char.prompt)
    const size = await saveDataUrl(dataUrl, dest)
    console.log(`✅ ${(size / 1024).toFixed(0)} KB`)
    okCount++
  } catch (e) {
    console.log(`❌ ${e.message}`)
    failCount++
  }
}

console.log(`\n完成：${okCount} 成功 / ${failCount} 失敗`)
console.log(`📁 portraits 在 ${PORTRAITS_DIR}`)
console.log(`💡 不滿意某張就跑：node --env-file=.env scripts/gen-portraits.mjs <id>`)
