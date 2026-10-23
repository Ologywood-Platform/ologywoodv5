# Node.js 22.23.4 production security update

OlogyWood's production image is now declared as the official `node:22.23.4-bookworm-slim` image pinned to manifest digest `sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d`. The existing FFmpeg, certificate installation, pnpm build, dependency installation, and server command remain unchanged. This is the existing root Dockerfile consumed by the managed deployment, not the alternate historical Dockerfile or Render configuration.

## Runtime enforcement and verification

`.nvmrc` declares `22.23.4` for local development. Production startup checks the actual `process.versions.node` value before creating the server and refuses any version other than `22.23.4`. The constant, `.nvmrc`, and Dockerfile must be updated together for a future security patch. This exact-version check follows the owner's requested target; it does not automatically accept newer versions.

The existing `/api/health` and `/health` responses retain `status` and `timestamp` and add `runtimeVerified`, computed from the actual process version. They set `Cache-Control: no-store, max-age=0`. The public response never includes the exact current version, credentials, paths, environment values, or user information. Exact `nodeVersion`, `requiredNodeVersion`, and `runtimeVerified` are available only through the existing administrator authorization boundary at `system.runtime`.

## Validation completed before publication

A separate official Linux Node.js 22.23.4 binary was downloaded over HTTPS and verified against the official SHA-256 checksum. No unrelated sandbox Node processes or login credentials were replaced. Both the native Sharp image operation and bcrypt password hash/compare completed under the patched binary with synthetic data.

The exact final full suite passed **3,617 tests**, with **23 existing skipped tests** and **zero failures**, under Node.js 22.23.4. TypeScript and the full production build passed. Runtime regressions test exact production version enforcement, non-production behavior, minimal health output, non-caching, administrator-only exact-version access, image digest consistency, and registration in the actual application router. The existing FFmpeg production regression now requires the patched image rather than the old floating image. Scoped credential, conflict-marker, and diff hygiene checks passed.

A compiled production-mode local server returned HTTP 200 with `runtimeVerified: true` and no-cache health headers. An anonymous request to the exact-version API returned HTTP 403. Starting the same production bundle with Node.js 22.13.0 failed before serving. The temporary production-mode server was stopped after the checks; no user, profile, booking, contract, appointment, release, payment, or permission record was edited.

## Verified production deployment

**Checkpoint `635e737c` was published by the owner and verified live on October 23, 2026. Production is running the required Node.js 22.23.4 runtime.** The public verification value is computed from the actual process version and is true only when it exactly equals `22.23.4`; it is not a configured version string.

Before publication, `/api/health` had only the old `status` and `timestamp` fields and `system.runtime` was absent with HTTP 404. After publication, fresh normal-browser requests on `www.ologywood.com` returned HTTP 200, `runtimeVerified: true`, and `Cache-Control: no-store, max-age=0` at 15:43:12 and 15:43:13 UTC. The managed `ologywood-mp6flm6c.manus.space` domain returned the same verified result at 15:44:41 UTC. Anonymous `system.runtime` requests returned HTTP 403 on both domains. No administrator login or private version response was needed for this exact-version verification.

The public homepage, Adonis profile, and Shop rendered after deployment. The profile's music finished loading with no displayed music error, its Creator Shop was visible, and it had one shared header. No checkout, upload, signup, playback, purchase, external share, or record mutation was performed. The closeout changes only this documentation and the tracker; deployed application code remains the fully tested checkpoint.

Live verification is separate from the local tests and confirms the newly deployed application process, not all historical environments or a forensic clean bill of health. Existing development service processes were not globally restarted by installing the isolated validation binary. This deployment task is complete; no further publication is required for the documentation-only closeout.

## Stripe and incident boundary

The owner reports seeing no suspicious Stripe activity during the last seven days. This is useful but does not prove credentials were never exposed. No Stripe API keys, webhook secrets, payment settings, or account records were changed in this task. API-key rotation remains a separate coordinated action. Keep the working webhook URL and its mode-specific signature verification intact. Preserve production evidence before any incident cleanup; this runtime update is not a host-forensics investigation.

## References

[1]: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases "Official October 2026 Node.js security advisory"
[2]: https://nodejs.org/en/blog/release/v22.23.4 "Official Node.js 22.23.4 security release"
[3]: https://support.stripe.com/questions/protecting-against-compromised-api-keys "Stripe guidance for potentially compromised API keys"

Node.js 22.23.4 is an official security release addressing the October 2026 advisory, including CVE-2026-111497. [1] [2] Stripe recommends coordinated credential rotation when exposure is suspected, with secure replacement and integration verification. [3]
