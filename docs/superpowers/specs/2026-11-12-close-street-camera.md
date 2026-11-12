# Phone street camera: protagonist-first framing

## Scope and preserved baseline

The published baseline is version 68, source commit b69b631538199e0bed976301aeac7d221d6ab4fd and tree a01c7573ba644b880acc338567fffeb9c53a686e. Its complete source backup and old branch remain available. This change follows the revised requirement that distant street opponents may leave the screen. It supersedes all-actor-fit expectations only for explicitly measured phone street profiles.

- Preserve phone-landscape STABLE framing and its background strategy.
- Phone-landscape CLASSIC uses approximately 95% of the corresponding stable protagonist scale, with bounded horizontal following rather than opponent-driven zoom.
- Phone-portrait street, both modes, uses a close player-only composition. Recorded 390-by-844 geometry gives standing original-art height close to classic VS, not identical to every VS camera mode.
- Share the policy between the first chapter and the common later-chapter adapter. Preserve ordinary VS, Boss/practice, desktop, unmeasured fallbacks, assets, combat rules and v4 saved data.

## Implementation contract

`streetPlayerCameraFrame` is the shared, route-only policy. It requires explicit touch and measured occlusions, and owns a versioned `playerCloseCamera` state distinct from the existing landscape stable state. A frame with unchanged geometry keeps its chosen scale. Portrait geometry recovery recomputes its legal scale; a tight layout cannot permanently shrink a later restored layout. Paused frames retain their saved player pose through preference and geometry changes.

Portrait requires the protagonist body to fit outside hard HUD and control occlusions. Landscape retains the approved soft-control policy. Other actors may be outside the view and existing direction hints remain available. The algorithm changes framing, not actor simulation, spawns, attacks, difficulty, resolution or texture filtering.

If the measured layout cannot provide a readable protagonist pocket, the shared entry throws a typed camera error before publishing a projection. Both renderer boundaries retain the established draw-failed lifecycle, bounded recovery and gated gameplay input. Only the known error receives a specific small-screen explanation; no arbitrary error content or save mutation is introduced. The 96-logical-pixel minimum body proxy is an engineering safety floor, not a physical-device readability result.

## Verification and limits

Required checks include all four entry paths, actual measured small-phone geometry, native landscape and logical side rotation, jump/depth poses, pause and mode transitions, saved-pose ownership, viewport recovery, original character alpha, and baseline-derived preservation snapshots. Old all-actor-fit assertions must be amended only in the authorized close-street profiles, with old evidence retained.

Structural measurements and a single native-library raster comparison show that closer framing does not make every stage faster. First-chapter retained-cache work decreases on the selected trace; some ready-frame drawing cost increases, and later-chapter static backing can increase. No general performance improvement, seam algorithm repair or physical-phone FPS result follows from those tests. Browser functional and paired timing checks are separate gates, with their exact scope recorded in release evidence.

No cache redesign or failed seam experiment is included. Natural finite-cache cold-start partial bands remain possible. Final delivery must distinguish the closer camera repair from unverified device stutter and seam behavior.

## Release protection

Use one fresh runtime import identity, preserve the original private audience, and reject a changed live baseline before publication. The final source archive is self-contained: duplicate bytes may be stored once, but every tracked path, mode and hash must be restored as ordinary independent files and verified after a fresh download. Runtime output is rebuilt and compared. Do not delete or overwrite old source, backups or browser data. Publish only the exact frozen candidate after these gates, using the supported Sites source workflow.

## Pause mask follow-up

Native Chromium validation exposed a separate pause-only zoom change at logical 568×320. Active dynamic street framing was 95% of the stable reference, but hiding the combat HUD and controls removed their measured blockers and enlarged the paused background. The fix belongs to the common layout measurement, not an inference from fewer rectangles: a real close-street combat owner retains visibility-hidden, still-laid-out slots. Explicit hidden attributes and display:none remain excluded. Actual layout, viewport and safe-area changes are measured normally.

`streetPlayerCameraProfile` now provides the same logical profile predicate to the camera and layout owners. The first chapter supplies an explicit route flag; the shared later-chapter interface derives it from the rendered world and current chapter state. Only the authorized close-street profiles extend the existing retained control-grid policy. Ordinary classic VS, Boss and desktop masks keep their existing behavior, and landscape stable retains its previous geometry.

A proposed shortcut that froze any less restrictive paused geometry was rejected: it prevented a genuinely tightened portrait HUD from restoring the larger view. That shortcut is not in this source. Tests retain the real geometry-recovery requirement and cover real shared measurement plus the actual chapter-interface owner lifecycle. Browser and device performance validation remain separate from these program tests.
