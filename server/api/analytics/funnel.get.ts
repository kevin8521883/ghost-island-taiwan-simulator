/** GET /api/analytics/funnel — 取得漏斗計數（給 /stats 儀表板）*/
import { getFunnel } from '~/server/utils/analytics'

export default defineEventHandler(async () => {
  return await getFunnel()
})
