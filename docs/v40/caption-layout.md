# Head-aware move captions

Approved scope: put main move labels behind and slightly above the acting head where space permits; keep text clear of both fighters, handle simultaneous moves and edges, smooth motion, preserve fighter/camera size and private access.

Implementation: use the rendered pose's head/body offsets and facing, with folded-knee and rolling anchors. Jointly score bounded placements for both live labels, avoiding heads, bodies, each other and tail crossings. Use a 95ms exponential follow plus slot hysteresis; collision or camera-edge emergencies move immediately to a safe candidate. Paint boards/tails at depth -1, under fighters, and text at depth 6. For narrow world viewports, long names wrap into two large lines instead of reducing type or fighter size. Short viewports omit the supporting subtitle. Combat and camera logic are unchanged.

Regression coverage: new caption tests cover pose/facing, near-head preference, left/right edges, simultaneous titles, bounds at 667/844/960 widths, easing, mobile text size, tail separation, compact wrapping and live Arena integration. Full npm test passed. Browser inspected production artwork fixtures at 844x390 and 667x320, including simultaneous moves, edge fallback, reversed facing and knee pose; also entered the actual game and triggered the player's move alongside the AI. This is browser/fixture verification, not a physical-phone test.

Rollback: existing deployed Sites version 17, commit 4b937e2ab07d6538f0af65e5e3763716b4294c49. Local backup tag backup-caption-before-v40 retains the old source. No access changes.
