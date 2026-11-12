# V38 larger roster portraits

## Change

Only selection CSS changes. The seven choices remain in one page, with both player and AI selectors, mirror selection, readable names and side badges, difficulty, and Start. Desktop and landscape use seven image-first cards in a row; upright phones use a four-plus-three gallery. Images fill their available grid cells instead of being capped at 34px or tied to the physical viewport height. On short upright phones, more of the available vertical area is assigned to the seven choices, rather than the selected-player preview.

The existing portrait click/voice logic, character roster, title, battle, and assets are unchanged by this selection work. Parent integration updates the roster stylesheet query to v38.

## Verification

Official Sites preview at http://127.0.0.1:4173/; browser operated only with CUA. Existing qa-viewport.html supplied phone-sized frames. A temporary 1280×720 desktop preset was removed afterward. These are desktop-browser viewport simulations, not physical-device tests.

Measured final CSS image boxes (width × height, CSS pixels):

| Viewport | Seven roster images | Selected preview | Menu client / scroll height |
| --- | --- | --- | --- |
| Desktop 1180×757 | 133.4×174 | 154×188 | 703 / 703 |
| Desktop 1280×720 | 133.4×165.3 | 154×188 | 666 / 666 |
| Landscape 844×390 | 101.7×94.5 | 108×105.5 | 342 / 342 |
| Landscape 568×320 | 62.9×58.2 | 88×75.8 | 272 / 272 |
| Upright 390×720 | 76×97.7 | 140.8×140.8 | 652 / 652 |
| Upright 320×568 | 58.5×52.7 | 78.8×78.8 | 500 / 500 |
| Physical 390×720, default rotation on | about 84×95 logical | 108×106 logical | 342 / 342 |

Object-fit contain preserves complete artwork, so a square source paints within the smaller dimension of each box. The Han source is slightly narrower than square. All seven cards, two selectors, difficulty and Start were inside the menu bounds in every listed case; no internal vertical overflow. Buttons retain minimum 44px touch targets and names remain at least 13px.

Before editing, desktop 1180×757 measured selected images 90×122 and roster images about 109.7×68.1. For phones, the previous source capped upright/narrow gallery images at 34px; this is a source-derived comparison, not a captured baseline phone measurement.

Browser interactions verified:

- Switch AI to 柯P, switch player to 小馬哥, choose 正式開吵, then Start. Countdown shows the chosen characters.
- On small upright phone, select 恰吉王 for both roles; 你＋AI badge and active AI selector update correctly.
- Toggle rotation through the settings UI, inspect upright and rotated layouts, then restore the original rotation-on preference.

## Automated checks

New tests in tests/roster-portraits-v38.test.mjs fail against the original CSS for desktop, landscape, upright and selected-head sizing, then pass after the changes. The small-upright budget uses the measured 500px menu height and resolves the CSS row allocation, catching excessive space given to selected previews.

Existing roster and entry-voice tests verify all seven deliberate first-move auditions, silent entry/match priming, side switching without unwanted voice, mirror selection, difficulty persistence, and no hidden-roster reset of an active match. Full suite result is recorded by the final integration run.
