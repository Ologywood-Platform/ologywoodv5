
## STATIC IMAGE AUDIT — 2026-11-12
- [x] Audited frontend image references. The three homepage category images and the CRM badge were the active inline assets using fragile storage paths; homepage category images were already localized and the Browse CRM filter badge now uses the bundled badge asset.
- [x] Confirmed dynamic artist, venue, release, merch and portfolio media should remain storage-backed because they are user-uploaded or database-driven.
- [x] Confirmed the remaining storage reference is the social OG image, which is metadata-only rather than an in-page mobile asset; the old venue demo paths are in an unused mock detail component, not the active `/venues/:id` route.
- [x] Validation passed: CRM badge plus homepage tests (7 total), TypeScript, and production build. Existing large-chunk warnings remain only.
