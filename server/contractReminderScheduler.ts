import { contractNotificationService } from './contractNotificationService';

interface ScheduledReminder {
  contractId: string;
  artistEmail: string;
  artistName: string;
  venueEmail: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  contractUrl: string;
  remindersSent: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
  };
}

interface ReminderScheduleConfig {
  enableAutoReminders: boolean;
  reminderIntervals: number[]; // Days before event (e.g., [7, 3, 1])
  checkInterval: number; // Minutes between checks (default: 60)
  timezone: string; // Timezone for scheduling (default: 'UTC')
}

class ContractReminderScheduler {
  private reminders: Map<string, ScheduledReminder> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;
  private config: ReminderScheduleConfig = {
    enableAutoReminders: true,
    reminderIntervals: [7, 3, 1], // 7 days, 3 days, 1 day before event
    checkInterval: 60, // Check every hour
    timezone: 'UTC',
  };

  /**
   * Initialize the reminder scheduler
   */
  async initialize(config?: Partial<ReminderScheduleConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enableAutoReminders) {
      console.log('[ContractReminderScheduler] Auto reminders are disabled');
      return;
    }

    console.log('[ContractReminderScheduler] Initializing scheduler...');
    console.log(`[ContractReminderScheduler] Reminder intervals: ${this.config.reminderIntervals.join(', ')} days`);
    console.log(`[ContractReminderScheduler] Check interval: ${this.config.checkInterval} minutes`);

    // Start the scheduler
    this.startScheduler();
  }

  /**
   * Start the reminder scheduler
   */
  private startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Run immediately on startup
    this.checkAndSendReminders();

    // Then run at regular intervals
    this.schedulerInterval = setInterval(
      () => this.checkAndSendReminders(),
      this.config.checkInterval * 60 * 1000
    );

    console.log('[ContractReminderScheduler] Scheduler started');
  }

  /**
   * Stop the reminder scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('[ContractReminderScheduler] Scheduler stopped');
    }
  }

  /**
   * Register a contract for reminders
   */
  registerContract(reminder: ScheduledReminder): void {
    this.reminders.set(reminder.contractId, reminder);
    console.log(`[ContractReminderScheduler] Contract registered: ${reminder.contractId}`);
  }

  /**
   * Unregister a contract from reminders
   */
  unregisterContract(contractId: string): void {
    this.reminders.delete(contractId);
    console.log(`[ContractReminderScheduler] Contract unregistered: ${contractId}`);
  }

  /**
   * Get all registered contracts
   */
  getRegisteredContracts(): ScheduledReminder[] {
    return Array.from(this.reminders.values());
  }

  /**
   * Calculate days until event
   */
  private calculateDaysUntilEvent(eventDate: string): number {
    const event = new Date(eventDate);
    const now = new Date();
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check and send reminders
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      console.log(`[ContractReminderScheduler] Checking reminders at ${now.toISOString()}`);

      for (const [contractId, reminder] of this.reminders.entries()) {
        const daysUntilEvent = this.calculateDaysUntilEvent(reminder.eventDate);

        // Check each reminder interval
        for (const interval of this.config.reminderIntervals) {
          const reminderKey = this.getReminderKey(interval);

          // Check if this reminder should be sent
          if (daysUntilEvent === interval && !reminder.remindersSent[reminderKey]) {
            await this.sendReminder(reminder, daysUntilEvent);
            reminder.remindersSent[reminderKey] = true;
            this.reminders.set(contractId, reminder);
          }
        }

        // Clean up reminders for past events
        if (daysUntilEvent < -1) {
          this.unregisterContract(contractId);
        }
      }
    } catch (error) {
      console.error('[ContractReminderScheduler] Error checking reminders:', error);
    }
  }

  /**
   * Get reminder key for tracking
   */
  private getReminderKey(days: number): 'sevenDays' | 'threeDays' | 'oneDay' {
    switch (days) {
      case 7:
        return 'sevenDays';
      case 3:
        return 'threeDays';
      case 1:
        return 'oneDay';
      default:
        return 'sevenDays';
    }
  }

  /**
   * Send reminder notification
   */
  private async sendReminder(reminder: ScheduledReminder, daysUntilEvent: number): Promise<void> {
    try {
      console.log(
        `[ContractReminderScheduler] Sending ${daysUntilEvent}-day reminder for contract ${reminder.contractId}`
      );

      const result = await contractNotificationService.sendContractNotificationsToBothParties({
        artistEmail: reminder.artistEmail,
        artistName: reminder.artistName,
        venueEmail: reminder.venueEmail,
        venueName: reminder.venueName,
        eventDate: reminder.eventDate,
        eventTime: reminder.eventTime,
        contractUrl: reminder.contractUrl,
        notificationType: 'reminder',
        daysUntilEvent,
      });

      if (result.artist && result.venue) {
        console.log(
          `[ContractReminderScheduler] Reminder sent successfully for contract ${reminder.contractId}`
        );
      } else {
        console.warn(
          `[ContractReminderScheduler] Partial failure sending reminders for contract ${reminder.contractId}`
        );
      }
    } catch (error) {
      console.error(
        `[ContractReminderScheduler] Error sending reminder for contract ${reminder.contractId}:`,
        error
      );
    }
  }

  /**
   * Manually trigger reminders for specific contracts
   */
  async triggerManualReminders(contractIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const contractId of contractIds) {
      const reminder = this.reminders.get(contractId);
      if (!reminder) {
        console.warn(`[ContractReminderScheduler] Contract not found: ${contractId}`);
        failed++;
        continue;
      }

      try {
        const daysUntilEvent = this.calculateDaysUntilEvent(reminder.eventDate);
        await this.sendReminder(reminder, daysUntilEvent);
        success++;
      } catch (error) {
        console.error(`[ContractReminderScheduler] Error sending manual reminder for ${contractId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get reminder status for a contract
   */
  getReminderStatus(contractId: string): ScheduledReminder | undefined {
    return this.reminders.get(contractId);
  }

  /**
   * Get statistics about scheduled reminders
   */
  getStatistics(): {
    totalContracts: number;
    upcomingReminders: number;
    sentReminders: number;
    failedReminders: number;
  } {
    const stats = {
      totalContracts: this.reminders.size,
      upcomingReminders: 0,
      sentReminders: 0,
      failedReminders: 0,
    };

    for (const reminder of this.reminders.values()) {
      const daysUntilEvent = this.calculateDaysUntilEvent(reminder.eventDate);

      // Count upcoming reminders
      if (daysUntilEvent > 0 && daysUntilEvent <= 7) {
        stats.upcomingReminders++;
      }

      // Count sent reminders
      if (reminder.remindersSent.sevenDays || reminder.remindersSent.threeDays || reminder.remindersSent.oneDay) {
        stats.sentReminders++;
      }
    }

    return stats;
  }

  /**
   * Export reminders for backup/debugging
   */
  exportReminders(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      config: this.config,
      reminders: Array.from(this.reminders.values()),
      statistics: this.getStatistics(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import reminders from backup
   */
  importReminders(data: string): void {
    try {
      const parsed = JSON.parse(data);

      if (parsed.config) {
        this.config = { ...this.config, ...parsed.config };
      }

      if (parsed.reminders && Array.isArray(parsed.reminders)) {
        for (const reminder of parsed.reminders) {
          this.registerContract(reminder);
        }
      }

      console.log(`[ContractReminderScheduler] Imported ${parsed.reminders?.length || 0} reminders`);
    } catch (error) {
      console.error('[ContractReminderScheduler] Error importing reminders:', error);
      throw new Error('Failed to import reminders');
    }
  }
}

// Create singleton instance
export const contractReminderScheduler = new ContractReminderScheduler();

// Initialize on module load if enabled
if (process.env.ENABLE_CONTRACT_REMINDERS !== 'false') {
  contractReminderScheduler.initialize({
    enableAutoReminders: process.env.ENABLE_CONTRACT_REMINDERS !== 'false',
    reminderIntervals: [7, 3, 1],
    checkInterval: parseInt(process.env.REMINDER_CHECK_INTERVAL || '60', 10),
    timezone: process.env.TIMEZONE || 'UTC',
  });
}
