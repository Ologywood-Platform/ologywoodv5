# OlogyWood AI Header Relocation

## Design decision

The OlogyWood AI launcher is moving from a floating lower-right bubble into the global header utility layer. A sparkle icon distinguishes AI guidance from the separate Inbox message icon, reduces visual obstruction over page cards and controls, and keeps assistance beside Search, Create, notifications, theme, and account utilities.

## Desktop interaction validation

The development homepage rendered the new header trigger for logged-out visitors with the accessible label `Open OlogyWood AI chat`. Selecting it opened the existing conversation panel beneath the header, changed the trigger label to `Close OlogyWood AI chat`, focused the question input, and preserved the greeting and suggested questions. Pressing Escape closed the panel and restored the open label. The previous floating lower-right launcher was absent.

## Mobile visual validation

At a 390 × 844 viewport, the OlogyWood brand, sparkle AI trigger, notifications, theme toggle, and menu fit on one header row. The opened panel stays eight pixels inside both viewport edges, begins immediately below the header, exposes a clear close control, retains the greeting and quick questions, and keeps the question input visible. No lower-right chat bubble overlays the featured-content area. The production defaults were then restored so the panel starts closed and the onboarding tour remains enabled.

After restoring those defaults, the homepage was reloaded. The chat remained closed until the header sparkle was selected, its accessible label changed from `Open OlogyWood AI chat` to `Close OlogyWood AI chat`, and no independent floating launcher reappeared.

The relocated panel also accepted and submitted the harmless question “Where do I find My Ology?” through the existing `aiChat.sendMessage` flow. The server completed the request in approximately two seconds, and the panel rendered an accurate answer directing the visitor to My Ology in the platform navigation. This confirms the existing LLM response behavior survived the launcher move.

The custom Admin Dashboard header was also rendered at 390 × 844. The sparkle utility fits beside a shortened mobile `Artist` return control without colliding with the title, system-status panel, or navigation tabs. The onboarding tour was restored immediately after this visual check.

Blog Management was rendered at the same mobile width. Its title, six-post count summary, sparkle utility, and compact `New` action remained on a clean header row with no horizontal overflow; the existing post filters, search field, thumbnails, and titles remained intact. Onboarding was again restored after the check.

## Regression and build validation

The focused header, AI chat, Blog Management, Admin, mobile, dark-mode, and Spotify callback suite passed **200 tests across nine files**. The complete platform suite passed **2,758 tests**, with **23 skipped**, across **155 files**. TypeScript passed, and the production build completed successfully in **17.41 seconds**.

The full-suite run also exposed an unrelated live-network timeout in the pre-existing invalid-code Spotify callback test. The callback now bounds both token and user-profile requests to four seconds and preserves the existing `TOKEN_EXCHANGE_FAILED` and `USERINFO_FAILED` redirects. Successful Spotify OAuth behavior was not changed, and all five OAuth route regressions pass.

The remaining step is publication followed by live mobile and desktop header verification.
