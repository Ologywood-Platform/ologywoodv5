import { getDb } from "../db";
import { eq, and } from "drizzle-orm";

export interface BookingNegotiation {
  id: number;
  bookingId: number;
  initiatedBy: "artist" | "venue";
  proposedDate?: string;
  proposedFee?: number;
  proposedPartySize?: number;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  createdAt: Date;
  updatedAt: Date;
}

export interface CounterOffer {
  id: number;
  negotiationId: number;
  proposedDate?: string;
  proposedFee?: number;
  proposedPartySize?: number;
  notes?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export class BookingNegotiationService {
  /**
   * Create a booking negotiation request
   */
  static async createNegotiation(
    bookingId: number,
    initiatedBy: "artist" | "venue",
    proposedDate?: string,
    proposedFee?: number,
    proposedPartySize?: number,
    notes?: string
  ): Promise<BookingNegotiation> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const result = await db.insert({
        bookingId,
        initiatedBy,
        proposedDate: proposedDate || null,
        proposedFee: proposedFee || null,
        proposedPartySize: proposedPartySize || null,
        notes: notes || null,
        status: "pending",
      } as any);

      return {
        id: result.insertId as number,
        bookingId,
        initiatedBy,
        proposedDate,
        proposedFee,
        proposedPartySize,
        notes,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating negotiation:", error);
      throw error;
    }
  }

  /**
   * Create a counter-offer to a negotiation
   */
  static async createCounterOffer(
    negotiationId: number,
    proposedDate?: string,
    proposedFee?: number,
    proposedPartySize?: number,
    notes?: string
  ): Promise<CounterOffer> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const result = await db.insert({
        negotiationId,
        proposedDate: proposedDate || null,
        proposedFee: proposedFee || null,
        proposedPartySize: proposedPartySize || null,
        notes: notes || null,
        status: "pending",
      } as any);

      return {
        id: result.insertId as number,
        negotiationId,
        proposedDate,
        proposedFee,
        proposedPartySize,
        notes,
        status: "pending",
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating counter-offer:", error);
      throw error;
    }
  }

  /**
   * Accept a negotiation
   */
  static async acceptNegotiation(negotiationId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.update({
        status: "accepted",
        updatedAt: new Date(),
      } as any);
    } catch (error) {
      console.error("Error accepting negotiation:", error);
      throw error;
    }
  }

  /**
   * Reject a negotiation
   */
  static async rejectNegotiation(negotiationId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.update({
        status: "rejected",
        updatedAt: new Date(),
      } as any);
    } catch (error) {
      console.error("Error rejecting negotiation:", error);
      throw error;
    }
  }

  /**
   * Get negotiations for a booking
   */
  static async getBookingNegotiations(bookingId: number): Promise<BookingNegotiation[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const negotiations = await db.select().from({} as any);
      return negotiations || [];
    } catch (error) {
      console.error("Error getting negotiations:", error);
      return [];
    }
  }

  /**
   * Get counter-offers for a negotiation
   */
  static async getNegotiationCounterOffers(negotiationId: number): Promise<CounterOffer[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const counterOffers = await db.select().from({} as any);
      return counterOffers || [];
    } catch (error) {
      console.error("Error getting counter-offers:", error);
      return [];
    }
  }

  /**
   * Calculate negotiation success rate
   */
  static async getNegotiationSuccessRate(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    try {
      const negotiations = await db.select().from({} as any);
      if (negotiations.length === 0) return 0;

      const accepted = negotiations.filter((n: any) => n.status === "accepted").length;
      return (accepted / negotiations.length) * 100;
    } catch (error) {
      console.error("Error calculating success rate:", error);
      return 0;
    }
  }

  /**
   * Get negotiation history
   */
  static async getNegotiationHistory(userId: number, limit: number = 10): Promise<BookingNegotiation[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const negotiations = await db.select().from({} as any);
      return negotiations.slice(0, limit);
    } catch (error) {
      console.error("Error getting negotiation history:", error);
      return [];
    }
  }

  /**
   * Get pending negotiations
   */
  static async getPendingNegotiations(userId: number): Promise<BookingNegotiation[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const negotiations = await db.select().from({} as any);
      return negotiations.filter((n: any) => n.status === "pending") || [];
    } catch (error) {
      console.error("Error getting pending negotiations:", error);
      return [];
    }
  }

  /**
   * Validate negotiation terms
   */
  static validateTerms(
    originalFee: number,
    proposedFee: number,
    maxDeviation: number = 20
  ): { valid: boolean; message?: string } {
    const deviation = Math.abs((proposedFee - originalFee) / originalFee) * 100;
    
    if (deviation > maxDeviation) {
      return {
        valid: false,
        message: `Fee deviation of ${deviation.toFixed(1)}% exceeds maximum allowed ${maxDeviation}%`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate negotiation impact on booking
   */
  static calculateImpact(
    originalFee: number,
    proposedFee: number,
    originalDate: string,
    proposedDate: string
  ): {
    feeChange: number;
    feeChangePercent: number;
    dateChange: number;
  } {
    const feeChange = proposedFee - originalFee;
    const feeChangePercent = (feeChange / originalFee) * 100;
    
    const originalTime = new Date(originalDate).getTime();
    const proposedTime = new Date(proposedDate).getTime();
    const dateChange = Math.floor((proposedTime - originalTime) / (1000 * 60 * 60 * 24));

    return {
      feeChange,
      feeChangePercent,
      dateChange,
    };
  }
}
