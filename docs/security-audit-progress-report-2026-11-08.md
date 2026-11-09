

### Calendar-feed token query contract

Artist and venue iCalendar feed routes now validate their `token` query value through the shared bounded scalar query helper before format and HMAC checks; repeated query parameters and non-string values no longer pass through a TypeScript cast. Existing positive route-ID validation, timing-safe token comparison, escaped iCalendar text, and safe errors remain intact. Focused calendar/Express/schedule regressions pass 16/16, TypeScript passes, and production build passes with existing chunk-size warnings. No calendar feeds, bookings, tokens, or records changed during validation.
