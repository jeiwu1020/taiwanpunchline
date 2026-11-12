# V75 stable full-stage presentation

## Changes

The existing control arrangements now overlay one canvas that fills the safe-area shell. Header and HUD are overlay layers too. Portrait pause, home, results and menu overlays no longer collapse control rows or resize the canvas. Paused VS cameras also freeze any pending ease. The pause tint is light and the visible scene remains blurred underneath.

The progress/timer cell has a 60px track and a four-character 20px monospace budget. This covers 0–100% without a viewport-based font override.

`combat-presentation.mjs` shares display-space HUD/control insets between the VS camera adapter and the depth-route full-stage path. Combat physics and fixed chamber/desk coordinates remain unchanged. Chamber tiles are allocated against actual camera bounds, preserving the world scale through jumps; challenge arena backdrop clipping also uses the complete visible world bounds rather than a fixed rectangle.

The page-level repeated-tap fallback now includes pointer-driven game buttons and their descendants. Their actions already arrive through pointer input, so canceled compatibility clicks do not remove game actions. Ordinary menu buttons, form controls, scrolls and accessibility zoom behavior retain their existing exceptions. This hardens an independently testable fallback gap; physical iOS Safari repeated-tap zoom is not verified by Node tests.

## Evidence

- `presentation-red.log`: initial five missing-behavior regressions.
- `route-inset-red.log`: route floor/controls overlap before full-stage insets.
- `pause-camera-red.log` / `pause-camera-green.log`: camera ease freeze.
- `arena-coverage-red.log`: fixed challenge arena coverage failed tall viewport.
- `presentation-final-focused.log`: final focused results.
- `presentation-full-suite.log`: intermediate full suite, before replacing obsolete dock contracts.

CSS contract tests do not paint text or prove physical browser gesture behavior. Browser visual QA remains the coordinator's responsibility, with actual phone verification required for iOS-native zoom claims.
