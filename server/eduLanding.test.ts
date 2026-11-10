import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("OlogyWood EDU foundation", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/Edu.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("registers a public EDU route and homepage entry point", () => {
    expect(app).toContain('const Edu = lazy(() => import("./pages/Edu"));');
    expect(app).toContain('<Route path="/edu" component={Edu} />');
    expect(home).toContain('<Link href="/edu">OlogyWood EDU</Link>');
  });

  it("presents distinct student and school pilot paths", () => {
    expect(page).toContain("Start as a student");
    expect(page).toContain("Explore a school pilot");
    expect(page).toContain("Request a partnership conversation");
    expect(page).toContain("Free entry-level access is available");
    expect(page).toContain("Education pricing is being finalized");
    expect(page).toContain("without promising bookings, employment, income, or school endorsement");
  });

  it("keeps the first release aligned with current platform plans", () => {
    expect(page).toContain('href="/pricing"');
    expect(page).not.toContain("50% off");
    expect(page).toContain("existing plans");
  });
});
