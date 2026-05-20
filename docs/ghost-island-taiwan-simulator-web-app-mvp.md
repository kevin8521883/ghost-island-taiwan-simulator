# 鬼島台灣模擬器：社畜篇
## Web + App Store / Google Play MVP 企劃書

版本：v0.2  
目標：先做 Web MVP，後續包成 iOS / Android App  
主要技術：Nuxt 3 + Capacitor

---

# 一、專案方向調整

原本方向是 Steam 獨立遊戲 Demo。

現在調整為：

先做成網頁版遊戲，之後可打包成：

- iOS App，可上架 Apple App Store
- Android App，可上架 Google Play
- Web 版本，可部署到正式網域

這樣的好處：

- 開發速度比 Godot / Unity 更快
- 符合目前前端技術背景
- 可以先做 MVP 驗證市場
- 事件內容可快速新增
- 後續可做會員、排行榜、分享、廣告、付費解鎖
- Web、iOS、Android 共用同一套邏輯

---

# 二、專案名稱

中文：

鬼島台灣模擬器：社畜篇

英文：

Ghost Island Taiwan Simulator: Salaryman Edition

---

# 三、產品定位

這是一款黑色幽默人生模擬遊戲。

玩家扮演生活在台灣的普通人，每天遇到台灣社會、職場、租屋、交通、家庭、物價、詐騙、健康等事件。

玩家透過選擇不同選項影響角色數值，最後走向不同結局。

---

# 四、平台目標

## Phase 1：Web MVP

先完成可玩的網頁版本。

可部署到：

- Vercel
- VPS
- Cloudflare Pages
- Netlify

## Phase 2：PWA

讓使用者可以把網頁加入手機桌面。

支援：

- 手機全螢幕
- 離線快取
- App-like 體驗

## Phase 3：App 打包

使用 Capacitor 將 Nuxt 專案打包成原生 App。

目標：

- iOS App Store
- Google Play

---

# 五、推薦技術選型

## 前端框架

Nuxt 3

原因：

- 使用者已有 Nuxt 3 經驗
- 適合做 Web App
- 可 SSR / SPA
- 可部署方便
- 可與 Capacitor 整合

---

## App 打包

Capacitor

用途：

將 Web 專案包成 iOS / Android App。

優點：

- 保留 Web 技術
- 同一份 Nuxt 專案可打包 App
- 支援 iOS / Android 原生功能
- 比重新學 Swift / Kotlin 快

---

## 狀態管理

Pinia

用途：

管理玩家狀態。

包含：

- money
- stress
- health
- happiness
- career
- reputation
- day
- currentEvent
- selectedCharacter
- ending

---

## 資料格式

使用 JSON 管理內容：

- characters.json
- events.json
- endings.json

未來可改成後台 CMS 或資料庫。

---

## UI

建議使用：

- Tailwind CSS
- Nuxt UI 或 shadcn-vue，可選
- 自製像素風 CSS

---

## 儲存方式

MVP 先用 localStorage。

未來可升級：

- IndexedDB
- Supabase
- Firebase
- 自架 API + MySQL / PostgreSQL

---

# 六、核心玩法

遊戲流程：

1. 進入首頁
2. 點擊開始遊戲
3. 選擇角色背景
4. 進入每日事件
5. 玩家選擇事件選項
6. 數值變化
7. 判斷是否觸發結局
8. 沒有結局則進入下一天
9. 最後進入結局畫面

---

# 七、玩家數值

玩家主要數值：

- money：金錢
- stress：壓力
- health：健康
- happiness：快樂
- career：職涯
- reputation：社會評價
- day：天數

建議規則：

- stress >= 100：過勞 / 崩潰結局
- health <= 0：住院 / 過勞結局
- money <= -50000：破產結局
- happiness <= 0：躺平結局
- day >= 30：進入一般結局判定

---

# 八、角色系統

MVP 先做 4 種角色。

## 1. 普通上班族

特色：

平衡型社畜。

```json
{
  "id": "office_worker",
  "name": "普通上班族",
  "money": 30000,
  "stress": 40,
  "health": 80,
  "happiness": 50,
  "career": 40,
  "reputation": 50
}
```

## 2. 科技業工程師

特色：

高薪高壓。

```json
{
  "id": "engineer",
  "name": "科技業工程師",
  "money": 50000,
  "stress": 70,
  "health": 60,
  "happiness": 45,
  "career": 70,
  "reputation": 60
}
```

## 3. 外送員

特色：

自由但不穩定。

```json
{
  "id": "delivery_rider",
  "name": "外送員",
  "money": 25000,
  "stress": 30,
  "health": 90,
  "happiness": 55,
  "career": 20,
  "reputation": 40
}
```

## 4. 剛畢業新鮮人

特色：

低收入高潛力。

```json
{
  "id": "fresh_graduate",
  "name": "剛畢業新鮮人",
  "money": 15000,
  "stress": 50,
  "health": 85,
  "happiness": 60,
  "career": 10,
  "reputation": 45
}
```

---

# 九、事件系統

事件資料使用 JSON 管理。

事件格式：

```json
{
  "id": "boss_family",
  "title": "主管說公司像家",
  "description": "主管拍著你的肩膀說：年輕人要多學，今天大家一起留下來努力。",
  "tags": ["work", "boss", "overtime"],
  "choices": [
    {
      "text": "留下來加班",
      "effects": {
        "money": 0,
        "stress": 15,
        "health": -5,
        "career": 5
      }
    },
    {
      "text": "準時下班",
      "effects": {
        "stress": -5,
        "happiness": 5,
        "career": -5,
        "reputation": -5
      }
    }
  ]
}
```

MVP 內容目標：

- 30 個事件
- 每個事件 2～3 個選項
- 每個選項都會影響數值

事件主題：

- 加班
- 租屋
- 房價
- 機車
- 捷運
- 颱風假
- 超商
- 早餐店
- 詐騙簡訊
- 健保
- 家庭壓力
- 年終
- 選舉新聞
- 物價上漲
- 同事離職
- 老闆畫餅

---

# 十、結局系統

MVP 先做 5 個結局。

## 1. 過勞結局

條件：

stress >= 100

## 2. 破產結局

條件：

money <= -50000

## 3. 躺平結局

條件：

happiness <= 0

## 4. 社畜倖存結局

條件：

day >= 30 且沒有觸發壞結局

## 5. 公務員幻想結局

條件：

特殊事件觸發或 career / happiness 達到特定組合

結局格式：

```json
{
  "id": "burnout",
  "title": "過勞邊緣人",
  "description": "你成功把公司當家，但家沒有把你當人。",
  "condition": {
    "stress": 100
  }
}
```

---

# 十一、頁面規劃

## 1. 首頁

路徑：

`/`

內容：

- 遊戲 Logo
- 開始遊戲
- 繼續遊戲
- 設定
- 製作名單

---

## 2. 角色選擇頁

路徑：

`/character`

內容：

- 角色卡片
- 初始數值
- 選擇角色按鈕

---

## 3. 遊戲主畫面

路徑：

`/game`

內容：

- 狀態列
- 事件卡片
- 選項按鈕
- 數值變化提示
- 下一天

---

## 4. 結局頁

路徑：

`/ending`

內容：

- 結局標題
- 結局描述
- 最終數值
- 再玩一次
- 分享結果

---

## 5. 設定頁

路徑：

`/settings`

MVP 可先做：

- 音效開關
- 文字速度
- 清除存檔

---

# 十二、UI / 美術方向

整體風格：

復古像素風 + 台灣黑色幽默 + 手機友善

建議方向：

- Pixel Art
- 低解析度視覺
- 深色背景
- 卡片式事件
- 像素邊框
- 類 RPG 對話框
- 手機直向畫面優先

手機畫面建議比例：

- 直向 9:16
- 適合單手點擊
- 選項按鈕大一點

可使用 CSS 製作像素感：

- border: 3px solid
- box-shadow: 4px 4px 0
- font-family 使用像素字體
- button 使用硬邊框

---

# 十三、建議資料夾結構

```txt
/
├─ assets/
│  ├─ images/
│  ├─ audio/
│  └─ fonts/
│
├─ components/
│  ├─ GameStatusBar.vue
│  ├─ EventCard.vue
│  ├─ ChoiceButton.vue
│  ├─ CharacterCard.vue
│  └─ PixelButton.vue
│
├─ composables/
│  ├─ useGameEngine.ts
│  ├─ useEvents.ts
│  └─ useEndings.ts
│
├─ data/
│  ├─ characters.json
│  ├─ events.json
│  └─ endings.json
│
├─ pages/
│  ├─ index.vue
│  ├─ character.vue
│  ├─ game.vue
│  ├─ ending.vue
│  └─ settings.vue
│
├─ stores/
│  └─ game.ts
│
├─ types/
│  └─ game.ts
│
└─ nuxt.config.ts
```

---

# 十四、App 打包方向

## 技術

使用 Capacitor。

流程：

1. 完成 Nuxt Web MVP
2. 將 Nuxt 設定為 SPA 或產出靜態檔
3. 加入 Capacitor
4. 建立 iOS / Android 專案
5. 使用 Xcode 打包 iOS
6. 使用 Android Studio 打包 Android
7. 測試手機版
8. 上架 App Store / Google Play

---

# 十五、Nuxt 設定方向

如果要打包 App，建議 Nuxt 以 SPA / 靜態方式處理。

`nuxt.config.ts` 可先規劃：

```ts
export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@pinia/nuxt'
  ],

  css: [
    '~/assets/css/main.css'
  ],

  app: {
    head: {
      title: '鬼島台灣模擬器：社畜篇',
      meta: [
        {
          name: 'description',
          content: '一款台灣黑色幽默人生模擬遊戲'
        }
      ]
    }
  }
})
```

---

# 十六、PWA 方向

後續可加入 PWA。

功能：

- 安裝到桌面
- 離線遊玩
- App-like 體驗

可使用：

`@vite-pwa/nuxt`

---

# 十七、上架注意事項

## App Store

需要：

- Apple Developer Program 帳號
- Xcode
- App Icon
- Screenshot
- 隱私權政策
- App 描述
- 年齡分級
- 審核資料

注意：

遊戲內容如果涉及政治、社會諷刺、敏感詞，要避免過度攻擊特定族群或真人。

---

## Google Play

需要：

- Google Play Console 帳號
- Android App Bundle
- App Icon
- Screenshot
- 隱私權政策
- 內容分級
- 資料安全表單

---

# 十八、商業模式方向

MVP 先免費。

後續可考慮：

- 廣告
- 移除廣告
- 額外角色包
- 特殊事件包
- 贊助支持
- Steam 完整版
- 付費 DLC
- 每週新事件

---

# 十九、Claude Code 任務指令

請依照此企劃建立 Nuxt 3 專案。

專案目標：

先完成一款可在 Web 上遊玩的《鬼島台灣模擬器：社畜篇》MVP。

請使用：

- Nuxt 3
- TypeScript
- Pinia
- Tailwind CSS
- JSON 資料檔
- 手機優先 RWD
- 像素風 UI

請先完成：

1. 首頁
2. 角色選擇頁
3. 遊戲主畫面
4. 結局頁
5. 設定頁
6. 事件系統
7. 數值系統
8. 結局判定
9. localStorage 存檔
10. 基礎像素風 UI

請不要先做：

- 登入系統
- 後台
- 金流
- 多人連線
- 排行榜
- 複雜動畫
- 原生功能

MVP 完成後，請再規劃 Capacitor 打包 iOS / Android 的步驟。

---

# 二十、Claude Code 實作順序

## Phase 1：建立 Nuxt 專案骨架

- 安裝 Nuxt 3
- 安裝 Pinia
- 安裝 Tailwind
- 建立 pages
- 建立 components
- 建立 stores
- 建立 data

## Phase 2：建立資料模型

- types/game.ts
- characters.json
- events.json
- endings.json

## Phase 3：建立遊戲核心

- useGameEngine.ts
- useEvents.ts
- useEndings.ts
- stores/game.ts

## Phase 4：建立 UI

- GameStatusBar
- EventCard
- ChoiceButton
- CharacterCard
- PixelButton

## Phase 5：完成遊戲流程

- 首頁開始
- 選角色
- 每日事件
- 套用選項效果
- 判斷結局
- 顯示結局
- 再玩一次

## Phase 6：手機版優化

- 直向手機畫面
- 大按鈕
- 避免過小文字
- 適合 App 打包

## Phase 7：準備 App 化

- 加入 Capacitor
- 建立 iOS / Android 專案
- 檢查安全區域 safe-area
- 檢查手機儲存
- 檢查離線可用性

---

# 二十一、未來擴充

可擴充功能：

- 每日挑戰
- 分享結局圖
- 排行榜
- 更多角色
- 更多職業
- 更多事件包
- 成就系統
- 圖鑑系統
- 廣告變現
- 付費角色
- 雲端存檔
- 後台事件管理
- AI 事件生成
