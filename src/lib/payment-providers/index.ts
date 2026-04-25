import type { PaymentProvider } from "./types";
import { createMockProvider } from "./mock";

// When real API keys are available, replace mock with real providers:
// import { createKaspiProvider } from "./kaspi";
// import { createHalykProvider } from "./halyk";

export function getPaymentProvider(name: string): PaymentProvider {
  switch (name) {
    case "kaspi":
      // TODO: replace with real Kaspi Pay provider when API keys are ready
      return createMockProvider("kaspi");

    case "halyk_qr":
      // TODO: replace with real Halyk QR provider
      return createMockProvider("halyk_qr");

    case "halyk_card":
      // TODO: replace with real Halyk ePay card provider
      return createMockProvider("halyk_card");

    case "mock":
      return createMockProvider("mock");

    default:
      return createMockProvider("mock");
  }
}

export type { PaymentProvider, CreatePaymentParams } from "./types";
