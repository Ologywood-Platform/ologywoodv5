# Release sections and responsive page layout

## What each feature does

| Feature | Public purpose | Purchase result |
|---|---|---|
| Music, in the profile sidebar on wide screens | Uploaded songs with a capped preview | Purchased audio download and a playable entry in My Ology |
| Content Releases, farther down the profile | Content on YouTube, Spotify, Vimeo or another creator-chosen host | Free, paid or membership-based hosted access; not an audio download |
| Project Previews | Promotional showcase of upcoming projects and track snippets | Not an OlogyWood checkout listing |

These are separate existing systems, not duplicate copies of the same release. No releases were moved, merged or deleted. Existing purchases, playback and access rights remain unchanged.

## Defects corrected

- Settings had the global header embedded inside its notification-preferences child component instead of at the page root. The root shell now renders one header across loading, signed-out and loaded states.
- Earnings embedded a global header in each nonzero income-chart legend segment. The header is now at the page root; tables scroll locally rather than expanding the document.
- Project Previews had duplicate page headings and competing sticky headers. It now retains the global header, back action, breadcrumb and manager heading.
- Profile quick actions were forced into six columns based on viewport width even though their actual content column was much narrower. Actions now fit available width and wrap labels instead of overlapping.
- Long artist bios, release titles, genres, reviewer names and comments now wrap within their cards. Profile sidebar columns begin on wider screens to avoid narrow tablet cards.
- The desktop header switches to its existing compact menu below 1,440 px. The header uses a wider, bounded container; very small phones retain the logo without forcing the full wordmark into the utility row.
- Phone email-preference action rows, payment-setup buttons and footer newsletter controls now fit their containers.
- Music and Content Release descriptions, Project Preview guidance and a Help answer explain the distinction above.

## Validation

- **82 focused tests passed.**
- **3,031 complete-suite tests passed, 23 skipped, zero failed.**
- TypeScript passed.
- Production build passed (Vite build: 17.29 seconds).
- Diff whitespace, exact merge-marker and changed-file credential-pattern checks passed.
- Fully intercepted browser fixtures exercised Settings, Earnings, Project Previews and an artist profile at **320, 390, 768, 1,024, 1,280, 1,440 and 1,920 px**. Each fitted the viewport with one root global header and no overlapping quick-action buttons, including deliberately long unbroken text.
- Compact-menu open/close and one-search-dialog Ctrl+K behavior passed. A cookie notice can independently have a dialog role; it is not counted as a duplicate search dialog.
- Responsive screenshots were visually reviewed. All API operations in these browser checks were intercepted; **zero mutation requests were made**.

## Scope and publication boundary

No backend payment calculations, fees, subscription limits, Project Preview snippet policies, database schema or creator/user/purchase records were changed. Thirty-second release-preview delivery from the prior checkpoint is retained.

The fixes are validated in development and ready to publish. Production closeout remains pending until publication and a live page check. Authenticated Settings and Earnings interactions should be verified without saving preferences, disconnecting Stripe or making a purchase.
