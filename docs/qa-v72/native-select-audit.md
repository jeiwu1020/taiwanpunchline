# V72: game-styled select menus

Baseline: `410d0ba41cc22cf7eb7f2b006ee1dda47de62fbe` (the verified V71 private Site source).
Candidate branch: `fix/custom-game-selects-v72`.

## Inventory and scope

All shipped HTML and first-party JavaScript were inspected for native select markup, dynamic select creation, native picker calls, and option population. Six single-select controls remained:

| Page | Source ID | Purpose |
| --- | --- | --- |
| index.html | training-behavior | Training setup: Stand / Guard / AI |
| index.html | training-live-behavior | Paused training: opponent behavior |
| index.html | voice-sample | Legacy history's 21-clip audio audition |
| art.html | character | Art viewer character |
| art.html | move | Art viewer action, dynamically replaced by character |
| art.html | speed | Art viewer playback speed |

Challenge chapter main/helper and character research already use custom comic choosers and are unchanged. Battle difficulty and character selection are already buttons. No additional dynamic native select creation was found in shipped first-party code. Historical docs and QA fixtures are not shipped game surfaces. Native file import and confirmation/security dialogs are deliberately unchanged.

## Implementation

`game-select.mjs` supplies one shared controller. Original selects remain hidden, unfocusable, and excluded from the accessibility tree as value/event boundaries, so existing handlers and form semantics are retained. No OS select menu is displayed by the replacement controls. The two game-side programmatic training assignments use `setGameSelectValue`; dynamically replaced art options and newly inserted selects are observed.

Popups are attached directly to the nearest modal dialog or transformed game app, using logical coordinates rather than opening a screen-oriented system menu. Art viewer menus use the viewport. Menus clamp to the visible host, scroll long lists, and close safely on rotation/resize. Sideways touch movement is mapped into logical vertical scrolling and a completed drag cannot accidentally select its release option.

Keyboard arrows, Home/End, typeahead, Enter/Space, Escape, and Tab are supported. Escape first cancels the list, and keyboard input cannot leak into combat. Focus returns to the trigger after selection/cancel. Outside interaction, hidden screens, closed details/modals, and removed controls dismiss or clean up the list. Disabled/hidden options, disabled groups/fieldsets, source events, form reset, and remount cleanup are covered.

The comic palette, 44px minimum targets, checked selection, paper background, ink borders, and red focus marks follow the existing game controls. No combat rules, assets, progression, save format, settings store, or challenge chooser were changed.

## Automated verification

- Clean baseline: `npm test`: 2363 passed, 0 failed.
- Red phase: the new 16 initial assertions failed before the shared chooser existed.
- Additional red/green regressions demonstrated hidden options being reachable by keyboard and a directly removed source being reinserted during cleanup; both defects were fixed.
- Final component suite: `node --test tests/game-select-v72.test.mjs`: 22 passed, 0 failed.
- Full suite: `npm test`: 2385 passed, 0 failed, 0 skipped.
- `node --check` passed for game-select.mjs, game-select-boot.mjs, and game.mjs.
- `git diff --check` passed.
- The first full candidate run passed 2377/2379. Its only failures were two hard-coded cache-key assertions for game.mjs v241. They now assert v242, the changed runtime's actual entry key; the rerun passed in full.

jsdom 26.1.0 is a development-only dependency for real DOM component tests; package.json, package-lock.json, and the node_modules ignore rule support those tests. The lock was regenerated and validated offline in an empty temporary directory and contains only jsdom's 39 development dependency packages. There are no added runtime packages or network services. This static project has no separate build or lint script.

## Browser verification

The coordinating task completed managed-preview CUA verification against this candidate:

- Desktop training setup: ArrowDown/Enter selected Guard. Starting training and pausing retained the same behavior. Escape closed only the popup, leaving Pause open.
- Training setup and paused-training menus followed the game direction in portrait, 844×390 landscape, and a 390×740 CSS-sideways viewport.
- The legacy 21-item voice menu accepted End/Enter on the last option. The end of the list remained visible sideways. Changing back to landscape closed the list safely while leaving the Settings page open.
- Art viewer: changing to the Han character rebuilt its move choices; selecting the arrow action and 1× playback speed succeeded.
- Main-game source selects were confirmed hidden, display:none, and tabIndex -1.

No headless browser was run. No physical-device touch gesture or Safari validation was performed. DOM tests cover synthetic sideways pointer scrolling and drag-release suppression, not real phone input. The existing pause panel's content scrolling at 844×390/sideways dimensions was observed and left unchanged as unrelated layout behavior.

The isolated read-only code review found no remaining concrete blocker after the direct-removal regression was fixed and rechecked.

### Repeatable CUA cases

Candidate document root: `brawl-v72-selects/dist`.

1. Desktop: Start → Training → choose each opponent behavior. Verify selected label/check and opening/closing repeatedly.
2. Start training → Pause → change opponent behavior → Continue → Pause again → return to setup. Verify the behavior and displayed choices remain synchronized.
3. Exercise arrows, Home/End, Enter/Space, Escape, Tab/Shift+Tab, and outside click. Escape must close only the popup first.
4. Phone logical landscape / portrait with side-turn enabled: repeat training setup and pause selection. Open a list, rotate or toggle side-turn, then reopen. It should close safely and use the new direction.
5. Settings → About → full historical information → legacy audio audition near the bottom. Open the 21-option list, scroll/select the last option, and confirm audition controls still work. Repeat sideways and with the settings body already scrolled.
6. Open `art.html`: select a character, check that the move list updates, select a move, change speed, pause/play, and mirror. Test a long list near the viewport edge and page scrolling.
7. Recheck existing challenge main/helper selection and save export/import entrypoints. The source and runtime are unchanged there.

No publication has been performed. The original baseline worktree remains clean. The parent-owned temporary CUA fixture is excluded from the deliverable.
