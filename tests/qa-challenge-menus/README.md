# Managed preview menu fixture

This fixture mounts the real character, preparation, overview and v4 controller modules. All storage calls are prefixed with `task5-isolated-qa:`. It never reads or changes official player saves. `fresh=1` removes only that synthetic namespace.

Prepare a managed Sites release output, then copy `index.html`, `harness.mjs`, and `matrix.html` to `out/qa-menus/`. Rewrite HTML `/dist/` asset URLs and harness `../../dist/` imports to `../`. Rewrite portrait `/dist/` to `../`. Do not place this fixture in product `dist`, and do not start an independent server or browser. Use the verified managed preview URL `/qa-menus/matrix.html` in CUA.

The eight buttons set real iframe viewport sizes (320×568, 390×844, 430×932, 844×390, 568×320, ±90° 390×844, 1200×800). They are browser layout tests, not physical mobile device emulation. Native modal, custom pickers, focus, and click hit-testing run in the actual browser.

The output below the iframe reports the real controller snapshot and dialog geometry. Reports are asynchronous postMessage observations; wait for the matching new revision/status before recording them. A save result message and the controller's persisted flag are separate checks. Observe actual UI controls and errors rather than claiming success from a click.

Suggested checks: add points to inspected Han while main remains Wang; Cancel/Escape; save and reload; readonly no plus; simulate quota failure and retry; single-slot reset cancel/confirm; second independent browser tab resets while the first owns a draft; inspect/reject wrong-slot or all-document import. Browser file-download events may not expose a saved path in the managed browser; do not report a file round trip unless verified.
