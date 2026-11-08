# Sensitive data at rest audit — 2026-11-08

## Scope

This audit covers application-managed values that can grant provider access, prove a signature, or expose a private document. It reports aggregate counts only; no token, signature payload, name, email, IP address, or document value is printed.

## Classification and controls

| Field/class | Sensitivity | Current control | Legacy state |
|---|---|---|---|
| `google_calendar_integrations.accessToken` / `refreshToken` | Provider credentials | Versioned AES-256-GCM envelopes on every new OAuth callback and token refresh; decryption occurs only at the Google request boundary | Current database: 0 integration rows |
| `signatures.signatureData` | Drawn signature image or typed signature | Versioned AES-256-GCM envelopes on database writes; database adapter decrypts only for authorized contract workflows/PDF generation | Current database: 1 legacy plaintext row; remediation is dry-run by default and pending owner-approved apply |
| `venue_contract_signatures.signatureData` | Drawn signature image or typed signature | Same versioned AES-256-GCM boundary as ordinary contract signatures | Current database: 4 legacy plaintext rows; remediation is dry-run by default and pending owner-approved apply |
| Uploaded rider PDFs and other private rider documents | Private contractual/technical documents | Existing encrypted private storage and authorization-preserving access paths | Not changed by this audit |
| Stripe API keys, publishable keys, webhook signing secrets | Payment credentials | Environment/project secrets only; no application-table storage | Not changed by this audit |
| Names, emails, IP addresses, booking metadata | Operational PII/audit metadata, not provider credentials | Existing authenticated/role-scoped access and transport protections | Not encrypted by this increment; broad PII classification remains a separate review |

## Remediation utility

`scripts/reencrypt-sensitive-data.ts` performs a complete read-only inventory by default and prints only counts. It can re-encrypt legacy Google token and signature rows only when both `--apply` and `ALLOW_PRIVATE_DATA_REENCRYPTION=1` are supplied. It performs no deletes and does not print payload values. The current dry run found 0 Google Calendar rows, 1 legacy ordinary-signature row, and 4 legacy venue-signature rows.

The utility is intentionally not run in apply mode during this task. An owner/operator should first ensure the project has `PRIVATE_DATA_ENCRYPTION_KEY` (or the existing rider encryption key) configured, back up the database under the project’s normal process, review the aggregate dry-run counts, and then run the explicit apply command during a controlled maintenance window.

## Validation

- OAuth encryption tests: 5/5.
- Private signature encryption/remediation tests: 5/5.
- Rider/contract/security regression tests in the focused run: 45/45 additional tests passed.
- TypeScript check passed.
- Dry-run remediation completed without writes and exited cleanly.
