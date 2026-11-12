
## MERCH AVAILABILITY STATUS — 2026-11-12

- [x] Added an explicit persisted `isPreOrder` field to merch items; existing rows default to Available now through additive migration `drizzle/0125_outgoing_synch.sql`.
- [x] Added creator-side editing for Available now vs Pre-order, including state persistence for existing shop items.
- [x] Added buyer-facing status badges on Creator Shop cards and product detail pages, changed the detail CTA to “Pre-order now” when applicable, and repeated the status in checkout.
- [x] Preserved payment, inventory, fulfillment, guest checkout, eBook, and order behavior; preorder is informational and does not bypass stock or checkout validation.
- [x] Applied the additive migration to the active development database. Focused merch/schema/commerce/security/UI regressions passed 35/35, TypeScript passed, production build passed, and desktop/mobile preview smoke checks loaded without overflow. No orders, prices, inventory quantities, payments, or existing product records were changed.
