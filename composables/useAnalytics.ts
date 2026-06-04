/**
 * 漏斗埋點 client hook。fire-and-forget、永不阻塞 UI。
 * session 級事件（landing/onboard）用 sessionStorage 去重、一個 session 只報一次。
 */
const SESSION_KEY = 'ghost-island-funnel-session-v1'
// 這些事件一個 session 只算一次
const SESSION_ONCE = new Set(['landing', 'onboard_done', 'onboard_skip'])

const loadSeen = (): Set<string> => {
  if (!import.meta.client) return new Set()
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export const useAnalytics = () => {
  const track = (event: string) => {
    if (!import.meta.client) return
    if (SESSION_ONCE.has(event)) {
      const seen = loadSeen()
      if (seen.has(event)) return
      seen.add(event)
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen]))
      } catch {
        // ignore
      }
    }
    // fire-and-forget；用 keepalive 讓導航中也能送出
    try {
      $fetch('/api/analytics/track', {
        method: 'POST',
        body: { event },
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignore
    }
  }

  return { track }
}
