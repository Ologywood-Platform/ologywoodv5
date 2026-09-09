# Role-Aware Account Menu

## Purpose

The account menu now provides fast access to the existing specialized Artist Dashboard without turning it into a seventh primary destination. The six canonical destinations remain **Discover, Experiences, Shop, Community, My Ology, and Workspace**.

## Creator-owner order

For a standalone creator owner, the Account section uses the requested order:

| Position | Item | Destination |
|---:|---|---|
| 1 | My Profile | Clean public artist URL, or profile editing when no profile exists |
| 2 | Artist Dashboard | `/dashboard` |
| 3 | My Ology | `/my-ology` |
| 4 | Workspace | `/workspace` |
| 5 | Account Settings | `/settings` |
| 6 | Sign Out | Existing secure logout action |

Administrator access, Terms review, and app installation remain available as separate role or utility actions above the Account section, so they do not interrupt the requested account sequence.

## Team-member behavior

The header calls the protected `team.getMyWorkspaceContext` procedure. An invited manager or team member receives **My Profile** for the owner artist’s clean public profile and one **Team Workspace** link to `/workspace`. The collaborator never receives an Artist Dashboard link or a duplicate generic Workspace link.

The invitation success screen now also sends accepted collaborators directly to **Team Workspace** instead of the obsolete `/artist-dashboard` route.

## Other roles

Venue, fan, ordinary-user, blogger, and administrator accounts do not receive the creator-only Artist Dashboard item unless they are the standalone creator owner. Existing Admin Dashboard access remains preserved as a separate role action. Desktop and mobile both render the same shared account-menu contract; mobile keeps 44-pixel touch targets and its scrollable menu container.

## Validation

A one-use read-only validator loaded the real creator owner and confirmed the exact five-link account sequence before Sign Out. It also evaluated any available collaborator membership without changing users, profiles, invitations, or team records, then was removed. Permanent tests cover creator order, clean slugs, Team Workspace fallback, creator-only visibility, invitation routing, and preservation of the six core destinations.

TypeScript passed with zero errors. The focused role, header, mobile, and ecosystem set passed **171 tests across eight files**. The complete platform suite passed **2,784 tests**, with **23 skipped**, across **160 test files**. The production build completed successfully in **19.65 seconds**.

## Production confirmation

Checkpoint `9a94e722` was published. The authenticated creator owner confirmed that the live account menu displays and works in the requested order. Production logs recorded successful `team.getMyWorkspaceContext` and `artist.getMyProfile` requests for user 7, followed by authenticated Artist Dashboard requests, with no account-menu routing or authorization error.
