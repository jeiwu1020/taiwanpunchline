# V34 battle gesture boundary and rotated overlay

User device evidence: V33 still zooms on repeated joystick-area taps, pinch zooms, and rotation-on does not show the overlay while rotation-off does. Published V33 is commit 7ed11fc7468b9b19cbe8998f418e1c4440081173, saved Site version 11.

Confirmed source causes: V33 intentionally used manipulation on the canvas, permitting pinch, and its overlay condition explicitly required zero rotation plus physical landscape. The exact physical-device repeated-tap trigger is not reproduced in this cloud environment. CSS alone did not satisfy the user's test, so add a narrowly scoped Safari TouchEvent/gesture fallback, not a page-wide zoom lock.

Plan: preserve V33; unify overlay CSS and camera through one boot/runtime overlayControls flag for rotated or native touch landscape; keep upright portrait and desktop docks; lock only the combat/countdown cabinet and clear it on menu/pause/result/settings; preserve native settings scroll/text zoom and all pointer ownership; test real functions, CSS contracts, repeated orientation, state transitions and multi-pointer paths. Use official preview when its current owner releases it. Do not claim physical iPhone verification. Publish the same private Site after regression and independent review, preserve audio/cooldown/core/art.
