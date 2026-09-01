# Sandbox Post Architecture

## Product contract

**Sandbox Post** is a playful, creator-controlled profile update for every talent type stored in `artist_profiles`. A public talent profile may have **one current Sandbox Post**. Publishing a new post replaces the prior post instead of creating a feed or archive.

The component appears directly beneath the profile biography in the main profile column. If the talent has no biography, the component remains in the same first-content position so owners can still create a post and visitors see the current post when one exists.

## Permanent replacement semantics

Replacement is implemented as an atomic database transaction: the existing `sandbox_posts` row is deleted and a new row is inserted. The old database row is not updated, versioned, archived, or exposed through a history endpoint. Manual deletion also removes the row permanently.

The interface must say: **“Publishing replaces and permanently deletes your current Sandbox Post from OlogyWood’s active database. It cannot be restored.”** The previous media storage key and every product reference to it are dropped at replacement or deletion, making that media unreachable through OlogyWood. Infrastructure logs, security records, or provider backups may persist only as described by platform policy and legal obligations; the product must not promise deletion from every backup instantaneously.

## Content and media

Each post contains 1–600 characters of plain text and may include one optional image or short video. Version one supports JPEG, PNG, and WebP images up to 8 MB, plus MP4, QuickTime, and WebM video up to 25 MB and 30 seconds. Video may include an optional generated JPEG thumbnail for social previews. Files are stored through the existing private server-side storage helper; the database stores only the active object key and public delivery URL.

No comments, downvotes, follower counts, reaction counts, popularity ranking, or public history are part of version one. The feature is expression and marketing, not a social-scoring system.

## Ownership and public visibility

Only the authenticated `artist_profiles.userId` owner may create, replace, or delete the post. A team member, venue, fan, or unrelated artist cannot publish to another profile. Public retrieval requires an active row joined to a real talent profile whose owning account is an artist or administrator and is not represented as a non-owner team member. Empty, hidden, missing, or non-talent records return no post.

Public responses contain text, public media URL/type, thumbnail URL, timestamps, artist identity, and canonical path. They never return storage keys, original filenames, raw MIME metadata, file sizes, owner email, or internal moderation fields.

## Sharing and social previews

Each current post has a canonical clean URL: `/artist/{artist-slug}/sandbox`. Copy, native device sharing, Facebook, X, LinkedIn, WhatsApp, email, and text use this URL. Social crawlers receive active-only Open Graph and X metadata. An image post uses the post image, a video post uses its thumbnail when available, and text-only/video-without-thumbnail posts use the talent profile photo before falling back to the OlogyWood social image.

When a post is replaced, the same clean URL resolves to the new current post. Deleted or hidden posts do not receive post-specific metadata and route visitors back to the talent profile with a clear unavailable state.

## Moderation and safety

Text is trimmed, length-limited, stored as plain text, and rendered without HTML. Media MIME type, extension, declared size, decoded size, duration, and ownership are validated server-side. The post includes the platform’s existing report pathway and Community Guidelines link. A `status` field permits administrative hiding without fabricating public deletion history.

## Data model

`sandbox_posts` uses one row per `artistProfileId` and one row per `artistUserId`, enforced with unique indexes. The row stores the current content and media only. There is intentionally no revisions table, history table, comment table, reaction table, or feed table.
