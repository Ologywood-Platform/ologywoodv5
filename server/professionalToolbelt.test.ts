import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Professional Toolbelt education", () => {
  const help = readFileSync(resolve(process.cwd(), "client/src/pages/Help.tsx"), "utf8");
  const checklist = readFileSync(resolve(process.cwd(), "client/src/components/ProfessionalToolbeltChecklist.tsx"), "utf8");
  const glossary = readFileSync(resolve(process.cwd(), "client/src/components/IndustryGlossary.tsx"), "utf8");
  const edu = readFileSync(resolve(process.cwd(), "client/src/pages/Edu.tsx"), "utf8");
  const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/ArtistDashboardV3.tsx"), "utf8");
  const workspace = readFileSync(resolve(process.cwd(), "client/src/pages/Workspace.tsx"), "utf8");

  it("provides the dedicated official-registration guide", () => {
    expect(help).toContain("How do I register with ASCAP and SoundExchange?");
    expect(help).toContain("ASCAP’s official Join flow");
    expect(help).toContain("SoundExchange Direct");
    expect(help).toContain("Do not claim a recording or share you do not control.");
    expect(help).toContain("SoundExchange administers qualifying U.S. digital-performance royalties");
    expect(help).toContain("Sync Licensing & Radio Placements: prepare, pitch and document the use");
    expect(help).toContain("A traditional radio spin does not use the same sound-recording royalty path");
    expect(help).toContain("Last reviewed: {item.reviewed}");
    expect(help).toContain("Official sources");
    expect(help).toContain("EDU & Professional Toolbelt");
    expect(help).toContain("isEduHelpArticle");
    expect(help).toContain("student enrollment, verification, school pilots");
  });

  it("keeps checklist progress local and reversible", () => {
    expect(checklist).toContain("ologywood-professional-toolbelt-progress-v2");
    expect(checklist).toContain("window.localStorage.getItem");
    expect(checklist).toContain("window.localStorage.setItem");
    expect(checklist).toContain(">Reset</button>");
    expect(checklist).toContain("Copy My Checklist");
    expect(checklist).toContain("window.print");
    expect(checklist).toContain("toolbelt-sync-ready");
    expect(checklist).toContain("toolbelt-radio-streaming");
    expect(checklist).toContain("toolbelt-review-opportunity");
    expect(checklist).toContain("OlogyWood does not receive or verify these selections");
  });

  it("provides keyboard-accessible glossary definitions", () => {
    expect(glossary).toContain("Sync / synch");
    expect(glossary).toContain("Royalties");
    expect(glossary).toContain("aria-describedby");
    expect(glossary).toContain("group-focus-within:visible");
  });

  it("links the registration guide from EDU", () => {
    expect(edu).toContain("Register with the Right Organization");
    expect(edu).toContain("toolbelt-pro-registration");
    expect(edu).toContain("Get Sync Ready");
    expect(edu).toContain("Sync Licensing & Radio Placements");
    expect(edu).toContain("toolbelt-sync-radio-placements");
    expect(edu).toContain("Radio, Streaming & Distribution");
    expect(edu).toContain("Build Your Professional Toolkit");
  });

  it("provides role-neutral entry points in My Dashboard and Workspace", () => {
    expect(dashboard).toContain("Professional Toolbelt");
    expect(dashboard).toContain("toolbelt-know-your-rights");
    expect(workspace).toContain("Professional Toolbelt");
    expect(workspace).toContain("Rights, royalties, sync, distribution, deals, and creator checklists");
  });
});
