import type { PaymentProvider, CreatePaymentParams } from "./types";

export function createMockProvider(providerName: string): PaymentProvider {
  return {
    name: providerName,

    async createPayment(params: CreatePaymentParams) {
      const paymentId = `mock_${providerName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const separator = params.returnUrl.includes("?") ? "&" : "?";
      const paymentUrl = `${params.returnUrl}${separator}payment=success&id=${paymentId}&provider=${providerName}`;

      return { paymentUrl, paymentId };
    },

    async verifyPayment(_paymentId: string) {
      return { paid: true };
    },
  };
}
