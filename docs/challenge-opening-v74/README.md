# Generated opening comic, v74

The opening uses seven character-specific raster storyboards made with the built-in image generation tool. No paid image API, external generation service, or SVG/code-drawn character substitutes were used. The original game portraits, costumes, bedroom, and street were visual references. The new figures are cohesive generated illustrations rather than heads pasted onto cut-up bodies.

Each character has six scenes: sleeping with the microphone news on television; pushing up from bed; sitting upright and pressing the alarm; changing into the original outfit and taking breakfast; stepping through the doorway; chasing the escaping microphone. The four existing story beats, text, next, skip, replay, reduced-motion behavior and save ownership are unchanged.

## Files and provenance

- Exact prompts and reference lists: `*-generation.json` in this folder.
- Generated PNG masters and runtime WebP encodings: `dist/assets/challenge/opening-v74/`.
- Runtime encodings use WebP quality 91, method 6. Encoding changes storage format only; it does not crop, retouch, or assemble the artwork.
- Measured panel rectangles and original dimensions: `dist/challenge-opening-assets.mjs`.
- Wang's generated sheet has unequal measured row heights. The other six sheets use a square canvas with two columns and three equal rows. The renderer follows the actual saved images, not the requested dimensions.
- Two pixels at panel boundaries exclude the generated divider only. All complete panels are fitted without aspect distortion or cover-cropping.

## Presentation

The main generated pose changes during waking from asleep to half-risen to seated alarm reach. Short dissolves and a restrained retreating camera keep all source content inside the frame. This is an animated motion comic, not interpolated skeletal or frame-by-frame animation. Reduced motion selects the completed pose and freezes camera movement.

Wide compositions use a large main panel with smaller supporting scenes. Narrow compositions retain a large complete main panel; wide source panels have 68%-width supporting scenes below. The original tall Wang panels use one large panel on narrow displays and a multi-panel strip on wide displays. Missing or unknown character sheets never silently substitute a different character's face.

## Verification

- `tests/challenge-opening-generated-v74.test.mjs`: pose progression, reduced motion, seven identity/load mappings, full source bounds, and portrait/landscape containment.
- Existing opening tests cover next/replay/skip, one completion, reopening, OS reduced motion, and unchanged save slots.
- `scripts/render-opening-v74.mjs`: imports the real production renderer and assets with an existing native Canvas dependency; validates dimensions and creates portrait/landscape renders in `docs/qa-v74/`.
- These native Canvas images are not phone screenshots or evidence of browser/phone GPU performance.

No save migration, unlocking change, new story requirement, or change to the original #48 backup is included.
