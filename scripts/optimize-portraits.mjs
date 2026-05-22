#!/usr/bin/env node
/**
 * 把 public/portraits/*.png 壓縮成 .webp（保留 alpha channel、像素風格 lossless 模式）
 *
 * 跑法：
 *   node scripts/optimize-portraits.mjs
 *
 * 1024×1024 RGBA PNG（~800KB-1.2MB）→ WebP 約 50-150KB（80-90% 縮小）
 * Safari 14+ / Chrome / Firefox / Edge 都支援、不需要 fallback
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const PORTRAITS_DIR = path.join(process.cwd(), 'public', 'portraits')

const files = await fs.readdir(PORTRAITS_DIR)
const pngFiles = files.filter((f) => f.endsWith('.png'))

if (pngFiles.length === 0) {
  console.error('❌ public/portraits/ 沒 PNG 檔')
  process.exit(1)
}

console.log(`📐 壓縮 ${pngFiles.length} 張 PNG → WebP\n`)

let totalBefore = 0
let totalAfter = 0

for (const name of pngFiles) {
  const pngPath = path.join(PORTRAITS_DIR, name)
  const webpPath = pngPath.replace(/\.png$/, '.webp')

  const before = (await fs.stat(pngPath)).size
  totalBefore += before

  try {
    // WebP 設定：quality 90、effort 6（高壓縮）、nearLossless 適合像素風
    await sharp(pngPath)
      .webp({
        quality: 90,
        effort: 6,
        nearLossless: true,
        alphaQuality: 100,
      })
      .toFile(webpPath)

    const after = (await fs.stat(webpPath)).size
    totalAfter += after
    const pct = ((1 - after / before) * 100).toFixed(0)
    console.log(
      `  ${name.padEnd(24)} ${(before / 1024).toFixed(0).padStart(5)} KB → ${(after / 1024).toFixed(0).padStart(4)} KB (${pct}% 縮)`
    )
  } catch (e) {
    console.log(`  ${name}: ❌ ${e.message}`)
  }
}

console.log('')
console.log(
  `總計: ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ${(totalAfter / 1024 / 1024).toFixed(2)} MB (節省 ${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`
)
console.log(`💡 .webp 已生成、可考慮刪掉 .png：rm public/portraits/*.png`)
