import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { artistReleases, contentReleases, contentReleasePurchases, releasePurchases } from "../drizzle/schema";
import {
  AI_DISCLOSURE_COMPONENT_VALUES,
  AI_DISCLOSURE_LEVEL_VALUES,
  getAiDisclosureFormValue,
} from "../shared/aiDisclosure";
import {
  EMPTY_AI_DISCLOSURE_DB,
  normalizeAiDisclosure,
} from "./services/aiReleaseDisclosure";

const read = (path: string) => readFileSync(path, "utf8");

describe("voluntary AI-use disclosure", () => {
  it("uses two neutral affirmative disclosure levels and a cross-media component taxonomy", () => {
    expect(AI_DISCLOSURE_LEVEL_VALUES).toEqual(["ai_assisted", "primarily_ai_generated"]);
    expect(AI_DISCLOSURE_COMPONENT_VALUES).toContain("writing_lyrics_script");
    expect(AI_DISCLOSURE_COMPONENT_VALUES).toContain("voice_vocals");
    expect(AI_DISCLOSURE_COMPONENT_VALUES).toContain("artwork_graphics");
    expect(AI_DISCLOSURE_COMPONENT_VALUES).toContain("video_animation");
  });

  it("stores the same optional disclosure metadata on both release systems, not purchase rows", () => {
    for (const table of [artistReleases, contentReleases]) {
      expect(table.aiUseDisclosureEnabled).toBeDefined();
      expect(table.aiUseLevel).toBeDefined();
      expect(table.aiUseComponents).toBeDefined();
      expect(table.aiUseTools).toBeDefined();
      expect(table.aiUseNotes).toBeDefined();
    }
    expect((releasePurchases as any).aiUseDisclosureEnabled).toBeUndefined();
    expect((contentReleasePurchases as any).aiUseDisclosureEnabled).toBeUndefined();
  });

  it("treats disabled and legacy-null records as no disclosure, not an AI-free claim", () => {
    expect(getAiDisclosureFormValue(null)).toEqual({
      enabled: false,
      level: "",
      components: [],
      tools: "",
      notes: "",
    });
    expect(normalizeAiDisclosure({
      aiUseDisclosureEnabled: false,
      aiUseLevel: "ai_assisted",
      aiUseComponents: ["composition_melody"],
      aiUseTools: "Example tool",
      aiUseNotes: "Example note",
    })).toEqual(EMPTY_AI_DISCLOSURE_DB);
  });

  it("requires an enabled disclosure to include a valid level and at least one component", () => {
    expect(() => normalizeAiDisclosure({
      aiUseDisclosureEnabled: true,
      aiUseComponents: ["composition_melody"],
    })).toThrowError(TRPCError);

    expect(() => normalizeAiDisclosure({
      aiUseDisclosureEnabled: true,
      aiUseLevel: "ai_assisted",
      aiUseComponents: [],
    })).toThrowError("Select at least one component that involved AI.");
  });

  it("deduplicates components and trims optional creator-provided details", () => {
    expect(normalizeAiDisclosure({
      aiUseDisclosureEnabled: true,
      aiUseLevel: "ai_assisted",
      aiUseComponents: ["voice_vocals", "voice_vocals", "artwork_graphics"],
      aiUseTools: "  Tool A, Tool B  ",
      aiUseNotes: "  I generated a harmony layer.  ",
    })).toEqual({
      aiUseDisclosureEnabled: true,
      aiUseLevel: "ai_assisted",
      aiUseComponents: ["voice_vocals", "artwork_graphics"],
      aiUseTools: "Tool A, Tool B",
      aiUseNotes: "I generated a harmony layer.",
    });
  });

  it("preserves an existing enabled disclosure during a partial update", () => {
    expect(normalizeAiDisclosure(
      { aiUseNotes: "Updated context" },
      {
        aiUseDisclosureEnabled: true,
        aiUseLevel: "primarily_ai_generated",
        aiUseComponents: ["video_animation"],
        aiUseTools: "Visual tool",
        aiUseNotes: "Old context",
      },
    )).toEqual({
      aiUseDisclosureEnabled: true,
      aiUseLevel: "primarily_ai_generated",
      aiUseComponents: ["video_animation"],
      aiUseTools: "Visual tool",
      aiUseNotes: "Updated context",
    });
  });

  it("keeps disclosure writes behind each release router's existing owner checks", () => {
    const whiteLabelRouter = read("server/routers/release.ts");
    const contentRouter = read("server/routers/releases.ts");
    expect(whiteLabelRouter).toContain("const aiDisclosure = normalizeAiDisclosure(input, release)");
    expect(whiteLabelRouter.indexOf("release.artistId !== profile.id")).toBeLessThan(whiteLabelRouter.indexOf("normalizeAiDisclosure(input, release)"));
    expect(contentRouter).toContain("eq(releases.userId, ctx.user.id)");
    expect(contentRouter.indexOf("eq(releases.userId, ctx.user.id)")).toBeLessThan(contentRouter.indexOf("normalizeAiDisclosure(data, existing)"));
  });

  it("offers an optional creator switch and never labels non-disclosure as No AI", () => {
    const fields = read("client/src/components/AIUseDisclosure.tsx");
    expect(fields).toContain("Disclose AI use on this release");
    expect(fields).toContain("Leaving it off means no disclosure was provided");
    expect(fields).not.toContain(">No AI<");
    expect(fields).toContain("Creator-provided disclosure. OlogyWood does not independently verify AI use, ownership, or rights.");
  });

  it("renders the shared public tag on direct songs, content releases, and creator manager lists", () => {
    expect(read("client/src/components/ReleaseCard.tsx")).toContain("<AIUseDisclosureTag disclosure={release}");
    expect(read("client/src/components/ContentReleasesDisplay.tsx")).toContain("<AIUseDisclosureTag disclosure={release}");
    expect(read("client/src/pages/ReleaseManager.tsx")).toContain("<AIUseDisclosureTag disclosure={release}");
    expect(read("client/src/pages/ContentReleases.tsx")).toContain("<AIUseDisclosureTag disclosure={release}");
  });

  it("uses an additive migration with no destructive statement or purchase-table change", () => {
    const migration = read("drizzle/0111_furry_goblin_queen.sql");
    expect(migration.match(/ALTER TABLE `artist_releases` ADD/g)).toHaveLength(5);
    expect(migration.match(/ALTER TABLE `releases` ADD/g)).toHaveLength(5);
    expect(migration).not.toMatch(/DROP|DELETE|TRUNCATE|release_purchases|content_release_purchases/i);
  });
});
