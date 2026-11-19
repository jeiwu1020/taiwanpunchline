# Challenge artwork, version 2

These are new non-destructive assets generated with the built-in image generator.
No paid third-party image service or image API was used. Original PNG masters and
runtime WebP exports are retained together. All version 1 assets remain intact.

## Saved files

| Runtime key | Master and runtime export | Size | Alpha |
| --- | --- | --- | --- |
| challenge-street-deep | street-deep-v2.png / .webp | 1536 × 1024 | Opaque |
| challenge-arena | arena-v2.png / .webp | 1536 × 1024 | Opaque |
| challenge-street-props | street-props-v2.png / .webp | 2172 × 724 | Preserved |
| challenge-captains | captain-atlas-v2.png / .webp | 1536 × 1024 | Preserved |

The actual files were checked for readable pixels and valid dimensions. Both
cutout atlases contain transparent pixels and fully visible subject pixels.
Colored RGB data behind alpha-zero pixels in the captain PNG is not a background;
consumers must preserve alpha rather than discard it during export.

## Runtime contract

`drawChallengeBackdrop(ctx, images, options)` accepts width/height of the
destination, curbY, buildingHeight, camera, arena, top and bottom. buildingHeight
is the distance from the curb to the top of the image, **including sky**.
The street image curb is at source y=715; the arena curb is at y=670.
For an image about 700 world pixels tall, use street buildingHeight=489.
Multiply this and curb positioning by the caller's zoom when drawing screen space.
camera is a destination-pixel offset, so callers own their parallax factor.
top/bottom are destination bounds, defaulting to 0/height. Any gap beyond the
original image is painted with its illustrated sky or road pixels, never a flat
fill. Width must cover the caller's visible world or screen. The helper clips to
the supplied bounds and restores context state.

`drawChallengeStreetProp(ctx, images, 'table' | 'sign', {x,y,width,height})`
uses a bottom-center origin. Table default dimensions are 280 × 116; sign defaults
are 82 × 94. Explicit dimensions can match existing platform collision planes.
The table source crop is [101,130,1244,513], the sign [1547,103,473,539].
Text is deliberately absent from the raster art so the game can draw legible
Traditional Chinese at runtime.

`drawChallengeMob` selects captain-atlas-v2 for mini_mic and mini_guard. The
ordinary three mob kinds retain their original atlas. Captains reuse the existing
arm and leg rig but have their own generated head, vest and gripping prop.
mini_mic is a silver-haired woman wearing burgundy and holding a megaphone;
mini_guard is a dark-haired man with amber glasses, a navy vest, orange sash and
wood placard. Neither is a politician portrait.

## Root causes and fix

The ordinary mob heads ended at the chin, while their vest atlas had an open V at
the neck. The old head registration stopped above the open area. The renderer now
seats the head lower, bridges the opening with existing generated skin texture,
then redraws only the front collar edge. Captains already have generated necks.
Their pose solver and gameplay joint positions are unchanged.

The previous background helper enlarged one short panorama over the whole route,
making storefronts enormous. Other renderers then covered the generated asphalt
with flat geometry. The new helper maintains a fixed human-scale scene and repeats
it horizontally; callers should remove any old flat road overpaint.

## Prompt record

- Street: Style-reference street-v1. Taiwanese sunrise neighborhood, warm
  hand-inked satirical editorial comic and crosshatching; generous sky, low-rise
  tiled buildings, breakfast and produce stalls, broad empty asphalt foreground,
  side-on camera, ordinary doors and waist-height tables, no people, writing,
  political portraits or flags. Requested 1536 × 1024; curb requested at 65% and
  measured in the returned image at y=715.
- Props: Style-reference street-v1. One transparent two-object atlas, sturdy
  modest folding campaign table with empty wood top, metal legs, burgundy cloth
  and a blank cream front panel; separate teal-framed blank wooden A-frame sign.
  Frontal cutouts, etched crosshatching, worn hand-coloring, transparent padding,
  no words, hands, cast shadows or clipped feet.
- Captains: Style-reference mob-atlas-v1. Transparent regular two-row three-column
  atlas. Row one: fictional shouting older woman, large silver coiffure and gold
  earrings, neck stump; separate burgundy vest/cream collar; hand holding ivory
  megaphone. Row two: fictional grumbling man, slick side-part, large amber glasses
  and mustache, neck stump; separate navy vest with orange sash and gold chain;
  hand holding blank wood placard. Heads, torsos and props isolated; no real
  politicians, extra limbs, text or dividing lines.
- Arena: Style-reference street-v1. Distinct small Taiwanese community square,
  low tiled building and shutter, modest striped canopies, stacked stools, blank
  banners, warm sunrise sky, broad unobstructed asphalt. Side-on human-scale comic
  stage, no baked crowd, portraits, political flags, giant table or writing.

## Verification

The focused regression tests in tests/challenge-art-polish-v68.test.mjs first
failed on the old renderer, then passed with these changes. They cover collar
layering across six poses for five kinds, dedicated captain art, full background
coverage during vertical panning, arena selection, prop placement and files.
The standalone tests/qa-challenge-art-v68.html uses the actual game helpers for
visual review of idle, punch and crouch, plus street/arena prop composition.
It can be served from the repository tests directory or copied to a temporary
preview's dist root. It is not linked into or published as a game feature.
