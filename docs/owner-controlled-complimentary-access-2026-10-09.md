# Owner-controlled complimentary access

**Date:** October 9, 2026  
**Status:** Implemented and validated; production publication and live verification pending.

## Where to find it

**Admin Dashboard → Users → Plan access → Manage complimentary access**.

The Plan access column and management controls appear only for the **verified platform owner**. Other admins cannot use these APIs even if they attempt to bypass the hidden controls. The owner's row shows **Enterprise — Owner** and cannot be modified through grants.

## Grant access

1. Locate the recipient by name or email in Admin Users.
2. Select **Manage complimentary access** for that account.
3. Review the current grant, raw billing status and audit history.
4. Select **Starter**, **Professional**, or **Enterprise**.
5. Optionally enter an expiry in your local time. Leave it blank for no scheduled expiry. No-expiry grants can still be revoked. The timestamp must be in the future and within the supported range through January 1, 2038.
6. Enter a reason of 3–500 characters.
7. Acknowledge that complimentary access does not cancel Stripe billing or waive transaction fees.
8. Select **Review grant**, review the account, plan, expiry and reason, then **Confirm grant**.

The recipient sees the actual granted plan, **$0/month subscription fee**, and expiry in subscription settings. No public code or redemption step is required: access is tied directly to the selected existing account.

## Replace or revoke

- To change the tier or duration, prepare new grant details and select **Review replacement → Confirm replace**.
- To end an active grant, select **Revoke current access**, enter a revocation reason, then **Confirm revoke**.
- The previous actions remain in append-only audit history. The dialog shows the newest 50 events; older events remain stored.
- Changes in another window trigger a revision conflict. The draft is retained and the latest account state must be reviewed again before confirmation. The tool never silently reapplies a stale decision.

## Billing and feature boundaries

Complimentary access waives only the **platform subscription charge for the granted tier**. It does not waive marketplace revenue shares, per-ticket fees, Stripe processing, purchased music/content, merchandise, Fan Club charges, or other transaction costs.

The normal features and limits of the selected tier remain in place. Grants do not make users admins, alter their creator role, reveal private data, bypass collaborator ownership, or unlock Athlete-only NIL workflows for non-Athletes.

This tool does not cancel, reactivate, refund, or create a Stripe subscription. Active, trialing, past-due, paused, period-end or unverified cancelled Stripe billing blocks new grants until billing is resolved separately. A locally marked cancellation can represent cancellation scheduled at period end, so it is not automatically treated as proof that billing has stopped.

At expiration or revocation, the next protected feature request resolves the account's underlying eligible subscription or Free tier. No scheduler, email reminder, or automatic paid subscription is created. Browser displays may require a refresh; server feature gates check the current state on requests. If a real paid Stripe subscription subsequently exists, it is not falsely presented as complimentary.

## Architecture and security

- Grants and append-only audit events are stored separately from `user_subscriptions` and Stripe billing.
- Additive migration **0114_rich_wendigo.sql** creates only the two approved grant/history tables. A narrowly scoped, idempotent runtime guard handles database parity.
- Grant/revoke state and audit append commit in one database transaction. A failed audit write rolls the change back.
- Account locking and expected revisions protect concurrent changes. The review step freezes its revision rather than approving unseen new state.
- Inputs validate account, paid tier, reason, acknowledgement and expiry. Errors preserve drafts and do not expose raw SQL.
- Recipient APIs expose plan/expiry metadata, not the private owner reason or audit record. Owner inspect omits Stripe/customer secret identifiers.
- The owner's protected non-expiring Enterprise entitlement remains separate and has precedence over recipient grants.

## Verification completed

- **2,960 full-suite tests passed**, **23 skipped**, no failures.
- TypeScript passed; production build passed in **17.86 seconds**. Existing bundle-size warnings remain.
- Behavioral grant/expiry/revocation, rollback, owner authorization, billing conflicts, schema retries and privacy tests passed.
- Isolated desktop (**1280 px**) and mobile (**390 px**) browser tests passed grant retry, retained draft, stale-review recovery, revocation history, Cancel and non-owner-hidden controls. Every API request was intercepted; no real grant or payment was issued.
- Visual inspection found a global Terms notice could obscure the new dialog footer. A scoped overlay/content layer override corrected it; desktop and mobile screenshots then showed unobstructed actions. Default dialog behavior remains unchanged.
- Read-only real-account verification returned owner capability true, ordinary-user capability false, ordinary-user inspect denied, owner Enterprise true, and unchanged raw owner billing.
- Runtime grant and audit tables each contained **zero rows** after testing. No real user, role, creator, subscription, payment or purchase record was changed.
- Help and deterministic AI guidance explain the exact management path, expiry/revocation, no codes and unchanged fees.
- Diff hygiene, exact merge markers, scoped credential review and temporary-validator cleanup are checked before checkpointing.

## Prior owner publication

The owner confirmed publication of checkpoint **6e47c485**. Production Artist Dashboard and Pricing bundles contain complimentary owner/zero-fee UI; an unauthenticated subscription request returned HTTP 401. Owner Enterprise was rechecked through read-only local router integration, with unchanged raw billing. The browser was signed out, so this is not a claim of independent authenticated production UI verification.

## Remaining step

Publish the new complimentary-grant checkpoint. Then verify the authenticated owner sees the management action in live Admin Users, can open an existing account's details and close/review without issuing a grant, and that ordinary admins remain denied. Issue a real grant only for an account you actually intend to authorize.
