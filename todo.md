
## PREORDER SHOPPING EXPERIENCE — 2026-11-12

- [x] Confirmed native physical merch supports guest checkout without an account, quantity selection, variant/size selection, and shipping or pickup; eBooks still correctly require an account for secure access.
- [x] Added a required preorder acknowledgement: buyers must confirm the estimated fulfillment date may change before payment.
- [x] Added an optional buyer email preference for fulfillment-date changes, available to guests and signed-in buyers.
- [x] Stored the expected preorder date and buyer preferences on the order, displayed the date in buyer and creator order management, and added creator date updates through the existing guarded order-update flow.
- [x] Buyer status emails include the expected date and “estimate may change” language; date-only notifications are sent only when the buyer opted in, while normal status notifications remain unchanged.
- [x] Added additive migration `drizzle/0127_burly_stick.sql` and compatibility repair for legacy `merch_orders` tables. Focused merch/schema/commerce/security tests passed 36/36, TypeScript passed, production build passed, and `git diff --check` is clean. No orders, payments, prices, inventory, or customer records were changed.
