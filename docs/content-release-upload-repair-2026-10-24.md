# Content Release media upload repair

**Status:** implemented and validated locally; checkpoint publication and an owner-driven production upload remain required. Existing creator content, purchases, publication state and fees were not modified during validation.

## What caused the error

The reported `Unexpected token 'S', "Service Unavailable" is not valid JSON` is a secondary parsing failure: a non-JSON HTTP service error reached a client that expected JSON. The cited New Release form’s MP4 file control is the optional **30-second Preview** uploader, not an upload of the full externally hosted content. Its old path was `FileReader.readAsDataURL` → `contentRelease.uploadPreview` → `server/services/releasePreviewMedia.ts` → storage, all inside one tRPC upload request. Cover art and Music Release uploads had related base64/JSON paths.

Confirmed architectural problems were base64 expansion, multiple in-memory copies, and synchronous preview encoding/storage on the upload request. The old route allowed a 20 MiB source, which expands to approximately 26.7 MiB before JSON overhead. The supplied unauthenticated transfer measurements were slow, but authentication stopped them before the encoder; they cannot establish an authenticated media failure.

The exact cause of the original production **503**—gateway timeout, process crash, memory pressure, or provider outage—could not be determined because the relevant production/system logs were not available through the exposed project controls. It is not honest to label a specific OOM or gateway limit as proven. Development logs were available but did not cover the owner’s original production request.

The original pipeline processed both eligible MP4s locally. Its measured combined peak process RSS was 447,360 KiB and 388,196 KiB for those runs. Decoder concurrency and base64 buffering were therefore relevant risks, not proof of the historical failure.

## Changes

### Bounded binary transport

The active Content Release preview/cover and Music Release audio/cover controls now use `/api/media-uploads`:

1. Small start metadata, limited to 16 KiB before the global JSON parser.
2. Authenticated raw `application/octet-stream` chunks, each at most **1 MiB**.
3. SHA-256 receipts and exact-size checks; duplicate chunks are idempotent, changed retries conflict.
4. Fast completion queues the durable upload job.
5. Separate processing request and fast status polling report actual upload/preparing/done/error state.

Source files and chunks live in storage, not database BLOBs. Owner-bound request IDs, private storage nonces, durable receipts and job state let known-session retries resume without creating duplicate release records or jobs. Processing does not create or publish a release; existing explicit Save/Create Draft/Publish behavior remains.

### Processing and resource controls

The existing FFmpeg preview encoder is retained. It now accepts a trusted assembled local file instead of decoding the entire base64 upload, and bounds decoder/filter threads. Output remains a normalized sample capped at 30 seconds, with actual byte/format/duration validation. Silent H.264 video is supported.

Processing uses same-connection transactional job leases and a **database-backed global worker slot**, so only one media processor runs across instances; a per-process guard also applies. Lost/expired leases can be recovered, stale results cannot overwrite a newer job lease, stored chunk hashes are reverified, and processing attempts are bounded. Uploads are limited to three active sessions per owner and thirty starts per hour. Principal locks precede job locks, authorization is repeated before mutations, and existing creator/plan/release ownership rules apply without a team-member or admin-only bypass.

**Execution boundary:** this managed deployment does not expose a dedicated unattended worker/queue service. The worker is invoked by a separate bounded request while status polls remain responsive; it has a 100-second processing budget and a 240-second lease. Upload transfer and ordinary status requests do not perform encoding. This is not a promise that work continues offline after every browser/server shutdown, nor a claim that a standalone background daemon was deployed. Durable jobs can be resumed; a guaranteed unattended worker would require a supported production queue/worker environment.

### Errors, privacy and UX

The client checks HTTP status/content type and safely handles plain text, HTML, malformed JSON and JSON gateway failures. Transient 502/503/504 retries are bounded; ordinary 500/413 failures are not blindly retried. Own parser-size errors return sanitized JSON HTTP 413, and underlying provider bodies are not exposed.

Preview and cover controls show transfer/preparing state, retain the prior uploaded value and unsaved draft after failure, and update only from validated done results. Existing Music Release upload actions use the same binary helper and safe response handling. Preview/cover callback generations and abort handling prevent late results from attaching to a different draft. Help and deterministic AI guidance explain limits, progress and retry behavior.

Temporary source chunks have opaque storage nonces, and the public storage proxy blocks their namespace before presigning or cache lookup, including encoded/traversal variants. Server-side source reads validate trusted HTTPS storage paths and reject redirects. Preview playback authorization and capped public samples remain unchanged. Stripe raw-body middleware is still registered first; no signing, fee, payment or subscription code changed.

## Limits and the five supplied files

The existing preview limits remain **20 MiB input**, **five-minute input duration**, and **30-second output**. Content/Music artwork remains **10 MiB**; Music audio remains **50 MiB**. The server chunk limit is a per-request transport bound, not a new one-megabyte file limit.

| Supplied filename | Original bytes | Preview eligibility | Final real encoder result |
|---|---:|---|---|
| `mm_video.mp4` | 19,939,200 | Within limit | H.264 1280×720, 19.041667 s, 2,056,725 output bytes; 13.428 s encoding |
| `mm_video(1).mp4` | 32,347,653 | Over limit | Rejected before encoding; browser shows 20 MB message before API calls |
| `mm_video(2).mp4` | 37,495,876 | Over limit | Rejected before encoding; browser shows 20 MB message before API calls |
| `mm_video(3).mp4` | 23,389,122 | Over limit | Rejected before encoding; browser shows 20 MB message before API calls |
| `mm_video(4).mp4` | 16,059,824 | Within limit | H.264 1280×720, 16.041667 s, 1,599,340 output bytes; 10.644 s encoding |

Original files were preserved. Final file-based encoder Node peak RSS was 109,956 KiB in the record-free five-file test; this is Node RSS only, not a claim about total production/container peak memory. The two output files were verified with ffprobe and contain the expected silent video stream.

## Validation

- **105 focused tests:** all passed across 11 files.
- **Full platform:** 3,686 passed, zero failed, 23 existing skipped; 3,709 total across 247 files.
- **TypeScript:** passed under Node.js 22.23.4.
- **Production build:** passed, 17.75 seconds.
- **Real media:** all five files inspected; two encoded successfully, three correctly rejected for size. No storage or business database writes in this real-encoder check.
- **Storage:** one 40-byte synthetic private chunk returned a direct trusted HTTPS storage URL, HTTP 200 and matching SHA-256 bytes. It was never attached to a profile, release or database row. This is a storage-adapter check, not a real profile upload; the unreferenced object remains subject to the storage provider's retention.
- **Browser:** fully intercepted 390 px and 1440 px workflows tested all five inputs, 503 recovery, a non-retried 500, preserved drafts/prior preview, processing-state polling, exactly two synthetic jobs, no page errors/overflow and no real API mutations. Mobile controls were visually inspected. Synthetic preview URLs are not a real playback-delivery check.
- **API/security:** anonymous start/status returned JSON 401; temporary private source paths returned JSON 404/no-store. Route/backend tests cover metadata/chunk bounds, ownership, quotas, SHA mismatch, duplicate retry, lease contention/recovery, strict result validation and safe gateway errors.
- **Schema:** additive `0120_shiny_sleepwalker.sql` reviewed; three new metadata tables installed idempotently through managed SQL and the narrow runtime guard. Actual runtime required columns, private nonce and unique job/chunk/global-slot keys were verified. No historical migrations or business-row backfills ran.
- **Hygiene:** diff checks and changed-file credential/conflict/artifact scan passed. No real profile/release/purchase/payment/permission rows, uploads to an existing profile, checkout, email or external share were changed during validation.

## Publication and remaining checks

Publish the validated checkpoint, then confirm the live bundle uses binary uploads, small metadata and progress controls. Non-mutating checks should confirm JSON errors, privacy gates, unchanged public profile/Shop/preview pages and healthy runtime on both domains.

An authenticated production upload cannot be claimed from local encoding or mocked browser workflows. The owner should retry `mm_video.mp4` or `mm_video(4).mp4` in New Release → Preview, observe transfer then Preparing preview, and explicitly save only the intended release. The other three need compression/trimming below 20 MiB before that preview control accepts them. If production still returns a service error, capture its request time/status/request ID and hosting logs; do not bypass authentication, inflate global body limits, or fabricate success.
