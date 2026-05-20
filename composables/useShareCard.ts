import type { Character, Ending, PlayerStats } from '~/types/game'

interface CardOptions {
  ending: Ending
  stats: PlayerStats
  character: Character | null
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

const drawCard = (ctx: CanvasRenderingContext2D, opts: CardOptions) => {
  const { ending, stats, character } = opts
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

  // 最終數值 label
  ctx.fillStyle = '#fbbf24'
  ctx.font = `28px ${sansTC}`
  ctx.fillText('— 最終數值 —', W / 2, dividerY + 50)

  // 2x3 stats grid
  const items: { label: string; val: string }[] = [
    { label: '💰', val: stats.money.toLocaleString() },
    { label: '🔥 壓力', val: stats.stress.toString() },
    { label: '❤️ 健康', val: stats.health.toString() },
    { label: '😊 快樂', val: stats.happiness.toString() },
    { label: '📈 職涯', val: stats.career.toString() },
    { label: '👥 評價', val: stats.reputation.toString() },
  ]
  const gridY = dividerY + 110
  const colW = (W - 200) / 2
  ctx.font = `bold 34px ${sansTC}`
  ctx.fillStyle = '#e8e6e3'
  items.forEach((item, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 100 + col * colW + colW / 2
    const y = gridY + row * 75
    ctx.fillText(`${item.label} ${item.val}`, x, y)
  })

  // 角色身分
  if (character) {
    ctx.fillStyle = '#888'
    ctx.font = `26px ${sansTC}`
    ctx.fillText(`身分：${character.name}`, W / 2, H - 140)
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

    const shareData: ShareData = {
      title: '鬼島台灣模擬器',
      text,
      url: 'https://ghost-island-taiwan-simulator.vercel.app/',
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

  return { generating, lastError, generate, share, download }
}
