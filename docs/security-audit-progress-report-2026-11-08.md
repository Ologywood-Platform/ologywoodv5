

### Direct-video finalize token contract

Performance and portfolio finalize routes now require a bounded scalar body token through one shared `strictBodyUploadToken` helper before verifying the signed upload session; arrays, objects, empty values, and oversized tokens are rejected rather than coerced with `String`. Focused performance/portfolio chunked-upload and parity regressions pass 28/28, TypeScript passes, and production build passes with existing chunk-size warnings. No video uploads, storage objects, profiles, or records changed during validation.
