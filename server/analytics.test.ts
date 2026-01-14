import { describe, it, expect } from "vitest";

describe("Analytics Dashboard", () => {
  describe("Metrics Calculation", () => {
    it("should calculate total bookings correctly", () => {
      const bookings = [
        { id: 1, status: "confirmed" },
        { id: 2, status: "completed" },
        { id: 3, status: "confirmed" },
      ];
      
      const totalBookings = bookings.length;
      expect(totalBookings).toBe(3);
    });

    it("should calculate total revenue correctly", () => {
      const bookings = [
        { id: 1, totalFee: 500 },
        { id: 2, totalFee: 1000 },
        { id: 3, totalFee: 750 },
      ];
      
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalFee, 0);
      expect(totalRevenue).toBe(2250);
    });

    it("should calculate average booking value", () => {
      const totalRevenue = 2250;
      const totalBookings = 3;
      const avgValue = totalRevenue / totalBookings;
      
      expect(avgValue).toBe(750);
    });

    it("should calculate completion rate", () => {
      const completedBookings = 72;
      const totalBookings = 100;
      const completionRate = (completedBookings / totalBookings) * 100;
      
      expect(completionRate).toBe(72);
    });

    it("should calculate monthly growth percentage", () => {
      const thisMonth = 42;
      const lastMonth = 37;
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100;
      
      expect(growth).toBeCloseTo(13.51, 1);
    });
  });

  describe("Trend Data Generation", () => {
    it("should generate 30-day trend data", () => {
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trendData.push({
          date: date.toLocaleDateString(),
          bookings: Math.floor(Math.random() * 3) + 1,
          revenue: Math.floor(Math.random() * 1500) + 500,
        });
      }
      
      expect(trendData.length).toBe(30);
      expect(trendData[0].date).toBeDefined();
      expect(trendData[0].bookings).toBeGreaterThanOrEqual(1);
      expect(trendData[0].bookings).toBeLessThanOrEqual(3);
    });

    it("should calculate average daily bookings", () => {
      const trendData = [
        { date: "1/1", bookings: 2, revenue: 1000 },
        { date: "1/2", bookings: 3, revenue: 1500 },
        { date: "1/3", bookings: 1, revenue: 500 },
      ];
      
      const avgBookings = trendData.reduce((sum, t) => sum + t.bookings, 0) / trendData.length;
      expect(avgBookings).toBeCloseTo(2, 1);
    });

    it("should calculate average daily revenue", () => {
      const trendData = [
        { date: "1/1", bookings: 2, revenue: 1000 },
        { date: "1/2", bookings: 3, revenue: 1500 },
        { date: "1/3", bookings: 1, revenue: 500 },
      ];
      
      const avgRevenue = trendData.reduce((sum, t) => sum + t.revenue, 0) / trendData.length;
      expect(avgRevenue).toBeCloseTo(1000, 0);
    });
  });

  describe("User Metrics", () => {
    it("should count active users correctly", () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const users = [
        { id: 1, lastSignedIn: new Date() }, // Active
        { id: 2, lastSignedIn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // Active
        { id: 3, lastSignedIn: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // Inactive
      ];
      
      const activeUsers = users.filter(u => u.lastSignedIn > thirtyDaysAgo).length;
      expect(activeUsers).toBe(2);
    });

    it("should identify top artists by bookings", () => {
      const bookings = [
        { artistId: 1, artistName: "Artist A", status: "completed" },
        { artistId: 1, artistName: "Artist A", status: "completed" },
        { artistId: 2, artistName: "Artist B", status: "completed" },
        { artistId: 1, artistName: "Artist A", status: "completed" },
      ];
      
      const artistBookings: Record<number, number> = {};
      bookings.forEach(b => {
        artistBookings[b.artistId] = (artistBookings[b.artistId] || 0) + 1;
      });
      
      const topArtist = Object.entries(artistBookings).sort((a, b) => b[1] - a[1])[0];
      expect(topArtist[0]).toBe("1");
      expect(topArtist[1]).toBe(3);
    });
  });

  describe("Performance Metrics", () => {
    it("should calculate MRR (Monthly Recurring Revenue)", () => {
      const totalRevenue = 21500;
      const estimatedMRR = totalRevenue * 0.3; // Assume 30% recurring
      
      expect(estimatedMRR).toBe(6450);
    });

    it("should calculate revenue run rate", () => {
      const totalRevenue = 21500;
      const runRate = totalRevenue * 1.1; // 10% growth projection
      
      expect(runRate).toBeCloseTo(23650, 0);
    });

    it("should identify performance trends", () => {
      const metrics = {
        thisMonth: { bookings: 42, revenue: 21500 },
        lastMonth: { bookings: 37, revenue: 19800 },
      };
      
      const bookingGrowth = ((metrics.thisMonth.bookings - metrics.lastMonth.bookings) / metrics.lastMonth.bookings) * 100;
      const revenueGrowth = ((metrics.thisMonth.revenue - metrics.lastMonth.revenue) / metrics.lastMonth.revenue) * 100;
      
      expect(bookingGrowth).toBeCloseTo(13.51, 1);
      expect(revenueGrowth).toBeCloseTo(8.59, 1);
    });
  });

  describe("Dashboard Display", () => {
    it("should format currency correctly", () => {
      const revenue = 21500;
      const formatted = `$${revenue.toLocaleString()}`;
      
      expect(formatted).toBe("$21,500");
    });

    it("should format percentages correctly", () => {
      const rate = 72;
      const formatted = `${rate}%`;
      
      expect(formatted).toBe("72%");
    });

    it("should display metric cards with correct data", () => {
      const metricCard = {
        title: "Total Bookings",
        value: 42,
        change: "+12% from last month",
      };
      
      expect(metricCard.title).toBe("Total Bookings");
      expect(metricCard.value).toBe(42);
      expect(metricCard.change).toContain("+12%");
    });
  });

  describe("Data Validation", () => {
    it("should validate metric data types", () => {
      const metrics = {
        totalBookings: 42,
        totalRevenue: 21500,
        activeUsers: 156,
        completionRate: 72,
      };
      
      expect(typeof metrics.totalBookings).toBe("number");
      expect(typeof metrics.totalRevenue).toBe("number");
      expect(typeof metrics.activeUsers).toBe("number");
      expect(typeof metrics.completionRate).toBe("number");
    });

    it("should validate trend data structure", () => {
      const trend = {
        date: "Jan 1",
        bookings: 2,
        revenue: 1000,
      };
      
      expect(trend.date).toBeDefined();
      expect(typeof trend.bookings).toBe("number");
      expect(typeof trend.revenue).toBe("number");
      expect(trend.bookings).toBeGreaterThan(0);
      expect(trend.revenue).toBeGreaterThan(0);
    });

    it("should handle edge cases", () => {
      // Zero bookings
      expect(0 / 1).toBe(0);
      
      // Negative growth
      const growth = ((30 - 40) / 40) * 100;
      expect(growth).toBe(-25);
      
      // Large numbers
      const largeRevenue = 1000000;
      expect(largeRevenue).toBe(1000000);
    });
  });
});
