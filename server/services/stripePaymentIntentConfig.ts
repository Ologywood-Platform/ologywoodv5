/**
 * PaymentIntents created by the server are confirmed by different client
 * surfaces. Keep redirect-capable methods disabled unless a flow explicitly
 * owns a return_url during confirmation.
 */
export const paymentIntentWithoutRedirects = {
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'never' as const,
  },
};
