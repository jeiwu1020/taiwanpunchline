# V7 Su and Chen likeness refresh

The user found the previous Su Tseng-chang and Chen Shui-bian heads insufficiently recognizable. Only those two head assets were regenerated. All seven cast move definitions, body/limb/prop modules and combat/animation logic are unchanged, apart from cache version references. Existing heads remain in source history and as unreferenced versioned assets.

## Inspected official references
- Su: Executive Yuan historical premiers archive, https://history.ey.gov.tw/director/?director=34 . Official image: https://history.ey.gov.tw/wp-content/uploads/2023/03/su_tseng_chang-1.jpeg (600×876).
- Chen: Presidential Office former president page, https://www.president.gov.tw/Page/87 . Its portrait is credited to 國史館. Official image: https://www.president.gov.tw/img/Index/a8637e79-0206-4be4-b0af-b21557d56b22.jpg (623×737).

Actual downloaded photo pixels were inspected before generation, rather than relying only on search titles. Photos are references, not distributed game assets. Public availability is not a general reuse license; no claim of public/commercial rights clearance is made.

## Regeneration brief and result
Built-in image generation used the appropriate official portrait as identity reference and the existing Ma ink portrait as style-only reference. Each prompt specified a complete head on alpha transparency, no neck/clothing/background/text, restrained caricature, warm peach skin, black contour and fine crosshatching, a slight right-facing turn, and a1254×1254 square sprite. Identity was prioritized over exaggerated generic features.

Su: high bald forehead with narrow dark side-hair strips, fine rimless glasses, moderate brows, narrow cheerful eyes, strong cheekbones and deep smile folds, broad upper-teeth smile and tapering lower face. Avoid overlarge round dome, villainous eyebrows or omission of glasses.

Chen: presidential-era low-volume smooth sideways-parted black hair, thin gold rounded-square spectacles, narrow nearly level eyes, longer oval face, relatively flat cheeks, tapered jaw, broad straight nose, thin closed mouth and restrained smile. Avoid tall swept-back quiff and inflated grinning cheeks.

New files: assets/su-head-v7.webp and assets/chen-head-v7.webp. Both1254×1254, lossless exact WebP converted from generated PNG with full RGBA byte equality. No script repainted/cropped/recolored the generated assets. Existing geometry and head pivots are unchanged. New heads are closer to frontal than the original exaggerated three-quarter heads; whole-character mirror and a single principal expression remain first-version limitations. Likeness is subjective and is not guaranteed by automated tests.
