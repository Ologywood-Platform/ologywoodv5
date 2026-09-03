# Admin Blog Management Count Repair

## Root cause

The production Blog database contains six published posts. The public `blog.list` procedure returned all six, and the authorized `blog.adminList` procedure returned all six in 13 ms. The misleading `0 total posts · 0 published · 0 drafts` header was rendered before the protected admin query completed, and the page had no explicit query-error state. In addition, published and draft figures were derived only from the current filtered/paginated response rather than an authoritative unfiltered status count.

## Repair

`blog.adminList` now returns filter-specific list pagination plus global `total`, `published`, `drafts`, and `archived` counts from the same Blog table. MySQL numeric strings and aggregate values are normalized to numbers. Blog access is centralized for administrator, approved blogger, and configured owner OpenID identities; unauthorized users receive a clear `FORBIDDEN` result rather than a generic server error.

Blog Management now displays `Loading blog post counts…` instead of false zeros while the query is pending and an actionable retry panel if the query fails. Empty Draft or Archived filters explain that the selected status has no posts while keeping the global six-post summary visible. Create, edit, publish/unpublish, archive, and delete success handlers invalidate every admin filter plus the public Blog cache.

## Validation

Authenticated owner validation displayed **6 total posts · 6 published · 0 drafts** and all six real Blog records. Selecting the empty Draft filter preserved the same global summary and displayed `No draft posts` rather than claiming the platform had no Blog.

A disposable real-router lifecycle began at 6/6/0/0, created a draft at 7/6/1/0, published it at 7/7/0/0, unpublished it at 7/6/1/0, archived it at 7/6/0/1, and deleted it back to 6/6/0/0. Public retrieval appeared only while published. Exact cleanup confirmed that the disposable record was removed and the six-post baseline remained unchanged.

Final validation passed TypeScript, **37 focused Blog management/cover/social-preview tests**, all **2,752 platform tests** with 23 skipped, and the production build. The three legacy blogger-role assertions were updated to exercise the centralized access helper directly rather than searching for role checks inside the router source.
