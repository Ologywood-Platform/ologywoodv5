import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { BulkContractService, type BulkContractJob } from '../services/bulkContractService';

// In-memory storage for demo (replace with DB in production)
const bulkJobs = new Map<string, BulkContractJob>();

export const bulkContractRouter = router({
  /**
   * Create a new bulk contract job from CSV
   */
  createBulkJob: protectedProcedure
    .input(z.object({
      csvContent: z.string().min(1, 'CSV content is required'),
      templateId: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        // Parse CSV
        const bookings = BulkContractService.parseCSV(input.csvContent);

        if (bookings.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid bookings found in CSV',
          });
        }

        // Validate all bookings
        const validationErrors: Record<number, string[]> = {};
        let validBookings = 0;

        bookings.forEach((booking, index) => {
          const validation = BulkContractService.validateBooking(booking);
          if (!validation.valid) {
            validationErrors[index] = validation.errors;
          } else {
            validBookings++;
          }
        });

        if (validBookings === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid bookings in CSV',
          });
        }

        // Create job
        const job = BulkContractService.createJob(ctx.user.id, validBookings, input.templateId);
        bulkJobs.set(job.id, job);

        // Estimate processing time
        const estimate = BulkContractService.estimateProcessingTime(validBookings);

        return {
          success: true,
          job: {
            id: job.id,
            status: job.status,
            totalItems: job.totalItems,
            createdAt: job.createdAt,
          },
          validBookings,
          invalidBookings: bookings.length - validBookings,
          estimatedTime: estimate.formatted,
          validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
        };
      } catch (error) {
        console.error('Error creating bulk job:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bulk job',
        });
      }
    }),

  /**
   * Get bulk job status
   */
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(({ ctx, input }) => {
      try {
        const job = bulkJobs.get(input.jobId);

        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const progress = BulkContractService.getProgress(job);

        return {
          success: true,
          job: {
            id: job.id,
            status: job.status,
            progress,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
          },
        };
      } catch (error) {
        console.error('Error fetching job status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job status',
        });
      }
    }),

  /**
   * Get job results
   */
  getJobResults: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      filter: z.enum(['all', 'success', 'failed']).optional().default('all'),
    }))
    .query(({ ctx, input }) => {
      try {
        const job = bulkJobs.get(input.jobId);

        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        let results = job.results;

        if (input.filter === 'success') {
          results = results.filter((r) => r.status === 'success');
        } else if (input.filter === 'failed') {
          results = results.filter((r) => r.status === 'failed');
        }

        return {
          success: true,
          results: results.map((r) => ({
            id: r.id,
            bookingId: r.bookingId,
            status: r.status,
            contractUrl: r.contractUrl,
            errorMessage: r.errorMessage,
            generatedAt: r.generatedAt,
          })),
          total: results.length,
        };
      } catch (error) {
        console.error('Error fetching job results:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job results',
        });
      }
    }),

  /**
   * Get job history
   */
  getJobHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(({ ctx, input }) => {
      try {
        const userJobs = Array.from(bulkJobs.values())
          .filter((job) => job.userId === ctx.user.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, input.limit);

        return {
          success: true,
          jobs: userJobs.map((job) => ({
            id: job.id,
            status: job.status,
            totalItems: job.totalItems,
            processedItems: job.processedItems,
            failedItems: job.failedItems,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
          })),
          total: userJobs.length,
        };
      } catch (error) {
        console.error('Error fetching job history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job history',
        });
      }
    }),

  /**
   * Generate summary report
   */
  generateSummaryReport: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(({ ctx, input }) => {
      try {
        const job = bulkJobs.get(input.jobId);

        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const report = BulkContractService.generateSummaryReport(job);

        return {
          success: true,
          report,
        };
      } catch (error) {
        console.error('Error generating report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate report',
        });
      }
    }),

  /**
   * Generate download manifest
   */
  generateDownloadManifest: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(({ ctx, input }) => {
      try {
        const job = bulkJobs.get(input.jobId);

        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const manifest = BulkContractService.generateDownloadManifest(job);

        return {
          success: true,
          manifest,
        };
      } catch (error) {
        console.error('Error generating manifest:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate manifest',
        });
      }
    }),

  /**
   * Get CSV template
   */
  getCSVTemplate: protectedProcedure.query(() => {
    try {
      const template = BulkContractService.generateCSVTemplate();

      return {
        success: true,
        template,
        fileName: 'bulk_contracts_template.csv',
      };
    } catch (error) {
      console.error('Error generating CSV template:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate CSV template',
      });
    }
  }),

  /**
   * Get bulk operations statistics
   */
  getStatistics: protectedProcedure.query(({ ctx }) => {
    try {
      const userJobs = Array.from(bulkJobs.values()).filter((job) => job.userId === ctx.user.id);

      const stats = BulkContractService.getStatistics(userJobs);

      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch statistics',
      });
    }
  }),

  /**
   * Cancel bulk job
   */
  cancelJob: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        const job = bulkJobs.get(input.jobId);

        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        if (job.status === 'completed' || job.status === 'failed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot cancel a completed or failed job',
          });
        }

        job.status = 'failed';
        job.completedAt = new Date();

        return {
          success: true,
          message: 'Job cancelled',
        };
      } catch (error) {
        console.error('Error cancelling job:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel job',
        });
      }
    }),
});
