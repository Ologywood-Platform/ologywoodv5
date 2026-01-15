import PDFDocument from 'pdfkit';
import { sendNotificationEmail, queueNotificationEmail } from './email-service';

interface InvoiceData {
  id: number;
  bookingId: number;
  artistName: string;
  artistEmail: string;
  venueName: string;
  venueEmail: string;
  eventDate: Date;
  eventTitle: string;
  amount: number;
  depositAmount: number;
  depositDueDate: Date;
  finalDueDate: Date;
  paymentTerms: string;
  notes?: string;
}

interface PaymentReminder {
  invoiceId: number;
  recipientEmail: string;
  recipientName: string;
  amount: number;
  dueDate: Date;
  reminderType: 'deposit' | 'final';
  daysBefore: number;
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Invoice details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: INV-${invoice.id}`, { align: 'right' });
    doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
    doc.moveDown();

    // From/To section
    doc.fontSize(12).font('Helvetica-Bold').text('FROM:');
    doc.fontSize(10).font('Helvetica');
    doc.text(invoice.artistName);
    doc.text(invoice.artistEmail);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:');
    doc.fontSize(10).font('Helvetica');
    doc.text(invoice.venueName);
    doc.text(invoice.venueEmail);
    doc.moveDown();

    // Event details
    doc.fontSize(12).font('Helvetica-Bold').text('EVENT DETAILS:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Event: ${invoice.eventTitle}`);
    doc.text(`Date: ${formatDate(invoice.eventDate)}`);
    doc.moveDown();

    // Line items table
    doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT BREAKDOWN:');
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 350;
    const col3 = 500;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', col1, tableTop);
    doc.text('Amount', col2, tableTop);
    doc.text('Due Date', col3, tableTop);

    // Horizontal line
    doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    doc.font('Helvetica');

    // Deposit line
    doc.text('Deposit (50%)', col1, currentY);
    doc.text(`$${invoice.depositAmount}`, col2, currentY);
    doc.text(formatDate(invoice.depositDueDate), col3, currentY);
    currentY += 20;

    // Final payment line
    const finalAmount = invoice.amount - invoice.depositAmount;
    doc.text('Final Payment (50%)', col1, currentY);
    doc.text(`$${finalAmount}`, col2, currentY);
    doc.text(formatDate(invoice.finalDueDate), col3, currentY);
    currentY += 20;

    // Total line
    doc.moveTo(col1, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    doc.font('Helvetica-Bold');
    doc.text('TOTAL', col1, currentY);
    doc.text(`$${invoice.amount}`, col2, currentY);

    doc.moveDown(3);

    // Payment terms
    doc.fontSize(10).font('Helvetica-Bold').text('PAYMENT TERMS:');
    doc.fontSize(9).font('Helvetica').text(invoice.paymentTerms);

    // Notes
    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('NOTES:');
      doc.fontSize(9).font('Helvetica').text(invoice.notes);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text('Thank you for booking with Ologywood!', { align: 'center' });

    doc.end();
  });
}

export async function sendInvoiceEmail(invoice: InvoiceData, pdfBuffer: Buffer): Promise<void> {
  const emailContent = `
    <h2>Invoice for ${invoice.eventTitle}</h2>
    <p>Please find your invoice attached.</p>
    
    <h3>Payment Details</h3>
    <ul>
      <li><strong>Total Amount:</strong> $${invoice.amount}</li>
      <li><strong>Deposit (50%):</strong> $${invoice.depositAmount} - Due ${formatDate(invoice.depositDueDate)}</li>
      <li><strong>Final Payment (50%):</strong> $${invoice.amount - invoice.depositAmount} - Due ${formatDate(invoice.finalDueDate)}</li>
    </ul>
    
    <p>Please make payment according to the payment terms specified in the invoice.</p>
  `;

  await sendNotificationEmail({
    type: 'payment',
    recipientEmail: invoice.venueEmail,
    recipientName: invoice.venueName,
    data: {
      bookingTitle: invoice.eventTitle,
      amount: invoice.amount,
      paymentDate: formatDate(new Date()),
      transactionId: `INV-${invoice.id}`,
    },
  });
}

export async function schedulePaymentReminders(invoice: InvoiceData): Promise<void> {
  const now = new Date();

  // Schedule deposit reminder (7 days before due date)
  const depositReminderDate = new Date(invoice.depositDueDate);
  depositReminderDate.setDate(depositReminderDate.getDate() - 7);

  if (depositReminderDate > now) {
    scheduleReminder({
      invoiceId: invoice.id,
      recipientEmail: invoice.venueEmail,
      recipientName: invoice.venueName,
      amount: invoice.depositAmount,
      dueDate: invoice.depositDueDate,
      reminderType: 'deposit',
      daysBefore: 7,
    });
  }

  // Schedule final payment reminder (7 days before due date)
  const finalReminderDate = new Date(invoice.finalDueDate);
  finalReminderDate.setDate(finalReminderDate.getDate() - 7);

  if (finalReminderDate > now) {
    scheduleReminder({
      invoiceId: invoice.id,
      recipientEmail: invoice.venueEmail,
      recipientName: invoice.venueName,
      amount: invoice.amount - invoice.depositAmount,
      dueDate: invoice.finalDueDate,
      reminderType: 'final',
      daysBefore: 7,
    });
  }

  // Schedule 1-day before reminder
  const oneDayBefore = new Date(invoice.depositDueDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  if (oneDayBefore > now) {
    scheduleReminder({
      invoiceId: invoice.id,
      recipientEmail: invoice.venueEmail,
      recipientName: invoice.venueName,
      amount: invoice.depositAmount,
      dueDate: invoice.depositDueDate,
      reminderType: 'deposit',
      daysBefore: 1,
    });
  }
}

function scheduleReminder(reminder: PaymentReminder): void {
  // In production, use a job queue like Bull or Agenda
  // For now, queue the reminder email
  const reminderType = reminder.reminderType === 'deposit' ? 'Deposit' : 'Final Payment';

  queueNotificationEmail({
    type: 'payment',
    recipientEmail: reminder.recipientEmail,
    recipientName: reminder.recipientName,
    data: {
      bookingTitle: `${reminderType} Reminder`,
      amount: reminder.amount,
      paymentDate: formatDate(reminder.dueDate),
      transactionId: `INV-${reminder.invoiceId}`,
    },
  });

  console.log(
    `[Invoice] Scheduled ${reminderType} reminder for ${reminder.recipientEmail} - Due ${formatDate(reminder.dueDate)}`
  );
}

export async function sendPaymentReminder(reminder: PaymentReminder): Promise<void> {
  const reminderType = reminder.reminderType === 'deposit' ? 'Deposit' : 'Final Payment';
  const daysUntilDue = Math.ceil(
    (reminder.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const emailContent = `
    <h2>${reminderType} Payment Reminder</h2>
    <p>This is a friendly reminder that your ${reminderType.toLowerCase()} of <strong>$${reminder.amount}</strong> is due on <strong>${formatDate(reminder.dueDate)}</strong> (in ${daysUntilDue} days).</p>
    
    <p>Please ensure payment is made by the due date to avoid any delays in event confirmation.</p>
    
    <p><a href="https://ologywood.com/payments" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Make Payment
    </a></p>
  `;

  await sendNotificationEmail({
    type: 'payment',
    recipientEmail: reminder.recipientEmail,
    recipientName: reminder.recipientName,
    data: {
      bookingTitle: `${reminderType} Due Soon`,
      amount: reminder.amount,
      paymentDate: formatDate(reminder.dueDate),
      transactionId: `INV-${reminder.invoiceId}`,
    },
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calculateDepositAmount(totalAmount: number, depositPercentage: number = 50): number {
  return Math.round((totalAmount * depositPercentage) / 100);
}
