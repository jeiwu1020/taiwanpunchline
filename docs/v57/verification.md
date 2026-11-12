# V57 verification
Baseline: private deployment #34, source a4e17394ee4e64178496d7be03afc243c5fee990. Rollback tag backup-before-home-v57 and complete source archived in Space, retrieved and SHA256 checked.

2099/2099 automated tests passed after cache-version update. git diff --check passed.
Browser QA used desktop Chrome with touch-preview iframe sizes, not physical iOS. Inspected 320x740, 390x844 and 667x375 layouts. 320px rally-label wrapping was found and corrected, then rechecked visually. Larger names wrap without clipping, landscape names remain legible. Four portrait action buttons remain separated; rightmost guard horizontal position retained. Loaded homepage opens settings and rotation toggle. Battle Home shows confirmation; cancel returns, fresh confirmation opens title. Automated tests additionally cover countdown pause, Escape, and freely repeated roster choices.
No gameplay balance or assist voice playback behavior changed. Help describes the existing independent voice lanes. Historical source and licensing information retained.

Generated icon PNG/ICO sizes, manifest references, and HTML links validated. Source and 512px export visually inspected. No offline capability is claimed.
