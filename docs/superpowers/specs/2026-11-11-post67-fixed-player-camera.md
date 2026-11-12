# #67 手機橫向穩定視野：固定主角尺度設計

> Follow amendment: `docs/superpowers/specs/2026-11-11-fixed-scale-follow-repair.md` supersedes the exact screen-anchor and exact x-follow requirements below after the paired collision regression. Constant scale and unrelated safety/preservation requirements remain.

狀態：設計與唯讀基線證據已備妥，已批准在 #67 隔離候選逐段實作與驗證。工具列與相機分開檢查；最終視覺驗收、備份讀回還原和版本衝突檢查完成前不發布。

## 目標、範圍與來源

使用者要求把手機橫向「穩定視野」改為主角固定可視尺度，敵人可暫時出框；涵蓋街道、一般 VS、挑戰 Boss、原生橫向及側轉。主角跳躍以平移保持可見；畫外對手方向須可辨識。

- Authoritative baseline：`806f00c3f16d51708c7bd52f4da8ca57825f7b89`。
- 唯讀 checkout：`/workspace/scratch/1a1351aee944/punchline-mobile-landscape-nov11/publication/checkout/.sites-checkout`。
- 待實作 candidate：`/workspace/scratch/1a1351aee944/punchline-mobile-landscape-nov11/candidate`，預期分支 `candidate/post67-display-fixes-20261111`。寫前重讀 HEAD、工作樹及其他工作者提交，不覆蓋並行成果。
- 不改：classic/dynamic、手機直向、桌機、touch 高度 >500、未量測 fallback、故事構圖、模擬／碰撞／速度／存檔、背景 cache／圖片／密度、actor draw。
- 一般 VS 和練習共用入口，兩者一致套用新模式；交付時明說，不另設練習鏡頭。
- 本輪工具列修正只有 touch portrait，不預期改變新橫向幾何。

## 已確認根因與入口

`dist/challenge-camera.mjs:fitChallengeCamera()` 的 stable 目前仍對所有 subjects、forecast、assist、retained poses 求可行 zoom，平移限制也可迫使縮小。只減慢 easing 或只把當前 actors 改成 `[player]` 均不充分。

| 路徑 | 實際鏈 | 實作位置 |
| --- | --- | --- |
| 主章一般 VS、練習、miniboss/Boss | `game.mjs:updateFrame()` → `fullStageCameraFrame()` → `fitChallengeCamera()` | 共用 fixed branch；主章只補幾何重驗／提示接線 |
| 主章街道 | `game.mjs` 建 `ChallengeDepthRoute` → `routeCameraFrame()` → `depthRouteCameraFrame()` → `fitChallengeCamera()` | 同一 fixed branch |
| 後章 2/3/4 街道與 Boss | 各 `chapter*-playable.mjs:draw()` → `createMobileCameraAdapter().frame()` → `fitChallengeCamera()` | 同一 fixed branch |

`challenge-render.mjs:routeCameraFrame()` 的非 depth legacy 分支不進 solver，但主章實際使用 `ChallengeDepthRoute`。保留這條未使用舊分支，不聲稱新政策涵蓋它。主章所有 battle 模式共用上述入口，後章的 Boss 不是另一個獨立相機。

## 選擇的方案與不採用方案

採用 **canonical 單主角盒 + 固定安全 screen anchor**。在有效畫面幾何確立時求最大可行單主角尺度，正常遊戲只依主角位置平移。

不採用「維持 all-fit，但增加最小 zoom／放慢縮放」：仍不符合固定尺度，也可能把主角裁掉。不採用「現有 actors 換成 player」：prediction、forecast 和 continuous-pan 的縮放 fallback 仍會變尺度。也不改 renderer／另造相機系統。

## 核心 API 與 frame 合約

在 `dist/challenge-camera.mjs` 增加以下明確介面。既有 `fitChallengeCamera()` 簽名不變。

- `isPlayerFixedCameraProfile(width, height, options={}) -> boolean`：`options.measuredCameraSafety !== false && isMobileLandscapePresentation({...options,width,height}) && (options.cameraMode ?? options.camera ?? 'classic') === 'stable'`。
- `playerFixedGeometryKey(width, height, options={}) -> string`：用現有 `geometry()` 的實際正規化結果建立 signature，不能讀 DOM。
- `canReuseCameraFrame(frame, width, height, options={}) -> boolean`：沒有 frame／尺寸不同為 false；舊非 fixed frame 同尺寸維持原結果 true；fixed frame 要求 compact measured mobile profile 及相同 geometry key。此函式檢查既有 frame 的幾何，不用新選模式推翻暫停中的既有模式。
- `fitPlayerFixedCamera(preferred, player, previous, options) -> fittedFrame`：私有或 export 皆可，但實作 brief 以私有 helper 為預設。只使用 player 與 geometry，不看敵人、forecast、assist。

成功 frame 保留既有 `cameraSafetyFit:true`、`controlOverlay:'soft'`、`challengeCameraMode:'stable'`，新增：

```text
playerFixedCamera: {
  version: 1,
  geometryKey,
  zoom,
  anchor: {x, y},          // 主角 ground/foot anchor 的 logical screen 座標
  pose: {x, displayY}      // 最近一個已顯示主角的值複本，非 actor reference
}
```

`pose.displayY = player.y + finite(player.depth,0)*.65`。canonical 盒固定為 `left:-132,right:132,top:-300,bottom:28`，不隨動作、vy、supportY、敵人或 depth 改尺寸。proxy 是安全代理，非 alpha 尺寸。

## 固定尺度與平移

首次／真幾何改變時：

1. 最大尺度 `min(1.4,width/440,height*.68/328)`。
2. 以 canonical 盒、現有 padded/clipped geometry、soft controls 及 `placeAtScale()` 求安全 screen anchor；偏好 `(width/2,height*.84)`。
3. 若最大尺度無解，用既有二分精度求最大可行尺度。必須找到安全 anchor 才標記 `cameraSafetyFit:true`；無效／完全封死幾何不能冒稱成功。
4. 新 geometry 若舊 zoom 仍可行，優先保留舊 zoom 並移到最近安全 anchor，避免僅 HUD 位置變化就重建尺度。真正 logical width/height 或 compact profile 改變，重新從新上限求尺度。舊 zoom 若大於新上限，遵循新上限。

相同 geometry key 時，直接重用同一 zoom 與 anchor，公式為：

```text
camera.x = player.x + (width/2 - anchor.x)/zoom
camera.y = player.displayY + (height/2 - anchor.y)/zoom
```

因此每幀主角安全代理投影完全相同；jump、table、depth、roll、knockback 不改 zoom。初版不另加 deadzone／easing，避免引入另一種失效與 pocket switching。真實角色位移可能令背景相應平移；這是追蹤角色，不是 solver 任意換 pocket。自然小步移動與任意瞬移的驗收分開。

保留 `challengeCameraSubjects()`／`challengeCameraPlan()` 原意，fixed branch 不讀它們來決定尺度。其餘分支原碼保持，尤其 solver candidate 次序、rect union、tie-break 不重構。

帶 `base` 的輸出要維持既有 renderer 轉換：`base=height/2+(430-camera.y)*zoom`、`jumpPan=0`。backdropZoom/Top/Bottom 保持既有顯示約定與覆蓋範圍；不得為本相機修改 raster cache、density policy 或增設全畫面 copy。

## Signature、viewport epoch 與暫停／結算

signature 包含：version、width/height、geometry rect 的四個有效邊界、正規化後每個遮擋的四邊及 soft/hard 標記。遮擋 tuple 排序後序列化，等值物件或重新排序不應製造新 epoch。padding 已在 geometry 生效；不能忽略 soft policy。不要把尺寸 round 後的 key 當實際安全證明。

不包含：DOM object identity、ResizeObserver/MutationObserver 次數、文字、血條 width style、button class、戰鬥幀號、actor reference、spawn/assist、viewport lifecycle 純狀態回呼。真實矩形座標改變才是 camera geometry 改變。viewport epoch 是觸發重新量測的通知，不是無條件縮放指令；同 epoch 仍可有真 HUD reflow，同幾何的新 epoch 不必改尺度。

以下四個 paused 早退改用 `canReuseCameraFrame()`，但只讓 fixed frame 的真幾何變更失效，不改舊 profile 的凍結規則：

- `combat-presentation.mjs:fullStageCameraFrame()`。
- `challenge-depth-render.mjs:depthRouteCameraFrame()`。
- `preview/campaign/mobile-camera-adapter.mjs:frame()`。
- `challenge-camera.mjs:fitChallengeCamera()`。

暫停且 geometry 相同：返回原 frame，畫面／zoom／mode 都凍結，包括暫停期間 UI 改相機選項。暫停 fixed frame 且真幾何改變：以 `previous.playerFixedCamera.pose` 值複本重投影，不追蹤被外界改動的 live actor；維持既有 stable 模式到恢復。離開 compact profile 時依原 viewport 重建流程處理，不把 fixed state 搬到直向／桌機。恢復時才採新選模式及 live player。

主章 `matchFinish.camera`：保留原結算動畫凍結。只有既有 fixed frame 的 geometry 不匹配才重投影，傳該 finish frame 為 previous 並以 paused 語意使用凍結 pose；不能每幀重算 live fighters，也不能重新啟動 finish sequence。舊 classic/portrait/desktop 的尺寸凍結行為不變。結算、暫停、選角、故事和 viewport 未 ready 時隱藏方向 badge。

## 畫外對手方向提示：純函式＋小型 DOM

新增 `dist/camera-direction-hints.mjs`，一個共用模組，不新增 canvas，不使用 fullscreen pixel copy。

- `offscreenOpponentHints(frame,world,{route=false,geometry,maxHints=2}) -> Array<Hint>` 為純函式。只在 `frame.playerFixedCamera` 存在時輸出。
- `mountCameraDirectionHints({document,root}) -> {setGeometry,update,clear,destroy}` 管理兩個可重用 badge。`setGeometry({width,height,origin,safeRect,occlusions})` 保存 logical canvas 到 root 的偏移與有效遮擋；`update(frame,world,{route=false,active=true})` 做純計算、只在值改變時更新 DOM。`clear()` 隱藏；`destroy()` 移除。
- Hint fields：`key,arrow,label,count,left,top,width,height`。badge 預設 88×24 logical px，文字「對手」或「敵人」，箭頭使用八方向；空間不足退成 24×24 arrow-only。最多左右各一組，選該側最近活敵並可標數量。垂直離框的敵人歸其相對主角 x 所在側，箭頭仍反映上／下／斜向。
- VS/Boss 只看活著的 `world.enemy`。街道取真正存在且仍活著的敵方集合與 `challengeCameraSubjects(world,{route:true})` 交集；不顯示未生成預告、遠方不構成局部威脅的敵人或我方 helper。
- 敵人完整代理框不能容於 safeRect 時顯示提示，完整返回即消失。這是保守提示，可能在敵人尚有部分可見時出現，不聲稱判斷了實際 alpha 遮擋。
- 從對應 safeRect 左／右邊緣、靠近中間高度的合法 slots 擇近，避開主角 proxy、HUD、控制區、另一 badge。不能把 badge 自己加入 camera occlusions。若沒有標籤空間先退小箭頭；極端完全無合法位置回傳空陣列，不覆蓋主角補洞。這種封死的合成幾何須有測試；正常 recorded geometry 若發生則是待回報的驗收缺口，不可默認忽略。
- DOM root container `position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5`，badge `aria-hidden=true`、無 role=button／tabindex／aria-live。不要全屏背景或 filter。所有 badge 均 pointer-events:none。
- 提示沿用既有漫畫介面：奶油紙色 `#fff5dc`、墨綠 `#173239` 文字與2px框、4px圓角、12px粗體、`box-sizing:border-box`。不新增陰影或 filter，以免視覺邊緣超出定位檢查的矩形。

### 主章接線

`combat-overlay-layout.mjs` 的既有 canvas 是 **64×64 路麥 canvas**，不是全畫面 canvas。原尺寸、DPR、drawFlyingMic 路徑完全保留。

同模組掛 shared DOM hints 為 `.app` 子元素；在既有 `refresh()` 重新量測 geometry 時，以 `challengeLogicalRect(canvasRect,rootRect,rotation)` 計算 hints origin，呼叫 `hints.setGeometry()`。在既有 `draw()` 額外接收 `cameraFrame,world,hintsActive` 並先 update hints，再走原 route-mic 可見性 early return；不能因不是 route 而跳過 VS/Boss hints。`destroy()` 同時清理 hints。

`game.mjs:updateFrame()` 既有 overlay draw 呼叫追加上述資料，`hintsActive` 要求 duel active、viewport ready、沒有 matchFinish／home／settings／result 遮罩。其餘 actor draw 不動。

### 後章接線

`preview/campaign/chapter-ui.mjs` 在 `#trial-app` 掛同一 shared DOM hints；`cameraOptions()` 真正重新量測時更新 geometry/origin，對外新增 `renderCameraHints(frame,world,{route=false,active=true})` 與 `clearCameraHints()`。既有 `render({state,world})` 遇到 story/choice/complete/paused/noncombat 時 clear，destroy 同步清理。

後章 2/3/4 的 `draw()` 在 `f=mobileCamera.frame(...)` 後各加一行 `ui.renderCameraHints(f.cameraFrame,g,{route,active:...})`。跳過戰鬥 draw 的早退要 clear。相機 adapter 保持純幾何，不偷偷依賴 DOM callback。不得修改 actor draw／scene layer 排序。

## Baseline golden 與不變合約

本目錄已有 `capture-baseline-classic.mjs`：僅可對 clean、HEAD 精確等於 #67 的 checkout 執行，輸出寫在本目錄，不寫 baseline。已擷取：

- `baseline-classic-v67.json`：108 scenarios、1536 frames，含 native/rotated 844×390、568×320，main VS/street、later Boss/street，單點及 120-frame 含 jump/depth/assist trace。
- `baseline-classic-provenance.json`：baseline HEAD、來源檔案 SHA-256、capture script SHA-256、golden SHA-256、前後 clean 記錄。
- Golden SHA-256：`584959896ba56b775dce542f500492d690906d9cbf1af2667f6a3c021db48df6`。

實作時可把這份已生成 golden 原封複製成 `tests/fixtures/mobile-classic-v67-golden.json`，測試只讀固定 JSON，逐 scenario replay candidate 輸出。不得對 candidate 執行 capture、更新 expected 迎合 candidate，亦不得以「candidate 與自己」驗證 preservation。main VS 的 training/Boss 別名另外用實際入口測試證明，不把重複數值當入口證據。

既有 `tests/fixtures/mobile-landscape-preservation-nov11.json` 及 solver reference 原封不動。classic golden、portrait/desktop frozen x/y/zoom、solver 精確 tie-break 都必須通過。

## 驗收與風險

新增精確 zoom 不變測試涵蓋敵人分離、兩側進場、死亡、forecast、helper 各階段、jump/table/depth/roll、native/±90、root/later/Boss、暫停/結算/resize/world reset；只對新 profile 將 all-subject 安全改為 player-only，不刪掉其他 profile 的安全斷言。

重跑七角色原始低姿勢 alpha，保持主角 alpha 不出框、不完全落入 controls union。幾何 proxy 安全不能冒充動畫 alpha／實機閱讀性保證。固定 anchor 使新模式行走時背景跟隨主角；自然小步平移不應有額外 pocket cut，但受擊／瞬移可造成相應即時安全平移，測試不能偷要求所有瞬移都平滑。

最終需全量 `npm test`、source entry wiring tests 與實際 browser native/sideways VS、街道、Boss smoke。共享 preview 使用要先由父代理協調；此準備階段不開。背景兩條線由其他工作者處理，不拿固定 zoom 當接縫已修好的證據。
