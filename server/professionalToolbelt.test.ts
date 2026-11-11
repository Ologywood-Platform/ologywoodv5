import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Professional Toolbelt education", () => {
  const help = readFileSync(resolve(process.cwd(), "client/src/pages/Help.tsx"), "utf8");
  const checklist = readFileSync(resolve(process.cwd(), "client/src/components/ProfessionalToolbeltChecklist.tsx"), "utf8");
  const glossary = readFileSync(resolve(process.cwd(), "client/src/components/IndustryGlossary.tsx"), "utf8");
  const edu = readFileSync(resolve(process.cwd(), "client/src/pages/Edu.tsx"), "utf8");

  it("provides the dedicated official-registration guide", () => {
    expect(help).toContain("How do I register with a PRO such as ASCAP or SoundExchange?");
    expect(help).toContain("ASCAP’s official Join flow");
    expect(help).toContain("SoundExchange Direct");
    expect(help).toContain("Do not claim a recording or share you do not control.");
  });

  it("keeps checklist progress local and reversible", () => {
    expect(checklist).toContain("ologywood-professional-toolbelt-progress-v1");
    expect(checklist).toContain("window.localStorage.getItem");
    expect(checklist).toContain("window.localStorage.setItem");
    expect(checklist).toContain("Reset progress");
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
  });
});
