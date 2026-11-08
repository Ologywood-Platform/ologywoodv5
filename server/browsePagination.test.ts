import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Browse.tsx"), "utf8");

describe("Browse artist pagination", () => {
  it("uses a bounded page slice while preserving the total result count", () => {
    expect(source).toContain("const artistPageSize = 12");
    expect(source).toContain("Math.ceil((filteredArtists?.length || 0) / artistPageSize)");
    expect(source).toContain("filteredArtists?.slice(");
    expect(source).toContain("Showing <strong>{filteredArtists.length}</strong>");
  });

  it("resets to page one when the query or filters change", () => {
    expect(source).toContain("setArtistPage(1)");
    expect(source).toContain("[searchQuery, talentTypeFilter, filters]");
  });

  it("has accessible disabled boundary controls", () => {
    expect(source).toContain('aria-label="Artist results pagination"');
    expect(source).toContain("disabled={artistPage === 1}");
    expect(source).toContain("disabled={artistPage === artistTotalPages}");
    expect(source).toContain("Page {artistPage} of {artistTotalPages}");
  });
});
