/**
 * /share/<ending_id> — 社群分享 landing page
 *
 * 給 LINE / Threads / FB / X bot 抓取 og:image meta、看到對應結局的 OG 圖。
 * 真實使用者瀏覽時、頁面顯示簡介 + 自動 redirect 回首頁。
 */
import endingsData from '~/data/endings.json'
import type { Ending } from '~/types/game'

const ALL_ENDINGS = endingsData as Ending[]
const SITE_URL = 'https://ghost-island-taiwan-simulator.vercel.app'

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'ending')
  const ending = ALL_ENDINGS.find((e) => e.id === id)

  // 找不到結局 → 用預設 og
  const og = ending
    ? {
        title: `${ending.title} · 鬼島台灣模擬器`,
        description: ending.description,
        image: `${SITE_URL}/og/${ending.id}.png`,
      }
    : {
        title: '鬼島台灣模擬器：社畜篇',
        description: '活著就已經很了不起',
        image: `${SITE_URL}/og-image.png`,
      }

  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(og.title)}</title>
  <meta name="description" content="${escapeHtml(og.description)}">
  <meta property="og:title" content="${escapeHtml(og.title)}">
  <meta property="og:description" content="${escapeHtml(og.description)}">
  <meta property="og:image" content="${og.image}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/share/${id}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(og.title)}">
  <meta name="twitter:description" content="${escapeHtml(og.description)}">
  <meta name="twitter:image" content="${og.image}">
  <link rel="canonical" href="${SITE_URL}/share/${id}">
  <style>
    body {
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: 'Noto Sans CJK TC', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      max-width: 480px;
      padding: 24px;
      border: 4px solid #fbbf24;
    }
    h1 { color: #fbbf24; font-size: 28px; margin: 0 0 12px; }
    p { font-size: 14px; line-height: 1.7; margin: 0 0 24px; }
    a { color: #fbbf24; text-decoration: none; padding: 12px 24px; border: 2px solid #fbbf24; display: inline-block; }
  </style>
  <script>
    // 真實使用者訪問 → 1.5 秒後跳回遊戲首頁
    if (!navigator.userAgent.match(/bot|facebookexternalhit|line|twitter|whatsapp|telegram|slack|discord/i)) {
      setTimeout(() => { window.location.href = '/'; }, 1500);
    }
  </script>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(og.title)}</h1>
    <p>${escapeHtml(og.description)}</p>
    <a href="/">開始我的人生 →</a>
  </div>
</body>
</html>`
})
