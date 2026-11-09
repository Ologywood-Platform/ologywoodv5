

### Direct video-upload scalar fields

Performance and portfolio direct-upload readers now reject arrays/objects for titles, categories, formats, MIME types, durations, and byte sizes instead of coercing them with `String`/`Number`. Existing owner-bound signed sessions, chunk-size limits, file-format checks, conversion rules, and redacted route errors remain intact. Focused direct-video regressions pass 32/32, TypeScript passes, and production build passes with existing chunk-size warnings. No uploads, storage objects, profiles, or records changed during validation.
