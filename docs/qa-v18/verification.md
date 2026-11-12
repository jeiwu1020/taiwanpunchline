# V18 integration verification

Neck/collar visual review: all 7 characters, both facing directions, 8 basic states plus 4 representative timestamps for each of 21 specials, inspected in the official browser. Existing jaw outlines remain visible, no new floating gap observed. Wang cup reaches the mouth; roll, archery and lotus use their own collar redraw. Existing anatomical/cartoon limitations and whole-sprite mirroring remain; this is representative-pose review, not a claim that every animation frame is perfect.

Voice browser QA with production VoiceChannels: player handshake and enemy Wang counter both paused=false with independent time advancement, accepted=2/skipped=1 after another player request, unchanged player source. Independent gains shown .68/.46. Preview clears the other lane; stop and game pause set both paused=true/time=0. Audio waveform/listening identity and iOS per-element gain remain unverified. No audio files changed. Temporary QA ended-state rendering was delayed until the following animation frame to avoid reporting before the onended callback.

Viewport: 320×568, 390×844 and 667×375 fit without document overflow. Actual special accepted, countdown visible with partial arc, ready mark distinct. Long Huang names wrap legibly. 568×320 exposed a real menu clipping defect (start bottom323.2 > menu bottom312); being corrected before release.

Independent review found recovery retreat overwriting an earned guard/crouch intent. Corrected to replace only movement, added two red-to-green tests. Reviewer reran original reproductions: crouch blend advances .0595→.119; guard remains true after recovery expires while defense duration remains .108. No timing parameter or damage changes.

Shared browser intermittently returned protocol timeouts. Our own test tabs were closed and recreated in the same browser; other agents' tabs were preserved. This prevents claiming a broad performance benchmark from the UI tests alone.

Final browser recheck: 568×320 menu bounds remained y57–312; complete 44px start button now y259–303 (9px bottom clearance), difficulty same. The character select field wrappers are 44px; their inner native selects measure40px. Actual start, countdown, queue special and pause worked. All document bounds remain exactly568×320. Desktop1180×757 renders the three rings and all controls without overlap. A temporary RAF diagnostic reported44.1 and46.4fps, p95 50.0/33.4ms in the shared browser; initial loading and concurrent retained tabs affect this, so no60fps/per-device guarantee is made. No temporary QA pages or diagnostics remain in dist.

Independent final review: no remaining confirmed production blocker. Voice, AI, cooldown and neck tests were rerun independently; original AI defect reproductions now pass. Representative pose visual review is completed, not a substitute for all-frame anatomical accuracy. Normal AI remains materially easier than V16 after removing instant first reads; model-script win rates are not human balance validation.

Final release preserves19 playable audio slots, all21 pre-existing audio files and48 raster art assets byte-for-byte, plus original combat-rules and roster data. No new audio authentication or reuse permission is implied. No new armor, hitbox, damage or cooldown adjustment. This is the existing owner-private Site source only, not either GitHub project's main branch.
