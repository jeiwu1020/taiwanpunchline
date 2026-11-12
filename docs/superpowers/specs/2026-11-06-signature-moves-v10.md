# V10 signature moves design

The user authorized implementation and private publication after source research, keeping the existing seven caricatures, mobile/desktop one-page controls and natural limb anatomy. No GitHub main or new Codex tasks. Existing owner-private Site source is the only publication target. Original voice verification and reuse rights remain incomplete: retain the previously integrated Han clip only and use clearly labelled synthetic non-speech effects for all newly configured moves. Never present imitation or reconstructed phrases as original voice.

## Approved roster and implementation choices

Each character retains three slots. Internal move keys below are the contract for engine and presentation.

- Wang: rush 連滾帶爬 (unchanged); counter 從從容容 (renamed, unchanged counter); heal 喝水回氣 (unchanged).
- Han: coin 發財金幣波; han_knee 可憐哪 (kneel, two short knee steps, then shout; no invulnerability or smaller hurtbox); arrow 一支穿雲箭.
- Ma: ma_handshake 死亡之握 (謝謝指教 shown, no instant kill); ma_gaze 我把你當人看 (look/point/open palm push, no transformation or ethnic target); ma_cough 酷酷嫂 (cough sound meme, elbow-covered cough and next-page comic effect, not spouse or spoken three-character quote).
- Su: su_shout 在那叫什麼; su_rush 衝衝衝 (three rhythmic steps, not necessarily three hits); su_dare 要試試看嘛 (beckon, brace, counter).
- Huang: huang_shout 太離譜了; huang_debt 我有欠你喔 (shrug, open empty palms, counter); huang_queue 可以這樣插隊喔 (step to stop, palm barrier, queue post accent, short-range push; decorative queue line is not a persistent physics wall).
- Chen: chen_dream 有夢最美 (lift paper plane/dream bubble, single projectile); chen_question 阿扁錯了嗎 (two palms/questions, two close pulses); chen_calm 有那麼嚴重嗎 (shrug and calm counter).
- Ko: ko_bags 垃圾不分藍綠 (existing two bag strikes); ko_name 賴祥德 (raised calling hand, broken name-card lettering; label the real intended name and meme interpretation); ko_resolve 我不會屈服 (grounded stance, one guarded hit without knockback; no retaliation or invulnerability).

All actions and game effects are invented satire, not historical reenactment. Han's knee-walk and quote originate from separate events. Cough is not a spoken quote. Audio source existence is separate from verified audio and rights.

## Art and animation

Retain approved portrait identities and suit colors. Generate new expressive cutouts only where existing poses cannot convey the act: Han knees, Ma cough/gaze, open-palm and beckoning hands, Chen dream/question, Ko calling/resolve. Distinct silhouettes precede cosmetic text. Maintain shoulder-elbow-wrist ordering and wrist-to-prop occlusion. New body poses must use genuine bent knees, grounded contact, consistent limb side and recovery. Do not rotate a closed fist into a palm. Whole-character mirroring remains a representation limit, not a newly drawn rear angle.

## Architecture

Retain Canvas/Phaser and Duel engine. Keep attack rules in core/roster; presentation in art-motion/art-roster-motion/art-expression/render. Add data-driven projectile/brace only where necessary. Do not change normal attack combo, crouch hitbox, jump, score or menu controls. New gameplay semantics invalidate old move-specific expectations but not interruption/pause/bounds safeguards.

## Verification

Test every new move at start, active, end, interruption, cooldown, pause and arena edges. Test counter nesting, brace against melee/projectile, multi-hit consumption, AI damage scaling and 49 matchups. Inspect every move in both orientations and several times, especially Han knees and hands. Phone portrait/landscape and a foreground combat soak. Independent source/semantics and visual review before private publication. All temporary QA routes removed from deployment.
