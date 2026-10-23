# Node.js 22.23.4 production security update

OlogyWood's production image is now declared as the official `node:22.23.4-bookworm-slim` image pinned to manifest digest `sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d`. The existing FFmpeg, certificate installation, pnpm build, dependency installation, and server command remain unchanged. This is the existing root Dockerfile consumed by the managed deployment, not the alternate historical Dockerfile or Render configuration.

## Runtime enforcement and verification

`.nvmrc` declares `22.23.4` for local development. Production startup checks the actual `process.versions.node` value before creating the server and refuses any version other than `22.23.4`. The constant, `.nvmrc`, and Dockerfile must be updated together for a future security patch. This exact-version check follows the owner's requested target; it does not automatically accept newer versions.

The existing `/api/health` and `/health` responses retain `status` and `timestamp` and add `runtimeVerified`, computed from the actual process version. They set `Cache-Control: no-store, max-age=0`. The public response never includes the exact current version, credentials, paths, environment values, or user information. Exact `nodeVersion`, `requiredNodeVersion`, and `runtimeVerified` are available only through the existing administrator authorization boundary at `system.runtime`.

## Validation completed before publication

A separate official Linux Node.js 22.23.4 binary was downloaded over HTTPS and verified against the official SHA-256 checksum. No unrelated sandbox Node processes or login credentials were replaced. Both the native Sharp image operation and bcrypt password hash/compare completed under the patched binary with synthetic data.

The exact final full suite passed **3,617 tests**, with **23 existing skipped tests** and **zero failures**, under Node.js 22.23.4. TypeScript and the full production build passed. Runtime regressions test exact production version enforcement, non-production behavior, minimal health output, non-caching, administrator-only exact-version access, image digest consistency, and registration in the actual application router. The existing FFmpeg production regression now requires the patched image rather than the old floating image. Scoped credential, conflict-marker, and diff hygiene checks passed.

A compiled production-mode local server returned HTTP 200 with `runtimeVerified: true` and no-cache health headers. An anonymous request to the exact-version API returned HTTP 403. Starting the same production bundle with Node.js 22.13.0 failed before serving. The temporary production-mode server was stopped after the checks; no user, profile, booking, contract, appointment, release, payment, or permission record was edited.

## Publication status and live checks

**The code is validated and ready for publication. Live production Node.js 22.23.4 is not yet asserted.** This session exposes checkpoint creation but no direct production Publish action. The owner has authorized the deployment; the remaining operational step is to click Publish for this checkpoint in the project interface.

Before publication, the normal production browser returned HTTP 200 from `/api/health` with only the old `status` and `timestamp` response. `system.runtime` was absent with HTTP 404. After publication, verify fresh `/api/health` responses on the production domains show `runtimeVerified: true`; verify anonymous exact-version access returns HTTP 403. With an authorized administrator session, the protected query can additionally show the actual version as `22.23.4`. Also verify the public homepage, a talent profile, and Shop load without performing checkout, upload, signup, or other real record mutations.

No production container build or live-runtime result is claimed by local validation. Existing development service processes were not globally restarted by installing the isolated validation binary. A successful production check confirms the newly deployed application process, not all historical environments or a forensic clean bill of health.

## Stripe and incident boundary

The owner reports seeing no suspicious Stripe activity during the last seven days. This is useful but does not prove credentials were never exposed. No Stripe API keys, webhook secrets, payment settings, or account records were changed in this task. API-key rotation remains a separate coordinated action. Keep the working webhook URL and its mode-specific signature verification intact. Preserve production evidence before any incident cleanup; this runtime update is not a host-forensics investigation.

## References

[1]: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases "Official October 2026 Node.js security advisory"
[2]: https://nodejs.org/en/blog/release/v22.23.4 "Official Node.js 22.23.4 security release"
[3]: https://support.stripe.com/questions/protecting-against-compromised-api-keys "Stripe guidance for potentially compromised API keys"

Node.js 22.23.4 is an official security release addressing the October 2026 advisory, including CVE-2026-111497. [1] [2] Stripe recommends coordinated credential rotation when exposure is suspected, with secure replacement and integration verification. [3]
