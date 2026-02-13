import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { taxReports, artistEarnings, artistPayouts } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const taxReportingRouter = router({
  /**
   * Get tax report for a specific year
   */
  getTaxReport: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        
        let report = await db.query.taxReports.findFirst({
          where: and(
            eq(taxReports.artistId, ctx.user.id),
            eq(taxReports.year, input.year)
          ),
        });

        // If no report exists, generate one
        if (!report) {
          report = await generateTaxReport(ctx.user.id, input.year);
        }

        return {
          success: true,
          data: {
            totalEarnings: report.totalEarnings,
            totalPayouts: report.totalPayouts,
            platformFees: report.platformFees,
            netIncome: report.netIncome,
            bookingCount: report.bookingCount,
            form1099Issued: report.form1099Issued,
            form1099Url: report.form1099Url,
            year: input.year,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get tax report',
        };
      }
    }),

  /**
   * Get monthly breakdown for a year
   */
  getMonthlyBreakdown: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        
        // Get all earnings for the year
        const earnings = await db.query.artistEarnings.findMany({
          where: eq(artistEarnings.artistId, ctx.user.id),
        });

        // Group by month
        const monthlyData: Record<string, any> = {};
        
        for (let month = 1; month <= 12; month++) {
          const monthEarnings = earnings.filter(e => {
            const date = new Date(e.createdAt);
            return date.getFullYear() === input.year && date.getMonth() + 1 === month;
          });

          const monthTotal = monthEarnings.reduce((sum, e) => sum + parseFloat(e.netAmount), 0);
          const monthFees = monthEarnings.reduce((sum, e) => sum + parseFloat(e.platformFee), 0);

          monthlyData[month] = {
            month: new Date(input.year, month - 1).toLocaleString('default', { month: 'short' }),
            earnings: monthTotal,
            fees: monthFees,
          };
        }

        return {
          success: true,
          data: Object.values(monthlyData),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get monthly breakdown',
        };
      }
    }),

  /**
   * Generate tax summary PDF
   */
  generateTaxSummaryPdf: protectedProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        
        const report = await db.query.taxReports.findFirst({
          where: and(
            eq(taxReports.artistId, ctx.user.id),
            eq(taxReports.year, input.year)
          ),
        });

        if (!report) {
          throw new Error('Tax report not found');
        }

        // In a real implementation, generate PDF using a library like pdfkit
        // For now, return a placeholder URL
        const pdfUrl = `/tax-reports/${ctx.user.id}-${input.year}.pdf`;

        return {
          success: true,
          data: {
            pdfUrl,
            fileName: `tax-summary-${input.year}.pdf`,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to generate tax summary PDF',
        };
      }
    }),

  /**
   * Get all tax reports for artist
   */
  getAllTaxReports: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        
        const reports = await db.query.taxReports.findMany({
          where: eq(taxReports.artistId, ctx.user.id),
        });

        return {
          success: true,
          data: reports.map(r => ({
            year: r.year,
            totalEarnings: r.totalEarnings,
            totalPayouts: r.totalPayouts,
            netIncome: r.netIncome,
            bookingCount: r.bookingCount,
            form1099Issued: r.form1099Issued,
          })),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get tax reports',
        };
      }
    }),
});

/**
 * Generate tax report for a specific year
 */
async function generateTaxReport(artistId: number, year: number) {
  const db = await getDb();
  
  // Get all earnings for the year
  const earnings = await db.query.artistEarnings.findMany({
    where: eq(artistEarnings.artistId, artistId),
  });

  // Filter by year
  const yearEarnings = earnings.filter(e => {
    const date = new Date(e.createdAt);
    return date.getFullYear() === year;
  });

  // Calculate totals
  const totalEarnings = yearEarnings.reduce((sum, e) => sum + parseFloat(e.grossAmount), 0);
  const platformFees = yearEarnings.reduce((sum, e) => sum + parseFloat(e.platformFee), 0);
  const totalPayouts = yearEarnings.reduce((sum, e) => sum + parseFloat(e.netAmount), 0);
  const netIncome = totalPayouts - platformFees;

  // Get payouts for the year
  const payouts = await db.query.artistPayouts.findMany({
    where: and(
      eq(artistPayouts.artistId, artistId),
      eq(artistPayouts.status, 'completed')
    ),
  });

  const yearPayouts = payouts.filter(p => {
    const date = new Date(p.completedAt || p.createdAt);
    return date.getFullYear() === year;
  });

  const totalPaidOut = yearPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  // Create tax report
  const report = await db.insert(taxReports).values({
    artistId,
    year,
    totalEarnings: totalEarnings.toString(),
    totalPayouts: totalPaidOut.toString(),
    platformFees: platformFees.toString(),
    netIncome: netIncome.toString(),
    bookingCount: yearEarnings.length,
    form1099Issued: totalEarnings >= 600, // IRS threshold
  });

  return {
    totalEarnings: totalEarnings.toString(),
    totalPayouts: totalPaidOut.toString(),
    platformFees: platformFees.toString(),
    netIncome: netIncome.toString(),
    bookingCount: yearEarnings.length,
    form1099Issued: totalEarnings >= 600,
  };
}
