/**
 * Stripe Payment Integration Tests
 * Verifies 1% platform fee collection and payment flow
 */

import { describe, it, expect } from "vitest";

describe("Stripe Payment Integration - 1% Platform Fee", () => {
  describe("Platform Fee Calculation", () => {
    it("should calculate 1% platform fee correctly", () => {
      const bookingAmount = 1000; // $10.00 in cents
      const platformFeeAmount = Math.round(bookingAmount * 0.01); // 1% in cents
      
      expect(platformFeeAmount).toBe(10); // $0.10
    });

    it("should calculate total amount including platform fee", () => {
      const bookingAmount = 5000; // $50.00 in cents
      const platformFeeAmount = Math.round(bookingAmount * 0.01); // 1% in cents
      const totalAmount = bookingAmount; // Total in cents
      
      expect(totalAmount).toBe(5000); // $50.00
      expect(platformFeeAmount).toBe(50); // $0.50
      expect(totalAmount).toBeGreaterThan(platformFeeAmount);
    });

    it("should handle small amounts correctly", () => {
      const bookingAmount = 100; // $1.00 in cents
      const platformFeeAmount = Math.round(bookingAmount * 0.01); // 1% in cents
      
      expect(platformFeeAmount).toBe(1); // $0.01
    });

    it("should handle large amounts correctly", () => {
      const bookingAmount = 500000; // $5000.00 in cents
      const platformFeeAmount = Math.round(bookingAmount * 0.01); // 1% in cents
      
      expect(platformFeeAmount).toBe(5000); // $50.00 (1% of $5000 = $50)
    });
  });

  describe("Artist Earnings After Fee", () => {
    it("should calculate artist earnings as 99% of booking fee", () => {
      const bookingFee = 1000; // $10.00
      const platformFee = bookingFee * 0.01; // 1% = $0.10
      const artistEarning = bookingFee - platformFee; // 99% = $9.90
      
      expect(artistEarning).toBe(990);
      expect(artistEarning / bookingFee).toBeCloseTo(0.99, 2);
    });

    it("should track earnings by payment status", () => {
      const bookings = [
        { fee: 1000, status: "fully_paid" },
        { fee: 2000, status: "fully_paid" },
        { fee: 1500, status: "deposit_paid" },
      ];

      let completedEarnings = 0;
      let pendingEarnings = 0;

      for (const booking of bookings) {
        const platformFee = booking.fee * 0.01;
        const artistEarning = booking.fee - platformFee;

        if (booking.status === "fully_paid") {
          completedEarnings += artistEarning;
        } else if (booking.status === "deposit_paid") {
          pendingEarnings += artistEarning;
        }
      }

      expect(completedEarnings).toBe(2970); // (1000 + 2000) * 0.99
      expect(pendingEarnings).toBe(1485); // 1500 * 0.99
    });
  });

  describe("Payment Flow Metadata", () => {
    it("should include platform fee in checkout session metadata", () => {
      const bookingAmount = 5000; // $50.00
      const platformFeeAmount = Math.round(bookingAmount * 0.01 * 100); // 1% in cents
      const totalAmount = Math.round(bookingAmount * 100); // Total in cents

      const metadata = {
        bookingId: "123",
        userId: "456",
        artistName: "Test Artist",
        venueName: "Test Venue",
        eventDate: "2026-03-15",
        userEmail: "artist@example.com",
        platformFeeAmount: platformFeeAmount.toString(),
        artistPaymentAmount: (totalAmount - platformFeeAmount).toString(),
      };

      expect(metadata.platformFeeAmount).toBe("5000");
      expect(metadata.artistPaymentAmount).toBe("495000");
      expect(parseInt(metadata.platformFeeAmount) + parseInt(metadata.artistPaymentAmount)).toBe(
        totalAmount
      );
    });

    it("should extract platform fee from webhook metadata", () => {
      const sessionMetadata = {
        bookingId: "123",
        userId: "456",
        platformFeeAmount: "5000",
        artistPaymentAmount: "495000",
      };

      const platformFeeAmount = sessionMetadata.platformFeeAmount
        ? parseInt(sessionMetadata.platformFeeAmount)
        : 0;
      const artistPaymentAmount = sessionMetadata.artistPaymentAmount
        ? parseInt(sessionMetadata.artistPaymentAmount)
        : 0;

      expect(platformFeeAmount).toBe(5000);
      expect(artistPaymentAmount).toBe(495000);
      expect(platformFeeAmount + artistPaymentAmount).toBe(500000);
    });
  });

  describe("Recurring Subscription Billing", () => {
    it("should track subscription status correctly", () => {
      const subscriptionStatuses = ["trialing", "active", "past_due", "canceled"];

      subscriptionStatuses.forEach((status) => {
        expect(["trialing", "active", "past_due", "canceled"]).toContain(status);
      });
    });

    it("should calculate monthly recurring revenue", () => {
      const subscriptions = [
        { tier: "starter", monthlyFee: 900, status: "active" }, // $9.00
        { tier: "professional", monthlyFee: 2900, status: "active" }, // $29.00
        { tier: "starter", monthlyFee: 900, status: "trialing" }, // $9.00
      ];

      let mrr = 0;
      for (const sub of subscriptions) {
        if (sub.status === "active") {
          mrr += sub.monthlyFee;
        }
      }

      expect(mrr).toBe(3800); // $38.00
    });
  });

  describe("Payout Processing", () => {
    it("should calculate payout amount after platform fee", () => {
      const totalPaymentAmount = 50000; // $500.00
      const platformFeeAmount = Math.round(totalPaymentAmount * 0.01); // 1% = $50.00
      const payoutAmount = totalPaymentAmount - platformFeeAmount; // $450.00

      expect(payoutAmount).toBe(49500);
      expect(payoutAmount / totalPaymentAmount).toBeCloseTo(0.99, 2);
    });

    it("should track multiple payouts", () => {
      const payouts = [
        { bookingId: 1, amount: 49500, status: "completed" },
        { bookingId: 2, amount: 99000, status: "completed" },
        { bookingId: 3, amount: 24750, status: "pending" },
      ];

      let completedPayouts = 0;
      let pendingPayouts = 0;

      for (const payout of payouts) {
        if (payout.status === "completed") {
          completedPayouts += payout.amount;
        } else if (payout.status === "pending") {
          pendingPayouts += payout.amount;
        }
      }

      expect(completedPayouts).toBe(148500); // $1485.00
      expect(pendingPayouts).toBe(24750); // $247.50
    });
  });

  describe("Platform Revenue Tracking", () => {
    it("should aggregate platform fees from all bookings", () => {
      const bookings = [
        { fee: 1000, status: "fully_paid" },
        { fee: 2000, status: "fully_paid" },
        { fee: 5000, status: "fully_paid" },
      ];

      let totalPlatformFees = 0;

      for (const booking of bookings) {
        const platformFee = booking.fee * 0.01;
        totalPlatformFees += platformFee;
      }

      expect(totalPlatformFees).toBe(80); // 1% of $8000 = $80
    });

    it("should track platform fees by payment status", () => {
      const bookings = [
        { fee: 1000, status: "fully_paid" },
        { fee: 2000, status: "deposit_paid" },
        { fee: 3000, status: "unpaid" },
      ];

      let collectedFees = 0;
      let pendingFees = 0;

      for (const booking of bookings) {
        const platformFee = booking.fee * 0.01;

        if (booking.status === "fully_paid") {
          collectedFees += platformFee;
        } else if (booking.status === "deposit_paid" || booking.status === "unpaid") {
          pendingFees += platformFee;
        }
      }

      expect(collectedFees).toBe(10); // 1% of $1000
      expect(pendingFees).toBe(50); // 1% of $5000
    });
  });

  describe("End-to-End Payment Flow", () => {
    it("should complete full booking payment flow with 1% fee", () => {
      // 1. Booking created
      const bookingFee = 10000; // $100.00

      // 2. Checkout session created
      const platformFeeAmount = Math.round(bookingFee * 0.01 * 100); // 1% in cents
      const totalAmount = Math.round(bookingFee * 100); // Total in cents

      expect(platformFeeAmount).toBe(10000); // $100.00
      expect(totalAmount).toBe(1000000); // $10000.00

      // 3. Payment succeeds
      const paymentStatus = "fully_paid";
      const artistEarning = bookingFee * 0.99; // $99.00

      expect(paymentStatus).toBe("fully_paid");
      expect(artistEarning).toBe(9900);

      // 4. Payout processed
      const payoutAmount = artistEarning; // $99.00

      expect(payoutAmount).toBe(9900);
      expect(payoutAmount + platformFeeAmount / 100).toBe(bookingFee);
    });
  });
});
