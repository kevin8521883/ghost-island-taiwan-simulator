/**
 * 金錢飛入動畫 — 從來源點噴出 N 個 emoji、拋物線飛向目標元素
 *
 * 用法：
 *   const burst = useCoinBurst()
 *   burst.fire({ amount: 8, sourceX: 200, sourceY: 400, targetSelector: '[data-stat-money]' })
 */
export const useCoinBurst = () => {
  const fire = (opts: {
    amount?: number
    sourceX: number
    sourceY: number
    targetSelector: string
    emoji?: string
  }) => {
    if (!import.meta.client) return
    const count = Math.max(3, Math.min(opts.amount ?? 6, 14))
    const targetEl = document.querySelector(opts.targetSelector) as HTMLElement | null
    if (!targetEl) return
    const rect = targetEl.getBoundingClientRect()
    const targetX = rect.left + rect.width / 2
    const targetY = rect.top + rect.height / 2
    const emoji = opts.emoji ?? '🪙'

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      el.className = 'coin-particle'
      el.textContent = emoji
      el.style.left = `${opts.sourceX}px`
      el.style.top = `${opts.sourceY}px`
      // 隨機 fan-out 偏移、讓初始位置散開、不是一坨疊
      const spreadX = (Math.random() - 0.5) * 60
      const spreadY = (Math.random() - 0.5) * 30 - 20
      const delay = i * 50
      // 用 CSS 變數帶起終點偏移、keyframes 自己跑
      el.style.setProperty('--cb-mid-x', `${spreadX}px`)
      el.style.setProperty('--cb-mid-y', `${spreadY}px`)
      el.style.setProperty('--cb-target-x', `${targetX - opts.sourceX}px`)
      el.style.setProperty('--cb-target-y', `${targetY - opts.sourceY}px`)
      el.style.animationDelay = `${delay}ms`
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1400 + delay)
    }
  }

  return { fire }
}
