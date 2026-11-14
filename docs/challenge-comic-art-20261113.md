# 2026-11-13 漫畫與道具素材紀錄

生成工具：內建 image_gen；參照既有議會場景與道具，未使用外部照片或真人引言。

## 六格道具 atlas

- 路徑：`dist/assets/challenge/encounter-props-v2.png`
- 規格：1536×1024，RGBA，六格512×512；原始PNG保留透明，沒有影像後製。
- SHA256：`0c1b2f1554b69e8a1c166c44993683b1557b3bdd8f3d3e1c508d81fdedc5e3ec`
- 參照：既有 `encounter-props-v1.png` 與 `arena-chamber-v19.webp`。
- 實際裁切與比例由 `chapter-encounter-art.mjs` 的 ENCOUNTER_SPRITES 定義；圖內不生成文字，操作提示和標籤由遊戲字體繪製。

完整 prompt：

Use case: illustration-story. Create one production sprite atlas for the Taiwanese satirical fighting game shown by the two reference images. Match their mature pen-and-ink hatching, bold dark forest ink outlines, warm old-paper highlights, worn golden wood, moss green and restrained brick red. References are STYLE references only. Transparent background, no floor plane, no drop shadows, no text, no letters, no UI, no people. EXACT layout: 1536x1024 landscape, 3 columns by 2 rows, six nonoverlapping equal 512x512 cells; center one entire isolated object in each cell, with at least 32px transparent padding on all sides. ALL objects front or slight three-quarter view for a side-scrolling game. Top-left: a tall hinged three-panel acoustic folding screen, green upholstered ribbed padding within dark wood frames, brass hinges and sturdy feet, strongly recognizable sound barrier; top-middle: a low wooden pushcart with two very obvious large dark rubber wheels, curved handle on right, two strapped golden wooden boxes, red cloth tied to handle; top-right: a substantial moss-green rotating double-arrow traffic direction board on a golden wood post and wide base, plain cream arrows pointing opposite ways with no words, a red and white striped hinged short barrier arm beside post; bottom-left: a tall wooden coat valet wearing an EMPTY navy business suit jacket on its hanger, one long empty sleeve extended as though offering a handshake, a large brass service bell attached at waist height, no face or person; bottom-middle: a squat green filing cabinet with three distinguishable drawers and brass handles, the middle drawer pulled OPEN to a dark paper-catching mouth, a large red rubber stamp mounted on top, cream folders, sturdy feet, obvious bureaucratic cartoon prop; bottom-right: a tall CLOSED carved golden-wood double door inside an ornate arch matching the reference parliamentary chamber, dark moss green ornamental insets, a small square brass battery-key socket on the right jamb at waist height, no surrounding wall, entire door and arch visible. Consistent fine-grained hand painted texture and deliberate humorous prop silhouettes. Each sprite must remain separate with all transparent gutters; do not combine objects between cells or add labels.

## 議會密道背景

- 路徑：`dist/assets/challenge/infinite-corridor-v1.png`
- 規格：1536×1024，不透明PNG，原始檔未後製。
- SHA256：`e92accec6630c2d7a6577a4091afdecec4696e83a64137467ed0efa139225b2a`
- 參照：`dist/assets/arena-chamber-v19.webp`；與議會的木雕、線條、金木/墨綠配色對照。
- 密道/門口/開門共用背景與同atlas木門，程式分層呈現門、電池鑰匙及角色。

完整 prompt：

Create a production 2D comic game background for the Taiwanese satirical fighting game in the reference image. Match its warm carved golden wood, moss-green accents, confident fine dark ink contours, pencil hatching and hand-painted old-paper grain EXACTLY. No people, no text, no signage, no UI. Landscape 3:2 composition. We have discovered a secret corridor beneath this parliamentary chamber. Foreground is a warm stone stair landing, left and right framing walls have carved timber paneling, old gilt framed wall mural swung slightly aside on the LEFT and three old brass lamps along the left receding wall, the third glowing. CENTER is a tall dark EMPTY arched passage with NO DOOR, approx 40 percent image width and 75 percent image height, into which the game can overlay its carved double door. Beyond the arch mysterious galleries and wooden stair landings recede down and sideways into teal darkness, one tiny amber lamp deep in the distance. Keep the lower foreground empty for game characters. Intriguing and funny-adventure tone, not horror, no skulls, no industrial sci-fi. Fully finished illustration with detailed wood grain, stone seams, subtle dust and believable warm light, consistent with reference. Opaque background.

## 視覺驗證

以 `scripts/render-comic-props.mjs` 使用遊戲實際Canvas renderer繪製五種道具的靜態/互動狀態、六個Ending視覺段落。核對透明邊界、完整輪廓、欄杆/飛行退件/蓋章/聲波/敲鈴辨識。線上手機直橫與桌機驗證結果另記於本輪驗收紀錄。

