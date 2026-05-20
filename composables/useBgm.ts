const STORAGE_KEY = 'ghost-island-bgm-v1'
const BGM_SRC = '/audio/bgm.mp3'

interface BgmPrefs {
  enabled: boolean
  volume: number
}

const loadPrefs = (): BgmPrefs => {
  if (!import.meta.client) return { enabled: true, volume: 0.4 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { enabled: true, volume: 0.4 }
    const data = JSON.parse(raw)
    return {
      enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
      volume: typeof data.volume === 'number' ? data.volume : 0.4,
    }
  } catch (_) {
    return { enabled: true, volume: 0.4 }
  }
}

export const useBgm = () => {
  const audio = useState<HTMLAudioElement | null>('bgm-audio', () => null)
  const enabled = useState<boolean>('bgm-enabled', () => loadPrefs().enabled)
  const volume = useState<number>('bgm-volume', () => loadPrefs().volume)
  const isPlaying = useState<boolean>('bgm-playing', () => false)

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled: enabled.value, volume: volume.value })
    )
  }

  const init = () => {
    if (!import.meta.client || audio.value) return
    const el = new Audio(BGM_SRC)
    el.loop = true
    el.volume = volume.value
    el.addEventListener('play', () => (isPlaying.value = true))
    el.addEventListener('pause', () => (isPlaying.value = false))
    audio.value = el
  }

  const play = async () => {
    init()
    if (!audio.value || !enabled.value) return
    try {
      await audio.value.play()
    } catch (_) {
      // autoplay blocked — caller will retry on next user gesture
    }
  }

  const pause = () => {
    audio.value?.pause()
  }

  const toggle = (on: boolean) => {
    enabled.value = on
    persist()
    if (!audio.value) {
      if (on) play()
      return
    }
    if (on) audio.value.play().catch(() => {})
    else audio.value.pause()
  }

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    volume.value = clamped
    if (audio.value) audio.value.volume = clamped
    persist()
  }

  return reactive({
    enabled,
    volume,
    isPlaying,
    play,
    pause,
    toggle,
    setVolume,
  })
}
