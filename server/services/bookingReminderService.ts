export const bookingReminderService = {
  async scheduleReminder(bookingId: number): Promise<void> {
    console.log(`[Reminder] Scheduled for booking ${bookingId}`);
  },

  async sendReminder(bookingId: number): Promise<void> {
    console.log(`[Reminder] Sent for booking ${bookingId}`);
  },

  async sendBulkReminders(): Promise<void> {
    console.log('[Reminder] Bulk reminders processed');
  },

  async cancelReminder(bookingId: number): Promise<void> {
    console.log(`[Reminder] Cancelled for booking ${bookingId}`);
  },
};
