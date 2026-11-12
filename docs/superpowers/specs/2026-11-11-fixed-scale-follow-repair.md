# Fixed-scale horizontal follow correction

## Intent and decision
The user wants clear, stable protagonist size in mobile landscape stable view, with other fighters allowed offscreen. A fixed screen anchor was our implementation choice, not a user requirement. Real seed0x671100/frame825 demonstrates that exact anchoring converts an unchanged street collision correction into a new60.597px background pan; shipped #67 moves the same landmark0.041px. Keep collision/AI behavior unchanged and correct the presentation.

The selected conservative approach reserves horizontal travel at geometry initialization and bounds horizontal camera speed. The parent approved this implementation choice under the existing request. An alternative narrower soft-control head proxy could retain maximal tiny-screen scale but changes readability assumptions; it is not selected. Simply lerping inside the old zero-width568 safety pocket cannot solve the problem.

## Binding scope
Only measured compact touch logical landscape stable: touch===true, width>height,0<height<=500, measuredCameraSafety!==false, mode stable. Root VS/practice/street/Boss and chapters2–4 use the existing common path. Preserve classic, portrait, desktop, unmeasured fallback, art, actor renderer, simulation, saves, cache policy, DPR and all existing screen/HUD/control safety. No narrower head proxy.

## Geometry and state
Actual canonical player box remains[-132,132]×[-300,28]. Private PLAYER_FOLLOW_RESERVE_X=80 world units expands only the geometry-fit envelope to[-212,212]×[-300,28]. Use existing padded/clipped geometry, soft-control policy, placeAtScale and30-step feasibility search. Preference remains min(1.4,width/440,height*.68/328). At true same-size geometry changes keep a feasible old zoom; never regrow while it remains feasible. Different dimensions/profile/world initialize anew. Failure to fit retains unsuccessful-fit semantics; never silently discard reserve.

The fitted anchor A is a resting target, not the actor's invariant displayed position. z stays exact. L=A.x−80*z, R=A.x+80*z. The actual player at any screen x in[L,R], y=A.y is safe because its true box lies in the expanded envelope. Enemy state and pose/attack state cannot select scale/target.

Version2 state: playerFixedCamera={version:2,geometryKey,zoom,anchor:{x,y},pose:{x,displayY},follow:{left:L,right:R,clamped}}. Geometry-key policy version is2; existing normalized geometry/equivalence inputs remain. No time, actor, label, identity or lag in the key. Compatible previous state requires finite frame/pose/target/interval values and matching policy. Reuse exact z/A/L/R under identical geometry. Frozen reuse must reject stale/incompatible state.

## Active horizontal following
Pass positional delta into private fitPlayerFixedCamera(preferred,player,previous,delta,options); public API unchanged. P.x is actual x and P.displayY=y+depth*.65. elapsedMs=clamp(finite(delta,1000/60),0,50); budget=480*elapsedMs/1000 CSS pixels. Negative/zero delta gives0; missing/nonfinite uses1000/60. No accumulated pause time.
T=P.x+(width/2−A.x)/z. limitedX=previous.x+clamp((T−previous.x)*z,−budget,budget)/z. q=width/2+(P.x−limitedX)*z. shownX=clamp(q,L,R). camera.x=P.x+(width/2−shownX)/z. camera.y=P.displayY+(height/2−A.y)/z. Initialize at T for first/incompatible state, new dimensions or changed zoom. Set follow.clamped from actual safety override.

The q clamp is mandatory even when it exceeds the speed budget: move only enough to the nearest safe interval edge, never shrink, mutate the actor, switch pockets or show an unsafe intermediate frame. Beyond-reserve displacements are explicit safety overrides, not smoothness passes. Do not classify them with HP/stun heuristics. Vertical follow remains exact; this repair does not promise bounded vertical pan. Subbudget ordinary motion stays exactly at target. Residual settling after the player stops is expected. Enemy-only changes cannot alter a settling path with otherwise identical history/player input.

## Frozen/rebased state
Equivalent geometry while paused/finishing returns the identical frame, including lag; never continue settling. Real same-size geometry rebase with unchanged zoom uses saved pose and previous camera.x, clamped into new L/R, with no rate step while frozen. Active same-size rebase rate-limits from prior x then safety-clamps. Dimensions/zoom changes initialize at new target. Existing root/adapter world identity and reset own history clearing. Existing mode freeze and finish timers remain untouched. Keep base=height/2+(430−camera.y)*zoom, jumpPan0 and existing backdrop density reserve.

## Hints
Use saved frame pose and actual frame center/zoom to project player blocker: px=width/2+(pose.x−frame.x)*z; py=height/2+(pose.displayY−frame.y)*z; full box px±132z, py−300z..py+28z. Never use target anchor or live world.player as a substitute. Opponent filtering/current-bound clipping, two passive DOM nodes, geometry caching and64×64 mic canvas remain unchanged.

## Measured tradeoff and acceptance
Copied-solver proof:844 zoom0.8085365853658538 unchanged;568VS0.4875000002907543,568street0.5437500001817215. Tiny scales are3.96%/8.86% below the unpublished maximum, but18.14%/27.67% above shipped same-trace medians0.412662577/0.425886568. This is not a visual-preference or physical-device proof.

Known real street trace frame825 must pan8px horizontally at60Hz instead of60.597px, with no scale change or safety override across960frames. Same real poses projected to568 are not a claim of real VS execution; actual entry/controller tests remain required. Beyond-reserve teleport must stay safe and be labeled clamped. Test nonzero lag through pause/finish/reflow/reset, both signs, delta semantics, unchanged oracles and original-alpha lag positions. Product implementation, full regression, independent review, frozen browser pixels/pointers, separate cache performance and restorable backup gates are mandatory before release.

This amendment supersedes exact screen-anchor/x-translation assertions in the earlier fixed-camera design and plan. Fixed scale, constant resting target, no opponent-driven zoom, and all unrelated invariants remain.
