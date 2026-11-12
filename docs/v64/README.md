# V64: Independent profiles and the test entrance

This version changes only the foundation for a later challenge mode. It does not add stages, enemies, experience, skill points, unlock rewards or a skill tree. Existing battle, series and training remain playable.

## Player behavior

- The home screen has three independent local save profiles. Each profile starts with Wang and Han and can eventually hold every character, rather than being tied to one character.
- Locked characters are black silhouettes with question marks on the home screen and cannot be selected as either fighter or either assist. Settings move/audio previews follow the same access rule.
- Tap the Chen portrait on the home screen five times within five seconds to enter test mode. In the initial roster it is a silhouette. Another portrait or leaving home resets the tap sequence.
- Test mode temporarily allows all seven characters. The purple header and border identify it. The home screen has an explicit exit button. Reloading or switching profiles exits it.
- Audio, camera, rotation and other existing preferences are retained separately.

## Data and portability

`dist/profile-progress.mjs` owns the versioned `taiwanpunchline-progress-v1` document. It contains an active profile ID and three independent profile records. Each record has its unlocked character IDs plus empty character/challenge extension records. Unsupported data is not overwritten. A slot switch reads the latest valid stored document first so that another tab's new progress is retained.

Test mode is in memory only. New matches receive immutable `progressContext` metadata with `recordProgress: false` and `submitRanking: false` during test mode. There is no rank submission or challenge reward service in the current prototype. Future writers must enforce this boundary, including a server-side boundary if online rankings are introduced. This hidden entrance is a convenience for testing, not password security.

Local storage is browser-origin specific. Moving to a different domain will require an explicit export/import or account migration when that work is authorized. No cross-device sync is claimed. No settings are cleared and no cloud login is added.

## Rollback

The pre-change baseline is Sites version 40, source commit fd53a25, with local tag `backup-before-unlocks-v64`. The complete V63 source backup was independently retrieved and its SHA-256 verified before editing. Restore that source or Site version to roll back; the new profile key is independent and may remain unused. Do not clear unrelated browser settings.

## Verification

- Full Node suite: 2,122 tests passed on the final source.
- Thirteen new profile regressions cover independent saves, preservation of existing and future data, corrupt/unavailable storage, all four selection targets, memory-only testing, sanitation after exit, five-tap timing, storage concurrency and masking before JS initialization.
- Existing legacy combat suites use an explicit fully unlocked profile fixture. Production does not have a test-only bypass for these tests.
- Independent code review found no blocking correctness or settings/data-loss issue.
- Actual cloud Chromium checks: desktop home/selection/training; 390x844 and 320x667 portrait; 844x390 landscape; rotated 320x667 (logical 667x320); five physical UI clicks, explicit exit, profile switch, locked move preview and all-character testing.
- The test marker uses the header rather than covering the enemy health bar. The previously disabled title-portrait pointer targets were restored with a scoped rule.
- Phone-sized checks used the production page in a dimensioned iframe and its existing `touchPreview` switch, not physical iOS hardware. The fixture is retained under tests and not deployed. In this fixture, the start button was also activated with Enter after mouse clicks did not advance; desktop direct-page start worked. Do not claim physical touch QA from this run.
- No game-origin console error was observed. The browser reported an unrelated extension-metadata message.

## Deferred allocation rule

The latest design direction is a shared earned-point allowance within a profile with separate per-character allocation, not one pool consumed across characters. This version defines no point fields, pool or allocation behavior; the empty extension records do not commit the future design to a shared consumable balance.
