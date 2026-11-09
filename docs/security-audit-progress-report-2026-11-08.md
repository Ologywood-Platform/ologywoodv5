

### Admin test-email body contract

The mounted admin-only test-email route now rejects array bodies and unknown JSON fields before email validation or delivery; only a scalar `email` field is accepted. Existing admin authorization, IP/email rate limits, length/format validation, retry headers, and redacted failure responses remain intact. Focused email/preference/route-input regressions pass 8/8, TypeScript passes, and production build passes with existing chunk-size warnings. No test emails, provider calls, or records changed during validation.
