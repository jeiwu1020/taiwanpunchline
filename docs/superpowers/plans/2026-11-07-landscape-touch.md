# Landscape Touch Implementation Plan

> For agentic workers: implement in this session task by task, then request an independent review.

**Goal:** Produce an unpublished, switchable mobile landscape candidate with original-style camera and generated background.
**Architecture:** Pure viewport geometry and pointer conversion feed a DOM viewport shell, manual Phaser canvas dimensions, and a standalone multi-pointer controls binder. Camera selection keeps v22 available beside restored midpoint tracking.
**Tech Stack:** Static HTML/CSS/ES modules, Phaser 3.90 Canvas, Node test runner.
**Spec:** docs/superpowers/specs/2026-11-07-landscape-touch-design.md

## Global Constraints
- Preserve v22 Site, generated assets, game arena boundaries and keyboard bindings.
- No orientation-lock or fullscreen dependency; no new paid tools.
- Both landscape and portrait phone views must expose start, pause, settings, special buttons and movement.

## Review Focus
- Rotated pointer axes and independent pointer release.
- Browser toolbar/keyboard viewport changes must not reset the battle or leave holds active.
- Native and rotated landscape must not double rotate.
- Safe areas and short 568×320 screens must preserve accessible controls.
- Rapid jump/landing, distance changes and camera comparison switching must remain finite and framed.

## Tasks
- [ ] Add red geometry, pointer ownership and restored-camera tests, keeping old-camera contract tests as comparison coverage.
- [ ] Implement pure game viewport and pointer helpers; bind shell, resize cleanup and touch controls.
- [ ] Restore midpoint camera with original zoom target and HUD safety cap; preserve v22 camera mode and background anchoring.
- [ ] Add mobile full-stage CSS, thumbstick, circular attack/jump/guard and three special shortcuts; include side-rotation and camera comparison toggles.
- [ ] Run full tests, syntax and diff checks; official browser QA at desktop, portrait and landscape dimensions with lifecycle/rotation checks.
- [ ] Independently review, merge audio worker patch, rerun affected checks, and package without deployment.
