
## EXPECTED PREORDER FULFILLMENT DATE — 2026-11-12

- [x] Added optional `expectedFulfillmentDate` (`YYYY-MM-DD`) to merch items with strict calendar-date validation.
- [x] Added a creator editor control shown only for physical preorders, with explanatory copy that the date is an estimate and does not automatically change order status or send notifications.
- [x] Displayed the date on public Creator Shop cards, product detail pages, and the checkout dialog before payment.
- [x] Ensured the value is only persisted for native physical preorders and is cleared when an item becomes Available now, external-only, or an eBook.
- [x] Generated and reviewed additive migration `drizzle/0126_reflective_changeling.sql`, then applied it to the active development database. Existing rows remain unchanged and null.
- [x] Merch schema, shop, commerce, and security regressions passed 23/23; TypeScript passed; production build passed; preview health and LSP checks are clean. No orders, prices, inventory, payments, or fulfillment statuses were changed.
