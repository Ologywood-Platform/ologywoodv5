import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("artist profile journey actions", () => {
  const component = readFileSync(resolve(process.cwd(), "client/src/components/ProfileJourneyActions.tsx"), "utf8");
  const profile = readFileSync(resolve(process.cwd(), "client/src/pages/ArtistProfile.tsx"), "utf8");

  it("connects each action to a real profile destination or booking handler", () => {
    expect(component).toContain("onClick={onBook}");
    expect(component).toContain("scrollToSection('profile-events'");
    expect(component).toContain("scrollToSection(document.getElementById('profile-shop')");
    expect(component).toContain("scrollToSection('profile-content'");
    expect(component).toContain("scrollToSection('profile-fan-club'");
    expect(profile).toContain('id="profile-events"');
  });

  it("provides helpful tooltips and feedback when a destination is unavailable", () => {
    expect(component).toContain("TooltipContent>Send a booking request");
    expect(component).toContain("TooltipContent>See upcoming events and ticket links");
    expect(component).toContain("TooltipContent>Browse music, merch, books, and paid content");
    expect(component).toContain("TooltipContent>Preview music and watch hosted content");
    expect(component).toContain("TooltipContent>Join this creator’s Fan Club");
    expect(component).toContain("toast.info(emptyMessage)");
  });

  it("keeps the five primary actions together on desktop and separates relationship controls", () => {
    expect(component).toContain("grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5");
    expect(component).toContain("border-t border-purple-100/80");
    expect(component).toContain("<FollowButton artistUserId={artistUserId} artistName={artistName} showCount={false} />");
  });
});
