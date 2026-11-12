# V8 portrait style verification

Scope: replace only Su and Chen heads, keep all seven characters, 21 specials, limbs, props, crouch and combat rules. Cache keys are V8. Two new 1254×1254 textures are smaller than V7: Su 1,348,140 bytes; Chen 1,573,026 bytes.

## Automated checks
- 302/302 Node tests pass after removing temporary browser fixtures.
- The two V8 path tests first failed against V7, then passed after integration.
- Existing hash guards confirm unchanged core logic, game logic, pose modules, renderer body geometry, all non-target art and cast metadata (excluding the two portrait paths).
- All 49 pairings complete on both difficulties with three deterministic seeds. No gameplay balance or hitbox changes.
- Lossless WebP conversion preserves every RGBA pixel from generated PNGs.
- Diff whitespace check passes.

## Visual review
The original V7 portraits, official identity photos, Wang/Han/Ma style references, and new pair were inspected directly. A separate review found a stronger editorial caricature fit without a critical identity break. Chen's raised brow and sly mouth are the main remaining subjective likeness tradeoff.

Chrome contact sheets were inspected for Su and Chen, each normal and mirrored: idle, walk, jump, left/right punch, kick, crouch, guard, hit, and five key poses of all three specials. No new neck gap, clipping or conspicuous floating head was observed. The short generated necks overlap the existing suit collars without a geometry change. This is sampled visual evidence, not a claim that every frame or every device has been certified.

At 320×568, both V8 portrait cards loaded at native width 1254, document width matched scroll width at 320, and a live Su-versus-Chen match responded to special buttons. At 667×375, the reversed Chen-versus-Su selection fit exactly within the viewport and started a match. Actual phone hardware, Safari and simultaneous touch gestures were not tested.

## Foreground smoke
Native Chrome was explicitly brought to the test tab. The automatic local-only harness completed two full rounds (Su versus Chen, then Ko versus Chen) and entered Ma versus Su. At final observation: 2,191 frames, 58.9 current FPS, observed sampled range 45.4–59.6, 32 textures, 12 scene objects, projectile pool 0. No application errors were returned; unrelated Chrome-extension metadata errors were excluded. This is a short desktop smoke test, not a broad performance guarantee.

Own temporary browser tabs were closed, managed preview was stopped, and all temporary QA routes were removed from dist before packaging. QA sources remain under tests/qa-v8. Official reference photos are not included in the distribution. No audio or voice rights statement changes.
