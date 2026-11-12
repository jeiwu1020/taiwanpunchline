# V38: clustered desktop/landscape title and larger selection portraits

Rollback base: V37 commit 7d48b0333bb65a810c40eb43e15eae6abb6285e7. Existing owner-private Site, unchanged audience.

Only title CSS, roster CSS, cache/version metadata and regression/QA evidence changed. Combat, move captions, audio routing, first-move portrait audition, controls and balance remain unchanged.

Phone portrait title is intentionally unchanged. Two upright sizes were compared against the previous CSS using the same fixed cast: 14 primary DOM rectangles and 11 computed styles match exactly. Desktop and landscape title now use a compact layered crowd with asymmetry, light bobbing and reduced-motion support.

Selection is larger at every tested size. Measured roster image boxes increased from desktop ~110×68 to ~133×165–174; upright390 now ~76×98 compared with the old CSS34px height cap. Seven choices, both role selectors, difficulty and Start remain on one page.

Full test suite: 1,603 passed, 0 failed. Responsive checks used cloud Chromium and viewport fixtures, not physical Safari hardware. Desktop1280×720 represents an effective layout size, not a full Windows150% font-rendering emulation. See component QA documents for measured sizes and interaction results.
