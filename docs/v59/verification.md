# V59 menu buttons
Baseline #36 c5168bcddb0ef9f5cacb33ba6d2dc2914e770c4b retained via backup-before-menu-v59 and full V58 archive already stored and retrieved from Space.

Changed the home dialog's continue/home/selection and pause dialog's continue/selection to shared solid comic red menu-action buttons. All use184x48px layout size,16px text, dark3px border and offset shadow. Removed quiet underlined-link treatment only for these requested choices. Existing departure confirmation and fresh-press logic unchanged.

2107 tests passed. Chrome QA at320x740 portrait,568x320 landscape and desktop: measured equal sizes/colors; visually inspected home and selection prompts; exercised cancel retaining pause, confirmed selection and confirmed home. Short landscape dialog whitespace compacted; clientHeight and scrollHeight both242px, so all three48px targets remain visible without scrolling. No physical iOS claim. No gameplay changes.
