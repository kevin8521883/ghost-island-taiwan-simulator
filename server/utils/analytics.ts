/**
 * 輕量自架漏斗埋點（複用 endingStats 的 Upstash 模式）
 * 只記匿名計數器、無個資、無第三方。local dev 用 in-memory fallback。
 *
 * 用 allowlist 防止任意 key 灌爆 Redis。
 */
import { Redis } from '@upstash/redis'

export const FUNNEL_EVENTS = [
  'landing', // 進首頁
  'onboard_done', // 看完新手教學
  'onboard_skip', // 跳過教學
  'run_start', // 開始一局
  'day1_choice', // 做了第一個選擇
  'reach_day15', // 撐到一半
  'run_end', // 走到任一結局
  'share_click', // 點分享
  'revive_used', // 用了封棺前續命
] as const

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number]
const ALLOWED = new Set<string>(FUNNEL_EVENTS)

let redis: Redis | null = null
const mem = new Map<string, number>()

const getRedis = (): Redis | null => {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

const key = (e: string) => `gi:funnel:${e}`

export const trackEvent = async (
  event: string
): Promise<{ ok: boolean; storage: 'redis' | 'memory' }> => {
  if (!ALLOWED.has(event)) return { ok: false, storage: 'memory' }
  const client = getRedis()
  if (!client) {
    mem.set(key(event), (mem.get(key(event)) ?? 0) + 1)
    return { ok: true, storage: 'memory' }
  }
  await client.incr(key(event))
  return { ok: true, storage: 'redis' }
}

export interface FunnelStats {
  counts: Record<string, number>
  storage: 'redis' | 'memory'
}

export const getFunnel = async (): Promise<FunnelStats> => {
  const client = getRedis()
  if (!client) {
    const counts: Record<string, number> = {}
    for (const e of FUNNEL_EVENTS) counts[e] = mem.get(key(e)) ?? 0
    return { counts, storage: 'memory' }
  }
  const raws = await Promise.all(FUNNEL_EVENTS.map((e) => client.get<number>(key(e))))
  const counts: Record<string, number> = {}
  FUNNEL_EVENTS.forEach((e, i) => {
    counts[e] = Number(raws[i] ?? 0)
  })
  return { counts, storage: 'redis' }
}
