# Sandbox Post Visual Validation

## Desktop public profile

Using a disposable development-only Visual Artist profile, the current Sandbox Post rendered **immediately beneath the About/bio card** in the main two-column profile area. The card used the requested playful identity, displayed “One post at a time,” kept the content readable, showed Share and Report controls for visitors, and explained that the next post permanently deletes the current one. Existing calendar, portfolio, reviews, header, and profile actions remained below or beside it without overlap.

## Desktop share panel

The custom Share Sandbox Post dialog opened from the post card and displayed a concise branded preview, the talent name, Facebook, X, LinkedIn, WhatsApp, Email, Text, Copy Link, and native device More controls. The dialog clearly explains that the stable clean link will show the talent’s newest post after replacement and that a replaced or deleted version will no longer appear. The layout stayed within the viewport with a visible close control and no accidental social posting during validation.

## Validation data boundary

The preview profile and post are disposable development records identified in `/tmp/ologywood-sandbox-post-preview.json`. They do not modify any existing creator profile and must be removed after desktop/mobile and owner-composer validation.

## Disposable owner authentication

The standard header login dialog accepted the isolated preview artist’s email/password credentials. No real creator credentials were used. The submit moved into a blank redirect/loading state, so the next validation step is to reopen the disposable profile and confirm that the authenticated owner controls are present before interacting with the composer.

After reopening the disposable profile, the authenticated owner state was confirmed: **Share**, **Replace**, and **Delete current post** controls appeared in the Sandbox Post card, while the visitor-only Report control was absent. The replacement action did not execute immediately; it attempted to open the composer. The existing first-login Visual Artist onboarding tour appeared above the page and must be dismissed before the underlying composer can be inspected. No post was replaced or deleted during this visual check.

After dismissing the onboarding tour, the site’s existing Terms-consent and cookie notices still occupied the lower viewport and intercepted the lower card interaction. The Sandbox Post card itself remained correctly placed and readable. Those consent notices must be accepted for the disposable account before opening the composer; no profile or post data was changed by the blocked click.

The September 1 Terms version and essential-cookie notice were then accepted for the disposable account. With the fixed notices removed, the full Sandbox Post card—including its wide image, readable caption, timestamp, permanent-replacement explanation, and owner Delete control—remained inside the profile column without clipping or overlap. The existing calendar followed below with normal spacing.

## Owner replacement composer

The unobstructed **Replace** action opened a centered composer with the current 100-character post prefilled, a live `100/600` counter, optional media control, and concise limits for images and 30-second video. The amber warning states that publishing permanently deletes the current Sandbox Post from OlogyWood’s active database and that it cannot be restored. Selecting **Review replacement** opened a second confirmation with explicit **Keep current post** and **Delete old post and publish** choices, and explained that the replacement uses the same share link. Validation stopped at the safe Keep/cancel boundary; no browser-driven replacement was submitted.

The confirmation was closed with **Keep current post**, then the composer was closed with **Cancel**. The original disposable post, image, timestamp, and owner controls remained unchanged, confirming the non-destructive escape path.

## Mobile profile and clean share page

Full-page screenshots at **390 × 844** confirmed that the talent header, About card, Sandbox Post card, image, Share/Replace/Delete controls, permanent-replacement note, calendar, portfolio, reviews, and footer stack cleanly without horizontal overflow. The post remains directly beneath the bio and above the calendar.

The clean `/artist/{slug}/sandbox` page also renders well on mobile: Back to profile and Share controls remain accessible, the current post and media fit the viewport, the talent identity is clear, and the one-at-a-time replacement explanation remains readable before the footer. No production profile or post was used for either screenshot.
