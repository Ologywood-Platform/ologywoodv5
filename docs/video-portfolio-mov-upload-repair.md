# Video Portfolio MOV Upload Repair

## Supplied file

`minivid-498201-j0I3.mov` is 38,930,135 bytes (37.1 MiB), 15 seconds long, and 1080 × 1920 at 30 fps. The QuickTime/MOV container contains browser-compatible H.264 Constrained Baseline video in `yuv420p` plus AAC-LC audio. Its size is below the 100 MB portfolio limit and its duration is below the two-minute limit.

## Root cause isolation

The production logs contain no `/api/video/portfolio` upload entry for the failed attempt, which means the browser failed before sending the multipart request. The current client must read metadata and draw a thumbnail before it calls the upload endpoint.

Chromium downloaded the supplied bytes rather than decoding them when they were served as `video/quicktime`, matching the file type assigned to `.mov` uploads. The identical unmodified bytes loaded and displayed immediately when served as `video/mp4`. This isolates the failure to Chromium’s handling of the QuickTime MIME label, not the file size, duration, H.264/AAC codecs, storage service, ownership checks, or catalog limits.

The repair should relabel browser-compatible `.mov` input as an MP4 `File` for local metadata, thumbnail capture, multipart upload, and eventual playback. The bytes are not transcoded or altered. MOV files whose codecs are genuinely unsupported must still fail before upload with a clear H.264/AAC MP4 export recommendation.

## Production transport findings

A disposable authenticated upload of the supplied 38,930,135-byte video to `https://www.ologywood.com/api/video/portfolio` was rejected by the deployment edge with **HTTP 413 Request Entity Too Large** before the Express route ran. Exact cleanup confirmed zero disposable users, profiles, or video rows remained. This proves the advertised 100 MB application limit cannot be delivered through one production multipart request.

The Forge storage service exposes an authenticated `v1/storage/presign/put` capability and accepts server-side PUTs, but the S3 target’s browser preflight from `https://www.ologywood.com` returned **HTTP 403**. Browser-direct presigned PUTs therefore cannot be used safely in the current storage configuration. The compatible design is an authenticated, HMAC-bound upload session using small same-origin chunks, temporary private storage keys, server-side reassembly and signature/size validation, and a single final catalog insert.

## Final validation

The exact supplied 38,930,135-byte MOV completed the repaired path as ten 4 MiB video chunks plus one JPEG thumbnail chunk. The authenticated start request returned 200, server assembly/finalization returned 200 in 5,595 ms, and a replayed finalization returned 409 without creating a duplicate. The final object was stored as `video/mp4`; a signed range request returned HTTP 206 with the original ISO `ftyp` signature, while the thumbnail returned HTTP 206 with a JPEG signature. The temporary catalog row was active with a 15-second duration before cleanup. Exact cleanup confirmed zero disposable users, profiles, or video rows.

A separate 4 MiB `application/octet-stream` probe cleared the existing production edge without a 413 response, confirming the chosen chunk size is below the deployment request-body boundary. The permanent HTTP suite additionally covers unauthenticated starts, HMAC tampering, wrong chunk lengths, cross-owner reuse, ten-item catalog capacity, assembly, final storage, single insertion, and replay rejection.
