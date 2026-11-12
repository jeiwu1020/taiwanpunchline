# V35 start screen

Approved scope: add a start/home screen with two distinct random existing parody portraits, readable parody notice, and a trusted Start click before audio/roster entry. Preserve saved preferences, previous selection, orientation UI, combat and all audio assets. No challenge, progression, equipment, cooldown or combat changes.

Design: a cream/amber/teal title overlay fills the cabinet, including the controls. Pair sampling is presentation-only and repeats are allowed between visits. Start stays disabled until game assets initialize. Initial arbitrary taps do not unlock sound. Start resumes shared audio and primes enabled voice channels synchronously, then navigates immediately even when playback is blocked. Feedback allows audio retry without preventing play. The header brand returns home and rerolls the pair.

Verification: production module random/controller tests; lifecycle tests for readiness, mute, failure, return home and selection independence; complete regression and 588-match soak; managed browser viewport and click checks if available. Browser emulation does not certify iPhone/Safari hardware gestures.

Rollback: V34 commit 609f20db6879d7f5242039b44741508aa2ab46ce and external source archive parliament-v34-before-title-609f20d.tar.gz. Same owner-private Site only.
