# V6 Chen and Ko integration QA

- Seven selectable characters, 21 specials. New Chen: calm counter, reply shockwave and short advancing step. New Ko: two-hand blue/green bag combo, low visual bag sweep and counter. All effects and situations are game fiction.
- Full Node suite: 294/294 passing. Includes all 49 pairings, both difficulties and three seeds (294 complete simulations); all 25 five-character V5 deterministic combat traces unchanged. Original Wang/Han and crouch behavior remain unchanged. Low sweep and crouch do not introduce a smaller hurtbox or evasion claim.
- New six motion tests were observed failing before authored poses were added; they now pass for finite fixed-length arm geometry, continuous wrist paths and non-static motion. Geometry tests do not establish correct anatomy.
- Independent combat/UI source review found no concrete release blocker. Han original audio epoch, mute, pause and termination lifecycle preserved; new-character events are tested not to trigger his recording.
- CUA phone viewport 320×568 and landscape 667×375: seven-person lists, Chen-versus-Ko and same-character Ko selection, new move labels, start/countdown, actual round, pause and return-to-select verified. No horizontal or vertical overflow. Combat touch buttons remain at least44px high. Physical phone, Safari and multitouch are not tested.
- QA fixtures live under tests/qa-v6; generated live copies must be removed from dist before packaging.

No performance claim is based on background-throttled tabs.

## Independent visual verdict
Normal and whole-character mirror contact sheets covered basics, crouch and all six new specials. Live normal timelines sampled all six. No detached wrists, inverse elbows, broken shoulders, floating shoes or slipping bag grip was found. Near dorsal and far inward-facing fists remain visually distinct. Closed fists have less explicit palmar detail than open hands. Ko's blue bag briefly covers the lower face during recovery, and bags swap to empty fists at special end rather than being put away; these remain minor silhouette and prop-transition polish limits. This review is sampled visual evidence, not an assertion that every possible interpolation/collision frame is perfect.

## Exclusive foreground performance
The native Chromium selected tab was verified as the V6 soak. Seven consecutive complete rounds cycled Chen, Ko, Ma, Su, Huang, Wang and Han. Final visible counters: 6,924 rendered frames, 54.6–61.0 FPS observed range, 18 current scene objects, 33 current textures and four pooled projectiles. No application console error or browser crash was observed; browser-extension metadata errors were excluded. This is a short cloud Chromium soak, not physical-phone or long-duration certification.
