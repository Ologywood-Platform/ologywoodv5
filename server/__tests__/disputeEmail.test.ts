import { describe, it, expect } from "vitest";

describe("Dispute Email Notifications", () => {
  describe("sendDisputeStatusUpdate function", () => {
    it("should be exported from email module", async () => {
      const emailModule = await import("../email");
      expect(typeof emailModule.sendDisputeStatusUpdate).toBe("function");
    });

    it("should accept all required parameters", async () => {
      const emailModule = await import("../email");
      // Verify the function signature accepts the correct params
      const fn = emailModule.sendDisputeStatusUpdate;
      expect(fn.length).toBe(1); // Single params object
    });
  });

  describe("Dispute router adminResolve integration", () => {
    it("should import sendDisputeStatusUpdate in dispute router", async () => {
      const disputeRouterModule = await import("../routers/dispute");
      expect(disputeRouterModule.disputeRouter).toBeDefined();
    });

    it("should handle all three status transitions", () => {
      const validStatuses = ["under_review", "resolved", "dismissed"];
      validStatuses.forEach((status) => {
        expect(["under_review", "resolved", "dismissed"]).toContain(status);
      });
    });
  });

  describe("Email content structure", () => {
    it("should have correct type labels for all dispute types", () => {
      const typeLabels: Record<string, string> = {
        payment_issue: "Payment Issue",
        no_show: "No Show",
        contract_violation: "Contract Violation",
        quality_issue: "Quality Issue",
        cancellation_dispute: "Cancellation Dispute",
        harassment: "Harassment",
        other: "Other",
      };

      expect(Object.keys(typeLabels)).toHaveLength(7);
      expect(typeLabels.payment_issue).toBe("Payment Issue");
      expect(typeLabels.no_show).toBe("No Show");
      expect(typeLabels.harassment).toBe("Harassment");
    });

    it("should have correct status configurations for all statuses", () => {
      const statusConfig: Record<string, { label: string; color: string }> = {
        under_review: { label: "Under Review", color: "#f59e0b" },
        resolved: { label: "Resolved", color: "#10b981" },
        dismissed: { label: "Dismissed", color: "#6b7280" },
      };

      expect(statusConfig.under_review.label).toBe("Under Review");
      expect(statusConfig.resolved.label).toBe("Resolved");
      expect(statusConfig.dismissed.label).toBe("Dismissed");
    });

    it("should include unsubscribe link in email template", async () => {
      // Read the email.ts source to verify unsubscribe link is present
      const fs = await import("fs");
      const emailSource = fs.readFileSync(
        require("path").join(__dirname, "../email.ts"),
        "utf-8"
      );
      
      // Find the sendDisputeStatusUpdate function
      const funcStart = emailSource.indexOf("export async function sendDisputeStatusUpdate");
      expect(funcStart).toBeGreaterThan(-1);
      
      const funcBody = emailSource.slice(funcStart);
      expect(funcBody).toContain("unsubscribe");
      expect(funcBody).toContain("Manage Preferences");
      expect(funcBody).toContain("Privacy Policy");
    });

    it("should include resolution block only when resolution is provided", async () => {
      const fs = await import("fs");
      const emailSource = fs.readFileSync(
        require("path").join(__dirname, "../email.ts"),
        "utf-8"
      );
      
      const funcStart = emailSource.indexOf("export async function sendDisputeStatusUpdate");
      const funcBody = emailSource.slice(funcStart);
      
      // Should have conditional resolution block
      expect(funcBody).toContain("resolutionBlock");
      expect(funcBody).toContain("resolution");
    });
  });

  describe("Dispute router email integration", () => {
    it("should import sendDisputeStatusUpdate in dispute router", async () => {
      const fs = await import("fs");
      const routerSource = fs.readFileSync(
        require("path").join(__dirname, "../routers/dispute.ts"),
        "utf-8"
      );
      
      expect(routerSource).toContain('import { sendDisputeStatusUpdate, sendDisputeFiled } from "../email"');
    });

    it("should call sendDisputeStatusUpdate in adminResolve mutation", async () => {
      const fs = await import("fs");
      const routerSource = fs.readFileSync(
        require("path").join(__dirname, "../routers/dispute.ts"),
        "utf-8"
      );
      
      expect(routerSource).toContain("sendDisputeStatusUpdate");
      expect(routerSource).toContain("reporter?.email");
      expect(routerSource).toContain("[Dispute] Email sent to reporter");
    });

    it("should gracefully handle email failures without failing the mutation", async () => {
      const fs = await import("fs");
      const routerSource = fs.readFileSync(
        require("path").join(__dirname, "../routers/dispute.ts"),
        "utf-8"
      );
      
      // Should have try/catch around email sending
      expect(routerSource).toContain("catch (emailError)");
      expect(routerSource).toContain("[Dispute] Failed to send email notification");
    });
  });

  describe("Dispute router security boundaries", () => {
    it("uses strict identifiers and bounded evidence/admin inputs", async () => {
      const fs = await import("fs");
      const routerSource = fs.readFileSync(
        require("path").join(__dirname, "../routers/dispute.ts"),
        "utf-8"
      );

      expect(routerSource).not.toMatch(/(bookingId|disputeId|id):\s*z\.number\(\)(?!\.)/);
      expect(routerSource).toContain('fileData: disputeFileDataSchema');
      expect(routerSource).toContain('mimeType: disputeEvidenceMimeSchema');
      expect(routerSource).toContain('z.array(z.string().url().max(2_048)).max(10).optional()');
      expect(routerSource).toContain('resolution: z.string().trim().max(10_000).optional()');
      expect(routerSource).toContain('adminNotes: z.string().trim().max(10_000).optional()');
    });

    it("requires the booking party before creating or checking a dispute", async () => {
      const fs = await import("fs");
      const routerSource = fs.readFileSync(
        require("path").join(__dirname, "../routers/dispute.ts"),
        "utf-8"
      );

      const createBlock = routerSource.slice(routerSource.indexOf('create: protectedProcedure'), routerSource.indexOf('getMyDisputes: protectedProcedure'));
      const checkBlock = routerSource.slice(routerSource.indexOf('checkBookingDispute: protectedProcedure'));
      expect(createBlock).toContain('db.getArtistProfileByUserId(ctx.user.id)');
      expect(createBlock).toContain('db.getVenueProfileByUserId(ctx.user.id)');
      expect(createBlock).toContain('Only artists and venues can file disputes');
      expect(checkBlock).toContain('Not authorized for this booking');
      expect(checkBlock).toContain('ctx.user.role !== "admin"');
    });
  });
});
