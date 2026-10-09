# Admin Users: open public profiles from names

**Date:** October 9, 2026  
**Status:** Implemented and tested; publish the new checkpoint to activate the change on production.

## Behavior

In **Admin Dashboard → Users**, a user with an existing artist/creator or venue profile now has a clickable name. It opens their actual public profile in a **new tab**, preserving the administrator's list, search and filter context. Links use the public profile name rather than the account's legal/display name or user ID. For example, Dawud's account resolves to `/artist/dawud-anyabwile`.

When the public profile name differs from the account name, it is shown underneath the clickable account name. The external-link icon and accessible label explain that a new tab will open.

Accounts without a public profile show **No public profile created**, without a broken link. Non-owner artist-team collaborators show **Team member — no standalone profile**, and legacy profiles containing “team member” in their name are not linked as artists. Empty or invalid profile names/IDs show an unavailable state rather than emitting `/artist/`, ID zero or a fabricated URL.

Artist/creator profiles remain accessible from the Users row even when the account has the admin role, including the platform owner. Existing profiles are resolved from ownership records, not inferred solely from account role. Venue-role accounts with both legacy profile types prefer their venue profile.

## Implementation and boundaries

The existing admin-only user list adds three bounded metadata queries for the current page: artist profiles, venue profiles and non-owner team memberships. Only profile ID/name and membership user IDs are read; no per-user N+1 calls are introduced.

The user-list response now explicitly projects list display fields rather than returning password hashes or email-verification tokens. Existing admin/owner authorization remains in effect. No new user privileges, access grants, public-profile publishing behavior, NIL data exposure or impersonation flow was added.

No user, artist, venue, billing, subscription, complimentary grant or purchase records were modified. No database migration was needed. Pagination behavior was left unchanged because this request concerns name navigation, not pagination.

## Validation

- **17 new behavioral tests** cover real-profile IDs/names, artist/venue routes, owner/admin profile access, missing/invalid profiles, team suppression, batched queries, admin-only API access, secret-field exclusion, and rendered link semantics.
- **36 focused tests passed** including existing admin and complimentary UI regressions.
- Complete platform suite: **2,987 passed**, **23 skipped**, **0 failures**.
- TypeScript, production build and `git diff --check` passed.
- Isolated browser checks at **1280px and 390px** verified name-click popup navigation, retention of the Admin tab, venue links and clear team/missing-profile labels. Every API request was mocked and no mutation occurred.
- Read-only real-router validation returned 50 Users rows, with 26 available profile links and two collaborator states on that page; Dawud resolved correctly, and authentication secrets were excluded. This was local real-router validation, not an authenticated production UI test.

## Publication check

Publish the checkpoint, then in live **Admin → Users** click a creator's name and a venue's name. Confirm each opens the correct public profile in a new tab. Accounts that have not created a public profile and team-only accounts should show explanatory text instead of a broken name link.
