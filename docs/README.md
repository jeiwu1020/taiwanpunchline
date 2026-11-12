# 議場大亂鬥 Prototype V2

Throwaway, independent satire fighting prototype. No existing Taiwanfighter or Playformosa branches/files are used or modified.

## Technical design
- Locally vendored Phaser 3.90.0, MIT, no runtime CDN requirement.
- Pure deterministic combat core separated from Phaser renderer.
- 60-second player-vs-AI round, both characters selectable, easy/normal difficulty.
- Immediate directional controls, jump, held auto-jab, automatic retreat guard, three character-specific moves.
- 150 ms action buffer, jab-to-special cancel, short hit stop, hit sparks, knockback, block feedback.
- Pointer capture/cancel/release cleanup, keyboard release cleanup, automatic blur pause.
- Original generated editorial caricature heads, programmatic bodies and stage. No copied photos, speech, songs or audio clips.
- Original oscillator effects only. All source references and licensing caveats are exposed in the help dialog.

## Verification
Run `npm test` or `node --test tests/*.test.mjs` for the combat core.
Browser QA requires the managed Sites preview daemon and shared cloud CUA browser.

## Browser QA notes
Desktop cloud browser verified first render, start/countdown, movement, held attack, special cooldown, and visible damage. A later Chromium tab exited with error code 9; captured console logs showed only extension metadata errors, not application exceptions. The renderer was changed to Phaser Canvas and the unchanging stage flattened to a single texture to reduce GPU and geometry load. Revalidation is required before claiming this addresses the crash.

Second QA pass: verified 390px portrait and 844×390 landscape rendered layouts, both character selection paths, game start/countdown, and held attack via browser UI. Fixed landscape controls wrapping and compact selection sizing, plus disabled help during countdown and automatic pause if focus was lost before it finishes. Confirmed the help dialog includes traceable references and sound licensing notes.

Limitation: after roughly 20–30 seconds of active combat the shared cloud Chromium again displayed error code 9 and advised closing other tabs/programs. Similar shared-browser failures were reported on unrelated prototypes. Root cause remains unconfirmed; Canvas change is NOT a verified fix. No complete browser round, physical-phone multi-touch, or audio listening pass is claimed. Combat round completion and result decisions are covered by the 14 passing core tests.

## V2 changes and verification
- User feedback: desktop should fit one viewport; characters should look more like the real people; satire and distinct move comedy should replace merely cute presentation.
- Height-driven single-viewport grid, readable HTML health HUD, no page scrolling at tested dimensions.
- Four generated editorial caricature head expressions with verified alpha; original photos only informed feature research. No news photo or real voice is packaged.
- Retreat automatically guards; independent guard button removed. Six named moves now have distinct physical/graphic reactions, target telegraph, water-spit interruption, failed-counter cue, and fictional result quips.
- Arrow collision changed to the marked impact circle (radius 50), not the whole flight path. Circle escape and inside-hit regression tests included.
- Source review completed. Current core suite: 19 tests.
- V1 isolation probe completed 16 full foreground rounds, later rounds with synthesized sound, 53–59 FPS, heap about 9–20 MB cycling down, bounded display/tween/texture counts, no JS errors. Background CDP tab ran at 1 FPS until explicitly selected in native Chromium. This does not establish the root cause of historical error code 9 and does not replace V2 QA.


### V2 final QA (2026-11-06 UTC)
- Browser UI and DOM bounds checked at 1280×720, 1366×768, 1024×600, 390×844, 390×667, 320×568, 844×390 and 667×375. Body scroll width/height matched the viewport at each size. Key gameplay labels remain at 13–17px on compact controls.
- 320×568 draw fixture with long title, long result quip and three stats fits entirely in the stage; replay and reselect both visible. Actual loss result also verified at 667×375. Help content uses its own scrollable dialog.
- Both character selection paths, start/countdown, special cooldown, pause/resume, help, real round-end and reselect paths exercised. All six specials also exercised by autoplay and core tests.
- Foreground V2 autoplay completed 7 consecutive full rounds with synthesized sound enabled, approximately 55–59 FPS, 11–14 observed display objects, 2–5 observed active tweens, 13–14 observed textures, heap samples 22–27 MB, no JS errors or tab crash. A prior V2 segment completed 4 rounds. A file write intentionally refreshed the managed preview between segments, so these are not claimed as one uninterrupted run.
- Deterministic combat soak: 2,000 completed rounds, no invalid state or timeout, maximum 2 projectiles / 4 queued events, GC heap 6.81–6.95 MB. This is logic testing, not browser rendering testing.
- Independent review reran 19/19 core tests and checked retreat-release buffering and retreat+jump. No known release-blocking issue remained.
- Limitations: no physical-phone multi-touch / Safari device pass, no audio listening pass, no hours-long browser soak. The shared-browser V1 error code 9 has not recurred in these V2 runs but its root cause is still unconfirmed. Extremely short viewports below the tested 320×568 portrait minimum are not claimed supported. No commercial-rights guarantee or real-voice license is asserted.
- QA harnesses and telemetry are retained under tests/qa-v2 and excluded from dist/publication.

## V3 漫畫招式整合

新增 `art.html` 慢放／翻面檢視器及 `moves.html` 來源與下一批設計。全部角色與現有招式改用同筆觸素材；韓金幣招式有一段真實議會原聲，權利尚未確認，僅私人測試。參閱 `ASSET-NOTES-v3.md`。測試入口 `node --test tests/*.test.mjs`；QA 臨時頁可用 `node tests/qa-v3/prepare.mjs` 產生，勿將 QA 頁發布到 dist。

## V4 四肢與蹲姿

J／攻擊按住連打輪替左拳、右拳、低前踢；S／↓／觸控蹲下。後退＋蹲保留格擋，跳躍或出招離開蹲姿。此版蹲姿不縮小命中範圍，也不提供閃避。雙臂配合與膝踝關節、落地屈膝加入原本漫畫分件，無新政治人物。詳見 `QA-v4.md` 與 `ASSET-NOTES-v4.md`，最新測試49項。

## V5 第一批五人擂台

原王世堅／韓國瑜加入馬英九、蘇貞昌、黃國昌，可分別選玩家與 AI，含同角色鏡像對戰。九個新招式、獨立服裝分件與道具、原有蹲姿及四肢動作。新角色暫用合成音效，不仿聲，引用語句保留候選來源與未聽驗／未取得再利用權註記。詳見 QA-v5.md 與 ASSET-NOTES-v5.md。陳水扁及柯文哲是下一階段，尚未放入本版選單。

## V6: Seven-character private roster
Chen Shui-bian and Ko Wen-je complete the requested five additions. Each has three distinct fictional specials; any of the seven characters can be player or AI. Chen's calm counter, reply wave and short advance contrast with Ko's dual blue/green bag strikes, low sweep and counter. The original combat inputs, crouch limitation and Wang/Han mechanics remain intact. See docs/QA-v6.md and docs/ASSET-NOTES-v6.md for verification and limits. New character audio is synthesized effects, not real or cloned speech.

## V7: Official-reference portrait refresh
Su and Chen heads were regenerated using inspected official photographs, while all body parts and move rules remain unchanged. See ASSET-NOTES-v7.md, portrait-prompts-v7.json and QA-v7.md for the references, exact generation brief and verification limits.

## V8: Stronger editorial caricatures
Su and Chen keep the improved likeness cues while matching the other characters' exaggerated proportions, asymmetric expressions, warm color and three-quarter view. All limbs, props and combat rules remain unchanged. See ASSET-NOTES-v8.md, portrait-prompts-v8.json and QA-v8.md. The existing owner-only Site is the delivery destination, not either GitHub main branch.

## V9: Expressions, props and distinct movement
Twelve new generated expressions and a six-cell prop/effect atlas give each character three different special-move expression keys. The five newer renderers now switch heads; Han gains genuine shouting and aiming faces. Running, heavy stomping and folder pursuit have different pose curves. The original combat rules, grip assets and controls are retained. Runtime new-head textures are compiled to512px for transfer and decoded memory savings; see ASSET-NOTES-v9.md and runtime-textures-v9.json. Review fixtures are generated with tests/qa-v9/prepare.mjs and must not be published.
