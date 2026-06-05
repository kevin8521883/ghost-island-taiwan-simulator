import type { Character, Ending, PlayerStats } from '~/types/game'
import { RADAR_AXES, radarClamp, radarPoint, radarAngle } from '~/utils/statRadar'

interface CardOptions {
  ending: Ending
  stats: PlayerStats
  character: Character | null
  playerName?: string | null
}

const W = 1080
const H = 1350

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number => {
  let line = ''
  let currentY = y
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY)
      line = char
      currentY += lineHeight
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

// 在 canvas 上畫六角雷達圖（跟結局頁的 StatHexagon 共用 statRadar 幾何）
const drawRadar = (
  ctx: CanvasRenderingContext2D,
  stats: PlayerStats,
  cx: number,
  cy: number,
  maxR: number,
  font: string,
) => {
  const labelR = maxR + 42
  // 網格：4 圈同心六邊形 + 軸線
  ctx.strokeStyle = '#3a3a3a'
  ctx.lineWidth = 2
  for (const lv of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath()
    RADAR_AXES.forEach((_, i) => {
      const p = radarPoint(cx, cy, maxR * lv, i)
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    })
    ctx.closePath()
    ctx.stroke()
  }
  RADAR_AXES.forEach((_, i) => {
    const p = radarPoint(cx, cy, maxR, i)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  })
  // 資料多邊形
  ctx.beginPath()
  RADAR_AXES.forEach((ax, i) => {
    const p = radarPoint(cx, cy, maxR * radarClamp(ax.norm(stats)), i)
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgba(251, 191, 36, 0.28)'
  ctx.fill()
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  ctx.stroke()
  // 頂點
  RADAR_AXES.forEach((ax, i) => {
    const p = radarPoint(cx, cy, maxR * radarClamp(ax.norm(stats)), i)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#fbbf24'
    ctx.fill()
  })
  // 標籤 + 數值
  RADAR_AXES.forEach((ax, i) => {
    const p = radarPoint(cx, cy, labelR, i)
    const cos = Math.cos(radarAngle(i))
    ctx.textAlign = Math.abs(cos) < 0.3 ? 'center' : cos > 0 ? 'left' : 'right'
    ctx.fillStyle = '#e8e6e3'
    ctx.font = `26px ${font}`
    ctx.fillText(`${ax.emoji}${ax.label}`, p.x, p.y)
    ctx.fillStyle = '#fbbf24'
    ctx.font = `bold 30px ${font}`
    ctx.fillText(ax.fmt(stats), p.x, p.y + 32)
  })
  ctx.textAlign = 'center' // 還原
}

const drawCard = (ctx: CanvasRenderingContext2D, opts: CardOptions) => {
  const { ending, stats, character, playerName } = opts
  const sansTC = '"Noto Sans TC", system-ui, sans-serif'

  // 背景
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // 像素風外框（含偏移投影）
  ctx.fillStyle = '#b08a16'
  ctx.fillRect(70, 70, W - 90, H - 90)
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(50, 50, W - 100, H - 100)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 8
  ctx.strokeRect(50, 50, W - 100, H - 100)

  ctx.textAlign = 'center'

  // 頂部品牌
  ctx.fillStyle = '#666'
  ctx.font = `bold 22px ${sansTC}`
  ctx.fillText('GHOST ISLAND TAIWAN SIMULATOR', W / 2, 130)

  ctx.fillStyle = '#e8e6e3'
  ctx.font = `bold 36px ${sansTC}`
  ctx.fillText('鬼島台灣模擬器 · 社畜篇', W / 2, 185)

  // DAY 標籤
  const badgeY = 240
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(W / 2 - 200, badgeY, 400, 75)
  ctx.fillStyle = '#0a0a0a'
  ctx.font = 'bold 38px monospace'
  ctx.fillText(`DAY ${stats.day} · 結局`, W / 2, badgeY + 52)

  // 大結局標題
  ctx.fillStyle = '#fbbf24'
  ctx.font = `bold 72px ${sansTC}`
  ctx.fillText(ending.title, W / 2, 440)

  // 結局描述（換行）
  ctx.fillStyle = '#e8e6e3'
  ctx.font = `30px ${sansTC}`
  const descEndY = wrapText(ctx, ending.description, W / 2, 520, W - 220, 44)

  // 分隔線
  const dividerY = Math.max(descEndY + 40, 800)
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, dividerY)
  ctx.lineTo(W - 150, dividerY)
  ctx.stroke()

  // 人生形狀 label
  ctx.fillStyle = '#fbbf24'
  ctx.font = `28px ${sansTC}`
  ctx.fillText('— 這一局的人生形狀 —', W / 2, dividerY + 48)

  // 六角雷達圖（取代原本的 2x3 數值格）。自適應大小、避免撞到底部身分/URL
  const radarTop = dividerY + 78
  const radarBottom = H - 170
  const radarCy = (radarTop + radarBottom) / 2
  const radarMaxR = Math.min(110, (radarBottom - radarTop) / 2 - 60)
  drawRadar(ctx, stats, W / 2, radarCy, radarMaxR, sansTC)

  // 角色身分（有暱稱就「阿明 · 普通上班族」）
  if (character) {
    const name = playerName && playerName.trim()
      ? `${playerName.trim()} · ${character.name}`
      : `身分：${character.name}`
    ctx.fillStyle = '#888'
    ctx.font = `26px ${sansTC}`
    ctx.fillText(name, W / 2, H - 140)
  }

  // 站點 URL
  ctx.fillStyle = '#666'
  ctx.font = 'bold 22px monospace'
  ctx.fillText('ghost-island-taiwan-simulator.vercel.app', W / 2, H - 90)
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/data:([^;]+);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const len = binary.length
  const buffer = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
}

export const useShareCard = () => {
  const generating = useState<boolean>('share-card-generating', () => false)
  const lastError = useState<string>('share-card-error', () => '')

  const generate = (opts: CardOptions): Blob | null => {
    if (!import.meta.client) return null

    generating.value = true
    lastError.value = ''
    try {
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        lastError.value = '無法建立 canvas context'
        return null
      }

      drawCard(ctx, opts)

      const dataUrl = canvas.toDataURL('image/png')
      return dataUrlToBlob(dataUrl)
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e)
      console.error('[shareCard]', e)
      return null
    } finally {
      generating.value = false
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const share = async (opts: CardOptions): Promise<'shared' | 'downloaded' | 'failed'> => {
    const blob = generate(opts)
    if (!blob) return 'failed'

    const filename = `ghost-island-${opts.ending.id}-day${opts.stats.day}.png`
    const file = new File([blob], filename, { type: 'image/png' })
    const text = `我在《鬼島台灣模擬器：社畜篇》第 ${opts.stats.day} 天迎來「${opts.ending.title}」結局。`

    // 分享 URL 用 /share/<ending> — 社群 bot 抓到對應結局 OG
    const shareData: ShareData = {
      title: '鬼島台灣模擬器',
      text,
      url: `https://ghost-island-taiwan-simulator.vercel.app/share/${opts.ending.id}`,
      files: [file],
    }

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch (e) {
        return 'failed'
      }
    }

    downloadBlob(blob, filename)
    return 'downloaded'
  }

  const download = (opts: CardOptions): boolean => {
    const blob = generate(opts)
    if (!blob) return false
    downloadBlob(blob, `ghost-island-${opts.ending.id}-day${opts.stats.day}.png`)
    return true
  }

  return reactive({ generating, lastError, generate, share, download })
}
