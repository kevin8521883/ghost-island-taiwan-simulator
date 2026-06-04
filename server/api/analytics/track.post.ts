/**
 * POST /api/analytics/track  { event }
 * 匿名漏斗埋點。fire-and-forget、失敗不影響玩家。
 */
import { trackEvent } from '~/server/utils/analytics'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ event?: string }>(event)
  if (!body?.event) {
    setResponseStatus(event, 400)
    return { ok: false }
  }
  return await trackEvent(body.event)
})
