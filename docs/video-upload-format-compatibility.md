# Video Portfolio format compatibility

## Product contract

OlogyWood accepts **MP4, MOV, WebM, AVI, and MKV** source files for Video Portfolio. Every source remains subject to the existing **100 MB** and **two-minute** limits and the ten-active-video profile capacity. MP4 and WebM files that browsers can decode retain the fast native path. Browser-compatible MOV files retain immutable MP4 relabeling. AVI, MKV, and MOV files that the browser cannot decode use the authenticated chunk path and are inspected and converted on the server.

The public catalog stores only browser-playable output. Converted files become H.264 video with optional AAC audio in a fast-start MP4 container. The server generates a JPEG thumbnail from the converted result. No AVI, MKV, unreadable source, partial conversion, or temporary chunk key is added to the public catalog.

## Security and resource boundaries

Upload sessions remain HMAC-signed, expire after 15 minutes, and are bound to one authenticated user and artist profile. Each request carries no more than 4 MiB of media. The server verifies declared and actual chunk sizes, source signatures, catalog capacity, assembled size, and single-use finalization before inserting one active row.

Conversion runs as a child process without a shell, removes metadata/subtitles/data streams, uses bounded output, and must finish inside the request lifetime. Only one conversion runs per application instance at a time to protect the 512 MiB runtime. Input and output paths are randomized beneath a dedicated temporary directory and are removed in a `finally` block. Missing FFmpeg, malformed containers, absent video streams, unsupported codecs, files over 100 MB, and videos over two minutes return distinct user-facing errors.

## Error language

| Failure | Message intent |
|---|---|
| Unsupported extension | Name the accepted formats: MP4, MOV, WebM, AVI, and MKV. |
| File over 100 MB | Show the selected size and the 100 MB maximum before upload. |
| Browser cannot read AVI/MKV | Do not show a browser-codec error; upload for protected server conversion. |
| Duration over two minutes | State the detected duration and two-minute maximum. |
| Invalid or deceptive container | Explain that the file does not match its selected format. |
| Unsupported codec/conversion failure | Recommend H.264/AAC MP4 as the most compatible alternative. |
| Conversion unavailable/busy | Ask the creator to retry shortly or upload MP4/WebM without implying the post was saved. |

The existing URL-video, native upload, thumbnail, progress, reset, playback, and social-preview behavior remains unchanged.

## Validation results

Representative AVI and MKV sources were processed by the real bounded FFmpeg service. AVI converted from 1,388,794 bytes to a 721,495-byte MP4 with a 39,786-byte JPEG thumbnail and a 3.033-second duration. MKV converted from 763,356 bytes to a 776,526-byte MP4 with a 44,912-byte JPEG thumbnail and a 3.041-second duration. Both outputs are H.264, yuv420p, and AAC in an ISO MP4 container. The converter also returned the expected specific errors for a 2:01 AVI, a malformed AVI signature, and a valid audio-only AVI with no readable video stream. Temporary conversion-directory cleanup passed after every case.

The real authenticated OlogyWood start/chunk/finalize routes were then exercised with four disposable sources: AVI, MKV, the user-supplied 38,930,135-byte MOV relabeled as MP4, and native WebM. All four created active temporary catalog rows, served valid range responses, rejected finalize replay, and used JPEG thumbnails. AVI and MKV published only converted `.mp4` URLs; the MOV remained `.mp4`; WebM remained `.webm`. Exact cleanup removed the disposable account, profile, and all four database rows without changing any creator profile.

Converted outputs now retain the canonical range-capable URL returned by the storage service. Replay detection recognizes both these absolute URLs and older relative storage paths. Production runtime support is declared in the root Dockerfile using Node 22 slim with FFmpeg and FFprobe; the sandbox does not expose a Docker daemon, so the container contract is protected by source-level tests while the native TypeScript build and installed FFmpeg runtime were validated directly.

Final validation passed TypeScript, **49 focused Video Portfolio upload/security tests**, the complete **2,747-test platform suite** with 23 skipped, and the production build. Temporary conversion samples, scripts, logs, and database rows were removed before checkpointing.
