

## Live Stripe purchase/refund verification — 2026-11-09

The live purchase gate was completed with the published Ologywood site using Adonis’s “ADONIS — SILENT NIGHT | A Romantic Christmas Experience.” Two separate $2.00 payments were confirmed in the Ologywood live Stripe account: one for `ologywood5@gmail.com` and one for `garychisolm30@gmail.com`. The fan purchase page showed the paid release with five downloads remaining, the purchase-confirmation email was received, and the artist Earnings page showed both transactions as completed at $2.00 gross and $1.98 net.

With owner approval, the exact `ologywood5@gmail.com` payment was matched in Stripe and fully refunded for “Requested by customer.” Stripe now shows that payment as **Refunded**; the separate artist-account payment remains **Succeeded** and was not touched. Refunds can take 5–10 days to appear on the customer’s statement. One controlled production refund establishes the live refund path; a second refund is optional.

Cross-domain payment history means confirming that the same authenticated purchase/refund state is consistent across the custom domain (`www.ologywood.com`) and the managed deployment domain (`ologywood-mp6flm6c.manus.space`), rather than only checking two user accounts. That cross-domain check remains open because the controlled purchase was performed on the custom domain and no second-domain authenticated history comparison was executed.
