# V51: mobile gestures, supporter flags, charge clarity and continuous entrance
Rollback: live #28 / source8e9e1089557d7341da2bd2adf4e8e39485164205 preserved in backup-before-rally-v51 and full source tar outside checkout.

Scope authorized by user: suppress accidental iOS pinch/double-tap zoom across battle/pause/settings while retaining native single-finger scrolling and accessible controls; named readable flags attached to actual hand; distinguish99/100 charge; continuous crowd entrance. No combat damage/range/timing changes, no additional art generation or paid tools.

Entrance now interpolates stable supporter lane x/y/height into exact world-ground wave start over existing .8s telegraph with smoothstep; active wave continues same location and existing collision. Tests sample 80 frames at320/390/844 widths and require zero initial position/scale discontinuity.

Meter stays numeric at100%, full gets green instead of gold, bold tabular percentage10px desktop/12px phone. Actual core threshold100 preserved;99.999 cannot activate.

Testing limitations: cloud desktop browser mobile viewport simulations and synthetic event contract tests only; no physical iOS Safari available in this environment. Do not claim physical iOS verification.

Final verification: 1,859 tests passed /0 failed. Browser preview at390x720 confirms new settings toggle defaults off, toggles on/off, dialog scrolls, and actual battle shows named hand-attached banner during AI rally entrance. Allseven names/mirrors checked in actual-asset fixture; meter99/100 checked sideby-side. No new art, paid tools or Codex task. iOS-native pinch claim remains explicitly unverified; event tests cover multipoint/legacygesture/defaultprevented and Safari Touch prototype properties.
