# v75 managed browser verification

Date: 2026-11-09 UTC. Executed in the managed cloud Chrome using the production page inside the existing local viewport fixture. These are desktop-browser size simulations, not iPhone Safari or physical-device checks.

## Observed before final sky integration

- Native landscape, side rotation disabled, 844 × 390: `#game` exactly (0,0,844,390). Street covered the viewport with HUD and controls over the background. The live 0% used 20px monospace inside a 60px centre cell. Visible controls stayed inside the frame and the fixture's hit tests passed.
- Portrait training, 390 × 720: `#game` stayed exactly (0,0,390,720) while paused and after resume. Background remained the same chamber, visibly blurred behind the pause card, with no docking reflow.
- Compact portrait, 320 × 568: live training covered the screen and characters, names, health bars and controls remained visible.
- Challenge opening in actual dialog layout: landscape canvas 590.40625 × 366, portrait canvas 366 × 552. Observed one bulletin/wake scene at a time, with the actual articulated wake renderer and working next/skip actions. No multi-panel collage.
- The landscape street jump rendered no white/transparent region. Review nevertheless identified repeated baked suns and a plain upper extension, prompting the final sky/façade separation rather than changing the camera or gameplay rules.
- Double-clicked the live attack button; the fixture reported scale 1 and zero document scroll. This mouse-input observation does not prove native iOS double-tap suppression. Automated touch-event fallback tests cover repeated game-control taps and preserve native menu clicks.
- Native Canvas evidence separately covers all seven opening characters, both orientations, multiple wake poses and other scenes. It is not a browser screenshot or mobile-performance measurement.

## Scope

Local browser test storage is separate from the production origin. No production save was overwritten. Progress/XP/pickup values were not changed by presentation repairs. Review of browser errors found cloud extension metadata messages; they are not game runtime errors.

## Added MiniBoss centering check

Used the isolated production face-off renderer, which does not read/write saves. Chrome DOM measurements showed centerDelta (0,0), buttonVisible true and dialogFits true in every tested layout: portrait390×640, desktop1080×600, native landscape568×320, clockwise sideways logical667×320, and counter-clockwise sideways logical667×320. Visually inspected portrait, desktop and rotated cards. All three boss dialogue variants appeared and retained the diagonal scene without the old rectangular tint. This is local fixture verification, not physical mobile testing.

## Final live preview check

After the final source freeze, Chrome320×568 training showed the original chamber correctly with continuous floorboards beneath the controls, not another auditorium. A live Phaser firstFrame bug was caught in browser review, fixed by explicitly selecting __BASE, and added to a regression before this successful recheck. Chrome844×390 native street with rotation off showed one textured continuous sky during an actual jump, no repeated sun or blank top; all tested controls stayed inside and hit-testable. Interactions remained responsive during these checks, but frame rate on real phones was not measured.
