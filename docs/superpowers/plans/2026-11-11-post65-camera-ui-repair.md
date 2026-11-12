# 第 65 版鏡頭與介面修正 Implementation Plan

**Goal:** 修正實測的鏡頭跳接、過遠構圖、整備／漫畫版面與切場閃畫面，保留共同機制及存檔。

**Architecture:** 共用相機求解器修正連續性與街道交戰群，不改遊戲世界。共同挑戰頁框嵌入整備內容，戰前／唯讀仍使用同一能力元件。場景切換以正確目標畫面完成繪製為提交點，不靠任意延遲。

**Tech Stack:** JavaScript modules、Phaser、Canvas、CSS、Node test runner、真實瀏覽器 DOM 驗收。

**Spec:** `docs/challenge/post65-repair-spec.md`

## Global Constraints

- 基準來源 29f347d8305c87d15d04033c8c6e0a0a2fdc8a52；原站、素材及瀏覽器資料不刪除。
- 四章同機制，不建立方向或章節各自的座標補丁。
- 保留 v4 格式、資源／XP／能力規則；本次候選不自行發布。
- 所有新缺陷先記錄失敗案例，再修正；未驗的真機條件明確揭露。

## Review Focus

- 玩家反向或靠邊時，合法構圖區域切換不能造成明顯跳接。
- 街道遠處敵人與預告物件不應永久鎖住遠景，近距危險角色仍需可見。
- 嵌入整備切換頁籤時，未確認草稿不能暗自保存，忙碌狀態不可重複提交。
- 側轉拖曳、短螢幕、捲動至底部與窄頂列都要驗真實操作，而非僅檢查 CSS 字串。
- 保存失敗、新導航、舊漫畫回呼或場景銷毀不能讓舊 VS 畫面閃現或永久鎖住畫面。

## Task 1: 共用鏡頭連續性與街道近景

Files: `dist/challenge-camera.mjs`、`dist/challenge-depth-render.mjs` 的相機接頭、`dist/preview/campaign/mobile-camera-adapter.mjs`、對應新回歸測試。

- [x] 原碼逐幀重現：合法位置切換、街道過度預告與擊退 feed-forward。
- [x] 為兩個呼叫端的連續移動、反向、助拳及街道尺寸契約新增紅測試。
- [x] 修正求解連續性與本地交戰群釋放；保持安全可見與原解析度。
- [x] 比較實測 DOM 遮擋資料下修正前後 pan／zoom／人物高度，驗既有相機及快取測試。

## Task 2: 挑戰頁框、整備與介面排版

Files: `dist/challenge-ui.mjs`、`dist/challenge-preparation.mjs`、`dist/challenge-preparation.css`、`dist/challenge.css`、`dist/challenge-layout.css`、`dist/starter-opening.mjs/.css` 及共用章節 UI。

- [x] 定位另開視窗、不同 padding、半透明 footer、側轉捲動攔截及雙列頂欄。
- [x] 新增同頁切換、草稿取消、底列遮擋、側轉捲動與漫畫高度紅測試。
- [x] 提供同一整備內容的嵌入／戰前／唯讀呈現方式，不複製保存邏輯。
- [x] 調整桌機單頁漫畫、統一按鈕、直向頂列、秒數說明與穩定捲軸寬度。短手機長文仍保留必要的垂直閱讀捲動。
- [x] 在真 DOM 驗窄頂列、側轉整備操作與各頁框一致性；實機觸控另列未驗。

## Task 3: 原子場景切換

Files: `dist/game.mjs`、`dist/challenge-story.mjs` 與場景／漫畫回歸測試。`starter-opening.mjs` 的 await 契約由 Task 2 同步接入。

- [x] 定位 async 保存／建場期間舊 Duel 被重新繪製。
- [x] 加入延遲保存、失敗、過期回呼、快速導航的紅測試。
- [x] 保留當前介面直到指定目標 run／duel 實際 postrender，統一取消和失敗處理。
- [x] 驗正常進場、接續、漫畫、Boss 與跨章，不添加固定等待時間；復原邊界與頂列路由另有 12 項獨立測試。

## Task 4: 整合與交付

- [x] 隔離工作樹及基線完整測試：3,383 通過。
- [x] 最終 UI 幾何重新輸入相機回歸；真瀏覽器跑主要方向及中斷流程。
- [x] 全套 3,477 項測試與發行建置，對照原素材及保存契約。
- [x] 固定候選版本引用並凍結來源供完整備份。
- [x] 明列已驗／未驗及原站未更新，取得發布許可後才可另行部署。

完整備份在來源凍結後執行，必須包含全新讀回、還原來源逐檔驗證及再次測試；結果記在獨立的交付還原說明，不以本計畫的勾選代替備份收據。
