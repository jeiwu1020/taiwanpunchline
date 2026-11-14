# 挑戰模式共用基礎與新增章節契約

這份文件描述未發布候選的程式接口與驗收要求，不代表已通過手機實機或人物平衡驗收。

## 一個機制，多個內容入口

- 視窗幾何唯一來源為 `viewport-core.js`；`viewport-lifecycle.mjs` 管理量測、旋轉後等待、safe area、提交版本（epoch）、穩定與失敗保護。第一章 `game-viewport.mjs`、後章 `chapter-ui.mjs` 都只當版面接頭。不能新增章別的 resize 或 visualViewport 演算法，也不能加入固定 iPhone Y 補償。
- `touch-controls.mjs` 以相同 committed epoch 接受指標；搖桿反旋轉只用同一份邏輯座標。畫面未 ready 時，觸控、鍵盤與戰鬥模擬一起停用，清除按住狀態。後章檔案只 re-export 根模組。
- 同步 bootstrap 必須先載入同一 viewport core。所有依賴的版本 URL 必須一致，不能讓同一頁載入兩份共享模組。
- Canvas 只在真尺寸改變時重設，HUD 只更新不同值；畫面遮擋幾何由 dirty cache 管理，不每一幀重排 DOM。保留正常桌面 max-width，不把它誤認為視窗未穩定。

## 章節內容與轉場

- 第二至五章的 controller 是 `campaign/chapter-controller.mjs` 的內容配置，僅提供 chapter ID、故事、敵人／地形、角色解鎖與下一章。禁止複製轉場／整備／存檔實作。
- 第一章保留既有 Phaser 呈現與開場漫畫，`AsyncChallengeSession` 是同一保存模型的轉接器，不是另一套獎勵或存檔規則。
- 持久化狀態只在 `campaign/fresh/progress.mjs` 管理，規則轉移使用 `campaign/core/transition.mjs`。各章不得直接寫 localStorage，也不得自行決定 XP、首通或重試收據。
- 一個模擬幀內多個普通怪 XP 與路段完成是一筆交易。確認寫入與讀回前不能切場；失敗凍結原場景並允許重試。不能繼續戰鬥而丟棄尚未保存的獎勵。
- 小怪重試可再領 XP，首通獎每槽一次。街道路段沿用血量、助拳和揪團；進小、大 Boss 重置，BO3 每小局沿用原有重置。一般接續是檢查點，不是逐幀存檔。
- 第五章阿扁仔首通後解鎖第七人；五章通關且七人齊備，才可進入最終戰。最終戰由同一 v4 權威保存 team-select / battle / ending / complete，勝利收據與160 XP每槽只領一次。
- 最終戰採已同意的三打四：玩家自選主戰與兩位 AI 隊友，對上其餘四人；四向走位、友軍不互傷、玩家倒下觀戰仍可由隊友取勝。150 秒未分勝負先比存活人數，再比存活者剩餘血量比例總和；平手重試。
- 本階段結尾取得神麥卻發現沒電，前往議會無限城尋找無限電池並待續；不提前揭露未來真正結局。

## 整備與共同介面

- `challenge-preparation.mjs`、`challenge-ability-view.mjs`、`challenge-preparation.css` 是所有章節唯一的整備／能力／配點表面；`settings-view.mjs` 是共用設定工作區。使用原有奶油紙、墨綠粗框與漫畫按鈕。
- `intent: save-only` 只存配置；`start/resume` 是明確入場；`boundary` 保留漫畫頁／結算畫面與資源，玩家再按繼續；`retry` 明示重開本路段或整場 Boss（BO3 比分歸零）。所有 UI 必須明確傳 intent。
- 戰鬥中（包括暫停）能力畫面唯讀，沒有假加點按鈕。更改配置走明確的重新整備並重試確認。取消、Esc、未完成草稿不寫存檔。
- 安全整備換角、加 HP 或換助拳不能免費回血／刷新充能。只夾上限，依新上限映射已累積承傷。正常與重訪兩份 carry 都遵循這個規則。

## 角色與敵人

- 七角天生能力、挑戰派生能力都由 `fighter-attributes.mjs` 計算。一般對戰與練習只用天生值；挑戰再疊各角色獨立技能點。UI 不另寫一套公式。
- 雷達固定尺度，同時顯示天生／保存／草稿實際能力，防禦軸以承傷倒數表示，數字仍直接標承傷倍率。不能用投入點數冒充角色強弱。
- 虛構小頭目借用角色招式動畫，不是七位角色本人；`challenge-opponent-policy.mjs` 保留其 70HP 和中性倍率。具名章末 Boss 與同一角色天生基底一致。難度設計需要另作明確遭遇配置，不偷偷改共用基底。
- 保留 21 招定義、素材及既有模式差異。本輪初值經程式探針檢查，不代表已證實人類對戰平衡。

## 資料安全

- 新權威鍵為 `taiwanpunchline-challenge-v4`。舊測試資料原樣保留，不自動讀取／採納／刪除；僅明按匯出舊資料才讀舊鍵。
- 三槽獨立，單槽重置／還原明示槽號。先建立並讀回復原備份，再以 revision、generation、Web Locks、原始字串 CAS 及寫後精確讀回確認。
- 不支援格式與無鎖環境 fail closed。過期分頁／草稿不能覆蓋新資料；dirty retry 也必須再次檢查來源。設定與其他槽不能連帶變更。
- 跨章 handoff 同時綁定槽、章、revision 與 generation；URL 旗標不能自行授權正式保存。
- 測試模式只能呼叫純記憶體 `preparePreview`。其角色、配點與 carry 是隔離副本，使用 preview revision 與 mode epoch；退出後丟棄。正式讀取與備份仍指向原資料，所有正式寫入 API 在測試模式繼續拒絕。不可為了讓測試模式入場而放鬆持久化防護。

## 新增章節最低驗收

正式接線順序：

- 章節 facade 呼叫 `createChapterController(config, options)`。config 提供 `chapterId/content/stepIds/storyFrames/characterNames/defaultUnlocked/unlockId/nextChapterId/createRoute/createDuel`；不要複製 controller 本體。
- `mountContinuationControls` 透過 `openChallengeContinuation` 與 `createCampaignPlayable` 連接正式 v4 權威；只在素材完成且有效 handoff 或明確接續後開始。`returnOverview()` 必須 await，失敗不得先導航。
- `mountChapterInterface` 接入 `getExitState/clearHold/onViewportChange/onReturnOverview/onRestart/onPrepare`。在 `ready` 為 false 時停用輸入與模擬；canvas 只按實際尺寸變更，不能另註冊一套 resize 邏輯。
- `bindTouchControls` 的 `viewport` 回呼必須給同一 controller 的 ready、epoch、frame／rotation；鍵盤也用同一 ready 條件。
- 成長資料由 `preparationSnapshot` 與 `getChallengeStats` 提供，共用 `mountChallengePreparation`；場景切換只在 accepted 且 persisted 後執行。測試模式需明確 preview 成功，不能假裝已保存。
- 改動本地模組後用 `node build/normalize-runtime-versions.mjs --write` 統一版本，並跑 `tests/runtime-version-coherence.test.mjs` 及所有跨章 identity、正式入口與保存測試。

1. 以內容配置接入 shared controller、factory、fresh router 及共用 UI；不複製 core、touch 或 viewport。
2. 所有正式寫入經同一 authority；實際保存、退出重進、單槽 reset/import、舊分頁衝突、quota／讀回失敗重試。
3. 新章全部街道、小 Boss、大 Boss、故事、整備、暫停、結算、出口；零點、中期與滿點。
4. 直向、原生橫向、左右側轉、桌面寬螢幕；實際量測控制中心命中、指標 capture、旋轉中按住不殘留、角色不被 HUD／控制區遮住。
5. 兩種相機，正常出怪、助拳入場、擊倒、跳躍和重複跳躍；不能單幀跳縮，也不能反覆重建相同背景。素材 hash、DPR 與碰撞結果不可因效能優化改變。
6. 實體 iPhone Safari／PWA／應用容器與 Android 分別驗證；桌面 Chromium 模擬尺寸不能冒充實機。沒有設備的項目明列未驗。
