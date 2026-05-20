export type ThemeId = 'default' | 'crt' | 'retro'

const STORAGE_KEY = 'ghost-island-theme-v1'

export const THEMES: { id: ThemeId; name: string; subtitle: string }[] = [
  { id: 'default', name: '鬼島黑', subtitle: '深色 + 琥珀（預設）' },
  { id: 'crt', name: 'CRT 螢光綠', subtitle: '老式螢幕監視器' },
  { id: 'retro', name: '80s 復古粉', subtitle: '霓虹深夜街頭' },
]

const loadTheme = (): ThemeId => {
  if (!import.meta.client) return 'default'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'crt' || raw === 'retro' || raw === 'default') return raw
  } catch (_) {}
  return 'default'
}

const apply = (theme: ThemeId) => {
  if (!import.meta.client) return
  const html = document.documentElement
  html.classList.remove('theme-default', 'theme-crt', 'theme-retro')
  html.classList.add(`theme-${theme}`)
}

export const useTheme = () => {
  const current = useState<ThemeId>('ui-theme', () => loadTheme())

  const set = (theme: ThemeId) => {
    current.value = theme
    apply(theme)
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, theme)
    }
  }

  const init = () => {
    apply(current.value)
  }

  return reactive({ current, themes: THEMES, set, init })
}
