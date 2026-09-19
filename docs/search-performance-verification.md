# Search Performance Verification

**Date:** September 17, 2026  
**Environment:** OlogyWood development preview

Slide 5 of the legacy Search API presentation claims that browser API calls decreased from three to one per search, response time decreased from 2.5 seconds to 700 milliseconds, and transferred data decreased from approximately 850 KB to approximately 170 KB.

The current unified search sends one browser tRPC request for each settled, debounced query. Three deliberately separate searches (`ado`, `atlanta`, and `sidequest`) generated exactly three requests total—one per query. The server resolves Talent, Venue, and Event candidates inside that one request using three bounded database queries executed concurrently.

Measured browser resource timings were 28 ms for `ado`, 24 ms for `atlanta`, and 20 ms for `sidequest`. Encoded response bodies were 303 bytes, 1,909 bytes, and 453 bytes respectively. Each test allowed 900 ms between queries, so each input was a distinct settled query rather than a rapid keystroke sequence.

The current implementation also applies a 300 ms client debounce, caches identical query results as fresh for 30 seconds, disables retry amplification, returns at most four results per entity group to this UI, selects only the fields needed for suggestions, and caps server candidates before relevance sorting.

The architecture therefore provides the intended request consolidation, bounded data transfer, and fast observed response behavior. However, the presentation's exact historical before/after percentages are not supported by preserved benchmark evidence. The current measurements substantially outperform its stated 700 ms and 170 KB targets, but the claimed 67%, 72%, and 80% reductions should be treated as illustrative rather than audited production metrics.
