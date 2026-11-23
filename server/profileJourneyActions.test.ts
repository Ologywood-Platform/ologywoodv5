import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("artist profile journey actions", () => {
  const component = readFileSync(resolve(process.cwd(), "client/src/components/ProfileJourneyActions.tsx"), "utf8");
  const profile = readFileSync(resolve(process.cwd(), "client/src/pages/ArtistProfile.tsx"), "utf8");

  it("connects each action to a real profile destination or booking handler", () => {
    expect(component).toContain("onBook();");
    expect(component).toContain("onClick={() => toggleAction('book')}");
    expect(component).toContain("onClick={() => toggleAction('attend')}");
    expect(component).toContain("onClick={() => toggleAction('buy')}");
    expect(component).toContain("onClick={() => toggleAction('watch')}");
    expect(component).toContain("onClick={() => toggleAction('join')}");
    expect(component).toContain('aria-expanded={expandedAction ===');
    expect(component).toContain("scrollToSection('profile-events'");
    expect(component).toContain("document.getElementById('profile-shop')");
    expect(component).toContain("scrollToSection('profile-content'");
    expect(component).toContain("scrollToSection('profile-fan-club'");
    expect(profile).toContain('id="profile-events"');
  });

  it("provides helpful tooltips and feedback when a destination is unavailable", () => {
    expect(component).toContain("Learn how booking works with {artistName}");
    expect(component).toContain("Learn how to find events and tickets");
    expect(component).toContain("Learn what you can buy from this profile");
    expect(component).toContain("Learn where to preview music and content");
    expect(component).toContain("Learn how to follow and stay connected");
    expect(component).toContain('profile-action-guidance');
    expect(component).toContain('Request a performance, appearance, or collaboration');
    expect(component).toContain('See upcoming events featuring this talent');
    expect(component).toContain('Browse music, merch, books, and other releases');
    expect(component).toContain('Preview music, videos, performances, and other content');
    expect(component).toContain('Follow this talent and stay updated');
    expect(component).toContain("toast.info(emptyMessage)");
  });

  it("keeps the five primary actions together on desktop and separates relationship controls", () => {
    expect(component).toContain("grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5");
    expect(component).toContain("border-t border-purple-100/80");
    expect(component).toContain("<FollowButton artistUserId={artistUserId} artistName={artistName} showCount={false} />");
  });
});
