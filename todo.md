
## MOBILE HOMEPAGE ASSETS AND PULL-TO-REFRESH — 2026-11-12
- [x] Replaced the three fragile category-card storage URLs with bundled local WebP assets for Music Artists, Athletes and Filmmakers; the existing Venues & Places illustration remains local SVG/CSS.
- [x] Added a guarded pull-down refresh gesture to the homepage: it activates only at the top of the page, ignores horizontal gestures, preserves normal vertical scrolling, refreshes artist and venue discovery data together, and shows accessible Pull / Release / Refreshing feedback.
- [x] Validation passed: 21 focused tests, TypeScript, and production build. Existing large-chunk warnings remain only.
- [ ] Owner publication remains pending.

## MOBILE HOMEPAGE TEXT SPACING — 2026-11-12
- [x] Fixed the responsive “From talent to opportunity.” heading by preserving an explicit space when the desktop line break is hidden on mobile.
- [x] Added a regression for the spacing contract; 3 focused tests, TypeScript, and production build passed. Existing large-chunk warnings remain only.
