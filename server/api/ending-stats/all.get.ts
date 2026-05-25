/**
 * GET /api/ending-stats/all
 * 取得目前全球結局統計
 *
 * 不做 server-side cache：玩家剛通關就要看到自己 +1、cache 會讓數字看起來像沒動。
 * Upstash 免費額度 10K/day 足夠 indie 流量。需要時可加 CDN s-maxage。
 */
import { getAllStats } from '~/server/utils/endingStats'

export default defineEventHandler(async () => {
  return await getAllStats()
})
