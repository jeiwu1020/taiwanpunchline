# Fifth chapter staff style correction

Built-in image_gen edit; transparent alpha preserved byte-for-byte. No CLI/API fallback.

Output: `dist/preview/chapter5/assets/chapter5/miniboss-atlas-v2.png`
SHA-256: `8d1fc11d9d90fb0084ead8a96ed6cc85ae4eed9acd9d5c108bd2c8fb8562e307`
1536×1024 RGBA. Original v1 remains in the repository. Measured head crops updated; original limb rig, clothing/prop placement and all mechanics retained.

Inputs, in order:
1. `dist/preview/chapter5/assets/chapter5/miniboss-atlas-v1.png` (edit target)
2. `dist/preview/chapter4/assets/chapter4/chapter4-miniboss-atlas-v1.png` (style reference)

Exact prompt:

> Use case: style-transfer. Game sprite atlas correction. Image 1 is the EDIT TARGET: the fifth chapter atlas, six isolated pieces in a 3-column 2-row grid. Image 2 is STYLE REFERENCE ONLY for mature satirical caricature faces, natural small eyes, detailed black pen crosshatching and hand-colored printed texture. Change ONLY the two heads in the LEFT column of Image 1 to match Image 2's existing game style. Top head: fictional adult Taiwanese male equipment clerk, messy dark hair, round brass glasses, green visor with small paper airplane pin, delighted but slightly exasperated, long caricature nose, adult cheek wrinkles, expressive grin, facing three-quarters right. Bottom head: fictional elderly Taiwanese male sound-check clerk, gray hair, round glasses and gray mustache, green cap with airplane pin, laughing eyes, broad nose, strongly wrinkled face, three-quarters right. They must look like adult editorial caricatures from Image 2, NOT anime, cute children's characters or Pixar. Keep exact six-piece atlas arrangement and canvas aspect 1536x1024. Preserve uniforms, handheld clipboard and radio, sizes and locations of all existing pieces, no letters. Head bounding boxes must stay within their original left-column cells with clear transparent margins, neck ends cleanly. TRUE TRANSPARENT ALPHA background, no backdrop, no shadows between sprites, no colored wash; only six separate cutout pieces. Strong black engraved outlines, muted sage green, ochre and cream paper tone inside each object.
