# Blog Management Owner-Access Repair

## Incident

On September 4, 2026, the live mobile Blog Management page showed `Blog post counts are temporarily unavailable` and denied access with the message that Blog Management is limited to the site owner, administrators, and approved bloggers. Production logs showed repeated `blog.adminList` `FORBIDDEN` errors for authenticated user 7 at 16:48:55 UTC.

## Root cause

The earlier Blog count repair correctly prevented false zero counts and centralized Blog access in `canManageBlog`, but that helper recognized the site owner only when the current `openId` exactly matched `OWNER_OPEN_ID`. The owner account is also a creator account, and its linked production identity can use a different `openId`. The Admin router already handled this condition with a verified-email fallback, so some Admin procedures authorized user 7 while Blog Management denied the same session.

## Permanent repair

Owner recognition now lives in one shared `isPlatformOwner` service. It checks the configured primary owner open ID, the established legacy owner identifier, and the established owner-email fallback with case-insensitive normalization. Both the Admin router and Blog Management call this same helper, preventing the two access policies from drifting again.

The Blog policy remains restricted to:

1. users whose role is `admin`;
2. users whose role is `blogger`;
3. the established platform owner identity.

Ordinary creators, venues, and fans remain denied. No Blog post, user, role, or production database record was modified during diagnosis or validation.

## Validation

A read-only real-router validation loaded the actual user 7 identity and successfully returned authoritative Blog status counts. It also proved administrator and approved-blogger access and confirmed that an ordinary creator receives `FORBIDDEN`. The permanent focused suite passed **99 tests across seven files**. The complete platform suite passed **2,753 tests**, with **23 skipped**, across **154 files**. TypeScript passed with zero errors, and the production build completed successfully in **19.44 seconds**.

The remaining step is publication followed by a live mobile Blog Management check.
