# V10 signature move artwork

This owner-private revision follows the selected seven-character, three-move roster. It does not add a politician, change GitHub main, grant rights, or publicly distribute the game.

Six generated WebP files are added: Han's four knee poses and matching open-mouth knee frame, Ma's gaze and cough heads, a six-cell gesture atlas, and a six-cell contextual prop atlas. Prompts and chosen/rejected generation history are preserved in signature-assets-v10.json and han-knees-v10-provenance.json / han-knee-shout-v10-provenance.json. Original source outputs are retained under docs, outside deployment assets.

Hand identities in the unmirrored layout are: near/right open palm, far/left open palm, right beckon, right raised index (rotated toward the opponent), right hand-back cough with joined forearm, and left palm holding a paper airplane. Mirror rendering flips the whole character consistently. No real-photo image is used as a character sprite.

Observed fixes during visual QA: regenerated ambiguous hand chirality, moved the cough fist from eye level to cover the mouth, grounded the lectern and queue posts, pointed Huang's finger forward, and removed the double-head/double-limb alpha crossfade at knee entry/exit. Chen lowers the raised hand to match the existing waist-height launch before releasing. The airplane projectile now flips with its flight direction; sprite-pool reuse resets flip state.

Known visual limits: Han knee walking uses a handful of drawn keys, with visible pose cuts at about .12 and .98 seconds, rather than continuous anatomical motion. Ma's cough forearm is gray while his upper sleeve is navy. Some new gesture joins retain two narrow white cuff bands. Open hands are slimmer than the legacy fists; the beckoning key can read as a pinching gesture. Minor low-alpha edge residue exists. These are prototype limitations, not a claim of perfect anatomy.

Audio remains separate from generated artwork. Only the existing 1.32-second Han “高雄發大財” clip is active. The Ma lecture source https://www.youtube.com/watch?v=R8vDOQt-V4A&t=5950s was identified, but the player did not load media and a single normal media download was canceled. No Ma cough audio was obtained or heard, and no cut points were verified. The audio slot is intentionally null and refuses unresolved recordings. New attacks use non-speech synthesized sound effects, never imitation represented as original speech. All reuse permissions remain unconfirmed.
