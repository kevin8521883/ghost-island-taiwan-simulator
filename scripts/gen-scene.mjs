#!/usr/bin/env node
/**
 * 生成事件動畫小視窗用的「場景背景圖」（不含人物）
 *
 * 跑：
 *   node --env-file=.env scripts/gen-scene.mjs office
 *   node --env-file=.env scripts/gen-scene.mjs office home shop
 *
 * 輸出：public/scenes/<id>.webp（同名 .png 作中間檔、會被刪）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
if (!OPENROUTER_KEY) {
  console.error('❌ OPENROUTER_API_KEY not set')
  process.exit(1)
}

const SCENES = {
  office: {
    name: '辦公室',
    prompt:
      'small Taiwanese office cubicle interior at night, a desk with CRT computer monitor, ' +
      'keyboard, papers, fluorescent ceiling light overhead, cubicle partition walls. ' +
      'Slightly oppressive workplace mood.',
  },
  payday: {
    name: '發薪日',
    prompt:
      'interior of a Taiwanese bank lobby or ATM area, counter, money bills stacked on counter, ' +
      'soft yellow lighting, celebratory but mundane vibe.',
  },
  shop: {
    name: '消費',
    prompt:
      'Taiwanese 7-11 convenience store interior aisle at night, shelves with snacks and drinks, ' +
      'cashier counter visible, cold fluorescent lighting.',
  },
  luck: {
    name: '好運',
    prompt:
      'magical neon arcade or lottery booth interior, glowing slot machine, cards floating, ' +
      'purple and gold color scheme, dreamy gambling den vibe.',
  },
  social: {
    name: '社交',
    prompt:
      'Taiwanese late-night street food stall scene, plastic chairs and tables, ' +
      'neon signs in background, steam from food.',
  },
  home: {
    name: '回家',
    prompt:
      'small cramped Taiwanese rental apartment living room interior at night, ' +
      'small TV on a low table, couch, warm orange lamp light, cluttered but cozy.',
  },
  accident: {
    name: '意外',
    prompt:
      'dark Taipei alley at rainy night, broken signage, puddles reflecting red neon lights, ' +
      'dangerous and ominous atmosphere.',
  },
  health: {
    name: '健康',
    prompt:
      'small Taiwanese clinic or hospital waiting room interior, plastic chairs, ' +
      'medical posters on wall, pale fluorescent lighting, sterile clinical vibe.',
  },
  ai: {
    name: '時事',
    prompt:
      'glitchy digital matrix space, falling green-purple code rain, ' +
      'abstract cyber background, no physical room.',
  },
}

const MODEL = 'google/gemini-2.5-flash-image'
const SCENES_DIR = path.join(process.cwd(), 'public', 'scenes')

const callOpenRouter = async (basePrompt) => {
  const fullPrompt =
    'NES Famicom retro pixel art background scene of ' + basePrompt + ' ' +
    'IMPORTANT: this is a BACKGROUND ONLY — NO people, NO characters, NO faces, completely empty of human figures. ' +
    'Wide horizontal aspect ratio (16:9 or wider). ' +
    'Limited 8-bit color palette (max 16 colors). Blocky chunky pixels, image-rendering: pixelated style. ' +
    'Dark moody atmosphere, deep saturated colors. ' +
    'No text or letters. Centered composition with empty floor area in the middle ' +
    '(this is where a character will be placed later by the game).'

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
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!dataUrl) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 300)}`)
  return dataUrl
}

const saveDataUrl = async (dataUrl, dest) => {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error('bad data url format')
  const rawBuf = Buffer.from(m[2], 'base64')
  const webpDest = dest.replace(/\.png$/, '.webp')
  // 不做透明處理（背景需要保留所有顏色）；只壓 webp
  await sharp(rawBuf)
    .webp({ quality: 88, effort: 6 })
    .toFile(webpDest)
  const stat = await fs.stat(webpDest)
  return stat.size
}

const args = process.argv.slice(2)
const targets = args.length > 0 ? args : Object.keys(SCENES)

const invalid = targets.filter((t) => !(t in SCENES))
if (invalid.length > 0) {
  console.error(`❌ 未知場景: ${invalid.join(', ')}`)
  console.error(`可用: ${Object.keys(SCENES).join(', ')}`)
  process.exit(1)
}

await fs.mkdir(SCENES_DIR, { recursive: true })
console.log(`📐 生成 ${targets.length} 張場景背景...`)

let ok = 0
let fail = 0
for (const id of targets) {
  const cfg = SCENES[id]
  process.stdout.write(`  ${cfg.name.padEnd(8)} (${id}) ... `)
  try {
    const dataUrl = await callOpenRouter(cfg.prompt)
    const size = await saveDataUrl(dataUrl, path.join(SCENES_DIR, `${id}.png`))
    console.log(`✅ ${(size / 1024).toFixed(0)} KB`)
    ok++
  } catch (e) {
    console.log(`❌ ${e.message}`)
    fail++
  }
}

console.log(`\n完成：${ok} 成功 / ${fail} 失敗`)
console.log(`📁 場景圖在 ${SCENES_DIR}`)
