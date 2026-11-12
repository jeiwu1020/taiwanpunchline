# Post-67 landscape partial-background seam repair

The user approved correcting first-chapter street lines that appear on phone landscape, not portrait. Original #67 is commit806f00c3f16d51708c7bd52f4da8ca57825f7b89. Desktop Chromium with the real Phaser.CANVAS path reproduced two defects in finite background filling: separate antialiased pending-band clips and ready/pending layer joins. Ready-only rows did not reproduce these lines during near/far60-position scans. This correction must not be presented as proof of every physical-phone artifact.

## Required behavior

When at least one visible finite background row is pending, hide all cached facade displays for that frame and draw the whole visible facade exactly once through the existing dynamic2× canvas. Keep the sky separate and unchanged. Do not clip the facade into internal bands or overlap translucent strips. Resume the unchanged cached facade displays as soon as every visible row is ready. Offscreen prefetch alone must not activate fallback.

Keep draw/paintPending public signatures and return meanings, pending diagnostics, bounded per-frame tile building and allocation/release budgets. Keep the retained portrait/desktop policy and legacy non-layered fallback unchanged. No new canvas or persistent cache. No change to images, filtering, DPR, density, camera, actor drawing, engine, UI, storage or Phaser pilot.

## Evidence and acceptance

Native tests must model intermediate2× and final1× output, with the original facade, sky and repair images. Compare each partial stage to a single uninterrupted facade pass, including ready/pending mixtures, near and far views and worldY0/256/512 boundary rows. A fully opaque sky makes final alpha-only tests insufficient, so assert per-row RGB and absence of the bright trough. Keep near/far/near ready correctness, allocation limits, reset/surface recovery and offscreen-prefetch behavior. Record cold and refill costs as native surrogate data, not phone FPS.

After implementation and review, re-run the isolated actual Chromium/Phaser fixture for near/far pending/reveal and fractional ready movement. No real player storage or production changes. Parent controls preview coordination, final integration, backup and release.
