import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("OlogyWood EDU foundation", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/Edu.tsx"), "utf8");
  const applyPage = readFileSync(resolve(process.cwd(), "client/src/pages/EduApply.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const footer = readFileSync(resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");
  const help = readFileSync(resolve(process.cwd(), "client/src/pages/Help.tsx"), "utf8");
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
    expect(page).toContain("The approved EDU framework");
    expect(page).toContain("without promising bookings, employment, income, or school endorsement");
    expect(page).toContain("Your creativity deserves an audience");
    expect(page).toContain("Music + audio");
    expect(page).toContain("Become an OlogyWood Campus Ambassador");
    expect(page).toContain("/edu/apply?path=student&interest=ambassador");
    expect(page).toContain("OlogyWood HBCU Creator Initiative");
    expect(page).toContain("not an announced institutional partnership");
  });

  it("publishes the approved framework without activating unverified billing", () => {
    expect(page).toContain('href="/pricing"');
    expect(page).toContain("50% student discount");
    expect(page).toContain("12-month verification");
    expect(page).toContain("30-day renewal grace");
    expect(page).toContain("requires manual eligibility approval and a separate successful checkout");
    expect(page).toContain("entering an email or code does not automatically verify ownership, validity, or enrollment");
    expect(page).toContain("not automatically enrolled in a paid plan");
  });

  it("makes EDU discoverable from the shared footer and Help Center", () => {
    expect(footer).toContain("{ label: 'OlogyWood EDU', path: '/edu' }");
    expect(help).toContain("How will OlogyWood EDU student pricing work?");
    expect(help).toContain("50% off Starter or Professional");
    expect(page).toContain("Professional Toolbelt");
    expect(page).toContain("Know your rights. Build your leverage.");
    expect(page).toContain("toolbelt-know-your-rights");
    expect(page).toContain("toolbelt-release-checklist");
    expect(help).toContain("Know Your Rights: what does a creator actually own?");
    expect(help).toContain("Build Your Royalty Map before releasing a project");
    expect(help).toContain("Review an entertainment opportunity before you opt in");
    expect(help).toContain("What should be in my professional release checklist?");
    expect(help).toContain("This article is educational information, not legal advice.");
  });

  it("routes student and school interest through validated contact subjects", () => {
    expect(page).toContain('/edu/apply?path=student');
    expect(page).toContain('/edu/apply?path=school');
    expect(applyPage).toContain('"EDU Student Interest"');
    expect(applyPage).toContain('"EDU School Pilot"');
    expect(contactRouter).toContain("'EDU Student Interest'");
    expect(contactRouter).toContain("'EDU School Pilot'");
    expect(applyPage).toContain("No payment is required to submit interest.");
    expect(applyPage).toContain("Estimated participating students");
    expect(applyPage).toContain("requestedInterest === \"ambassador\"");
    expect(footer).toContain("emerging talent, student showcases, creative opportunities");
  });
});
