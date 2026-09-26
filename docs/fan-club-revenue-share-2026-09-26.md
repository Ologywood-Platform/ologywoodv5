# Fan Club Revenue Share Update — September 26, 2026

## Authorized change

OlogyWood's Fan Club revenue share is now **90% to Talent and 10% to OlogyWood**. The OlogyWood portion is a technology marketplace platform fee, not athlete-agent or representative compensation.

## Unchanged charges

- Booking payments: **1%** OlogyWood platform fee
- Digital Music Releases: **1%** OlogyWood platform fee
- Native Creator Shop purchases, including merchandise and books: **1%** OlogyWood platform fee
- Event tickets: **$0.99 per ticket**
- Ology Live virtual sessions: **15%** technology marketplace service fee
- External tip links: **0%** OlogyWood platform fee
- Stripe processing charges: separate and governed by Stripe's current terms

## Implementation

A shared source contract now defines the Fan Club 10% platform fee, 90% Talent share, and cent rounding. New Stripe Checkout subscriptions pass the shared 10% value as `subscription_data.application_fee_percent` and store the same percentage in Checkout metadata. Creator-facing earnings estimates use the same shared calculation.

Stripe's official Connect subscription documentation states that `application_fee_percent` is calculated from the final subscription invoice amount and is deducted before Stripe fees. For the current destination-charge setup, Stripe charges OlogyWood's platform balance for processing fees. Public copy therefore states that a $10 monthly Fan Club payment produces a $1 OlogyWood application fee and a $9 transfer to Talent, while Stripe processing is handled separately under Stripe's current terms.

## Existing subscriptions and transaction boundary

A read-only production-database audit found **no Fan Club membership records**, including no active memberships with Stripe subscription IDs, at the time of implementation. No existing subscription required migration or external Stripe modification. Completed transactions are not recalculated retroactively.

## Terms and user notice

The Terms are versioned as `2026-09-26-fan-club-90-10`, with a September 26, 2026 update and effective date. The in-app Terms banner explains the fee reduction and requires acceptance of the new version. The Terms expressly preserve all other published OlogyWood rates and separate Stripe processing charges.

## Validation targets

- Shared 90/10 calculation and rounding
- Stripe Checkout application-fee percentage and metadata
- Creator dashboard, homepage, How It Works, Help, Terms, and AI guidance
- Continued 15% Ology Live rate and other unchanged fees
- Absence of stale Fan Club 85/15 or 15% copy
- TypeScript, focused tests, full suite, production build, and repository hygiene
