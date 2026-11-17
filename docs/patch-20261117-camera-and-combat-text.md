# 修補說明 2026-11-17：戰鬥提示文字與直向鏡頭統一

## 1. 第二～五章戰鬥提示文字（不再使用綠底長條）

- 新增共用模組 `dist/preview/campaign/combat-event-presentation.mjs`，四章的 `*-playable.mjs` 都改走同一條 `presentCombatEvents()`。
- 招式／Boss 預警：維持大字 callout（本來就與第一章共用 `shoutCaptionLayout`）。
- 補給：改為世界座標浮字「補給到手！HP 全滿」（與第一章相同）。
- 助拳：改為助拳角色頭上的浮字「名稱 · 招式」，停留約 1.3 秒。
- 揪團：移除畫面上的長句；畫面上仍有既有的「集合！／撲空！／撞到了！」與命中浮字。
- `#feedback` 保留為視覺隱藏的 live region（`role="status"`），讀螢幕器仍會播報上述訊息。
- 移除 `#feedback` 的定位／綠底／`boss-warning` CSS（`chapter-shell.css`、`landscape-safe.css`、`chapter-ui.css`）。

## 2. 直向手機鏡頭（只影響 `touch && portrait`，桌機與橫向不變）

全部集中在 `dist/challenge-camera.mjs`，兩個可調常數：

| 常數 | 目前值 | 390px 寬時 | 說明 |
|---|---|---|---|
| `PORTRAIT_STREET_ZOOM_DIVISOR` | 460 | 縮放約 0.85（原 1.03） | 街道近景，數字越小越近 |
| `PORTRAIT_COMBAT_ZOOM_DIVISOR` | 620 | 縮放約 0.63（原約 0.50～0.57） | 一般對戰／練習／各章 Boss，數字越小越近 |

- 動態視野：改用固定站立縮放，範圍是基準的 90%～100%；不再因為量測版面改變而重新取基準（這就是「用招式後才拉近」的原因）。
- 穩定視野：開局以雙方中點構圖；之後保持不動，只有玩家靠近安全邊緣才推動。雙方放得下時，會緩緩把對手也帶進畫面。
- 直向開局若雙方間距很大，對手仍可能被切掉一部分；縮放越大切得越多。覺得對手被切太多，就把 `PORTRAIT_COMBAT_ZOOM_DIVISOR` 調大（例如 660）。
- 跳躍時地面線仍保持在畫面內（只用於雙人構圖與動態視野）。

## 3. 測試

- 新增：`tests/combat-event-presentation.test.mjs`、`tests/portrait-camera-consistency.test.mjs`。
- 更新：`chapter-presentation-consistency`、`mobile-camera-tuning`、`street-close-geometry-recovery`、`street-close-player-camera`（原本寫死舊密度 `390/380`）。
- 已知：打這份修補前，專案 HEAD 就有大量測試失敗（311 個測試檔中有 127 個）；本修補沒有讓任何原本通過的檔案變成失敗。

## 4. 未處理（需要你決定）

- 第一章／一般對戰的 `#broadcast` 語錄橫幅（帶「語錄／迷因改編」聲明）仍是綠底，且第二～五章沒有這項內容。
- 最終章 `preview/finale` 仍使用 DOM `#caption` 顯示玩家招式名稱，樣式與其他章不同。
- `chapter2/3/4-base.css` 內仍有未被載入的舊 `#feedback` 規則（只剩測試引用其中一份）。
