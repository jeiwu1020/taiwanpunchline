# Local-only browser QA harnesses
These files are not published. To reproduce, copy qa-* files into dist, start managed Sites preview, and open qa-view.html. Select the native browser tab so rAF is not background-throttled. qa-view runs autoplay after Start; qa-manual does not. qa-results uses a deterministic draw-state fixture for layout only. Remove the copied files from dist before packaging.

qa-play/qa-game are snapshots of production files with diagnostic code appended. Regenerate from current index.html/game.mjs before testing later revisions. qa-fixture similarly adds only a known result state.

The harness telemetry is local only. It records no user information and makes no external requests.
