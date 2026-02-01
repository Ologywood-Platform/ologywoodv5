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
  static async createNegotiation(bookingId: number, initiatedBy: "artist" | "venue", proposedDate?: string, proposedFee?: number, proposedPartySize?: number, notes?: string): Promise<BookingNegotiation> {
    return { id: 1, bookingId, initiatedBy, proposedDate, proposedFee, proposedPartySize, notes, status: "pending", createdAt: new Date(), updatedAt: new Date() };
  }

  static async createCounterOffer(negotiationId: number, proposedDate?: string, proposedFee?: number, proposedPartySize?: number, notes?: string): Promise<CounterOffer> {
    return { id: 1, negotiationId, proposedDate, proposedFee, proposedPartySize, notes, status: "pending", createdAt: new Date() };
  }

  static async acceptNegotiation(negotiationId: number): Promise<void> {}
  static async rejectNegotiation(negotiationId: number): Promise<void> {}
  static async getBookingNegotiations(bookingId: number): Promise<BookingNegotiation[]> { return []; }
  static async getNegotiationCounterOffers(negotiationId: number): Promise<CounterOffer[]> { return []; }
  static async getNegotiationSuccessRate(userId: number): Promise<number> { return 0; }
  static async getNegotiationHistory(userId: number, limit: number = 10): Promise<BookingNegotiation[]> { return []; }
  static async getPendingNegotiations(userId: number): Promise<BookingNegotiation[]> { return []; }

  static validateTerms(originalFee: number, proposedFee: number, maxDeviation: number = 20): { valid: boolean; message?: string } {
    return { valid: true };
  }

  static calculateImpact(originalFee: number, proposedFee: number, originalDate: string, proposedDate: string) {
    return { feeChange: 0, feeChangePercent: 0, dateChange: 0 };
  }
}
