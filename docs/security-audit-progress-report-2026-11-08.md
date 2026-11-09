

### Active-route success-log privacy

Successful OG metadata logs no longer include profile/venue/blog/project IDs, names, slugs, titles, or artist names. Booking checkout logs no longer include artist IDs, booking IDs, or transaction amounts, and Calendar synchronization logs omit artist IDs while retaining aggregate counts. Focused OG/booking/calendar/error-safety regressions pass 14/14, TypeScript passes, and production build passes with existing chunk-size warnings. No metadata requests, Checkout sessions, payments, calendar rows, or records changed during validation.
