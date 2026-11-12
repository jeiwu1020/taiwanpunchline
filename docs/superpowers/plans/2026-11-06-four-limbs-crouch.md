# Four-limb Movement and Crouch Implementation Plan

> For agentic workers: execute the approved first-version scope task by task and record verification.

**Goal:** Give both existing fighters active arms and articulated legs plus a held crouch without new hit rules.
**Architecture:** Core exposes posture and cosmetic attack variant; art-motion computes joint poses; art-render draws generated pieces. Existing gameplay controls gain crouch while keeping attack/special mappings.
**Tech Stack:** Static ESM, Canvas/Phaser, Node tests, generated transparent WebP assets.
**Spec:** docs/superpowers/specs/2026-11-06-four-limbs-crouch.md

## Global Constraints
- Owner-private existing Site; no GitHub main or new Codex task.
- Basic attack .10–.23 hit window, .32 end, .21 special cancel, .15 input buffer remain.
- Existing damage/cooldowns/projectile and landing-circle hit rules remain.
- Crouch does not change fighter foot-root y or provide dodge immunity.

## Review Focus
- Held crouch + retreat/jump/attack and opposite directions; no stuck posture.
- Pointer cancel, blur, pause and new round clear input.
- Left/right hand identity and far-arm torso occlusion through normal/mirror poses.
- Knees bend forward and feet remain on ground in crouch/landing.
- 320x568 portrait and 667x375 landscape controls do not overflow.

### 1. Posture and controls
- [ ] Add failing regression tests for crouch, cancel rules, variant cycle and unchanged hit results.
- [ ] Add crouch/crouchBlend/landing and attack.variant in core, never alter hit calculations.
- [ ] Bind S/down, held touch crouch, clear on interruption; adapt mobile layout and explanatory text.
- [ ] Run all core tests and syntax checks.

### 2. Art and animation
- [ ] Generate matching thigh/shin-with-shoe and true left-fist pieces for both colors; inspect alpha and anatomy.
- [ ] Add tests for far-arm motion, leg lengths, planted crouch feet and cosine/eased continuity.
- [ ] Extend pose output with far arm, knees/ankles, body offset and cosmetic attack variant.
- [ ] Update renderer and slow viewer, preserving the accepted drink/archery poses and no newly flipped isolated hands.
- [ ] Run tests and normal/mirror visual audit.

### 3. Verify and publish
- [ ] Independent source and anatomy review; fix blocking findings.
- [ ] Mobile controls, original voice, held-input cleanup and foreground rounds.
- [ ] Record limits; remove temporary QA files from deployed dist.
- [ ] Package with Sites source helper, publish existing owner-private Site, verify terminal success and release preview.
