# V7 portrait refresh QA

Scope: Su Tseng-chang and Chen Shui-bian head likeness only. Official Executive Yuan and Presidential Office/Academia Historica photographic references were inspected. The other five portraits, all costumes/limbs/props, all21 moves and seven-character controls remain unchanged.

302 Node tests pass. Eight new guards first produced two expected failures for missing V7 portrait wiring, then passed after integration. Guards compare all seven cast records after normalizing the two portrait paths, all non-target art paths and byte hashes of combat, game and authored motion modules after normalizing cache versions. Original25 V5 combat trace baselines and294 complete-match simulations remain passing. Test expectation edits only update the two new portrait paths and cache version.

The image conversion preserves complete RGBA byte equality. Both new heads retain the1254-square source dimensions expected by the current head renderer. Browser and independent likeness results are appended after review. Automated tests do not measure resemblance.

## Visual and phone checks
An independent reviewer compared actual old/new sprite pixels to the official photos and favored the new pair for reference fidelity. Su now includes fine rimless glasses, relaxed brows, tooth-showing smile and tapering jaw. Chen has gold rounded-square glasses, darker sideways-combed hair, calmer eyelids and restrained smile. Remaining caricature differences include Su's enlarged forehead/nose and Chen's fuller hair/large frames; this is not a guarantee of subjective recognizability.

CUA contact sheets in normal and mirrored facing show the new heads attached to their original bodies through basic actions and sampled special-move poses without a new neck gap or clipped scalp. Live Su desk-slam and Chen stepping animation inspectors were sampled. The unchanged head pivot and source dimensions preserve existing arm occlusion. All unchanged body motion remains covered by earlier QA and new byte-level guards, not a fresh claim of exhaustive frame review.

At320×568 portrait, both V7 selector portraits load correctly at1254 natural resolution; the Su-versus-Chen round starts and reaches its normal result screen. At667×375 landscape, swapped Chen-versus-Su selection and all controls fit. Body/document extents match the respective viewport in both cases. No physical-phone/Safari test was performed.

A short native-foreground Chromium smoke completed two full rounds (Su versus Chen, then Ko versus Chen) with2,191 rendered frames. Observed range48.7–57.9 FPS; no application console error or crash. This is a short smoke, not a new long-session or physical-phone performance certification. QA tab closed and managed preview stopped after verification.
