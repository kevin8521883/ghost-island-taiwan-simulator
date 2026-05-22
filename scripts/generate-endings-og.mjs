#!/usr/bin/env node
/**
 * 為 12 個結局產靜態 OG 圖（1200×630）、給社群分享 meta 用
 * 輸出到 public/og/<ending_id>.png
 *
 * 跑法：node scripts/generate-endings-og.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const W = 1200
const H = 630

const endingsPath = path.join(process.cwd(), 'data', 'endings.json')
const endings = JSON.parse(await fs.readFile(endingsPath, 'utf8'))

const OG_DIR = path.join(process.cwd(), 'public', 'og')
await fs.mkdir(OG_DIR, { recursive: true })

const escapeXml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// 把長句拆行：先依標點切片、再 concat 不超過 maxChars 的行
const wrap = (text, maxChars = 22) => {
  const segments = text.split(/([，。、])/).filter((s) => s.length > 0)
  // 把標點黏回前一段
  const merged = []
  for (const seg of segments) {
    if (/^[，。、]$/.test(seg) && merged.length > 0) {
      merged[merged.length - 1] += seg
    } else {
      merged.push(seg)
    }
  }
  const lines = []
  let current = ''
  for (const seg of merged) {
    if (current.length === 0) {
      current = seg
    } else if ((current + seg).length > maxChars) {
      lines.push(current)
      current = seg
    } else {
      current += seg
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 4)
}

const moodColors = {
  happy: { primary: '#fbbf24', accent: '#fde68a', bg1: '#1a0f00', bg2: '#3a1f00' },
  sad: { primary: '#9ca3af', accent: '#d1d5db', bg1: '#0a0a0a', bg2: '#1f1f1f' },
  stressed: { primary: '#f87171', accent: '#fca5a5', bg1: '#1a0606', bg2: '#3a0a0a' },
  normal: { primary: '#fbbf24', accent: '#fde68a', bg1: '#0a0a0a', bg2: '#1a0f00' },
}

const buildSvg = (ending) => {
  const mood = ending.mood ?? 'normal'
  const colors = moodColors[mood] ?? moodColors.normal
  const title = escapeXml(ending.title)
  const descLines = wrap(escapeXml(ending.description), 22)

  // 描述每行 y 起 320、間距 50
  const descTspans = descLines
    .map(
      (line, i) =>
        `<tspan x="80" dy="${i === 0 ? 0 : 50}">${line}</tspan>`
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.bg1}"/>
      <stop offset="100%" stop-color="${colors.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 雙層 pixel 邊框 -->
  <rect x="48" y="56" width="${W - 64}" height="${H - 96}" fill="none" stroke="${colors.primary}" opacity="0.6" stroke-width="6"/>
  <rect x="32" y="40" width="${W - 64}" height="${H - 96}" fill="none" stroke="${colors.primary}" stroke-width="6"/>

  <!-- 上方 tag：結局 -->
  <text x="80" y="140" font-family="Noto Sans CJK TC, sans-serif" font-size="28" font-weight="bold" fill="${colors.accent}">
    結局 · Ghost Island Taiwan Simulator
  </text>

  <!-- 主標題 -->
  <text x="80" y="240" font-family="Noto Sans CJK TC, sans-serif" font-size="72" font-weight="bold" fill="${colors.primary}">
    ${title}
  </text>

  <!-- 描述 -->
  <text font-family="Noto Sans CJK TC, sans-serif" font-size="36" fill="#e5e5e5" y="380">
    ${descTspans}
  </text>

  <!-- 右下角 brand -->
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="Noto Sans CJK TC, sans-serif" font-size="22" fill="${colors.accent}" opacity="0.7">
    鬼島台灣模擬器：社畜篇
  </text>
</svg>`
}

console.log(`📐 為 ${endings.length} 個結局產 OG 圖...\n`)

let okCount = 0
let failCount = 0
for (const ending of endings) {
  const svg = buildSvg(ending)
  const dest = path.join(OG_DIR, `${ending.id}.png`)
  try {
    await sharp(Buffer.from(svg)).png().toFile(dest)
    const size = (await fs.stat(dest)).size
    console.log(`  ${ending.id.padEnd(25)} ${ending.title.padEnd(12)} → ${(size / 1024).toFixed(0)} KB`)
    okCount++
  } catch (e) {
    console.log(`  ${ending.id}: ❌ ${e.message}`)
    failCount++
  }
}

console.log(`\n完成：${okCount} 成功 / ${failCount} 失敗`)
console.log(`📁 OG 圖在 ${OG_DIR}`)
