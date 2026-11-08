import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/ArtistProfile.tsx"), "utf8");
const reportVideoSource = readFileSync(resolve(process.cwd(), "client/src/components/ReportVideoButton.tsx"), "utf8");

describe("public artist profile display", () => {
  it("supports both numeric and clean-slug profile URLs", () => {
    expect(source).toContain("/artist/");
    expect(source).toContain("isNumericId");
    expect(source).toContain("getProfile.useQuery");
    expect(source).toContain("getProfileBySlug.useQuery");
    expect(source).toContain("resolvedArtistId");
  });

  it("keeps the public profile sections and creator-facing trust signals wired", () => {
    for (const section of [
      "SandboxPostSection",
      "FanClubSection",
      "ContentReleasesDisplay",
      "MerchDisplay",
      "PortfolioPhotoViewer",
      "OlogyLiveProfileSection",
      "EntityBreadcrumb",
      "StickyBookingBar",
      "CrmBadge",
      "isVerified",
    ]) {
      expect(source).toContain(section);
    }
  });

  it("has explicit invalid, loading, not-found, retry, and accessible media states", () => {
    expect(source).toContain("Invalid artist profile");
    expect(source).toContain("ProfileHeaderSkeleton");
    expect(source).toContain("Artist not found");
    expect(source).toContain("Retry photos");
    expect(source).toContain("Show all");
    expect(source).toContain("portfolioPhotosQuery.fetchNextPage");
  });

  it("does not call protected profile queries for anonymous visitors", () => {
    expect(source).toContain("enabled: isAuthenticated && resolvedArtistId > 0");
    expect(reportVideoSource).toContain("enabled: isAuthenticated && !isOwnProfile");
  });
});
