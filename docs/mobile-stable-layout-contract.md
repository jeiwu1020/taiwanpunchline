# 手機橫向穩定相機的版面契約

適用於主入口的 VS、Boss、街道，以及第二至第四章共用入口。只有已量測、touch、邏輯寬大於高且高不超過 500px 的穩定視野使用固定人物大小。桌機、直向、classic 和未量測模式保留原動態幾何。

## 量測與渲染

`applyChallengeCameraLayout` 由顯示入口接收目前 viewport 和有效顯示中的 `frame.camera`（或 `cameraMode`），明確準備槽 CSS。接著 `measureChallengeOcclusions` 僅讀取幾何，不改 DOM、不選模式；沒有相機模式參數的檢查工具也不會關掉已顯示的穩定槽。它仍回傳原本的 `safeRect`、`occlusions`、`hudBottom` 和 `lowerLane`。手機橫向另外回傳 `fixedCameraGeometry`：

- `safeRect`：同一次量測的邏輯安全區，不重複扣除實體安全邊界。
- `occlusions`：固定文字槽、HUD 面板與未按壓控制項的版面矩形。
- `layoutKey`：共用槽版本及永久場景版面識別。真正重排、尺寸、安全區或場景版面變動仍會重新計算。

固定相機的 placement 與 geometry key 必須使用同一個 `fixedCameraGeometry`。不能只固定 key，或直接忽略 HUD。沒有這份資料的既有呼叫仍可使用原始幾何，這是相容介面，不代表瞬時 DOM 矩形已經穩定。

`applyChallengeCameraLayout` 會設定根節點的 `data-fixed-camera-layout`；入口必須在讀取任何 HUD／mic 邊界以前呼叫，確保同一輪使用新槽的尺寸。這個旗標只對有效的手機橫向穩定視野啟用：

- `#item-status` 位於 HUD 底下 3px，寬為 HUD 的 80%，固定高 15px，10px 字體、13px 單行行高、上下各 1px 內距。空文字保留槽但不顯示底色。長文字不換行或增高，而是省略超出部分；完整文字仍保留在 DOM/live region。
- 現行道具狀態的全部角色／同角色稱呼／雙方持物組合，最長 36 字。以每字完整 10px 的保守寬度上界計算為 360px；568px、無額外橫向安全邊界的槽內文寬為 431.6px。現行街道指引最長 38 字也在此預算內。不以輔助工具保留全文代替一般玩家的可見文字驗證。未來新增更長文案或更窄版面時，須重新檢查關鍵資訊是否完整可見。
- HUD 內的狀態文字由原本固定面板包住並裁切溢出；其瞬時子矩形不另增相機障礙。面板本身仍是完整硬障礙。現有漫畫邊框與控制項造型不變。
- 控制項保留按下動畫。量測從按鈕及其子提示的邏輯矩形扣除現有 0–2px 的垂直按壓位移，包含放開時的動畫中間值。更大或其他變形仍視為真正的幾何變動。

## 入口及新增章節

主入口由 `mountCombatOverlayLayout` 取得有效相機模式，先準備槽再量測當輪 HUD 和 mic 邊界。結束動畫和暫停時以已顯示的相機模式為準。`mountGameViewport` 的 camera 按鈕與純相機偏好套用透過 `isCameraFrozen` 保留現有 fixed snapshot；非固定相機、活躍切換和真正旋轉／surface 重建仍保留原 reset 行為。第二至第四章由同一個 `mountChapterInterface.cameraOptions` 量測並傳遞完整結果；暫停時保留已顯示的槽模式，恢復時才套用新選擇。新章節應接用這兩個共用介面之一，不另外量測一套文字或控制幾何。

主入口的 `cameraSafety` 是有快取的同步讀取介面。每次取用先比對便宜的結構識別：有效顯示相機、gameMode、depthRoute、titleOpen、landscapePreview、touch／layout／rotation／fullBleed、已套用的尺寸與安全邊界 inline 值、viewport epoch／surface generation、shell 原點與 canvas 身分。只有識別變動或 resize/reflow 通知標 dirty 才重新量矩形。相同識別的 getter 不讀 `getBoundingClientRect`、不寫槽旗標；文字、持物與按壓動畫不屬於結構識別。

`applyCombatPresentationLayout` 與 viewport 共用既有的街道字體旗標推導，以已套用的 fullBleed、title 和 depthRoute 同步提交 landscapePreview，再量測。這保護新世界第一次讀取早於 MutationObserver／RAF 的情況。不能只等待非同步 observer，也不能讓舊 battle 幾何先建立 Boss 的 camera history，再靠下一幀補量。新世界的 owner reset、真正 reflow 的保留倍率政策及 prepared／painted／ready 生命週期都不變。後章仍保持原本 sync／invalidateGeometry → tick 的 hud／render → cameraOptions → new-world adapter 的順序，不複製根入口的快取。

## 遮罩與保留中的戰鬥版面

可見性與版面參與是不同的契約。原始 `occlusions` 繼續排除 `visibility:hidden`；只有 compact stable 且量測入口明確傳入 `retainCombatLayout:true` 時，固定槽才保留仍有 layout 的隱藏 HUD／控制項。`hidden`／`.hidden`、自身或祖先 `display:none`、未有尺寸的控制項仍不納入。街道的 enemy panel 仍由既有 hidden 狀態排除，不能為了留槽而把真正不存在的控制項加入。

主入口額外提供 `getCombatOwner`，只能回傳目前擁有戰鬥畫面的 world。標題開啟時不保留；合法狀態是 countdown、active、paused、over，以及街道的 gate／lost。menu、title、story 不因保留舊 Duel 物件就成為戰鬥 owner。overlay 的同步 stamp 同時讀 `.screen` 的 class／hidden／display primitive，恢復遊戲的首次 getter 必須更新 raw 可見矩形，不等待 observer。穩定 getter 仍不讀矩形或 computed style。

第二至第四章的共用 UI 以實際 `getExitState().mode`、result.kind 及已由 `render({state,world})` 接收的世界決定保留資格，不以可能偽裝非戰鬥內容的 `chapterMode='pause'` 判斷。入口原順序是 sync／invalidateGeometry → tick.beginFrame → hud／render → draw 首次 cameraOptions；冷啟動且已暫停也必須遵守這個順序。只有 compact stable 的真 route／battle 或該世界結果遮罩使用 `data-retained-combat-layout=true`：控制層保留原 absolute grid，但 visibility:hidden、pointer-events:none。其他 profile 及真正 menu／story／choice／complete 繼續 display:none。owner 旗標在 viewport apply、invalidateGeometry、render 與首次 cameraOptions 前準備，不依賴 ready 或額外等待幀。

這些改動不改同幾何 pause／finish 的 pose、倍率及 follow lag，也不改真正旋轉時的 rebase 政策。新增章節必須先建立實際顯示 world，再消費 shared cameraOptions；不能先拿隱藏控制層的空幾何初始化 camera history。瀏覽器對 hidden 控制的焦點／命中測試、遮罩捲動和首次恢復畫面仍須另做 native 驗收，DOM stub 不是這些行為的實證。

將完整 camera options 傳給 `fullStageCameraFrame`、`depthRouteCameraFrame` 或 `createMobileCameraAdapter`，不要只挑出舊 `safeRect` 和 `occlusions`。新世界照既有方式重設相機；同一世界的暫停、結束與安全區重排則保留 frozen pose 和允許的水平 follow lag。

新增 HUD 若可改變外框，必須先提供有界、可讀的渲染槽，再讓同一量測契約使用該槽。不要記住第一次讀到的空矩形，也不要把真正的版面變動永遠凍結。既有 80 世界單位水平預留和每秒 480 CSSpx 跟隨速度不變。

## 窄畫面的明確代價與驗證範圍

捕獲的 568×320 Boss 事件中，舊空文字框從 10×2px 變成 137.78125×15px，使 r3 的 zoom 從 0.625 降到 0.525 並保持縮小。現在從第一幀就預留可讀的 15px 槽，初始 zoom 為 0.525；相對舊空字第一幀小 16%，不再等道具文字出現才縮小。

相同捕獲人物／原始空字幾何下，#67 是 0.5020434。若三版都使用同一份預留槽幾何，#67 為 0.4725115，r3 和修正後均為 0.525。原版恰吉王站立 alpha 高 276 世界單位，對應預留槽下 144.9 CSSpx（#67 同槽為 130.41 CSSpx）。這些是原模型及原 renderer 的離線比較，不能當成真人操作或真實手機閱讀平衡的驗收。

回歸使用實際捕獲前後矩形，DOM stub 會真的改變 `getBoundingClientRect`，涵蓋五個共用 wrapper、文字與按壓循環、雙向側轉、非零 lag、暫停／finish、尺寸／安全區／真重排及模式排除；另使用原素材的低姿勢 alpha 檢查。發布前仍需對修正版本做一次實際瀏覽器 Boss 事件驗收，並保留實體手機／Safari 的驗證限制。

另一次 r4 根入口捕獲指出：首次 Boss 消費了舊 battle:false／HUD top 48 幾何，先建立 0.375 的倍率；其後正確 challenge:false／HUD top 40 到來仍保留該倍率。r5 的入口回歸使用這對捕獲矩形、真 startRound／newDuel／syncModeHUD 及原相機選擇與 owner commit 語句，驗證第一次 cameraView／setZoom 就是正確槽的 0.525，而不是先小後大。該離線測試不能證明瀏覽器合成器的精確首次可見像素；發布 gate 仍需要新版本的原生瀏覽器證據。
