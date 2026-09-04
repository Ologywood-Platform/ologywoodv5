# Voluntary AI-Use Disclosure for Songs and Releases

## Product decision

OlogyWood will provide an **optional creator-controlled disclosure**, not a platform determination. Talent can turn on **Disclose AI use on this release**, select the overall level, identify the creative components involved, and optionally name tools or add context. When enabled, public release surfaces show a compact sparkle tag that opens the creator-provided details.

The switch being off means **no disclosure was provided**. It must not be presented as “No AI,” because an omitted value is not proof that AI was absent. YouTube’s music delivery guidance similarly treats an omitted Gen AI value as unknown and distinguishes fully, partly, and non-Gen-AI designations.[1] OlogyWood will expose only affirmative disclosure states because participation is voluntary.

## Disclosure levels

| Value | Public label | Meaning |
|---|---|---|
| `ai_assisted` | **AI-assisted** | AI contributed to selected parts of a substantially creator-led work. |
| `primarily_ai_generated` | **Primarily AI-generated** | AI generated a substantial or primary portion of the disclosed components. |

This keeps the first version understandable while still distinguishing assistance from substantially generated work. YouTube’s examples distinguish a fully generated song from partial uses such as generated structural layers, lyric collaboration, melodies, or music-video visuals.[1]

## Component taxonomy

The same model will support direct song sales and externally hosted movies, podcasts, courses, albums, and other releases. Creators can select one or more of:

| Component | Examples |
|---|---|
| Writing, lyrics, or script | Lyrics, verses, scripts, outlines, or narration text |
| Composition or melody | Musical structure, melody, harmony, or composition |
| Voice or vocals | Generated, cloned, or materially transformed voice/vocals |
| Instruments, performance, or generated sound | Instrument layers, stems, sound effects, or synthetic performance |
| Production or arrangement | Arrangement choices, production layers, or structural production |
| Editing, mixing, or mastering | Material generative editing or audio post-production |
| Artwork or graphics | Cover art, illustrations, motion graphics, or promotional visuals |
| Video or animation | Generated or materially altered video and animation |
| Other | A creator-described use not covered above |

This extends Apple Music’s reported element-level approach—Artwork, Track, Composition, and Music Video—into a creator-friendly cross-media taxonomy.[2]

## Public presentation

The compact public tag will display **AI-assisted** or **Primarily AI-generated** beside existing genre, platform, and release-type metadata. Expanding it reveals the selected components, optional tools/providers, optional creator explanation, and the statement: **“Creator-provided disclosure. OlogyWood does not independently verify AI use, ownership, or rights.”**

The tag is contextual rather than punitive. YouTube states that its disclosure label alone does not change recommendation or monetization eligibility, and that label visibility should give viewers useful context at a glance.[3] OlogyWood will likewise keep purchases, pricing, access control, and ranking independent of voluntary disclosure.

## Data and compatibility rules

Both `artist_releases` and `releases` receive nullable disclosure detail fields plus a non-null disabled-by-default flag. Existing rows therefore remain unchanged and render no tag. Disabling disclosure clears its public details. Enabling disclosure requires a valid level and at least one component. Tools and explanations are optional, length-limited plain text.

Payment, purchase, download, access-control, publishing, rights-certification, and content-hosting fields remain untouched. The disclosure does not certify copyright, consent, licensing, originality, or eligibility on another platform.

## Implementation and validation

The additive `0111_furry_goblin_queen` migration adds the same five fields to `artist_releases` and `releases`: a default-false enablement flag, nullable level, nullable JSON component list, nullable tool/provider text, and nullable creator notes. The managed database was migrated successfully and then confirmed to contain all ten columns. Existing rows remain undisclosed by default; no purchase table or existing release record was changed.

Both creator workflows now use one shared disclosure control. The switch starts off for legacy and new records, enabled disclosures require one level and at least one component, repeated components are deduplicated, optional text is trimmed and length-limited, and disabling the switch clears all public details. Both release APIs retain their existing owner checks before normalization or persistence.

White Label music cards and externally hosted Content Release cards use one expandable public tag. The collapsed state shows only **AI-assisted** or **Primarily AI-generated**. Expanding it reveals the creator-selected components, optional tools/providers, optional explanation, and the non-verification statement. Mobile validation at 390 pixels confirmed a single-column control with contained labels and fields; desktop validation confirmed a balanced two-column control and public preview. The temporary visual-validation route was removed afterward.

The Help Center and OlogyWood AI now explain how to enable the feature and why an absent tag means unknown rather than AI-free. TypeScript passed, and the focused release, purchase, checkout, download, sales, public-profile, Help, and AI guidance suite passed **129 tests across nine files**.

## References

[1]: https://support.google.com/youtube/answer/17124251?hl=en "YouTube Help — Disclose Gen AI usage for music content"
[2]: https://www.musicbusinessworldwide.com/apple-music-launches-ai-transparency-tags-but-only-if-labels-and-distributors-choose-to-declare-them/ "Music Business Worldwide — Apple Music launches AI transparency tags"
[3]: https://blog.youtube/news-and-events/improving-ai-labels-viewers-creators/ "YouTube Blog — Improving AI labels for viewers and creators"
