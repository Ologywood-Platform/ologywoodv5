

### Residual router boundary pass

A residual mutation scan found eight no-input mutations. Review confirmed they are all authenticated context-only actions: removing a user avatar, email preference opt-out/resubscribe/delete, marking all notifications read, clearing a rider default, deleting the owner’s current Sandbox Post, and sending venue verification email. No missing user-controlled input schema was found. Two adjacent safety issues were corrected: venue verification tokens now use 32 random bytes encoded as base64url rather than `Uint8Array.toString()`, and the venue verification plus email-resubscription failure logs now record only error type rather than raw exceptions. Focused email-preference, venue, notification, rider-template, and Sandbox Post regressions pass 16/16; TypeScript and production build pass with existing chunk-size warnings. No emails, profiles, posts, preferences, or records changed during validation.
