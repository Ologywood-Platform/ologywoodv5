# Admin Activity Mobile Scroll Repair

## Reported behavior

On a mobile Admin Dashboard, the Activity table extended beyond the viewport but its wrapper used `overflow-hidden`. The Timestamp and Admin columns were visible, while Action, Category, Target, and Details could not be reached.

## Repair

The Activity table now sits inside a dedicated horizontal scroll region. The table keeps a stable 960-pixel minimum width, while its container remains bounded to the viewport and supports horizontal and vertical touch gestures, iOS momentum scrolling, keyboard focus, and accessible region labeling. A mobile-only helper note tells administrators to swipe horizontally. The existing filters, rows, pagination, data queries, and administrator authorization were not changed.

## Validation

The Activity view was rendered at 390 × 844 pixels and showed the mobile swipe guidance with the table contained inside the page. It was also rendered at 1280 × 720 pixels, where Timestamp, Admin, Action, Category, Target, and Details remained visible in the existing desktop layout. The focused Admin/mobile suite passed **141 tests across six files**. The complete platform suite passed **2,754 tests**, with **23 skipped**, across **154 files**. TypeScript passed, and the production build completed successfully in **18.98 seconds**.

## Production verification

Checkpoint `72af8315` was published on September 4, 2026. The platform owner verified on a real mobile device that the live Admin Activity table now scrolls horizontally. Production logs recorded successful `admin.getActivityStats` and `admin.getActivityLog` calls for authenticated user 7 at 17:44 UTC and 17:45 UTC, with no Activity query error.
