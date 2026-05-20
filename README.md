# 鬼島台灣模擬器：社畜篇

Ghost Island Taiwan Simulator: Salaryman Edition — 一款台灣黑色幽默人生模擬遊戲。

**🎮 線上試玩**：<https://ghost-island-taiwan-simulator.vercel.app>

**Phase 1 MVP**：Nuxt 3 + TypeScript + Pinia + Tailwind 的 Web 版本，後續走 PWA → Capacitor 打包 iOS / Android。

---

## 已完成（Phase 1 ~ 5）

- **設定檔**：`package.json` / `nuxt.config.ts` / `tsconfig.json` / `tailwind.config.ts`
- **資料**：
  - `data/characters.json`：4 種角色（office_worker / engineer / delivery_rider / fresh_graduate）
  - `data/events.json`：45 個 Taiwan-flavored 事件（含 8 個 AI 時事主題）
  - `data/endings.json`：6 個結局（含 5 個 spec 結局 + 1 個 survivor catch-all）
- **狀態**：`stores/game.ts`（Pinia）+ localStorage 持久化
- **核心**：`composables/useGameEngine.ts` / `useEvents.ts`（加權隨機）/ `useEndings.ts`（按 priority 判定）
- **元件**：`PixelButton` / `GameStatusBar` / `EventCard` / `ChoiceButton` / `CharacterCard`
- **頁面**：`/` / `/character` / `/game` / `/ending` / `/settings`
- **UI**：純 CSS 像素風（深色 + 銳邊框 + 4px 投影），Press Start 2P 標題字 + Noto Sans TC 內文，手機直向優先

## 還沒做

- **Phase 6**：手機版細部優化（safe-area、虛擬鍵盤、large tap target）
- **Phase 7**：Capacitor 打包 iOS / Android
- 音效 / 文字逐字顯示
- 更多事件包、職業擴充、結局擴充

---

## 跑起來

```bash
npm install
npm run dev
# 預設 http://localhost:3000
```

第一次跑會自動跑 `nuxt prepare` 產生 `.nuxt/tsconfig.json`，IDE 才能正確解析 auto-imports。

## 部署

- Vercel / Netlify / Cloudflare Pages：用 `npm run generate` 出靜態檔，或直接連 repo 自動部署
- VPS：`npm run build` + `node .output/server/index.mjs`

## 資料夾結構

```
.
├─ assets/css/main.css         # Tailwind + 像素風 component class
├─ components/                 # 5 個 UI 元件
├─ composables/                # 3 個遊戲邏輯 composable
├─ data/                       # 3 個 JSON 資料檔（非工程可改）
├─ pages/                      # 5 個畫面
├─ stores/game.ts              # Pinia store + localStorage
├─ types/game.ts               # TypeScript 型別
├─ docs/                       # spec 原文
├─ app.vue
├─ nuxt.config.ts
├─ tailwind.config.ts
└─ tsconfig.json
```

## 加事件

直接在 `data/events.json` append 新 entry：

```json
{
  "id": "your_event_id",
  "title": "事件標題",
  "description": "情境描述。",
  "tags": ["work"],
  "weight": 5,
  "choices": [
    { "text": "選項 A", "effects": { "stress": 10, "money": -500 } },
    { "text": "選項 B", "effects": { "happiness": 5 } }
  ]
}
```

數值 key 限定 `money` / `stress` / `health` / `happiness` / `career` / `reputation`。`weight` 越大抽到機率越高。
