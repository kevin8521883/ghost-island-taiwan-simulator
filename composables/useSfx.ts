const STORAGE_KEY = 'ghost-island-sfx-v1'

/**
 * 8-bit 音效用 Web Audio 即時合成（不需音檔素材）。
 * 每個音效是一串 {f 頻率, d 秒, type 波形} 的小序列。
 */
type Tone = { f: number; d: number; type?: OscillatorType }
const SFX_TONES: Record<string, Tone[]> = {
  click: [{ f: 660, d: 0.05, type: 'square' }],
  // 選項按下：低頓一下
  press: [{ f: 330, d: 0.06, type: 'square' }],
  // 加錢：上行雙音叮叮
  coin: [
    { f: 880, d: 0.06, type: 'square' },
    { f: 1320, d: 0.1, type: 'square' },
  ],
  // 正面：上行三音
  positive: [
    { f: 523, d: 0.06, type: 'triangle' },
    { f: 659, d: 0.06, type: 'triangle' },
    { f: 784, d: 0.1, type: 'triangle' },
  ],
  // 負面：下行兩音
  negative: [
    { f: 392, d: 0.08, type: 'sawtooth' },
    { f: 262, d: 0.14, type: 'sawtooth' },
  ],
  // 成就：明亮上行四音
  achievement: [
    { f: 659, d: 0.07, type: 'square' },
    { f: 784, d: 0.07, type: 'square' },
    { f: 988, d: 0.07, type: 'square' },
    { f: 1319, d: 0.16, type: 'square' },
  ],
  // 死亡/結局：低沉下墜
  death: [
    { f: 330, d: 0.12, type: 'sawtooth' },
    { f: 247, d: 0.14, type: 'sawtooth' },
    { f: 165, d: 0.3, type: 'sawtooth' },
  ],
}

interface SfxPrefs {
  enabled: boolean
  volume: number
}

const loadPrefs = (): SfxPrefs => {
  if (!import.meta.client) return { enabled: true, volume: 0.7 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { enabled: true, volume: 0.7 }
    const data = JSON.parse(raw)
    return {
      enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
      volume: typeof data.volume === 'number' ? data.volume : 0.7,
    }
  } catch (_) {
    return { enabled: true, volume: 0.7 }
  }
}

// 單例 AudioContext（lazy、第一次 play 時建立、需在 user gesture 後）
let audioCtx: AudioContext | null = null
const getCtx = (): AudioContext | null => {
  if (!import.meta.client) return null
  if (audioCtx) return audioCtx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    audioCtx = new AC()
  } catch (_) {
    audioCtx = null // 建立失敗（autoplay policy / 隱私設定）→ 靜默無聲、不報錯
  }
  return audioCtx
}

export const useSfx = () => {
  const enabled = useState<boolean>('sfx-enabled', () => loadPrefs().enabled)
  const volume = useState<number>('sfx-volume', () => loadPrefs().volume)

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled: enabled.value, volume: volume.value })
    )
  }

  const play = (name: string) => {
    if (!import.meta.client || !enabled.value) return
    const tones = SFX_TONES[name] ?? SFX_TONES.click
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    let t = ctx.currentTime
    const vol = Math.max(0, Math.min(1, volume.value)) * 0.3 // 上限壓低、避免刺耳
    for (const tone of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = tone.type ?? 'square'
      osc.frequency.setValueAtTime(tone.f, t)
      // 簡單 attack/decay 包絡
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.d)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + tone.d)
      t += tone.d
    }
  }

  // 觸覺回饋（手機）
  const haptic = (pattern: number | number[] = 10) => {
    if (!import.meta.client) return
    try {
      navigator.vibrate?.(pattern)
    } catch {
      // ignore
    }
  }

  const toggle = (on: boolean) => {
    enabled.value = on
    persist()
    if (on) play('click')
  }

  const setVolume = (v: number) => {
    volume.value = Math.max(0, Math.min(1, v))
    persist()
  }

  // preload 保留為 no-op（合成音效不需預載），維持既有呼叫相容
  const preload = (_name: string) => {}

  return reactive({ enabled, volume, play, haptic, preload, toggle, setVolume })
}
