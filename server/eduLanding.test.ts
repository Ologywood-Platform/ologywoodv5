import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("OlogyWood EDU foundation", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/Edu.tsx"), "utf8");
  const applyPage = readFileSync(resolve(process.cwd(), "client/src/pages/EduApply.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const contactRouter = readFileSync(resolve(process.cwd(), "server/routers/contact.ts"), "utf8");

  it("registers a public EDU route and homepage entry point", () => {
    expect(app).toContain('const Edu = lazy(() => import("./pages/Edu"));');
    expect(app).toContain('const EduApply = lazy(() => import("./pages/EduApply"));');
    expect(app).toContain('<Route path="/edu" component={Edu} />');
    expect(app).toContain('<Route path="/edu/apply" component={EduApply} />');
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

  it("routes student and school interest through validated contact subjects", () => {
    expect(page).toContain('/edu/apply?path=student');
    expect(page).toContain('/edu/apply?path=school');
    expect(applyPage).toContain('"EDU Student Interest"');
    expect(applyPage).toContain('"EDU School Pilot"');
    expect(contactRouter).toContain("'EDU Student Interest'");
    expect(contactRouter).toContain("'EDU School Pilot'");
    expect(applyPage).toContain("No payment is required to submit interest.");
  });
});
