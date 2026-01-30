import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export interface PaymentIntent {
  id: string;
  bookingId: number;
  artistId: number;
  venueId: number;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  paymentType: "full" | "deposit" | "installment";
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositPayment {
  id: string;
  bookingId: number;
  amount: number;
  percentage: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
}

export interface InstallmentPayment {
  id: string;
  bookingId: number;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
}

export class StripePaymentService {
  /**
   * Create payment intent for full payment
   */
  static async createFullPaymentIntent(
    bookingId: number,
    artistId: number,
    venueId: number,
    amount: number,
    artistEmail: string,
    venueName: string
  ): Promise<string> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId.toString(),
          artistId: artistId.toString(),
          venueId: venueId.toString(),
          paymentType: "full",
        },
        receipt_email: artistEmail,
        description: `Booking payment from ${venueName}`,
      });

      return paymentIntent.client_secret || "";
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  }

  /**
   * Create deposit payment
   */
  static async createDepositPayment(
    bookingId: number,
    totalAmount: number,
    depositPercentage: number = 50,
    dueDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ): Promise<DepositPayment> {
    try {
      const depositAmount = Math.round(totalAmount * (depositPercentage / 100));

      const deposit: DepositPayment = {
        id: `dep_${bookingId}_${Date.now()}`,
        bookingId,
        amount: depositAmount,
        percentage: depositPercentage,
        dueDate,
        status: "pending",
        createdAt: new Date(),
      };

      return deposit;
    } catch (error) {
      console.error("Error creating deposit payment:", error);
      throw error;
    }
  }

  /**
   * Create installment payments
   */
  static async createInstallmentPayments(
    bookingId: number,
    totalAmount: number,
    numberOfInstallments: number = 3
  ): Promise<InstallmentPayment[]> {
    try {
      const installmentAmount = Math.round(totalAmount / numberOfInstallments);
      const installments: InstallmentPayment[] = [];

      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + i * 30); // Monthly installments

        installments.push({
          id: `inst_${bookingId}_${i}`,
          bookingId,
          installmentNumber: i,
          totalInstallments: numberOfInstallments,
          amount: installmentAmount,
          dueDate,
          status: "pending",
          createdAt: new Date(),
        });
      }

      return installments;
    } catch (error) {
      console.error("Error creating installment payments:", error);
      throw error;
    }
  }

  /**
   * Process payment
   */
  static async processPayment(
    paymentIntentId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<boolean> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return paymentIntent.status === "succeeded";
    } catch (error) {
      console.error("Error processing payment:", error);
      return false;
    }
  }

  /**
   * Get payment intent status
   */
  static async getPaymentStatus(paymentIntentId: string): Promise<string> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status;
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return refund.status === "succeeded";
    } catch (error) {
      console.error("Error refunding payment:", error);
      return false;
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      return customer.id;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  /**
   * Create invoice
   */
  static async createInvoice(
    customerId: string,
    amount: number,
    description: string,
    dueDate: Date
  ): Promise<string> {
    try {
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: Math.ceil(
          (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      });

      // Add line item
      await stripe.invoiceItems.create({
        invoice: invoice.id,
        customer: customerId,
        amount: Math.round(amount * 100),
        description,
      });

      // Finalize and send invoice
      await stripe.invoices.finalizeInvoice(invoice.id);

      return invoice.id;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(customerId: string): Promise<any[]> {
    try {
      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 100,
      });

      return charges.data;
    } catch (error) {
      console.error("Error getting payment history:", error);
      return [];
    }
  }

  /**
   * Handle webhook event
   */
  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object);
          break;
        case "payment_intent.payment_failed":
          console.log("Payment failed:", event.data.object);
          break;
        case "invoice.payment_succeeded":
          console.log("Invoice paid:", event.data.object);
          break;
        case "invoice.payment_failed":
          console.log("Invoice payment failed:", event.data.object);
          break;
        default:
          console.log("Unhandled event type:", event.type);
      }
    } catch (error) {
      console.error("Error handling webhook:", error);
      throw error;
    }
  }

  /**
   * Calculate payment schedule
   */
  static calculatePaymentSchedule(
    totalAmount: number,
    depositPercentage: number = 50,
    numberOfInstallments: number = 2
  ): { deposit: number; installments: number[] } {
    const depositAmount = Math.round(totalAmount * (depositPercentage / 100));
    const remainingAmount = totalAmount - depositAmount;
    const installmentAmount = Math.round(remainingAmount / numberOfInstallments);

    const installments = Array(numberOfInstallments).fill(installmentAmount);
    // Adjust last installment for rounding
    installments[numberOfInstallments - 1] = remainingAmount - installmentAmount * (numberOfInstallments - 1);

    return {
      deposit: depositAmount,
      installments,
    };
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(amount: number): boolean {
    // Stripe minimum is $0.50 USD
    return amount >= 0.5;
  }

  /**
   * Get payment methods for customer
   */
  static async getPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return paymentMethods.data;
    } catch (error) {
      console.error("Error getting payment methods:", error);
      return [];
    }
  }

  /**
   * Save payment method
   */
  static async savePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      console.error("Error saving payment method:", error);
      throw error;
    }
  }
}
