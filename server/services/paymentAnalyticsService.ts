export interface RevenueData {
  period: string;
  amount: number;
  transactionCount: number;
}

export interface ArtistRevenue {
  artistId: string;
  artistName: string;
  totalRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
}

export interface VenueRevenue {
  venueId: string;
  venueName: string;
  totalSpent: number;
  bookingCount: number;
  averageBookingCost: number;
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

class PaymentAnalyticsService {
  async getRevenueTrends(): Promise<RevenueData[]> {
    return [];
  }

  async getTopArtistsByRevenue(): Promise<ArtistRevenue[]> {
    return [];
  }

  async getTopVenuesBySpending(): Promise<VenueRevenue[]> {
    return [];
  }

  async getAnalyticsPeriods(): Promise<AnalyticsPeriod[]> {
    return [];
  }
}

export const paymentAnalyticsService = new PaymentAnalyticsService();
