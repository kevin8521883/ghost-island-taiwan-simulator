#!/usr/bin/env node
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const W = 1200
const H = 630

// SVG landscape OG image：標題 + slogan + 像素風城市 skyline
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a0f00"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 像素邊框（雙層，模擬投影） -->
  <rect x="48" y="56" width="${W - 64}" height="${H - 96}" fill="none" stroke="#b08a16" stroke-width="6"/>
  <rect x="32" y="40" width="${W - 64}" height="${H - 96}" fill="none" stroke="#fbbf24" stroke-width="6"/>

  <!-- 城市 skyline 在右下 -->
  <g fill="#fbbf24" opacity="0.85">
    <rect x="780" y="380" width="60" height="180"/>
    <rect x="860" y="320" width="80" height="240"/>
    <rect x="960" y="350" width="60" height="210"/>
    <rect x="1040" y="280" width="80" height="280"/>
  </g>
  <g fill="#0a0a0a">
    <rect x="800" y="420" width="14" height="14"/>
    <rect x="820" y="420" width="14" height="14"/>
    <rect x="800" y="460" width="14" height="14"/>
    <rect x="820" y="460" width="14" height="14"/>
    <rect x="800" y="500" width="14" height="14"/>
    <rect x="820" y="500" width="14" height="14"/>
    <rect x="880" y="370" width="14" height="14"/>
    <rect x="900" y="370" width="14" height="14"/>
    <rect x="920" y="370" width="14" height="14"/>
    <rect x="880" y="410" width="14" height="14"/>
    <rect x="900" y="410" width="14" height="14"/>
    <rect x="920" y="410" width="14" height="14"/>
    <rect x="880" y="450" width="14" height="14"/>
    <rect x="900" y="450" width="14" height="14"/>
    <rect x="920" y="450" width="14" height="14"/>
    <rect x="980" y="400" width="14" height="14"/>
    <rect x="1000" y="400" width="14" height="14"/>
    <rect x="980" y="440" width="14" height="14"/>
    <rect x="1000" y="440" width="14" height="14"/>
    <rect x="1060" y="330" width="14" height="14"/>
    <rect x="1080" y="330" width="14" height="14"/>
    <rect x="1100" y="330" width="14" height="14"/>
    <rect x="1060" y="370" width="14" height="14"/>
    <rect x="1080" y="370" width="14" height="14"/>
    <rect x="1100" y="370" width="14" height="14"/>
    <rect x="1060" y="410" width="14" height="14"/>
    <rect x="1080" y="410" width="14" height="14"/>
    <rect x="1100" y="410" width="14" height="14"/>
  </g>

  <!-- 主標題（左半邊） -->
  <text x="100" y="200" font-family="Noto Sans CJK TC" font-size="76" font-weight="900" fill="#fbbf24">
    鬼島台灣模擬器
  </text>
  <text x="100" y="280" font-family="Noto Sans CJK TC" font-size="56" font-weight="700" fill="#e8e6e3">
    社畜篇
  </text>
  <text x="100" y="360" font-family="monospace" font-size="32" fill="#888">
    Ghost Island Taiwan Simulator
  </text>

  <!-- Slogan -->
  <text x="100" y="450" font-family="Noto Sans CJK TC" font-size="36" font-weight="700" fill="#e8e6e3">
    每天一張事件卡
  </text>
  <text x="100" y="500" font-family="Noto Sans CJK TC" font-size="36" font-weight="700" fill="#e8e6e3">
    你能撐過 30 天嗎？
  </text>

  <!-- 底部標籤 -->
  <text x="100" y="570" font-family="Noto Sans CJK TC" font-size="22" font-weight="700" fill="#666">
    9 角色 · 73 事件 · 12 結局
  </text>
</svg>`

const buffer = await sharp(Buffer.from(svg))
  .png({ quality: 92 })
  .toBuffer()

writeFileSync('public/og-image.png', buffer)
console.log(`Generated public/og-image.png (${buffer.length} bytes, ${W}x${H})`)
