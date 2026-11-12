# V48 verification and rollback

Rollback: backup-before-rally-v48 at 53c0ca140bf1878ba0a01207afc233aab90f3409 (#25). Full source archive retained outside checkout.

Portrait root cause: 84px stick overflowed a 60px row and 64px column. The new dedicated 88px row and 84px column leave a full gap beneath the 78px move row. Browser measurements: usable widths 280, 288, 320, 360, 375, 390, 414 and 430; no intersections, no horizontal overflow, stick 84x84 and action buttons 54x54. Actual 320x568 and 390x720 portrait verified. Native 844x390 landscape, simulated safe areas and 3 rotation cycles also checked in the existing browser harness. These are browser viewport tests, not physical phone testing.

#25 L clipping reproduced from its archived exact HTML/CSS. Button bottom 61px, L bottom 62.703px, overflow hidden. Fixed equal name/meter/key rows for both primary buttons; L remains the existing keyboard binding and appears in the controls help. No key mapping changes.

Crowds: three new built-in generated transparent fictional adult portraits (elderly man, young adult woman, elderly woman), alongside the two existing supporters. Screen-space formation cancels both camera movement and zoom. Idle people stay still in a low foreground strip; a six-person batch launches at .55s, reaches the opposite lane at the unchanged .95s damage beat, then exits. Existing warning, damage, guard/jump/table counterplay and both sides' charge rules unchanged. Motion reduction disables travel/bounce while preserving labels/warning.

Carry item: choose lower wrist at pickup, store the hand for that item instance, follow wrist and facing, clear when core removes the item on throw. Action-cutout anchors handle roll, archery and kneeling; raised hands use smaller props to limit face obstruction. Seven-character visual sheet covers idle, all three moves and mirror; numeric tests cover all move phases and hand stability. No combat-core, voice or subtitle timing changes.

Automated suite: 1812 passed before final help text change; rerun recorded at release. Preview QA pages are deterministic render/DOM fixtures, not alternate combat rules.
