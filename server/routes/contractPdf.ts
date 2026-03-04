import { Router, Request, Response } from "express";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as db from "../db";
import { getRiderTemplate } from "../services/riderTemplateService";
import { sdk } from "../_core/sdk";

const router = Router();

/**
 * GET /api/contract/:bookingId/pdf
 * Generates and downloads a PDF of the signed rider contract
 */
router.get("/:bookingId/pdf", async (req: Request, res: Response) => {
  try {
    console.log("[Contract PDF] Request received for booking:", req.params.bookingId);
    
    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    // Authenticate user
    let user;
    try {
      user = await sdk.authenticateRequest(req);
      console.log("[Contract PDF] Authenticated user:", user.id);
    } catch (authErr: any) {
      console.error("[Contract PDF] Auth failed:", authErr?.message || authErr);
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = user.id;

    // Get booking
    const booking = await db.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    console.log("[Contract PDF] Found booking:", bookingId, "artistId:", booking.artistId, "venueId:", booking.venueId);

    // Verify user is involved in this booking
    const artistProfile = await db.getArtistProfileByUserId(userId);
    const venueProfile = await db.getVenueProfileByUserId(userId);
    const isArtist = artistProfile && booking.artistId === artistProfile.id;
    const isVenue = venueProfile && booking.venueId === venueProfile.id;
    if (!isArtist && !isVenue) {
      return res.status(403).json({ error: "Not authorized for this booking" });
    }

    // Get contract and signatures
    const contract = await db.getContractByBookingId(bookingId);
    const signatures = contract ? await db.getSignaturesByContractId(contract.id) : [];
    const artistSig = signatures.find((s) => s.signerRole === "artist");
    const venueSig = signatures.find((s) => s.signerRole === "venue");
    console.log("[Contract PDF] Contract:", contract?.id, "Status:", contract?.status, "Signatures:", signatures.length);

    // Get rider template data
    let riderData: Record<string, any> = {};
    let templateName = "Performance Rider";
    if (booking.riderTemplateId) {
      try {
        const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplate) {
          riderData = typeof riderTemplate.templateData === "string"
            ? JSON.parse(riderTemplate.templateData as string)
            : riderTemplate.templateData || {};
          templateName = riderTemplate.templateName || "Performance Rider";
        }
      } catch (err) {
        console.error("[Contract PDF] Error loading rider template:", err);
      }
    }

    // Get artist and venue info
    const artistProf = await db.getArtistProfileById(booking.artistId);
    const venueProf = await db.getVenueProfileById(booking.venueId);
    const artistUser = artistProf ? await db.getUserById(artistProf.userId) : null;
    const venueUser = venueProf ? await db.getUserById(venueProf.userId) : null;

    console.log("[Contract PDF] Generating PDF...");

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const colors = {
      purple: rgb(0.486, 0.227, 0.929),  // #7C3AED
      darkText: rgb(0.067, 0.067, 0.067),
      grayText: rgb(0.42, 0.45, 0.49),
      green: rgb(0.133, 0.773, 0.369),
      lightGray: rgb(0.92, 0.92, 0.92),
      red: rgb(0.937, 0.267, 0.267),
    };

    function checkNewPage(needed: number = 60) {
      if (y < margin + needed) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    }

    function drawText(text: string, options: {
      font?: typeof helvetica;
      size?: number;
      color?: ReturnType<typeof rgb>;
      x?: number;
      maxWidth?: number;
    } = {}) {
      const font = options.font || helvetica;
      const size = options.size || 10;
      const color = options.color || colors.darkText;
      const x = options.x || margin;
      const maxWidth = options.maxWidth || contentWidth;

      // Word wrap
      const words = String(text || "").split(" ");
      let line = "";
      const lines: string[] = [];

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      for (const l of lines) {
        checkNewPage(size + 6);
        page.drawText(l, { x, y, size, font, color });
        y -= size + 6;
      }
    }

    function drawLine() {
      checkNewPage(10);
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.5,
        color: colors.lightGray,
      });
      y -= 15;
    }

    function drawSectionHeader(title: string) {
      checkNewPage(30);
      y -= 8;
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: contentWidth,
        height: 20,
        color: rgb(0.96, 0.95, 1), // Light purple bg
      });
      page.drawText(title, {
        x: margin + 8,
        y: y,
        size: 11,
        font: helveticaBold,
        color: colors.purple,
      });
      y -= 24;
    }

    function drawKeyValue(key: string, value: string) {
      checkNewPage(20);
      const safeValue = String(value || "N/A");
      page.drawText(key + ":", {
        x: margin + 10,
        y,
        size: 9,
        font: helveticaBold,
        color: colors.grayText,
      });
      const keyWidth = helveticaBold.widthOfTextAtSize(key + ":", 9);
      // Truncate long values to fit on one line
      let displayValue = safeValue;
      const maxValueWidth = contentWidth - keyWidth - 28;
      while (helvetica.widthOfTextAtSize(displayValue, 9) > maxValueWidth && displayValue.length > 3) {
        displayValue = displayValue.slice(0, -4) + "...";
      }
      page.drawText(displayValue, {
        x: margin + 10 + keyWidth + 8,
        y,
        size: 9,
        font: helvetica,
        color: colors.darkText,
      });
      y -= 16;
    }

    // ===== HEADER =====
    page.drawText("OLOGYWOOD", {
      x: margin,
      y,
      size: 22,
      font: helveticaBold,
      color: colors.purple,
    });
    y -= 18;
    page.drawText("Artist Performance Agreement", {
      x: margin,
      y,
      size: 12,
      font: helvetica,
      color: colors.grayText,
    });
    y -= 30;

    // Contract status badge
    const status = contract?.status || "pending";
    const statusText = status === "fully_signed" ? "FULLY SIGNED & EXECUTED" :
                       status === "signed_by_artist" ? "ARTIST SIGNED - AWAITING VENUE" :
                       status === "signed_by_venue" ? "VENUE SIGNED - AWAITING ARTIST" :
                       "PENDING SIGNATURES";
    const statusColor = status === "fully_signed" ? colors.green : colors.red;

    page.drawText(statusText, {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: statusColor,
    });
    y -= 20;

    drawLine();

    // ===== CONTRACT INFO =====
    drawSectionHeader("CONTRACT DETAILS");
    drawKeyValue("Contract", templateName);
    drawKeyValue("Booking ID", `#${booking.id}`);
    drawKeyValue("Event", String((booking as any).eventDetails || "N/A"));
    drawKeyValue("Event Date", booking.eventDate ? new Date(booking.eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD");
    drawKeyValue("Total Fee", `$${parseFloat(String(booking.totalFee || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
    drawKeyValue("Deposit", `$${parseFloat(String(booking.depositAmount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
    y -= 5;

    // ===== PARTIES =====
    drawSectionHeader("PARTIES");
    drawKeyValue("Artist", artistProf?.artistName || "N/A");
    drawKeyValue("Artist Email", artistUser?.email || "N/A");
    drawKeyValue("Venue", venueProf?.organizationName || "N/A");
    drawKeyValue("Venue Email", venueUser?.email || "N/A");
    y -= 5;

    // ===== RIDER DETAILS =====
    const formData = riderData.formData || riderData;

    // Helper to format field values for display
    function formatFieldValue(val: any, suffix: string = ""): string {
      if (val === true) return "Yes";
      if (val === false) return "No";
      return `${String(val)}${suffix}`;
    }

    // Technical Requirements
    const techFields = [
      ["stage_size_min", "Minimum Stage Size", " ft"],
      ["stage_size_preferred", "Preferred Stage Size", " ft"],
      ["sound_system", "Sound System", ""],
      ["monitors", "Monitors", ""],
      ["microphones", "Microphones", ""],
      ["lighting", "Lighting", ""],
      ["backline", "Backline", ""],
      ["power_requirements", "Power Requirements", ""],
      ["additional_tech", "Additional Tech", ""],
    ];
    const hasTech = techFields.some(([key]) => formData[key as string]);
    if (hasTech) {
      drawSectionHeader("TECHNICAL REQUIREMENTS");
      for (const [key, label, suffix] of techFields) {
        if (formData[key as string]) {
          drawKeyValue(label as string, formatFieldValue(formData[key as string], suffix as string));
        }
      }
      y -= 5;
    }

    // Performance Details
    const perfFields = [
      ["performance_duration", "Performance Duration", " minutes"],
      ["set_times", "Set Times", ""],
      ["soundcheck_time", "Soundcheck Time", ""],
      ["load_in_time", "Load-in Time", ""],
      ["set_list_provided", "Set List Provided", ""],
      ["encore", "Encore", ""],
    ];
    const hasPerf = perfFields.some(([key]) => formData[key as string]);
    if (hasPerf) {
      drawSectionHeader("PERFORMANCE DETAILS");
      for (const [key, label, suffix] of perfFields) {
        if (formData[key as string]) {
          drawKeyValue(label as string, formatFieldValue(formData[key as string], suffix as string));
        }
      }
      y -= 5;
    }

    // Hospitality
    const hospFields = [
      ["green_room", "Green Room", ""],
      ["catering", "Catering", ""],
      ["beverages", "Beverages", ""],
      ["towels", "Towels", ""],
      ["parking", "Parking", ""],
      ["accommodation", "Accommodation", ""],
      ["transportation", "Transportation", ""],
      ["guest_list", "Guest List", ""],
    ];
    const hasHosp = hospFields.some(([key]) => formData[key as string]);
    if (hasHosp) {
      drawSectionHeader("HOSPITALITY REQUIREMENTS");
      for (const [key, label] of hospFields) {
        if (formData[key as string]) {
          drawKeyValue(label as string, formatFieldValue(formData[key as string]));
        }
      }
      y -= 5;
    }

    // Financial Terms
    const finFields = [
      ["deposit_percentage", "Deposit Required", "%"],
      ["deposit_due_date", "Deposit Due", ""],
      ["balance_due_date", "Balance Due", ""],
      ["cancellation_policy", "Cancellation Policy", ""],
      ["payment_method", "Payment Method", ""],
    ];
    const hasFin = finFields.some(([key]) => formData[key as string]);
    if (hasFin) {
      drawSectionHeader("FINANCIAL TERMS");
      for (const [key, label, suffix] of finFields) {
        if (formData[key as string]) {
          drawKeyValue(label as string, formatFieldValue(formData[key as string], suffix as string));
        }
      }
      y -= 5;
    }

    // Policies
    const polFields = [
      ["merchandise", "Merchandise", ""],
      ["recording_policy", "Recording Policy", ""],
      ["photography_policy", "Photography Policy", ""],
      ["social_media", "Social Media", ""],
      ["special_requirements", "Special Requirements", ""],
    ];
    const hasPol = polFields.some(([key]) => formData[key as string]);
    if (hasPol) {
      drawSectionHeader("POLICIES & SPECIAL REQUIREMENTS");
      for (const [key, label] of polFields) {
        if (formData[key as string]) {
          drawKeyValue(label as string, formatFieldValue(formData[key as string]));
        }
      }
      y -= 5;
    }

    // ===== SIGNATURES =====
    drawSectionHeader("SIGNATURES");
    y -= 5;

    // Artist Signature
    checkNewPage(80);
    page.drawText("Artist Signature", {
      x: margin + 10,
      y,
      size: 10,
      font: helveticaBold,
      color: colors.darkText,
    });
    y -= 16;

    if (artistSig) {
      // Draw signature box
      page.drawRectangle({
        x: margin + 10,
        y: y - 30,
        width: 200,
        height: 35,
        borderColor: colors.purple,
        borderWidth: 1,
        color: rgb(0.99, 0.98, 1),
      });

      // Render signature - use signer name as typed signature, or signatureData if it's text
      const artistSigText = (artistSig.signatureData && !artistSig.signatureData.startsWith("data:"))
        ? artistSig.signatureData
        : artistSig.signerName || "[Digital Signature on File]";
      page.drawText(String(artistSigText), {
        x: margin + 20,
        y: y - 20,
        size: 16,
        font: helveticaOblique,
        color: colors.purple,
      });
      y -= 40;

      page.drawText(`Signed by: ${artistSig.signerName || "Artist"}`, {
        x: margin + 10,
        y,
        size: 9,
        font: helvetica,
        color: colors.grayText,
      });
      y -= 14;
      page.drawText(`Date: ${artistSig.signedAt ? new Date(artistSig.signedAt).toLocaleString("en-US") : "N/A"}`, {
        x: margin + 10,
        y,
        size: 9,
        font: helvetica,
        color: colors.grayText,
      });
      y -= 14;
      page.drawText(`IP: ${artistSig.ipAddress || "recorded"}`, {
        x: margin + 10,
        y,
        size: 8,
        font: helvetica,
        color: colors.grayText,
      });
    } else {
      page.drawText("Not yet signed", {
        x: margin + 10,
        y,
        size: 9,
        font: helveticaOblique,
        color: colors.red,
      });
    }
    y -= 25;

    // Venue Signature
    checkNewPage(80);
    page.drawText("Venue Signature", {
      x: margin + 10,
      y,
      size: 10,
      font: helveticaBold,
      color: colors.darkText,
    });
    y -= 16;

    if (venueSig) {
      page.drawRectangle({
        x: margin + 10,
        y: y - 30,
        width: 200,
        height: 35,
        borderColor: colors.purple,
        borderWidth: 1,
        color: rgb(0.99, 0.98, 1),
      });

      const venueSigText = (venueSig.signatureData && !venueSig.signatureData.startsWith("data:"))
        ? venueSig.signatureData
        : venueSig.signerName || "[Digital Signature on File]";
      page.drawText(String(venueSigText), {
        x: margin + 20,
        y: y - 20,
        size: 16,
        font: helveticaOblique,
        color: colors.purple,
      });
      y -= 40;

      page.drawText(`Signed by: ${venueSig.signerName || "Venue"}`, {
        x: margin + 10,
        y,
        size: 9,
        font: helvetica,
        color: colors.grayText,
      });
      y -= 14;
      page.drawText(`Date: ${venueSig.signedAt ? new Date(venueSig.signedAt).toLocaleString("en-US") : "N/A"}`, {
        x: margin + 10,
        y,
        size: 9,
        font: helvetica,
        color: colors.grayText,
      });
      y -= 14;
      page.drawText(`IP: ${venueSig.ipAddress || "recorded"}`, {
        x: margin + 10,
        y,
        size: 8,
        font: helvetica,
        color: colors.grayText,
      });
    } else {
      page.drawText("Not yet signed", {
        x: margin + 10,
        y,
        size: 9,
        font: helveticaOblique,
        color: colors.red,
      });
    }
    y -= 25;

    // ===== FOOTER =====
    drawLine();
    checkNewPage(40);
    drawText("This document was generated by Ologywood and constitutes a legally binding agreement between the parties listed above.", {
      size: 8,
      color: colors.grayText,
    });
    drawText(`Generated: ${new Date().toLocaleString("en-US")}`, {
      size: 8,
      color: colors.grayText,
    });

    // Add page numbers to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((p, i) => {
      p.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: pageWidth - margin - 80,
        y: 30,
        size: 8,
        font: helvetica,
        color: colors.grayText,
      });
      p.drawText("Ologywood - Artist Booking Platform", {
        x: margin,
        y: 30,
        size: 8,
        font: helvetica,
        color: colors.grayText,
      });
    });

    // Save and send
    const pdfBytes = await pdfDoc.save();
    const filename = `rider-contract-booking-${bookingId}-${new Date().toISOString().split("T")[0]}.pdf`;

    console.log("[Contract PDF] Generated PDF:", filename, "Size:", pdfBytes.length, "bytes");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length.toString());
    res.send(Buffer.from(pdfBytes));

  } catch (error: any) {
    console.error("[Contract PDF] Error generating PDF:", error?.message || error, error?.stack);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
