# Comic move typography redesign

User feedback: previous lettering was bland and the mobile sawtooth flash was not visible. Verified reasons: only two moves had the effect, mobile stroke was 1.4px at 30% starting opacity, faded continuously across 180ms, and appeared beneath fighter art.

New system covers every current signature move. Seven character palettes, explicit player/AI + character labels, bold italic tilted text with dark extrusion, and seven treatment families (impact sawtooth, rushing slashes, combo double-strokes, guard brackets, projectile direction strokes, grab chevrons, calm/heal marks). Graphics are high-contrast outlined ink without filled backing plates or tails. They stay visible through the original reading duration and fade with the name, rather than a brief flash. The original move-event voice trigger and caption duration are unchanged. Reduced motion keeps a static treatment.

Screen-fixed anchors now use outer 20%/80% positions to leave more of the central fight clear. Layout wraps by available side width, reserves logical HUD geometry and overlay controls, and never scales the fighters or modifies camera/combat behavior. Graphics stay local to the text; there are no connections to actors.

Validation: all roster moves tested for style/palette, mobile hold visibility, landscape/portrait side bounds, safe HUD/control margins, local-only stroke geometry and no filled occluders. Full existing suite also run. Browser inspected 844x390 simultaneous character styles, 667x320 reversed facing, 390x640 portrait, and an actual live battle showing the impact treatment clearly after the move began. Not a physical handset test. Individual moving actors may temporarily pass behind a fixed caption zone; captions deliberately do not chase them.

Rollback: Sites #20 source f052fb8a7bc038b2bbabc3aab13e53a3f5f6e944, retained local tag backup-before-comic-v43. Preserve owner-private access.
