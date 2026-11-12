# V58 verification
Baseline #35 / 99df3364ba0d33443b20a7b5718d48c4292a42ac retained in rollback tag backup-before-controls-v58 and the complete V57 source archive already saved and retrieved from Space.

Both supplied user screenshots inspected. Portrait visible action gaps now equal 4px. Chrome touch-preview DOM measurements: at320px all four targets49x54 with x100,153,206,259; at390px targets54x54 with x143.734,201.734,259.734,317.75 (last gap differs only0.016px rendering rounding). Guard position preserved.
Landscape cards visually checked at568x320 and667x375: height80px narrow /68px wider, original16px move-name and9px subtitle fonts retained. Long names wrap. Home dialog visually checked at320 portrait and568 landscape. Desktop and portrait pause→selection confirmation, cancellation and final selection navigation exercised; no duplicate confirmation.
Automated regressions cover focus cycling, fresh-press gates, cancellation preserving HP, countdown and roster freedom. Full suite:2105 passed. Testing uses desktop Chrome with iframe mobile dimensions, not physical iOS.
