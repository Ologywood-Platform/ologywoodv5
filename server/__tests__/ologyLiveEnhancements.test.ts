import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const clientDir = join(__dirname, "../../client/src");

describe("Ology Live Enhancements", () => {
  describe("Feature 1: NIL Earnings Export (PDF/CSV)", () => {
    const earningsPage = readFileSync(
      join(clientDir, "pages/OlogyLiveEarnings.tsx"),
      "utf-8"
    );

    it("should have Export CSV button", () => {
      expect(earningsPage).toContain("Export CSV");
    });

    it("should have Export PDF button", () => {
      expect(earningsPage).toContain("Export PDF");
    });

    it("should have exportCSV function that generates CSV content", () => {
      expect(earningsPage).toContain("exportCSV");
      expect(earningsPage).toContain("text/csv");
      expect(earningsPage).toContain("nil-earnings");
    });

    it("should have exportPDF function that generates printable HTML", () => {
      expect(earningsPage).toContain("exportPDF");
      expect(earningsPage).toContain("NIL Compliance Earnings Report");
      expect(earningsPage).toContain("FOR ATTORNEY / COMPLIANCE REVIEW");
    });

    it("should include disclaimer in exports", () => {
      expect(earningsPage).toContain("disclaimer");
      expect(earningsPage).toContain("does not constitute tax");
    });

    it("should include platform details in PDF export", () => {
      expect(earningsPage).toContain("Platform Fee Rate");
      expect(earningsPage).toContain("15% of gross booking amount");
      expect(earningsPage).toContain("Payment Processor");
      expect(earningsPage).toContain("Stripe");
    });

    it("should include monthly breakdown in CSV export", () => {
      expect(earningsPage).toContain("MONTHLY BREAKDOWN");
      expect(earningsPage).toContain("monthlyBreakdown");
    });

    it("should include category breakdown in CSV export", () => {
      expect(earningsPage).toContain("EARNINGS BY NIL CATEGORY");
    });

    it("should disable export buttons when no data is available", () => {
      expect(earningsPage).toContain("disabled={!nilReport.data");
    });

    it("should show loading state during export", () => {
      expect(earningsPage).toContain("Exporting...");
      expect(earningsPage).toContain("Generating...");
    });

    it("should use FileSpreadsheet icon for CSV and FileText icon for PDF", () => {
      expect(earningsPage).toContain("FileSpreadsheet");
      expect(earningsPage).toContain("FileText");
    });

    it("should include year in export filenames", () => {
      expect(earningsPage).toContain("nil-earnings-${selectedYear}.csv");
      expect(earningsPage).toContain("nil-report-${selectedYear}");
    });
  });

  describe("Feature 2: Live Countdown Timer with Auto-Enable Join Button", () => {
    const mySessionsPage = readFileSync(
      join(clientDir, "pages/OlogyLiveMySessions.tsx"),
      "utf-8"
    );

    it("should have a useCountdown hook", () => {
      expect(mySessionsPage).toContain("useCountdown");
    });

    it("should have a calculateCountdown function", () => {
      expect(mySessionsPage).toContain("calculateCountdown");
    });

    it("should have a CountdownTimer component", () => {
      expect(mySessionsPage).toContain("CountdownTimer");
    });

    it("should enable join button 5 minutes before session start", () => {
      expect(mySessionsPage).toContain("5 * 60 * 1000");
      expect(mySessionsPage).toContain("fiveMinBefore");
    });

    it("should show LIVE NOW indicator when session is active", () => {
      expect(mySessionsPage).toContain("LIVE NOW");
      expect(mySessionsPage).toContain("isLive");
    });

    it("should show 'Starting soon' message when joinable", () => {
      expect(mySessionsPage).toContain("Starting soon");
      expect(mySessionsPage).toContain("Join now!");
    });

    it("should display countdown with days, hours, minutes, seconds", () => {
      expect(mySessionsPage).toContain("days");
      expect(mySessionsPage).toContain("hours");
      expect(mySessionsPage).toContain("minutes");
      expect(mySessionsPage).toContain("seconds");
    });

    it("should update countdown every second", () => {
      expect(mySessionsPage).toContain("setInterval");
      expect(mySessionsPage).toContain("1000");
    });

    it("should disable join button when session is not yet joinable", () => {
      expect(mySessionsPage).toContain("cursor-not-allowed");
      expect(mySessionsPage).toContain("Join button activates 5 minutes before");
    });

    it("should use isJoinable state to control button enablement", () => {
      expect(mySessionsPage).toContain("isJoinable");
      expect(mySessionsPage).toContain("joinEnabled");
    });

    it("should show pulsing animation when join is available", () => {
      expect(mySessionsPage).toContain("animate-pulse");
    });

    it("should show live ping animation when session is live", () => {
      expect(mySessionsPage).toContain("animate-ping");
    });

    it("should render countdown only for confirmed sessions", () => {
      expect(mySessionsPage).toContain('session.status === "confirmed"');
    });
  });

  describe("Feature 3: Share to Social Media", () => {
    const profileSection = readFileSync(
      join(clientDir, "components/OlogyLiveProfileSection.tsx"),
      "utf-8"
    );

    it("should have a ShareMenu component", () => {
      expect(profileSection).toContain("ShareMenu");
    });

    it("should support sharing to Twitter/X", () => {
      expect(profileSection).toContain("twitter.com/intent/tweet");
      expect(profileSection).toContain("Share on X");
    });

    it("should support sharing to Instagram (copy to clipboard)", () => {
      expect(profileSection).toContain("Share on Instagram");
      expect(profileSection).toContain("Paste in Instagram");
    });

    it("should support sharing to Facebook", () => {
      expect(profileSection).toContain("facebook.com/sharer");
      expect(profileSection).toContain("Share on Facebook");
    });

    it("should support copying the direct link", () => {
      expect(profileSection).toContain("Copy Link");
      expect(profileSection).toContain("Link Copied!");
      expect(profileSection).toContain("navigator.clipboard.writeText");
    });

    it("should include talent name and experience title in share text", () => {
      expect(profileSection).toContain("talentName");
      expect(profileSection).toContain("experience.title");
      expect(profileSection).toContain("Ology Live");
    });

    it("should have a share button on each experience card", () => {
      expect(profileSection).toContain("Share2");
      expect(profileSection).toContain("Share this experience");
    });

    it("should open share links in new window", () => {
      expect(profileSection).toContain('window.open(url, "_blank"');
    });

    it("should close share menu after action", () => {
      expect(profileSection).toContain("onClose");
    });

    it("should use experience URL for sharing", () => {
      expect(profileSection).toContain("experienceUrl");
      expect(profileSection).toContain("/ology-live/${experience.id}");
    });

    it("should show copied confirmation state", () => {
      expect(profileSection).toContain("setCopied(true)");
      expect(profileSection).toContain("setCopied(false)");
    });
  });
});
