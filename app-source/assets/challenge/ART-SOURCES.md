# First chapter artwork

Generated with the built-in image generation tool for this project. No paid third-party generator was used. PNG masters are retained; matching WebP files are runtime exports with alpha preserved.

- mob-atlas-v1: Three fictional campaign street characters in engraved, hand-colored editorial-comic style. A seven-column paper-doll atlas supplies heads, vests, upper sleeves, forearms, thighs, lower legs and gripping props. Rows are a mustached microphone interrupter, a leaflet distributor with purple headband, and a stocky visor-wearing placard steward. These are fictional characters, not portraits of political figures. The two captains reuse these generated templates with larger proportions and their own combat behavior.
- mob-atlas-generated-v1: User-provided GPT-generated transparent atlas with three additional fictional campaign street characters and their individual held props: red flag, smartphone and orange light baton. Imported as a separate 1914×822 PNG atlas so the original mob artwork remains unchanged.
- street-v1: Taiwanese sunrise neighborhood panorama, tiled apartment and breakfast stall, produce market with striped awnings, campaign alley with blank banners and loudspeaker truck. Clear foreground roadway, no baked text or people.
- bedroom-v1: Modest Taiwanese sunrise bedroom, unmade wooden bed, striped blanket, alarm clock, green window grille, open green door and jacket on hook. No baked characters or text.
- pajamas-v1: Headless full-body cutout wearing loose pale-blue striped pajamas and slippers, with crosshatched shading and a clean neck opening. The selected existing player portrait is attached at runtime. This is a short opening-scene costume, not a combat skeleton.

All new characters use the existing fighterPose joint solver. Runtime crop boundaries and anchoring are documented in ../../challenge-art.mjs. Background floor convention: actor feet at y=430; the curb is slightly above that plane.
