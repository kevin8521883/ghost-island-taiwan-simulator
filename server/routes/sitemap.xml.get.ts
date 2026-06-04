/**
 * 動態 sitemap：靜態頁 + 每個結局的 /share landing 頁
 * 讓 Google 收錄 12 個結局落地頁（之前只給社群 bot 看 OG）
 */
import endingsData from '~/data/endings.json'
import type { Ending } from '~/types/game'

const SITE_URL = 'https://ghost-island-taiwan-simulator.vercel.app'
const ALL_ENDINGS = endingsData as Ending[]

const STATIC_ROUTES = ['/', '/stats', '/gallery', '/achievements']

export default defineEventHandler((event) => {
  const urls: { loc: string; priority: number }[] = [
    ...STATIC_ROUTES.map((r) => ({ loc: SITE_URL + r, priority: r === '/' ? 1.0 : 0.6 })),
    // 只列「非隱藏」結局，避免暴雷隱藏結局
    ...ALL_ENDINGS.filter((e) => !e.hidden).map((e) => ({
      loc: `${SITE_URL}/share/${e.id}`,
      priority: 0.7,
    })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
