# V51 mobile gesture changes

## Root cause

V34 only guarded countdown/live combat inside `#viewport-shell`. Pausing or opening settings deliberately released the guard. `.screen`, native controls, header content and the separate settings dialog were deliberately excluded. `touch-action: manipulation` also permits pinch. Passing the previous tests therefore did not imply the requested pause/settings behavior.

## Implementation

- Keep `battle-gestures.mjs` unchanged as the exclusive combat pointer policy. Continue releasing it for pause/settings so it cannot swallow native scrolling or control activation.
- Add `page-zoom-gestures.mjs` on the game document, with explicit ownership of the shell, separate settings dialog and body/html safe-area gaps. Only owned multipoint touch sequences and Safari gesture sequences are canceled. Unknown or outside contacts are not adopted.
- Default shell/dialog/scroller CSS to `pan-x pan-y`: scrolling remains native while pinch and double-tap zoom are excluded. Single-finger slider input retains `pan-x`; no viewport zoom-cap or `user-scalable=no` is introduced.
- Repeated nearby taps on text/empty surfaces have a 350 ms, movement-aware fallback. Buttons, links, checkbox labels, range inputs, selects and editable controls retain native compatibility clicks. Their CSS handles double-tap zoom. No synthetic clicks, propagation blocking or pointer changes are introduced.
- The double-tap record copies `clientX/clientY` explicitly. Real Safari Touch properties may be inherited getters, so object spreading a Touch object is not sufficient.
- Settings → 操作與畫面 now includes “允許頁面雙指縮放（輔助閱讀）”. It defaults off and writes its separate localStorage preference only on a user change. Enabling it restores pinch in pause/menu/settings, while retaining double-tap protection. The exclusive live-combat lock remains. Browser text sizing and the separately zoomable move guide remain available.
- `clearHold()` resets stale page and battle gesture ownership during state/viewport interruptions. Reset never adopts an already-held native contact.

## Verification

- Red-first tests confirmed missing module/policy failures, then separately exposed and fixed the non-enumerable Safari Touch-coordinate regression.
- 11 new gesture/preference tests cover battle/pause/dialog/body, independent native controls/scrolling, tap movement/timing, Safari gesture retargeting, mixed ownership, reset/cancel/destroy, reading mode and persistence failure.
- Existing CSS tests were revised to reflect the newly requested default while retaining explicit native scrolling, range-drag and accessible reading-mode assertions. The V34 combat ownership tests remain intact.
- Browser-only boundaries in three older test harnesses gained documentElement/body and imports for the real new module. No combat expectations were removed.
- Final `npm test`: **1,859 passed, 0 failed**, 7.62 seconds. `node --check dist/page-zoom-gestures.mjs` and `git diff --check` passed.
- This worker did not run physical iOS Safari. Node event tests are not proof of native iOS gesture recognition. Before claiming that verification, test rapid taps at joystick edges, dual joystick/attack, deliberate pinch in battle/pause/settings, one-finger dialog scroll/range/checkbox, rotation while held, and the reading-mode toggle on a real iPhone. Browser chrome and OS accessibility zoom are outside a page's control. Already-zoomed pages can be reduced using reading mode; the implementation does not forcibly reset browser scale.
