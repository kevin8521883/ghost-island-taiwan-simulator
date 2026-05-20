const STORAGE_KEY = 'ghost-island-sfx-v1'

const SFX_MAP: Record<string, string> = {
  click: '/audio/sfx/click.wav',
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

export const useSfx = () => {
  const cache = useState<Record<string, HTMLAudioElement>>('sfx-cache', () => ({}))
  const enabled = useState<boolean>('sfx-enabled', () => loadPrefs().enabled)
  const volume = useState<number>('sfx-volume', () => loadPrefs().volume)

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled: enabled.value, volume: volume.value })
    )
  }

  const preload = (name: string) => {
    if (!import.meta.client || cache.value[name]) return
    const src = SFX_MAP[name]
    if (!src) return
    const el = new Audio(src)
    el.preload = 'auto'
    el.volume = volume.value
    cache.value[name] = el
  }

  const play = (name: string) => {
    if (!import.meta.client || !enabled.value) return
    preload(name)
    const el = cache.value[name]
    if (!el) return
    el.volume = volume.value
    try {
      el.currentTime = 0
      el.play().catch(() => {})
    } catch (_) {
      // ignore — rapid replay may throw, harmless
    }
  }

  const toggle = (on: boolean) => {
    enabled.value = on
    persist()
    if (on) play('click')
  }

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    volume.value = clamped
    for (const el of Object.values(cache.value)) {
      el.volume = clamped
    }
    persist()
  }

  return reactive({ enabled, volume, play, preload, toggle, setVolume })
}
