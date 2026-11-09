import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routerSource = readFileSync(join(__dirname, "routers/venueContract.ts"), "utf8");
const emailSource = readFileSync(join(__dirname, "email.ts"), "utf8");

describe("venue-contract security boundaries", () => {
  it("uses safe strict identifiers for every contract mutation and lookup", () => {
    expect(routerSource).toContain("const venueContractId = z.number().int().positive().safe();");
    expect(routerSource).toContain("const bookingId = z.number().int().positive().safe();");
    expect(routerSource).not.toMatch(/(venueContractId|bookingId): z\.number\(\)(?!\.)/);
    expect(routerSource).toContain(".input(z.object({ venueContractId }).strict())");
    expect(routerSource).toContain(".input(z.object({ bookingId }).strict())");
  });

  it("bounds platform-generated contract data and rejects unknown fields", () => {
    expect(routerSource).toContain("const contractClause = z.object({");
    expect(routerSource).toContain("clauses: z.array(contractClause).max(30).optional()");
    expect(routerSource).toContain("customTerms: z.string().trim().max(20_000).optional()");
    expect(routerSource).toContain("JSON.stringify(value).length <= 40_000");
    expect(routerSource).toContain("}).strict().refine((value) => JSON.stringify(value).length <= 40_000");
    expect(routerSource).not.toContain("z.record(z.string(), z.any())");
  });

  it("accepts only bounded, valid PDF uploads and derives a cryptographic storage suffix", () => {
    expect(routerSource).toContain("fileData: pdfBase64");
    expect(routerSource).toContain("fileName: pdfFileName");
    expect(routerSource).toContain('mimeType: z.literal("application/pdf")');
    expect(routerSource).toContain("buffer.subarray(0, 5).toString(\"ascii\") !== \"%PDF-\"");
    expect(routerSource).toContain("buffer.length > 10 * 1024 * 1024");
    expect(routerSource).toContain('const randomSuffix = randomBytes(8).toString("hex")');
    expect(routerSource).not.toContain("Math.random().toString(36)");
  });

  it("bounds drawn and typed signatures before persistence", () => {
    expect(routerSource).toContain("const signInput = z.object({");
    expect(routerSource).toContain("const signatureData = z.string().trim().min(1).max(1_000_000)");
    expect(routerSource).toContain("function isSignatureImage(value: string): boolean");
    expect(routerSource).toContain("decoded.length <= 750 * 1024");
    expect(routerSource).toContain("Drawn signatures must be a valid signature image");
    expect(routerSource).toContain("Typed signatures are too long");
  });

  it("does not trust request origins or log raw email exceptions", () => {
    expect(routerSource).toContain("trustedCheckoutOrigin(undefined, ctx.req?.headers?.origin)");
    expect(routerSource).not.toContain('ctx.req?.headers?.origin || "https://www.ologywood.com"');
    expect(routerSource).not.toMatch(/console\.error\([^\n]*(emailErr|error)\)/);
  });

  it("escapes contract names and titles in shared notification email HTML", () => {
    expect(emailSource).toContain('import { escapeFanEmailHtml } from "./services/fanEmailFormatting";');
    expect(emailSource).toContain("const safeArtistName = escapeFanEmailHtml(artistName);");
    expect(emailSource).toContain("const safeRecipientName = escapeFanEmailHtml(recipientName);");
    expect(emailSource).toContain("const safeContractTitle = escapeFanEmailHtml(contractTitle);");
    expect(emailSource).toContain(".replace(/[\\r\\n]/g");
  });

  it("keeps decline-email interpolation escaped and contract reads party-scoped", () => {
    expect(routerSource).toContain("escapeFanEmailHtml(venueProfile.organizationName)");
    expect(routerSource).toContain("escapeFanEmailHtml(artistProfile.artistName)");
    expect(routerSource).toContain("escapeFanEmailHtml(contract.title)");
    expect(routerSource).toContain("const isAdmin = ctx.user.role === \"admin\";");
    expect(routerSource).toContain("if (!isArtist && !isVenue && !isAdmin)");
  });
});
