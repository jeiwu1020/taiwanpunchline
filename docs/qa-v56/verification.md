# V56 team controls, restart and speech
Baseline #33 source 1e22737e378fb07e63f479128d1a0b1db1b33b36, rollback tag backup-before-ui-voice-v56. Full baseline source saved to Space and downloaded again with matching SHA256 3a3af1f9237a94c54fa4b5ca62ce41401c100c1da4c676a980145748ae7c62a8.

Team target grouping now matches main portraits. Portrait controls form one row; Chrome touch-preview measurement at320x740: stick84x84, four49x54 targets with4px gaps, specials separate above.320x568 menu and568x320 landscape were visually checked. Narrow landscape actions54x54 and specials61x60, no intersections. Two-step pause restart was clicked in browser and reset HP/time with countdown; automated tests cover whole-series reset, retained selections, cancellation, Escape, and stale input rejection.

Four independent audio lanes retain original gains. Main and helper speech do not replace each other; repeated speech within one lane queues. Helper voice is selected from the actual assistStart attack event. Browser observed chosen helper original file in its separate audio element. Automated mock-media tests cover all14 assist attack choices for both sides, FIFO and concurrency. Natural round end lets active lines complete and discards unstarted pending lines; deliberate mute, pause, blur, home or restart still stops sound and clears queues.

No claim of subjective mix listening or physical iOS testing: browser tests use cloud Chrome and simulated viewport/touch-preview. Actual audio overlap may be busy, intentionally without newly introduced ducking or priority cutoff per user request.
