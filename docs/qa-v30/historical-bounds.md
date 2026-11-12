# Arena range audit

Read-only historical verification used local Git history in parliament-camera-touch-nov7:
- V18 1c356909df915b9b4a18c0851a848719aec3a07a
- V19 cd718e1c6be143b073c247b68b3acf8b2a8aea8b
- V29 f9c571908306e712a1ba1ef9b86b041979b00522, current private Site checkout.

Versions were identified from each committed dist/index.html. V18/V19/V29 all use fighter center limits68..892 (travel824), ground430, start260/700, walking245 and guard movement60, slow multiplier0.75, body separation88 with bypass at vertical difference220. moveFighter and separate match byte-for-byte, SHA256 fdeeeca63cae5e26603d095d402d87b3c1d0dee0f16f183d1a3e324e5417b914. V19 docs/v19/core-contract.md also records world width960 and the same limits. Runtime read-only checks reached both limits and separated overlapping fighters to68/156 and804/892.

V30 leaves core.mjs and all move/audio data unchanged. Low visual rail inner faces24/936 are derived from a44-unit body half-width; those are not new collision coordinates. The fixed rails are anchored at ground430. Idle shoe draw bounds are x−35..47 before facing flip and soles around432..433; the low rail remains outside the idle shoes at the clamp and avoids obscuring heads.

Do not generalize this as unchanged full combat since V18: item/protection/AI behavior changed in intervening versions. The verified claim is unchanged basic arena limits, movement and body-separation geometry. Historical commits were verified locally, not independently against a remote.
