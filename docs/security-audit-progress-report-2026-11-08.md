

### Release-checkout body contract

The active release checkout endpoint now rejects missing/non-object/array bodies and unknown fields before any release lookup or Stripe work; only `releaseId` and `customAmountCents` are accepted. Existing strict positive-ID, bounded custom-price, trusted-origin, ownership, and provider-safe behavior remains unchanged. Focused release-checkout/Express regressions pass 12/12, TypeScript passes, and production build passes with existing chunk-size warnings. No Checkout sessions, payments, emails, or records changed during validation.
