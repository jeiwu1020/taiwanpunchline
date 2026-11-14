# R3：iPhone 啟動載入停滯處理

使用者回報 PR #1 預覽在 iPhone 固定停於「載入漫畫 37%」。37% 約為 28/76；Phaser 原本同時發出 32 張圖片請求，完成順序不等於入列順序，不能據此指認第 28 張圖片。

## 已取得的證據

- R2 預覽版本為 `campaign-visuals-20261112-r2`。76 張啟動圖片全部存在於發行目錄，可解碼；下載量約 94.65 MiB，RGBA 解碼量約 360.43 MiB。
- 原載入器使用 Phaser 的 XHR → Blob → Image 路徑，預設 32 併發，XHR 逾時為 0；圖片處理只等待 load/error 回呼，佇列後續推進依賴 Phaser frame update。掛住時沒有局部恢復入口。
- Linux WebKit 27.2 + iPhone viewport 能實際完成 R2 線上首頁 → 第一章移動、第五章移動/跳躍及最終戰七人四向移動；未出現腳本或 HTTP 錯誤。沒有重現實體 iPhone 的固定 37%，因此尚未確認該手機的精確根因。
- 故障注入測試觀察到：相同 URL 的新 Image 可能與未結束的舊請求合併，單純重新指定相同圖片網址不足以繞過掛住的請求。

## 修正

- 保留全部 76 組 key/圖片 URL、原始素材、場景 create 流程及存檔系統。
- 改用原生 Image 的四併發佇列，避免每圖額外 XHR Blob，透過 Image 回呼推進，無須下一個動畫影格。
- 每次圖片嘗試最多等待 45 秒，最多自動重試一次；重試加獨立 query，避免沿用掛住請求。
- 兩次都失敗時保留成功圖片，顯示「重試載入」。再次重試只載入失敗項目。必要圖片仍全部就緒後才允許開始；既有七項 optional 場景圖維持 fallback。
- 以單一 Phaser.Loader.File gate 接回引擎；載入狀態、剩餘 key、失敗 key 記錄於首頁的 data-boot-* 屬性，以便精確診斷再次發生的狀況。
- runtime identity 更新為 `campaign-boot-20261112-r3`。首頁既有 title-screen.css 完全不變，新錯誤按鈕使用獨立 CSS。

## 驗證方式

`npm test` 執行既有全套測試與新增七項 loader 測試。`npm run qa:boot-loading` 使用 Playwright WebKit，預設對 localhost:4174；`QA_BASE` 可改為隔離預覽，`QA_OUT` 可指定報告目錄。測試需要可執行的 Playwright WebKit。

瀏覽器測試涵蓋網路失敗、加速的圖片逾時、完全暫停 requestAnimationFrame、手機直向、原生橫向與 CSS 側轉；驗證開始按鈕、重試、不重抓成功圖片、啟動前存檔逐字保持、以可信任的瀏覽器 click 操作進入第一章及真實 touch jump；本輪 WebKit 連續觸控選單測試曾出現幾何保護期間的點擊未接受，因此不將選單連續 tap 視為已驗證。故障注入與觀測 hook 只存在於測試截取的回應，不會寫入發行資產。

原有總解碼記憶體需求仍在。Linux WebKit / viewport 模擬不能替代實體 iPhone 的記憶體、網路與 Safari 實測，R3 是否解決該手機的固定 37% 仍需要原裝置複測。這次不合併 main、不更動正式站。

## 本次結果

- 全套單元／既有回歸：4,478 / 4,478 通過。
- WebKit source browser：五種情境通過；`boot/report.json` 與對應 ready/playing 截圖保留證據。
- 實際 `out/` 發行目錄：原生橫向、CSS 側轉均通過進入第一章及 touch jump，沒有腳本錯誤。
- 獨立 code review：沒有 Critical / Important 問題；確認新舊 76 組 key/URL 一致。
- 正式 main 維持 `488e31755dfe84db31b11c1c1f5df9dd81b452bf`。本修正推送前正式首頁 SHA-256：`80b643ad289228708f93dbdc249afc4750d53f89650f199b241314bcaa6809e1`。
