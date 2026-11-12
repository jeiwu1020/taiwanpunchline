# Fixed Player Landscape Camera Implementation Plan

> Follow amendment: `docs/superpowers/specs/2026-11-11-fixed-scale-follow-repair.md` supersedes the exact screen-anchor and exact x-follow requirements below after the paired collision regression. Constant scale and unrelated safety/preservation requirements remain.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The controller assigns one native implementer per task and an independent review gate; implementers must not delegate. Each product task needs the controller's specific release after the previous task review; no parallel product writers.

**Goal:** 固定手機橫向 stable 主角尺度，讓 VS／練習／街道／Boss 共用安全平移與畫外敵人方向提示。

**Architecture:** 在現有 shared camera 加單一受限 profile 分支，使用 canonical 主角盒及 viewport geometry 固定 anchor/zoom；其他相機原碼保持。提示共用純函式與兩個小型 DOM badge，根／後章做薄接線，不改 actor renderer。

**Tech Stack:** ES modules、Node test runner、jsdom、既有 Phaser CANVAS 與 chapter canvas。

**Spec:** `docs/superpowers/specs/2026-11-11-post67-fixed-player-camera.md`. The controller-owned external evidence directory is `/workspace/scratch/1a1351aee944/punchline-post67-display-fixes-nov11/evidence/camera/`; references to this directory below refer there, not the plan directory.

## Global Constraints

- Authoritative baseline HEAD：`806f00c3f16d51708c7bd52f4da8ca57825f7b89`；不寫 baseline。
- Product candidate：`/workspace/scratch/1a1351aee944/punchline-mobile-landscape-nov11/candidate`。
- 必須等父代理解除工具列檔案衝突 gate 才開始 Task 1 的產品寫入；重讀 candidate HEAD/status，不覆蓋其他工作者變更。
- 逐段產品寫入由控制者明確放行；cache 的實際 Chromium 效能檢查仍是最終發布關卡，不得因獨立相機工作開始就視為已通過。
- 分段執行且不得自行連做：Task 1 核心完成 → 父代理安排獨立 review 並明確放行 → Task 2 生命週期 → 獨立 review 並放行 → Task 3 提示 → 獨立 review → 最後整體驗收。完成一段後停下等待，不把本 brief 當作下一段的自動授權。
- 每個 Task 自評完成並提交前都必須執行完整 `npm test`，記錄總數、失敗數與 exit status；focused checks 不能替代全測，不可等 Task 4 才跑。若舊斷言因批准規格必須改變，逐項報告修改理由與適用 profile，保留其他 profile 的原斷言及 frozen oracle。
- 不自行開始 preview。最終 browser 驗收由父代理協調同一個已凍結候選，完成所有分段 review 後再安排。
- 不再派代理；不新增 Codex 任務；此 brief 不授權發布或變更分支目標。
- 僅 measured compact touch logical landscape stable：touch===true、width>height、0<height<=500、measuredCameraSafety!==false、mode==='stable'。
- classic、portrait、desktop、unmeasured fallback、故事、模擬／碰撞／存檔、背景 cache／圖片／密度與 actor draw 不改。
- 不擴張 combat-overlay-layout.mjs 的64×64路麥canvas，不新增全畫面 copy。
- 一般 VS 和練習共享同一入口與新模式，交付必須說明。
- Frozen oracle 不可重新生成自候選；golden 來源與 hashes 見 baseline-classic-provenance.json。

## Review Focus

1. 暫停改 camera 設定但未恢復：畫面不變；同尺寸 safe-area 真變更仍需從凍結 pose 重投影（Task 2）。
2. geometry 每幀換新物件／換 tuple 次序、DOM 血條文字更新：zoom/anchor 不變（Task 1、2）。
3. 真實受擊／瞬移不同於 smooth trace：主角安全優先，不能偷偷縮放或錯誤歸為 solver pocket cut（Task 1）。
4. 非街道的 overlay.draw 不能在 route-mic early return 前漏掉 VS/Boss hints；故事／結算不可殘留 badge（Task 3）。
5. logical canvas 與 rotated root 原點不同：DOM 提示只轉換一次，無每幀 layout read、無輸入攔截（Task 3）。

### Task 1: Fixed-scale core and preservation tests

**Files:**
- Modify: `dist/challenge-camera.mjs`。
- Create: `tests/mobile-stable-player-camera.test.mjs`、`tests/mobile-classic-v67-golden.test.mjs`。
- Copy unchanged: 本目錄 `baseline-classic-v67.json` → `tests/fixtures/mobile-classic-v67-golden.json`。
- Modify scoped assertions: `tests/mobile-landscape-profile.test.mjs`、`tests/challenge-camera-contract.test.mjs`、`tests/shared-camera-continuity.test.mjs`、`tests/shared-camera-measured-motion.test.mjs`、`tests/street-camera-smoothing.test.mjs`、`tests/street-camera-assist-entry.test.mjs`、`tests/mobile-camera-tuning.test.mjs`。

**Interfaces:**
- Consumes: existing `geometry(frame,options)`、`placeAtScale(boxes,zoom,rect,occlusions,wanted)`、`isMobileLandscapePresentation()`。
- Produces: `isPlayerFixedCameraProfile(width,height,options)`、`playerFixedGeometryKey(width,height,options)`、`canReuseCameraFrame(frame,width,height,options)`；`fitChallengeCamera()` returns the fixed state specified in design.md.

- [ ] **Step 1: Recheck gate and checkout.** Require parent release; record `git branch --show-current`, `git rev-parse HEAD`, `git status --short`; inspect toolbar commit diff and relevant AGENTS/local skill instructions. Do not reset or clean unrelated work.
- [ ] **Step 2: Install baseline oracle without regeneration.** Copy the existing evidence JSON unchanged, verify SHA-256 `584959896ba56b775dce542f500492d690906d9cbf1af2667f6a3c021db48df6`, and implement a read-only candidate replay test following the input construction in capture-baseline-classic.mjs. Assert every captured property within 1e-10 numeric tolerance and exact strings/booleans; no test-writing of expected files.
- [ ] **Step 3: Write failing fixed-profile tests.** For actual 844×390 native/rotated and recorded568 fixtures, main and later paths, use ground/jump/table/depth, enemies at both sides490, far separation, deaths, pending spawns and helper warning/attack/exit. Assert `next.zoom === first.zoom`, state anchor deep equality, player safety with halfWidth132/full body bounds/soft controls, and equivalent main/later frames. Include ±90 equivalence and an actor teleport case where camera moves instead of zoom shrinking.
- [ ] **Step 4: Run RED and record expected failures.** `node --test tests/mobile-stable-player-camera.test.mjs tests/mobile-classic-v67-golden.test.mjs`. Fixed requirements should fail on #67; golden must already pass.
- [ ] **Step 5: Implement one fixed branch.** Create profile/key/reuse helpers and private `fitPlayerFixedCamera(preferred,player,previous,options)`. Canonical box is [-132,+132]×[-300,+28]; lock zoom/anchor under identical geometry. Use old zoom on changed geometry if still safe and within new upper bound, otherwise solve. Apply exact center/base formulas. Bypass forecasts, prediction envelopes and continuous-pan zoom fallback only for this branch. Do not change subject-plan functions or existing solver ordering.
- [ ] **Step 6: Add identity/geometry tests.** Reconstruct equal geometry objects each frame, reverse occlusion tuple order, vary HP/label/assist metadata without changing geometry: key/zoom/anchor unchanged. Change real HUD bounds at same dimensions: keep old zoom if feasible, relocate anchor; force smaller available room: select lower safe fixed zoom once. Change dimensions/profile: reinitialize. Invalid geometry must not claim safety.
- [ ] **Step 7: Update obsolete all-fit assertions only for new profile.** Select `[player]` only when `frame.playerFixedCamera` exists; exact zoom invariance replaces the former <=2% zoom allowance there. Preserve classic/portrait/desktop all-subject assertions and test count; use explicit natural motion versus knockback/teleport motion bounds.
- [ ] **Step 8: Verify core and preservation.** `node --test tests/mobile-stable-player-camera.test.mjs tests/mobile-classic-v67-golden.test.mjs tests/mobile-landscape-profile.test.mjs tests/challenge-camera-contract.test.mjs tests/challenge-camera-solver-equivalence.test.mjs tests/mobile-camera-preservation.test.mjs tests/shared-camera-continuity.test.mjs tests/shared-camera-measured-motion.test.mjs tests/street-camera-smoothing.test.mjs tests/street-camera-assist-entry.test.mjs tests/mobile-camera-tuning.test.mjs`. Expected: zero failures; retain existing portrait/desktop fixture and solver-reference bytes.
- [ ] **Step 8a: Run full suite before claiming Task 1 complete.** Run `npm test` against the final Task 1 code and record totals/exit status. Enumerate every approved-spec assertion change and confirm other profiles remain protected. Fix or report failures before claiming completion or committing.
- [ ] **Step 9: Commit scoped core/tests when permitted, then stop for review.** Stage exact owned paths; commit `fix: lock mobile stable camera to player scale`. Do not include another worker's dirty paths; report commit, focused/full test results and assertion changes to parent. Do not start Task 2 until the independent review is resolved and the parent explicitly releases its gate.

### Task 2: Frozen frames and real entry wiring

**Files:**
- Modify: `dist/challenge-camera.mjs`、`dist/combat-presentation.mjs`、`dist/challenge-depth-render.mjs`、`dist/preview/campaign/mobile-camera-adapter.mjs`、`dist/game.mjs`。
- Create: `tests/mobile-stable-camera-lifecycle.test.mjs`。
- Extend: `tests/mobile-landscape-entry-contract.test.mjs`。

**Interfaces:**
- Consumes: Task 1 helpers and `playerFixedCamera.pose` value snapshot。
- Produces: paused wrappers and main finish cache revalidate only fixed geometry; unchanged regular APIs。

- [ ] **Step 1: Write failing lifecycle tests.** Same-size paused frame remains deep-equal when player or selected mode changes but geometry does not; changed same-size safe-area reprojects frozen pose; resize in compact profile rebuilds a safe zoom; active resume follows live pose/selected mode. Test native↔sideways equivalent geometry no reset. Root finish cached camera remains exact across animation frames, changes only on fixed geometry invalidation, and does not restart finish timers/sequence.
- [ ] **Step 2: Run RED.** `node --test tests/mobile-stable-camera-lifecycle.test.mjs`; expect failure of same-dimension geometry revalidation on old wrappers.
- [ ] **Step 3: Replace only the four scoped pause shortcuts.** Use `canReuseCameraFrame()` for fullStage, depthRoute, adapter and shared solver. New fixed frame uses frozen pose during pause geometry repair. A mode changed while paused does not take effect until resume. Nonfixed frames preserve legacy shortcut behavior.
- [ ] **Step 4: Repair root finish-cache invalidation.** In game.mjs camera selection, preserve cached finish frame if reusable; for fixed geometry invalidation pass cached finish frame as previous and paused/frozen semantics. No live actor chase while finishing; no changes to finish lifecycle/timekeeping.
- [ ] **Step 5: Exercise actual source entry wiring.** Extend VM/jsdom entry tests for camera='stable', main VS/training/challenge Boss and real ChallengeDepthRoute; each chapter2/3/4 route/battle adapter must receive measured UI geometry and produce fixed state. Retain classic cases. Add explicit checks that no active main route uses the unrelated nondepth legacy camera.
- [ ] **Step 6: Verify.** `node --test tests/mobile-stable-camera-lifecycle.test.mjs tests/mobile-landscape-entry-contract.test.mjs tests/mobile-classic-v67-golden.test.mjs tests/mobile-landscape-profile.test.mjs tests/challenge-camera-contract.test.mjs tests/combined-camera-progress.test.mjs`. Expected: zero failures and no storage/mode engine changes.
- [ ] **Step 6a: Run full suite before claiming Task 2 complete.** Run `npm test` against the final Task 2 code; record totals/exit status and any precisely scoped assertion changes. Focused tests alone do not pass this gate.
- [ ] **Step 7: Commit scoped wrapper/tests when permitted, then stop for review.** `fix: revalidate frozen mobile camera geometry`. Report the full suite and commit to parent; do not start Task 3 until independent review is resolved and the parent explicitly releases its gate.

### Task 3: Shared DOM opponent hints

**Files:**
- Create: `dist/camera-direction-hints.mjs`、`tests/camera-direction-hints.test.mjs`。
- Modify: `dist/combat-overlay-layout.mjs`、`dist/game.mjs`、`dist/preview/campaign/chapter-ui.mjs`。
- Modify one call/early clear per entry: `dist/preview/chapter2/chapter2-playable.mjs`、`dist/preview/chapter3/chapter2-playable.mjs`、`dist/preview/chapter4/chapter4-playable.mjs`。
- Extend: `tests/mobile-landscape-entry-contract.test.mjs`。

**Interfaces:**
- Produces pure `offscreenOpponentHints(frame,world,{route=false,geometry,maxHints=2})` returning `{key,arrow,label,count,left,top,width,height}[]`.
- Produces `mountCameraDirectionHints({document,root})` returning `{setGeometry({width,height,origin,safeRect,occlusions}),update(frame,world,{route=false,active=true}),clear(),destroy()}`.
- Root overlay `draw()` additionally accepts `{cameraFrame,world,hintsActive}`; chapter UI additionally exposes `renderCameraHints(frame,world,{route,active})` and `clearCameraHints()`.

- [ ] **Step 1: Write failing pure/DOM tests.** Near visible enemy no hint; clipped left/right/up/down enemies get correct arrows; dead/helper/forecast/far street nonthreat excluded; both sides max2; return-to-screen clears. Verify 88×24 badge then24×24 fallback safe slots avoid player/HUD/controls. Fully blocked synthetic geometry returns[] rather than cover player; normal recorded geometry must still provide a safe hint. All DOM nodes pointer-events:none, aria-hidden, no focusables/live-region; repeated same state creates no new nodes or writes.
- [ ] **Step 2: Run RED.** `node --test tests/camera-direction-hints.test.mjs`; new module should be missing.
- [ ] **Step 3: Implement pure projection and DOM owner.** Use frame fixed marker as the gate, real enemy/filter rules from design, reusable two-span DOM pool and cached geometry. Style container absolute inset0/z-index5 and badges only; use existing cream#fff5dc, darkgreen#173239 text/2pxborder,4pxradius,12pxboldtext and border-box. No new shadow/filter outside the measured badge bounds. Do not create canvas or read layout in update(). Keep badge classes outside measureChallengeOcclusions selectors.
- [ ] **Step 4: Wire root beside the mic canvas.** Mount hints in `.app`; refresh logical offset via challengeLogicalRect on existing geometry refresh; call hints update before route-mic early return; keep mic canvas width/height and code path unchanged. Root updateFrame supplies active/nonmodal/nonfinish gating.
- [ ] **Step 5: Wire later shared UI.** Mount in `#trial-app`, update geometry only when existing measurement occurs, add public render/clear methods, clear on paused/noncombat lifecycle, destroy. Three chapter files add a call immediately after adapter frame and clear before noncombat/no-world early returns. Do not touch actor rendering.
- [ ] **Step 6: Add entry and rotation tests.** Root VS/Boss hints work with route=false; main and each later chapter street/battle share same helper; native/±90 root offsets correct; paused/result/story/viewport-not-ready clears; badge never enters cameraSafety occlusions; no per-frame getBoundingClientRect calls; original mic canvas is still64×64 logical backing plan.
- [ ] **Step 7: Verify.** `node --test tests/camera-direction-hints.test.mjs tests/mobile-landscape-entry-contract.test.mjs tests/mobile-stable-camera-lifecycle.test.mjs tests/mobile-classic-v67-golden.test.mjs` plus existing overlay/layout/viewport tests discovered from repository. Expected: zero failures.
- [ ] **Step 7a: Run full suite before claiming Task 3 complete.** Run `npm test` against the final Task 3 code; record totals/exit status and any precisely scoped assertion changes. Focused tests alone do not pass this gate.
- [ ] **Step 8: Commit scoped hints/tests when permitted, then stop for review.** `feat: show offscreen opponents in fixed mobile view`. Report the full suite and commit to parent; wait for independent review and parent coordination before final aggregate acceptance or preview.

### Task 4: Full acceptance and contract update

**Files:**
- Modify: `docs/mobile-landscape-camera-contract.md`。
- Extend only if a real coverage gap is found: `tests/mobile-landscape-low-pose.test.mjs`。
- Evidence output: this external evidence/camera directory, not tracked product reports unless parent requests otherwise。

**Interfaces:** No new runtime API; consumes Tasks1–3 output。

- [ ] **Step 1: Run original-alpha protection.** `node --test tests/mobile-landscape-low-pose.test.mjs`; require all24960 existing cases, zero wholly-controlled actors and zero offscreen alpha. Preserve explicit low-pose limitations; do not lower safety assertions to green a regression.
- [ ] **Step 2: Run realistic trajectories.** Actual Duel/ChallengeDepthRoute and chapter2/3/4 routes with seeded input; both facings, jump/table/depth/assist. Report fixed zoom min=max per unchanged geometry, safety, pan relative to actual player movement, and nearest enemy hint transitions. Separate artificial teleports from normal movement.
- [ ] **Step 3: Update contract.** Document stable player-only versus classic all-fit, geometry keys/rebase, paused/finish freeze, VS+training+Boss coverage, offscreen hint behavior, unmeasured fallback and preserved alpha caveat. Do not claim legacy nondepth route or browser acceptance without evidence.
- [ ] **Step 4: Run aggregate.** `npm test`; capture complete summary, exit status and candidate HEAD. Run `git diff --check`, baseline golden hash check, and verify frozen fixture/reference SHA-256 unchanged. Focused pass does not substitute full suite.
- [ ] **Step 5: Parent coordinates one frozen-candidate browser acceptance.** Do not start any preview independently. After all segmented reviews pass, the parent freezes the integrated candidate and coordinates native/sideways 844×390 and568×320 main VS/training/street/Boss and later street/Boss; pause/switch mode/rotate/resume/finish, hints and low-pose readability; portrait/desktop/classic comparison. Use that same frozen candidate throughout. No real player data reads or mutations.
- [ ] **Step 6: Commit contract/verified follow-up changes when permitted.** Stage only reviewed paths; do not publish or change remote branch without parent instruction.
- [ ] **Step 7: Deliver evidence and limits.** Exact commit(s), file list, focused/full/browser results, golden provenance, same-frame fixed zoom evidence, and any unresolved blocker. Explicitly say VS and practice share the behavior; don't claim the independent street seam issue is solved by fixed zoom.

## Preparation completed before execution

- [x] Exact baseline HEAD and clean status checked.
- [x] Read-only classic golden captured outside product:108 scenarios/1536 frames; source still clean.
- [x] Design/plan self-review: APIs consistent, profile preservation pinned, five Review Focus cases assigned, shared DOM mic constraint explicit.
- [ ] Parent release of product-write gate received.
