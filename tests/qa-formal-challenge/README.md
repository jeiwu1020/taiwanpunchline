# Formal browser QA harness

Local-only. Not copied into `dist` or published. The managed Sites preview may run `server.mjs` via an isolated dev package after preview ownership is confirmed. Do not start a second local server in a managed environment.

- Browser uses real chapter HTML, CSS, runtime, progress APIs and one-use formal handoff. No `test`, `qa`, or `previewOnly` entry flags.
- Synthetic legacy fixture is adopted and advanced through real progress API to the desired chapter/checkpoint. The app opens through its real formal continuation path.
- All game/settings/handoff Storage keys are mapped into the `formalQA-nov11:` namespace before runtime load. Existing origin saves are neither read nor changed.
- Explicit world gate, duel win/loss and depleted-resource buttons inject deterministic world outcomes into the real runtime. They are labelled test drivers, **not** claims of player-input or natural combat coverage.
- Storage failure uses real `Storage.setItem` exception; save-busy uses the actual named Web Lock; rival save uses a separate production progress instance. Save UI is production UI.
- Rectangles, viewport containment and center hit testing are captured from actual rendered DOM. Disabled or obscured background controls are reported, not automatically counted as failures. Scrollable modal content requires separate reachability checks.
- Insets are simulated by replacing `env(safe-area-inset-left/right)` in served CSS, without editing production files. Not a real notch/device test.
- Parent controls resize the iframe to test responsive viewport dimensions. This does not emulate a hardware phone, mobile browser engine, multi-touch, or audio hardware.
- Final report writes only `tests/qa-formal-challenge/evidence/latest-browser-report.json`. Browser control uses the documented CUA API, never external Playwright/CDP.
