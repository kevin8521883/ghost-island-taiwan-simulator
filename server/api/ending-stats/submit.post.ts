/**
 * POST /api/ending-stats/submit
 * 結局通關時、匿名上報一次（client 端 localStorage dedupe）
 */
import { submitEnding } from '~/server/utils/endingStats'

interface Body {
  endingId?: string
  characterId?: string | null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  if (!body?.endingId) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'endingId required' }
  }
  const result = await submitEnding({
    endingId: body.endingId,
    characterId: body.characterId ?? null,
  })
  if (!result.ok) {
    setResponseStatus(event, 400)
  }
  return result
})
