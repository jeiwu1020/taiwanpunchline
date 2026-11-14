# 完整主線候選驗證

## 範圍與基底

- 基底：`main` 的 `488e31755dfe84db31b11c1c1f5df9dd81b452bf`，隔離分支 `codex/complete-challenge-story`。
- 開工確認正式 Workers 首頁為 `workers-background-only-20261113-r1`，背景快取模組與 main SHA-256 一致：`f26f769e279b7d7f0ba99cd80d384c33accbedfe511e5d995e12045065ddd91b`。
- 保留兩名起始角色、依序解鎖五名 Boss、共用章節進度與 v4 三槽存檔；沒有替換任何圖片或音檔。第五章已於R2補上三張獨立場景、新道具與虛構場務；最終戰沿用既有議場及七角素材。既有345個媒體檔原樣保留，新圖另存。詳 [視覺補強記錄](VISUAL-VERIFICATION.md)。
- 章1補戰後音浪接續；章2維持 Boss 戰前不揭名；章3查歸還標籤、章4護送器材車，章5清點／試音／阿扁仔 BO3，七人齊備進既定三打四。
- 玩家自選一名主戰、兩名 AI 隊友，對上其餘四人。友軍不互傷、四向走位、玩家倒下繼續觀戰。150秒先比存活人數，再比剩餘血量比例總和；完全相同重試。
- 第一階段結尾取得沒電的神麥，接往議會無限城尋找無限電池並待續。未提前決定真正結局。

## 自動化

`npm test`：4,471 項通過，0 失敗／取消／略過，111.1秒。包括舊存檔、跨槽、CAS／generation／過期 token、無鎖 fail-closed、quota／讀回重試、整備與共享 viewport、相機／桌子／背景接縫、原角色21招與新三打四碰撞、AI、觀戰勝利、一次性獎勵及結局重看。

`node build/normalize-runtime-versions.mjs --write`：0差異，執行期版本一致。

`node build-release-output.mjs`：成功，525檔、259,584,792 bytes，排除170個舊／重複檔。既有共享素材hash檢查通過，新圖另加。

另跑21場有種子的完整 AI 混戰（七種主戰 × 三難度），全部正常結算且座標／血量有限；戰鬥約17–38秒。這只是完成性探針，不代表真人平衡驗收，細節見 [ai-simulations.json](ai-simulations.json)。

獨立 reviewer 檢查後指出延遲排隊線缺 depth 與跨深度／友軍排隊線碰撞兩項問題；各加失敗案例再修正，完整重跑已涵蓋。

## 瀏覽器

完整新存檔流程16項檢查通過，頁面／HTTP錯誤0；390×844直向、844×390橫向、390×844側轉90°、568×320小橫向均實際命中觸控，七人血條不被父層裁切。完整結果與圖片在 [browser/report.json](browser/report.json)。

建置後另用 localhost:4175 載入第五章與最終戰，驗證街道／混戰入場及實際Space跳躍、J攻擊；無資產或頁面錯誤，見 [built-smoke.json](built-smoke.json)。腳本 `npm run qa:campaign` 預設以 localhost:4174 為目標，先以靜態伺服器提供 `dist`；透過攔截回應附加測試用觀察點，正式碼不帶除錯入口。指定 `QA_BASE` 可變更目標，`CHROMIUM_PATH` 可指定 Chromium。

街道抵達出口及打倒對手採受控測試事件；移動、跳躍、攻擊、選隊、漫畫翻頁、換角、保存失敗與跨頁接續透過實際介面操作。此驗證是流程／存檔驗證，不能代替真人從頭打完的難度評測。

## 舊候選與限制

Library 找到 `chapter5-temple-queue-candidate-20261110.zip`（`libfile_bedc7d1959bc819189ba51dd353d0b3e`）與 `fighter-3v4-isolated-rule-spike-20261110.zip`（`libfile_bd9d3253fe508191815ea6136fde9a8e`）。官方下載 helper 皆回 `hosted apps tools/list request failed with HTTP status 401`，無法取回 bytes，不宣稱已比對或可安全沿用。GitHub 既有 heads 未含這兩份可玩實作。

未驗證實體 iPhone Safari／PWA／應用容器、Android、裝置音訊及真人平衡。Chromium 的尺寸和觸控模擬只涵蓋候選的自動化驗證，不冒充實機驗收。

## 發布狀態

隔離分支已交付；PR先前被自動核准審查拒絕，現依父線程明確指示不建立，尚無PR。沒有合併 main、執行 Workers 部署或改動 GPT Site。現行正式站保留背景接縫修正版。無限城關卡、排行榜及登入未屬本輪內容。
