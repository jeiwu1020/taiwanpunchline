# Visible item contact

The authorized correction makes paper and duck contact agree with their visible flight and the fighter's visible body. A thrown duck can hit while falling and after landing. Paper leaves the real carrying hand, visibly rises to a high lane, then flies level. A very close croucher may be hit during the visible rise; farther crouchers avoid the paper because it passes above them, not because of an immunity flag.

Use separate head, torso, arm, hand, leg and foot shapes derived from the rendering pose. Do not fill the empty space between extended limbs or treat bows, bags, cups, glyphs and other props as vulnerable body parts. Full-body roll and folded-knee cutouts need their own shapes. Sweep the actual XY flight segment, including item size, and consume an item after one hit or block. Sampling must use the current substep pose, not the previous drawn frame.

Keep damage 8/10, horizontal speed 460/360, life 1.6/1.8 seconds, throw startup .12 seconds, throw duration .40 seconds, knockback and guard behavior unchanged. Other attacks and projectiles retain their existing rules. Parent handles backup, release/version changes, browser QA and deployment.

Considered alternatives: enlarging the old single rectangle would leave the falling/low-profile exclusions and fill empty limb gaps; retaining blanket dodge immunity would preserve the reported visual mismatch. The selected approach is item-only swept contact against separate pose shapes, plus a visible rising paper path.
