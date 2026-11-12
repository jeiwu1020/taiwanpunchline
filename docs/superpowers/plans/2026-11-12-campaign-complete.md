# 完整挑戰主線實作計畫

Spec: docs/superpowers/specs/2026-11-12-campaign-complete-design.md

使用者已授權直接執行與合理設計，採本回合自行實作，完工後由獨立 reviewer 檢查整個分支。

## Task 1 — 核對與隔離

取得 main；核對線上背景修正版本及背景模組 hash。檢查 AGENTS、既有章節/存檔契約；在外部 worktree 建立 codex/complete-challenge-story。安裝鎖定依賴並跑 npm test 基線，保留結果。

## Task 2 — 第五章與前四章

先新增章節控制器/三路段兩小頭目/阿扁仔 BO3/解鎖測試，觀察因第五章缺失而失敗。以共用 createChapterController、ChallengeDepthRoute、Duel 建立第五章；重用既有圖像與共用頁面/輸入介面。更新第1–4章故事、交接與不同路段節奏，保持第二章戰前保密。移除第五章阻擋，讓正式 v4 存取只經既有交易。驗證章節保存和接續測試。

## Task 3 — 最終戰保存模型

先測舊檔接受、七人門檻、隊伍三人且唯一、存檔重開最終戰、失敗與重試、勝利獎一次、結局已讀與完成狀態；測 quota/讀回失敗、過期 token、其他槽不變。擴充 catalog/model/transition 及 fresh API，沿用單一存檔鍵和交易。更新首頁和跨頁 handoff 路由至第5章與最終戰。

## Task 4 — 七人混戰與結局

先建立多人引擎測試：四向/斜走、友軍不互傷、AI 攻擊其他 AI、玩家倒下後隊友可勝、時間到平手不過關、原招式/能力導入。實作獨立 finale 引擎、控制與呈現，沿用原角色圖、共享 viewport/touch、設定和主線保存。明確組隊說明、敵我標示、觀戰、暫停、重試、回總覽、失敗保存救援和重看結局。結局寫入確定後標記主線完成。

## Task 5 — 驗證與交付

統一 runtime 版本，檢查輸出所有頁面/素材。完整 npm test + node build-release-output.mjs。實際 Chromium 遊玩主線入口、第五章小頭目/Boss/解鎖、最終戰勝敗/AI觀戰/結局、存檔刷新、手機布局/側轉/按鍵命中，產生證據檔。獨立 reviewer 讀 diff 及 spec，修正重要發現後重測。提交隔離分支及 PR；不合併或推正式站，報告版本、測試與未驗項目。

## Review Focus

舊五章未開放存檔仍可接續；已清四章的 handoff 必須到第五章；七人門檻不被 URL 繞過；同一帧/重試/重複勝利不多領首通；保存失敗不得顯示假完成；玩家死亡但隊友獲勝；第二章未知 Boss 避免 UI 洩漏；觸控旋轉後無殘留；新增章節不要複製保存/viewport 實作。
