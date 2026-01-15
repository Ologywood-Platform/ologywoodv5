import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

// Mock contract data for now - in production this would query the database
const mockContracts: Record<number, any> = {
  5: {
    id: 5,
    bookingId: 1,
    status: "pending",
    content: `BOOKING CONTRACT

This Booking Contract ("Contract") is entered into as of the date of acceptance between:

ARTIST: [Artist Name]
VENUE: [Venue Name]

TERMS AND CONDITIONS:

1. BOOKING DETAILS
   - Event Date: [Date]
   - Event Time: [Time]
   - Location: [Venue Address]
   - Performance Duration: [Duration]

2. COMPENSATION
   - Performance Fee: [Amount]
   - Payment Terms: [Terms]
   - Deposit Required: [Deposit Amount]

3. TECHNICAL REQUIREMENTS
   - Sound System: [Requirements]
   - Lighting: [Requirements]
   - Stage Setup: [Requirements]

4. CANCELLATION POLICY
   - Artist Cancellation: [Policy]
   - Venue Cancellation: [Policy]
   - Refund Terms: [Terms]

5. LIABILITY AND INSURANCE
   - Artist Liability: [Details]
   - Venue Liability: [Details]

6. GENERAL TERMS
   - This contract constitutes the entire agreement between the parties
   - Any modifications must be made in writing
   - This contract is governed by applicable law

By signing below, both parties agree to the terms and conditions outlined in this contract.`,
    createdAt: new Date("2026-01-15"),
    signedAt: null,
    signatures: [],
  },
};

export const contractRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const contract = mockContracts[input.id];
      if (!contract) {
        throw new Error("Contract not found");
      }
      return contract;
    }),

  getByBookingId: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(({ input, ctx }) => {
      // In production, query database for contracts related to this booking
      // For now, return mock data if it matches
      return Object.values(mockContracts).filter(
        (c) => c.bookingId === input.bookingId
      );
    }),

  list: protectedProcedure.query(({ ctx }) => {
    // In production, query database for user's contracts
    return Object.values(mockContracts);
  }),

  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        content: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      // In production, save to database
      const newContract = {
        id: Math.max(...Object.keys(mockContracts).map(Number)) + 1,
        ...input,
        status: "pending",
        createdAt: new Date(),
        signedAt: null,
        signatures: [],
      };
      mockContracts[newContract.id] = newContract;
      return newContract;
    }),

  sign: protectedProcedure
    .input(
      z.object({
        contractId: z.number(),
        signerName: z.string(),
        signerEmail: z.string().email(),
        signatureImage: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const contract = mockContracts[input.contractId];
      if (!contract) {
        throw new Error("Contract not found");
      }

      // Add signature
      if (!contract.signatures) {
        contract.signatures = [];
      }

      contract.signatures.push({
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signatureImage: input.signatureImage,
        signedAt: new Date(),
      });

      // Update contract status if all parties have signed
      if (contract.signatures.length >= 2) {
        contract.status = "signed";
        contract.signedAt = new Date();
      }

      return contract;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => {
      delete mockContracts[input.id];
      return { success: true };
    }),
});
