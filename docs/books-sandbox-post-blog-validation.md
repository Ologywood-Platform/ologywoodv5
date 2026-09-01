# Books and Sandbox Post Blog Validation

## Public article

The development article route `/blog/books-and-sandbox-post-launch` resolves successfully as a published announcement dated September 1, 2026 and attributed to **OlogyWood Team**. The page renders the complete approved article, creator examples table, tags, social sharing controls, inline OlogyWood CTA, standard account CTA, global header, and footer.

## Campaign cover

The uploaded 16:9 cover is 2560 × 1440 pixels and visibly includes the supplied neon **OW OLOGYWOOD** logo, the exact headline **“BOOK. SELL. SHARE WHAT’S NOW.”**, the subheading **“Books + Sandbox Post on OlogyWood”**, a creator-author holding a book, a Sandbox Post card, booking confirmation, checkout, books, and a sharing cue. It uses the permanent web asset path `/manus-storage/ologywood-books-sandbox-post-launch_27b20296.png`.

No external social post or production deployment was performed during this validation.

## Blog listing and sharing

The public `/blog` listing returns the launch article as the newest card with its announcement category, September 1, 2026 date, approved excerpt, campaign cover, tags, and clean `Read more` link. The article route includes the complete body, creator examples table, inline OlogyWood CTA, standard account CTA, social sharing controls, header, and footer.

A Facebook crawler request receives `og:type=article`, the approved launch title and excerpt, the canonical production URL `https://www.ologywood.com/blog/books-and-sandbox-post-launch`, and the absolute cover URL `https://www.ologywood.com/manus-storage/ologywood-books-sandbox-post-launch_27b20296.png`. The Blog Open Graph lookup now also requires `status=published`, so draft posts cannot receive public article metadata.
