# Unified progress candidate, 2026-11-10

This is an isolated, unpublished candidate. No real browser storage was used in its tests. Frozen release and restoration packages were not changed.

## Ownership and persistence

`dist/preview/campaign/unified/progress.mjs` exports `openUnifiedProgress({storage, locks, onChange})`.

- Opening only reads. It does not create v3, migrate any slot, change settings, or erase old keys.
- v3 key: `taiwanpunchline-progress-v3`. One JSON envelope contains the per-slot authority, the v2 campaign payload, adoption source records, and exact original v1/v2/seed strings. Authority cannot commit without its payload.
- Adopted slots use v3 for all subsequent story rewards, selection and skills. The v1 and v2 keys are not written by their campaign operations.
- Unadopted slots still use v1. A legacy write rereads that document, changes only the target slot, and preserves other slots and unknown root/profile fields. It checks the source again before writing. An old deployed #55 tab does not participate in locks, so any detected read difference fails closed. This cannot provide a cross-key transaction or control writes performed by old software.
- Once v3 exists, its active profile is the shared main/continuation selection. Changing an active pointer does not change the separate obsolete v1 active pointer.
- All writes use `navigator.locks`-compatible exclusive coordination. Missing locks is read-only, not silently unsaved formal play.
- A write is saved only after its exact serialized bytes are read back. A write exception after successful storage is accepted only if that readback succeeds. Unknown/mismatching readback is dirty/conflicted.
- No key is removed. Settings are never read or written by this module.

## Synchronous reads

`api.get()` returns:

```
{
  revision, activeProfileId, profileId,
  authority: 'legacy' | 'campaign',
  document,          // legacy-compatible read-only three-slot projection
  campaignDocument, // the full inner v2 campaign model
  persisted, dirty, busy, readOnly, reason, storageIssue, testMode
}
```

The legacy projection is for old UI reads only. Do not pass it to any old writer. Adopted profile projections have the first-chapter completed/checkpoint fields and shared campaign XP, not a separate writable v1 ledger.

`readProfile(id?)` and `getCurrentProfile()` return a cloned true profile. An adopted profile has `.campaign`; a legacy profile has `.challenge`.

`canUse(id)`, `availableCharacters()`, `getChallengeStats(id, base?)`, `activeProfileId`, `testMode`, `progressContext()` are synchronous. Battle/training should use the shared roster but preserve their existing unbuffed combat rules. Challenge should use the returned derived growth stats.

## Async mutations

Always check **both `accepted` and `persisted`**. A rejected operation can report `persisted:true` because the prior state is saved; that does not mean the attempted action succeeded.

- `selectProfile(id)`
- `allocate(id, skill, {expectedRevision?})`
- `reset(id, {expectedRevision?})`
- `selectCharacters({characterId, helperId}, {expectedRevision?})`, adopted slots only
- `retrySave()`
- `refresh()`, read-only refresh, refuses to discard dirty work

These return `{accepted, persisted, reason, ...}`. Mutations are serialized, with expected profile/revision checked after entering the lock. Do not treat returned Promises as booleans.

`enterTestMode()` and `exitTestMode()` are synchronous memory-only changes. They invalidate runs and cancel queued writes, including an adoption waiting for the old v2 lock. `cancelRun()` is memory-only.

The compatibility-only `updateLegacyProfile(updater, context?)` and `legacyCommand(name, args)` reject adopted slots. Application code should normally use the named public APIs and `AsyncChallengeSession`, not arbitrary updaters.

## Explicit per-slot adoption

1. Call `inspectAdoption(id)`, which returns `{profileId, reason, choices, evidence, revision, alreadyAdopted}`.
2. Show the source choices and reason. `legacy` means an existing original document; `campaign` means existing v2. Completely empty storage offers `new`, never a fake original source. v2-only storage retains v2's active slot and offers only campaign.
3. After an explicit whole-slot source choice call:

```
await api.adoptProfile(id, {
  source: 'legacy' | 'campaign' | 'new',
  expectedRevision: api.get().revision,
  evidence: previouslyShownInfo.evidence
})
```

The exact source strings are reread and compared under locks. Do not regenerate `evidence` behind an already displayed confirmation. If source changed, ask from a fresh view.

Reasons include `legacy-only`, `campaign-only`, `new-profile`, `sources-match`, `legacy-changed`, `campaign-changed`, `both-sources-changed`, `origin-evidence-unavailable`, and unsupported source reasons. Missing seed evidence does not permit automatic selection. Neither XP nor skills nor unlocks are merged by max/union. The unchosen branch remains intact in the envelope and old key.

A late-completing unadopted slot can be adopted from its current v1 independently; all other adopted profiles remain byte-equivalent. An already adopted slot cannot be silently re-adopted. Choosing an older branch may intentionally omit newer progress from active play, but its complete unchosen raw branch remains available for export/recovery.

If quota prevented adoption, retry must still match the originally approved source. An old pending legacy write cannot finish after another page adopted that slot.

## Later-chapter store adapter

`api.campaignStore()` provides the existing campaign-store-shaped API:

- `get`, `beginRun`, `dispatch`, `selectProfile`, `selectCharacters`, `allocate`, `reset`, `cancelRun`, `retrySave`, `exportJSON`, `exportLegacyJSON`, test-mode toggles.
- `get().document` is the inner v2 model. The adapter maps its document revision to the envelope revision for allocation/reset. Router growth code should keep passing `store.get().document.revision`.
- Direct main API allocation/reset uses `api.get().revision`, not inner model revision.
- `exportJSON` now exports a full v3 backup, not a bare v2 document.
- `beginRun` will not start a new run while dirty. After a failed growth save, remain paused, export or retry; after confirmed retry, re-begin the same chapter/step to get a valid token.
- No existing v3 branch should fall back to the old v2 writer.
- Chapter 5 and finale remain content-locked in the begin API, regardless of query parameters.

## First-chapter asynchronous session

Import `AsyncChallengeSession` from `unified/first-chapter.mjs`.

```
const session = await AsyncChallengeSession.create({
  progress: api, characterId, helperId, difficulty, replay
});
// Require session.startResult.accepted and persisted for formal start.
```

The factory returns an instance with `startResult`. Invalid programmer configuration such as missing `progress` throws; normal blocked saves are results. A failed roster-setup save returns `accepted:false, setupPending:true`; after retry succeeds, recreate the session rather than directly entering a route. Omitted character/helper preserve adopted saved selection. Preview may intentionally return accepted true, persisted false, reason test-mode.

Synchronous fields: `phase`, `checkpoint`, `carry`, `finished`, `attemptId`, `characterId`, `helperId`, `difficulty`, `token`, `run`, `lastReward`, `busy`.

Async methods: `rewardMob(event)`, `routeComplete(carry)`, `bossWon(carry)`, `retry()`, `finishChapter()`, `flush()`.

- Each session has a reliable event queue. Same-frame mob events followed by route completion are ordered and not discarded because a write is busy.
- Scene transitions wait for the mutation result. Duplicate old-scene events are rejected, and external profile/checkpoint changes never pay a new slot.
- Quota failures retain accepted XP and receipts in dirty memory; later events from that same valid scene are also retained. A dirty finish cannot navigate to another chapter.
- Chapter 1's routes/minibosses map to checkpoints 0–5. Entry is consumed on start, so the main UI should decide/show the first wake-up comic before calling create. Boss-comic is consumed with the final boss result after the existing boss dialogue.
- Winning the last boss commits the clear and unlock at the result, before Continue. Reloading that result resumes handoff. `finishChapter()` explicitly consumes handoff/roster and advances to chapter 2.
- Replay rewards retain first-clear deduplication, allow legitimate new-attempt mob XP, and leave the later main cursor unchanged. Legacy completed replay also advances all six phases when milestones were already paid.
- A completed legacy run still needs explicit adoption to continue to newer chapters; `finishChapter()` reports `legacy-adoption-required` without changing v1.
- Test mode creates a pure memory preview session, not a formal writer.
- Replay mid-run cursor is not durable. Reloading replay starts the revisit at route A. Main campaign checkpoint remains durable.

## Backup/import

`exportBackup()` returns JSON with version 3, complete envelope, exact v1/v2/seed source strings, the last observed v3 bytes (including an unsupported version), and the current persistence label. Dirty export is useful recovery data, not proof of an on-disk save.

`importBackup(text, {expectedRevision, adoptLegacySlots?, adoptCampaignSlots?})`:

- Native v3 package: exact schema/version validation. Original v1/v2/settings are not overwritten.
- If the package has legacy-authority slots and current v1 differs, returns `legacy-source-conflict`. An explicit `adoptLegacySlots:true` imports those backup slots into v3 instead of modifying the current v1. UI must disclose the three-slot consequence.
- Raw v1 JSON: requires explicit `adoptLegacySlots:true`, validates every slot, then adopts all three into v3.
- Raw v2 JSON: requires explicit `adoptCampaignSlots:true`, validates the campaign, then adopts all three into v3.
- Before v3 replacement, creates a unique backup key containing the complete pre-import state and verifies it. Backup failure prevents replacement. Returns `backupKey` when successful or when replacement itself becomes dirty.
- Rechecks expected revision and source after creating the backup. Import never deletes the old keys or backups.

Unsupported/corrupt current v3 is deliberately fail-closed. This version does not provide an in-app override to replace such a key. Do not claim universal one-click recovery. The unsupported original bytes are included as `lastObservedEnvelopeRaw` for manual recovery; no in-app override is authorized by that field. Source files and raw keys remain untouched for manual recovery. Backups have a bounded size; repeated large branch histories can hit quota and must use export rather than deleting data automatically.

## Verification

All fixtures are memory Maps and serial fake Web Locks, never actual localStorage.

- `qa/campaign/tests/unified-progress.test.mjs`: no-write first load, source choice, v2-only/new profiles, seed evidence, source changes, late slots, extension preservation, no locks, revision conflicts, fault injection, backups/imports, adapter revision mapping.
- `qa/campaign/tests/unified-first-chapter.test.mjs`: all six checkpoints, result reload, same-frame batches, duplicate/retry/replay, original-only replay, preview isolation, quota recovery, external changes, locked chapter 5, saved character/helper.
- `qa/campaign/tests/unified-safety-review.test.mjs`: independent regression tests for four discovered safety issues plus archive/backup failure and extension cases.

Old frozen source, ZIP archives and Space version2 package were not changed. Parent owns combined main/continuation browser QA and release readiness; this data-layer completion is not a publication or a claim of fully integrated UI readiness.

## Final verification snapshot

Data-core-owned tests: 54/54 passed. Full campaign QA at this checkpoint: 248/248 passed, including the independently developed later-page integrations. Combined main/root tests and browser checks remain owned by the parent integration task. See `qa/campaign/artifacts/unified-core/verification.json` and logs for exact source hashes.
