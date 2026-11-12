# V12 character display names

User-selected aliases, preserving IDs:
- wang: 恰吉王 (source person: 王世堅)
- han: 韓國魚 (source person: 韓國瑜)
- ma: 小馬哥 (source person: 馬英九)
- su: 電火球 (source person: 蘇貞昌)
- huang: 咆哮哥 (source person: 黃國昌)
- chen: 阿扁仔 (source person: 陳水扁)
- ko: 柯P (source person: 柯文哲)

The shared roster `name` now supplies selectors, matchup cards, portrait alt text, HUD, generic move captions, and art inspector. Static fallbacks and gameplay explanations were updated. The move guide is regenerated from the same roster and separately identifies the real source person. Original quotes, original audio filenames and source links retain factual attribution. Ma's missing original cough remains missing; no new audio was introduced.

Verification:
- 440 tests passed, including exact aliases/source identities, unchanged roster gameplay metadata against V11, unchanged normalized engine source, generated guide headings/attribution, static fallbacks, and all 49 menu pairings.
- Browser menu displayed all seven selected aliases; desktop Ko/Su selection, active HUD, result screen and re-selection retained 柯P/電火球.
- A local-only QA button entered the unchanged result screen for inspection. It was removed along with its generated fixtures before packaging.
- At 320×568, 咆哮哥/阿扁仔 cards and selectors fit without clipped names; the one-screen controls remained present.
- Art inspector displayed all seven aliases. Source guide displayed all seven aliases alongside separately labelled real people.
- Independent read-only naming audit found no nickname/source-attribution mix-up.

No changes to character IDs, 21 moves, damage, timing, hitboxes, animation assets or audio files. Core source differs only in its versioned roster import. No GitHub branch was modified. Existing owner-private Site and URL are preserved.
