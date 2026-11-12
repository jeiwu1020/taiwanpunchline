# In-game portrait character selection

Approved scope: replace the two native role selectors with seven in-game portrait cards, a visible selected state, and in-game difficulty buttons. All selection UI must rotate with the game. Retain the existing seven portraits, names, moves, mirror matches, game rules, keyboard and touch combat, and V23 camera comparison.

Choose a role by clicking its matchup card, then select a portrait. Keep both choices visible. Difficulty has two buttons. Use a seven-wide roster on larger logical layouts and a four-plus-three grid on short/narrow layouts; every interactive target is at least 44px. Hide combat HUD and controls during selection to avoid wasting phone height. Preserve role, fighter and difficulty choices across layout changes, pause/reselect and replay.

Approaches considered: native selects cannot reliably rotate their OS popup; previous/next arrows would rotate but require repeated searching. The approved portrait-card approach keeps all seven visible and matches the game style. Use existing HTML buttons inside the rotated app, not a new Canvas-based menu.

Publish only to the existing owner-private sideways comparison Site. Do not edit the original V22 Site. Physical iPhone/Safari verification is not available; report browser viewport checks accurately.
