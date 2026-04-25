export interface CreatePaymentParams {
  /** Amount in tenge (integer) */
  amount: number;
  /** Booking ID used as order reference */
  orderId: string;
  /** Human-readable description */
  description: string;
  /** URL to redirect user after payment */
  returnUrl: string;
  /** Server-to-server callback URL for payment status */
  callbackUrl: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(
    params: CreatePaymentParams
  ): Promise<{ paymentUrl: string; paymentId: string }>;
  verifyPayment(paymentId: string): Promise<{ paid: boolean }>;
}
