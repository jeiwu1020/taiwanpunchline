# V46: 揪團 and growing supporters

Rollback: Sites #23 / ed6924e4751826647531ce95b7d8777ffee6f960. Tag backup-before-rally-v46. Full source backup brawl-pre-rally-v46-source.tar in task workspace.

Scope: preserve single desk and combat charge/damage/AI rules. Remove old HUD support bars and HUD crowd button, retain HP and guard. Put 揪團 immediately left of attack, same button dimensions (desktop66x44, touch54x54), bottom-up gold meter fill. Reserve two-button width and shrink flexible special area; upright phone keeps specials in their own upper row. L remains the keyboard shortcut.

Both sides independently render ceil(charge*6/100) supporters, maximum six. Accepted rally holds six through its existing1.9s performance even after meter spend. Generated two transparent fictional adult supporter cutouts, alternating mirrored poses, light idle sway and stronger cheering after the existing .95s warning. No combat rule or cost change. Cohorts stay inside camera edges, behind fighters, confined to the lower stage. Ground ripple communicates the existing single floor hit. Reduced motion removes sway.

Assets: built-in image generation, not an external paid API. supporter-woman-v46.png (1312x1199 RGBA) and supporter-man-v46.png (1269x1240 RGBA); alpha ranges0–255. Original generated files retained. Prompts: fictional Taiwanese middle-aged woman with short dark hair, glasses, cream shirt and orange scarf, raised arms; fictional stout middle-aged man with blue jacket, clapping. Warm hand-inked satirical editorial caricatures, dark teal contour, watercolor/crosshatching, transparent, no real person, no text/logos. Final assets are copied into dist/assets.

Verification: full test suite, new crowd independence/count/activation retention, button order and HUD removal, upward CSS fill, edge-camera visibility tests. Browser checked actual60% earned charge, growing supporters, opponent rally warning, landscape844x390 and upright390x700, with unchanged health bars. Browser-sized QA, not physical phones. No throwing-item art or AI wording changes included.
