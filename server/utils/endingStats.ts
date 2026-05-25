/**
 * 全球結局統計 backend abstraction
 *
 * 線上：用 Upstash Redis（透過 Vercel Marketplace 整合，自動注入 UPSTASH_REDIS_REST_URL / TOKEN）
 * 本地 dev 沒設環境變數時：fallback 用 in-memory Map（重啟歸零）、確保 UI 開發不被卡
 */
import { Redis } from '@upstash/redis'
import endingsData from '~/data/endings.json'
import charactersData from '~/data/characters.json'
import type { Ending, Character } from '~/types/game'

const ENDING_IDS = new Set((endingsData as Ending[]).map((e) => e.id))
const CHARACTER_IDS = new Set((charactersData as Character[]).map((c) => c.id))

let redis: Redis | null = null
const mem = new Map<string, number>()

const getRedis = (): Redis | null => {
  if (redis) return redis
  // 兩種命名都吃：
  // - UPSTASH_REDIS_REST_URL / TOKEN（Upstash Marketplace integration）
  // - KV_REST_API_URL / TOKEN（Vercel 內建 Redis、Upstash 套殼版）
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

const K_TOTAL = 'gi:stats:total_runs'
const kEnding = (id: string) => `gi:stats:ending:${id}`
const kCharEnding = (charId: string, endingId: string) =>
  `gi:stats:char:${charId}:${endingId}`

export interface SubmitParams {
  endingId: string
  characterId: string | null
}

export interface SubmitResult {
  ok: boolean
  reason?: string
  storage: 'redis' | 'memory'
}

export const submitEnding = async (
  params: SubmitParams
): Promise<SubmitResult> => {
  const { endingId, characterId } = params
  if (!ENDING_IDS.has(endingId)) {
    return { ok: false, reason: 'unknown ending', storage: 'memory' }
  }
  if (characterId && !CHARACTER_IDS.has(characterId)) {
    return { ok: false, reason: 'unknown character', storage: 'memory' }
  }

  const client = getRedis()
  if (!client) {
    // in-memory fallback（local dev、沒設 env）
    mem.set(K_TOTAL, (mem.get(K_TOTAL) ?? 0) + 1)
    mem.set(kEnding(endingId), (mem.get(kEnding(endingId)) ?? 0) + 1)
    if (characterId) {
      const ck = kCharEnding(characterId, endingId)
      mem.set(ck, (mem.get(ck) ?? 0) + 1)
    }
    return { ok: true, storage: 'memory' }
  }

  const ops: Promise<unknown>[] = [
    client.incr(K_TOTAL),
    client.incr(kEnding(endingId)),
  ]
  if (characterId) {
    ops.push(client.incr(kCharEnding(characterId, endingId)))
  }
  await Promise.all(ops)
  return { ok: true, storage: 'redis' }
}

export interface AllStats {
  totalRuns: number
  byEnding: Record<string, number>
  storage: 'redis' | 'memory'
}

export const getAllStats = async (): Promise<AllStats> => {
  const client = getRedis()
  if (!client) {
    const byEnding: Record<string, number> = {}
    for (const id of ENDING_IDS) {
      byEnding[id] = mem.get(kEnding(id)) ?? 0
    }
    return {
      totalRuns: mem.get(K_TOTAL) ?? 0,
      byEnding,
      storage: 'memory',
    }
  }

  const ids = Array.from(ENDING_IDS)
  // MGET 一次抓所有結局計數
  const [totalRaw, ...endingRaws] = await Promise.all([
    client.get<number>(K_TOTAL),
    ...ids.map((id) => client.get<number>(kEnding(id))),
  ])
  const byEnding: Record<string, number> = {}
  ids.forEach((id, i) => {
    byEnding[id] = Number(endingRaws[i] ?? 0)
  })
  return {
    totalRuns: Number(totalRaw ?? 0),
    byEnding,
    storage: 'redis',
  }
}
