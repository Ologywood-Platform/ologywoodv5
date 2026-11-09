

### Legacy public event-search query contract

The active legacy event-search route now validates search/query, event type, location, and date filters as bounded scalar strings through the shared `singleQueryString` helper; repeated query parameters and objects are not cast into database inputs. Existing route-parameter validation and event mutation ownership checks remain intact. Focused event-route regressions pass 22/22, TypeScript passes, and production build passes with existing chunk-size warnings. No event searches, event rows, or records changed during validation.
