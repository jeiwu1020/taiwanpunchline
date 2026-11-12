# V70 responsive controls verification

## Scope and safety

Based on committed V69 c8851f389dd803f80970526cfc6fcb14f8f9ca00. V69 contains the short-portrait camera/background, guard neck, and challenge-panel corrections. This follow-up changes the final control stylesheet and minimal button markup only. Combat, experience, saves and input bindings are unchanged.

The original published #45 source and V69 are separately archived. No GitHub or public-site deployment is part of this work. The testing wrapper is kept outside dist; it must not be deployed.

## Checks

- Full Node test suite: 2342 passed, zero failed. Independent read-only code review also ran the complete suite successfully.
- Cloud Chrome rendered iframe viewports: 320×568 and 390×650 portrait, 390×600 short portrait, 740×360 and 844×390 landscape, 390×650 with CSS sideways, and 1200×750 desktop.
- Portrait street action positions: assist/jump upper row; rally/guard/attack lower row. All action buttons 54×54. Landscape actions 58×58, left to right rally, assist, jump, guard, attack.
- VS and practice keep the street-only jump hidden. Desktop retains original movement buttons and key bindings. K and left Shift still both guard; the compact visible hint is K.
- Longest tested move name, 可以這樣插隊喔, occupies two 19px lines with a separate 20px cooldown region. It does not clip in landscape VS, portrait, sideways or desktop.
- Move activation showed a live 5.9-second cooldown in the street. Releasing held controls left zero held classes. Rally's partial fill and assist's full fill were inspected in computed styles; no duplicate horizontal strips remain in the main game.
- Viewport switching pauses gameplay as before. Settings and pause remain interactive; returning to gameplay restores controls. A second settled resume was needed after some wrapper resize transitions.
- Test mode was entered through the existing five-click homepage control. It did not permanently unlock profile characters. No save was deleted or imported.

## Limits

This is browser simulation on cloud Chrome, not a physical iPhone, Safari, or installed web app test. The current iPhone browser toolbar/viewport symptom was reproduced structurally with the shorter iframe and V69 logical-viewport checks; real-device confirmation remains useful. Training has unlimited assist/no cooldown, so those states were not used as proof of finite-meter consumption.

## QA wrapper

docs/qa/controls-v70.html is a developer-only viewport harness. For a repeat QA session, temporarily copy it to dist/qa-controls-v70.html and point its iframe at index.html. Remove the temporary copy before packaging.
