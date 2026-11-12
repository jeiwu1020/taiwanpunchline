# V54 visible item contact verification

## Behavior

- Ducks can hit during descent or floor travel whenever the visible body overlaps. There is no grounded-only or falling-phase immunity.
- Paper starts at the real carrying wrist, rises over 0.18 seconds to footY−265, then flies level. A close croucher can be hit during that visible rise. Farther crouchers avoid it through actual clearance.
- Both item contact radii are18 world pixels, matching the approximately 37×36 and 38×37 opaque flying art. Damage 8/10, speed 460/360, life 1.6/1.8, knockback 14/18, throw startup 0.12 and duration 0.40 remain unchanged. Guard still costs 2 HP and one pip.
- Body contact uses separate pose-based capsules. The fixed hand and collision pose are sampled from the current simulation state through the same pure pose function used by drawing. Non-item attacks and projectiles keep their old collision path.
- A falling duck can break a queue when it reaches the visible sign height. Existing paper/non-falling queue behavior remains unchanged.

## Verification

- Baseline npm test: 1875 passed, 0 failed.
- Eight new direct symptom regressions failed before implementation and passed afterward.
- Final tests/item-contact-v54.test.mjs: 115 passed, 0 failed. The matrix covers all seven characters, both roles and facings, 30/60/120fps, near/far contact, guard, crouch, roll, knee posture, table/floor routes, airborne overlap and spatial evasion, AI, once-only damage, hand/foot extensions, empty limb gaps and prop-only space.
- Final npm test: 1992 passed, 0 failed, 0 skipped.
- git diff --check and node syntax checks passed.

## Cutout review corrections

Measured against opaque source pixels, four initially approximate profiles needed correction. Each has an exact failing-then-passing regression in both orientations:

1. Lotus lower legs had an invisible side hit at local(−66,−28), although the nearest body pixel was 36.84 px away from the 18 px item. The knee profile now follows its roughly 56 px-wide silhouette.
2. The lotus sleeve was missed at(−46,−68), although the nearest visible pixel was 7.10 px away. It now has a bent upper arm and forearm matching the protruding elbow.
3. The roll's former single round shape hit empty space at(74,−42) and missed a shoe at(48,−10). Separate torso, folded legs, crossed arms/hands and shoe shapes replace it.
4. Han's shouting head incorrectly used the broad generic portrait shape. A narrower asymmetric forehead/cheek/chin profile now follows that particular portrait.

## Deliberate compatibility changes

The old airborne-duck test required every duck to land before hitting. It now asserts one hit during the visible fall; a separate clear-flight test still proves landing and continued floor travel. The old simultaneous jump/paper test now meets the raised paper with the actual far foot and takes 8 damage, rather than receiving blanket jump evasion. Separate tests verify jumps that really clear either item still evade.

For a normal floor throw, settled paper center y=165 and radius 18 put its lower edge at 183. The fully crouched body starts at 203 (20px clearance), the sampled knee pose near 196.44 (13.44px clearance), and the minimum through the complete roll interval is about187.95 (4.95px clearance). Standing heads overlap normally.

A paper thrown from the table can pass above a distant floor opponent; a floor duck can pass under a distant table opponent. Close release/falling contacts still hit when the image genuinely meets the body. These are geometric outcomes, not posture immunity flags.
