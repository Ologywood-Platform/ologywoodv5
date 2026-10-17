import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function source(relativePath: string): string {
  return readFileSync(resolve(__dirname, "..", relativePath), "utf-8");
}

describe("fan email consent UI", () => {
  const followButton = source("client/src/components/FollowButton.tsx");
  const consentControl = source(
    "client/src/components/FanEmailConsentControl.tsx"
  );
  const following = source("client/src/pages/Following.tsx");
  const fansSection = source("client/src/components/FansSection.tsx");
  const sendUpdate = source("client/src/components/SendUpdateDialog.tsx");
  const preferences = source(
    "client/src/components/EmailPreferencesCenter.tsx"
  );
  const unsubscribe = source("client/src/pages/Unsubscribe.tsx");
  const privacy = source("client/src/pages/PrivacyPolicy.tsx");
  const help = source("client/src/pages/Help.tsx");

  it("keeps following separate from optional email permission", () => {
    expect(followButton).toContain("FanEmailConsentControl");
    expect(followButton).toContain(
      "sign you up for emails or share your email address"
    );
    expect(followButton).not.toContain(
      "Priority access to booking availability"
    );
    expect(followButton).not.toContain('"Follow," you agree to receive email');
    expect(consentControl).toContain(
      "Share my name and email with {creatorName} for updates"
    );
    expect(consentControl).toContain("Past exports cannot be recalled");
    expect(consentControl).toContain("expectedRevision: draftRevision");
    expect(consentControl).toContain("enabled: open && isAuthenticated");
    expect(consentControl).toContain("setSaveError");
  });

  it("provides consent controls for followed artists without adding consent for venues", () => {
    expect(following).toContain("manage optional artist email permission");
    expect(following).toContain("<FanEmailConsentControl");
    expect(following).toContain("followingId={artist.id}");
  });

  it("uses only consent-eligible contacts for paid fan email display and fresh export", () => {
    expect(fansSection).toContain("trpc.follows.getFanEmails.useQuery");
    expect(fansSection).not.toContain("follows.getFollowers.useQuery");
    expect(fansSection).toContain("eligibleCount");
    expect(fansSection).toContain("utils.follows.exportFanEmails.fetch(undefined, { staleTime: 0 })");
    expect(fansSection).toContain("export limit: 10,000");
    expect(fansSection).toMatch(/honor\s+removals for any list you/);
  });

  it("rechecks eligible contact count and requires an explicit confirmation to send", () => {
    expect(sendUpdate).toContain("trpc.artistUpdates.canSend.useQuery");
    expect(sendUpdate).toContain("eligibleCount");
    expect(sendUpdate).toContain("No followers are currently eligible");
    expect(sendUpdate).toContain("Confirm Send");
    expect(sendUpdate).toContain(
      "accepted, ${failed} failed, ${skipped} skipped"
    );
    expect(sendUpdate).not.toContain("delivered");
    expect(sendUpdate).toContain("This does not email all followers");
  });

  it("makes creator updates a separate global preference and still saves Never", () => {
    expect(preferences).toContain("fanUpdates: true");
    expect(preferences).toContain("Allow creator update emails globally");
    expect(preferences).toContain("opt you in to any creator");
    expect(preferences).toContain('disabled={saveStatus === "saving"}');
    expect(preferences).not.toContain(
      "saveStatus === 'saving' || isUnsubscribed"
    );
    expect(preferences).toContain("unsubscribedAt");
  });

  it("uses a public scoped fan token without query-param identity selection or auto-unsubscribe", () => {
    expect(unsubscribe).toContain('params.get("fanToken")');
    expect(unsubscribe).toContain("getFanUnsubscribe.useQuery");
    expect(unsubscribe).toContain("unsubscribeFan.useMutation");
    expect(unsubscribe).toContain('scope !== "creator_updates"');
    expect(unsubscribe).toContain("No email preference was changed");
    expect(unsubscribe).toContain("does not reveal a recipient identity");
    expect(unsubscribe).toContain("It will not unfollow the creator");
    expect(unsubscribe).not.toContain('params.get("email")');
    expect(unsubscribe).not.toContain('params.get("userId")');
    expect(unsubscribe).not.toContain("handleUnsubscribe();");
    expect(unsubscribe).not.toContain("Resubscribe");
  });

  it("documents the explicit consent, limited export, and future-only revocation model", () => {
    expect(privacy).toContain("Last updated: October 17, 2026");
    expect(privacy).toContain("not by itself give that creator permission");
    expect(privacy).toContain("Exports are limited to up to 10,000 contacts");
    expect(privacy).toContain("past exports cannot be recalled");
    expect(help).toContain("Following only adds the artist to your list");
    expect(help).toContain("It does not email all followers");
  });
});
