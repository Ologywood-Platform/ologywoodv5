/**
 * Bulk Contract Operations Service
 * Handles batch contract generation, import, and management
 */

export interface BulkContractJob {
  id: string;
  userId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  templateId?: string;
  results: BulkContractResult[];
}

export interface BulkContractResult {
  id: string;
  bookingId: number;
  status: 'success' | 'failed';
  contractUrl?: string;
  errorMessage?: string;
  generatedAt: Date;
}

export interface BookingImportData {
  artistName: string;
  artistEmail: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  eventTime: string;
  totalFee: number;
  templateId?: string;
}

export class BulkContractService {
  /**
   * Create a new bulk contract job
   */
  static createJob(userId: number, totalItems: number, templateId?: string): BulkContractJob {
    return {
      id: `job_${userId}_${Date.now()}`,
      userId,
      status: 'pending',
      totalItems,
      processedItems: 0,
      failedItems: 0,
      createdAt: new Date(),
      templateId,
      results: [],
    };
  }

  /**
   * Add result to job
   */
  static addResult(job: BulkContractJob, result: BulkContractResult): void {
    job.results.push(result);
    job.processedItems++;

    if (result.status === 'failed') {
      job.failedItems++;
    }
  }

  /**
   * Start job processing
   */
  static startJob(job: BulkContractJob): void {
    job.status = 'processing';
    job.startedAt = new Date();
  }

  /**
   * Complete job
   */
  static completeJob(job: BulkContractJob, success: boolean = true): void {
    job.status = success ? 'completed' : 'failed';
    job.completedAt = new Date();
  }

  /**
   * Calculate job progress
   */
  static getProgress(job: BulkContractJob): {
    percentage: number;
    processed: number;
    total: number;
    remaining: number;
  } {
    const percentage = Math.round((job.processedItems / job.totalItems) * 100);
    const remaining = job.totalItems - job.processedItems;

    return {
      percentage,
      processed: job.processedItems,
      total: job.totalItems,
      remaining,
    };
  }

  /**
   * Parse CSV booking data
   */
  static parseCSV(csvContent: string): BookingImportData[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: BookingImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());

      if (values.length < 7) continue; // Skip incomplete rows

      const artistNameIdx = headers.indexOf('artist name');
      const artistEmailIdx = headers.indexOf('artist email');
      const venueNameIdx = headers.indexOf('venue name');
      const venueAddressIdx = headers.indexOf('venue address');
      const eventDateIdx = headers.indexOf('event date');
      const eventTimeIdx = headers.indexOf('event time');
      const totalFeeIdx = headers.indexOf('total fee');
      const templateIdIdx = headers.indexOf('template id');

      data.push({
        artistName: values[artistNameIdx] || '',
        artistEmail: values[artistEmailIdx] || '',
        venueName: values[venueNameIdx] || '',
        venueAddress: values[venueAddressIdx] || '',
        eventDate: values[eventDateIdx] || '',
        eventTime: values[eventTimeIdx] || '',
        totalFee: parseFloat(values[totalFeeIdx]) || 0,
        templateId: values[templateIdIdx],
      });
    }

    return data;
  }

  /**
   * Validate booking data
   */
  static validateBooking(booking: BookingImportData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!booking.artistName || booking.artistName.length === 0) {
      errors.push('Artist name is required');
    }

    if (!booking.artistEmail || !booking.artistEmail.includes('@')) {
      errors.push('Valid artist email is required');
    }

    if (!booking.venueName || booking.venueName.length === 0) {
      errors.push('Venue name is required');
    }

    if (!booking.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(booking.eventDate)) {
      errors.push('Valid event date (YYYY-MM-DD) is required');
    }

    if (!booking.eventTime || !/^\d{2}:\d{2}$/.test(booking.eventTime)) {
      errors.push('Valid event time (HH:MM) is required');
    }

    if (booking.totalFee <= 0) {
      errors.push('Total fee must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate CSV template
   */
  static generateCSVTemplate(): string {
    const headers = [
      'Artist Name',
      'Artist Email',
      'Venue Name',
      'Venue Address',
      'Event Date',
      'Event Time',
      'Total Fee',
      'Template ID',
    ];

    const exampleRow = [
      'John Doe',
      'john@example.com',
      'The Grand Theater',
      '123 Main St, New York, NY',
      '2026-03-15',
      '19:00',
      '5000',
      'template_rock',
    ];

    return `${headers.join(',')}\n${exampleRow.join(',')}`;
  }

  /**
   * Generate job summary report
   */
  static generateSummaryReport(job: BulkContractJob): string {
    const duration = job.completedAt && job.startedAt ? 
      Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000) : 0;

    let report = `BULK CONTRACT JOB SUMMARY\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `Job ID: ${job.id}\n`;
    report += `Status: ${job.status.toUpperCase()}\n`;
    report += `Created: ${job.createdAt.toISOString()}\n`;

    if (job.startedAt) {
      report += `Started: ${job.startedAt.toISOString()}\n`;
    }

    if (job.completedAt) {
      report += `Completed: ${job.completedAt.toISOString()}\n`;
      report += `Duration: ${duration} seconds\n`;
    }

    report += `\nProcessing Summary:\n`;
    report += `-`.repeat(50) + '\n';
    report += `Total Items: ${job.totalItems}\n`;
    report += `Processed: ${job.processedItems}\n`;
    report += `Successful: ${job.processedItems - job.failedItems}\n`;
    report += `Failed: ${job.failedItems}\n`;
    report += `Success Rate: ${job.processedItems > 0 ? ((((job.processedItems - job.failedItems) / job.processedItems) * 100).toFixed(2)) : 0}%\n`;

    if (job.results.length > 0) {
      report += `\nDetailed Results:\n`;
      report += `-`.repeat(50) + '\n';

      job.results.forEach((result, index) => {
        report += `\n${index + 1}. Booking #${result.bookingId}\n`;
        report += `   Status: ${result.status.toUpperCase()}\n`;

        if (result.status === 'success' && result.contractUrl) {
          report += `   Contract: ${result.contractUrl}\n`;
        }

        if (result.status === 'failed' && result.errorMessage) {
          report += `   Error: ${result.errorMessage}\n`;
        }

        report += `   Generated: ${result.generatedAt.toISOString()}\n`;
      });
    }

    return report;
  }

  /**
   * Generate download manifest
   */
  static generateDownloadManifest(job: BulkContractJob): string {
    let manifest = `BULK CONTRACT DOWNLOAD MANIFEST\n`;
    manifest += `Generated: ${new Date().toISOString()}\n`;
    manifest += `Job ID: ${job.id}\n\n`;

    manifest += `Successful Contracts (${job.processedItems - job.failedItems}):\n`;
    manifest += `-`.repeat(50) + '\n';

    job.results
      .filter((r) => r.status === 'success')
      .forEach((result) => {
        manifest += `${result.contractUrl}\n`;
      });

    if (job.failedItems > 0) {
      manifest += `\nFailed Contracts (${job.failedItems}):\n`;
      manifest += `-`.repeat(50) + '\n';

      job.results
        .filter((r) => r.status === 'failed')
        .forEach((result) => {
          manifest += `Booking #${result.bookingId}: ${result.errorMessage}\n`;
        });
    }

    return manifest;
  }

  /**
   * Estimate processing time
   */
  static estimateProcessingTime(itemCount: number, avgTimePerItem: number = 2): {
    estimated: number;
    formatted: string;
  } {
    const estimated = itemCount * avgTimePerItem; // in seconds
    const minutes = Math.ceil(estimated / 60);
    const formatted = minutes < 60 ? `${minutes} minutes` : `${(minutes / 60).toFixed(1)} hours`;

    return {
      estimated,
      formatted,
    };
  }

  /**
   * Get job statistics
   */
  static getStatistics(jobs: BulkContractJob[]): {
    totalJobs: number;
    completedJobs: number;
    totalContracts: number;
    successfulContracts: number;
    failedContracts: number;
    averageSuccessRate: number;
  } {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((j) => j.status === 'completed').length;
    const totalContracts = jobs.reduce((sum, j) => sum + j.totalItems, 0);
    const successfulContracts = jobs.reduce((sum, j) => sum + (j.processedItems - j.failedItems), 0);
    const failedContracts = jobs.reduce((sum, j) => sum + j.failedItems, 0);
    const averageSuccessRate = totalContracts > 0 ? (successfulContracts / totalContracts) * 100 : 0;

    return {
      totalJobs,
      completedJobs,
      totalContracts,
      successfulContracts,
      failedContracts,
      averageSuccessRate,
    };
  }
}
