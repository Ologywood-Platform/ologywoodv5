

### OAuth callback query contract

Google, Spotify, and Google Calendar callback routes now accept only bounded scalar query strings for `code`, `state`, and provider `error` values; arrays, objects, empty strings, and oversized values are rejected before state verification or provider exchange. Signed state, fixed provider-error redirects, callback binding, and encrypted token storage remain intact. OAuth/route-input regressions pass 20/20, TypeScript passes, and production build passes with existing chunk-size warnings. No OAuth exchanges, tokens, calendar rows, emails, or records changed during validation.
