

### Legacy release-upload body contract

The mounted legacy audio and cover-art upload routes now reject unknown JSON fields before decoding or storage writes; only `fileData`, `fileName`, and `mimeType` are accepted. Existing authentication, canonical base64, MIME allowlisting, filename safety, byte limits, and redacted storage errors remain intact. Focused release-upload/Express regressions pass 14/14, TypeScript passes, and production build passes with existing chunk-size warnings. No audio, cover art, storage objects, or records changed during validation.
