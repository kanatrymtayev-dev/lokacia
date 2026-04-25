import { describe, it, expect } from "vitest";
import { createMockProvider } from "../payment-providers/mock";
import { getPaymentProvider } from "../payment-providers";

describe("createMockProvider", () => {
  const provider = createMockProvider("kaspi");

  it("has correct name", () => {
    expect(provider.name).toBe("kaspi");
  });

  it("createPayment returns paymentUrl with params", async () => {
    const result = await provider.createPayment({
      amount: 30000,
      orderId: "booking-123",
      description: "Test booking",
      returnUrl: "https://lokacia.kz/bookings",
      callbackUrl: "https://lokacia.kz/api/payments/callback",
    });

    expect(result.paymentUrl).toContain("https://lokacia.kz/bookings");
    expect(result.paymentUrl).toContain("payment=success");
    expect(result.paymentUrl).toContain("provider=kaspi");
    expect(result.paymentId).toMatch(/^mock_kaspi_/);
  });

  it("createPayment appends with & when returnUrl has query params", async () => {
    const result = await provider.createPayment({
      amount: 50000,
      orderId: "booking-456",
      description: "Test",
      returnUrl: "https://lokacia.kz/bookings?paid=booking-456",
      callbackUrl: "https://lokacia.kz/api/payments/callback",
    });

    expect(result.paymentUrl).toContain("&payment=success");
  });

  it("verifyPayment always returns paid: true", async () => {
    const result = await provider.verifyPayment("mock_kaspi_123");
    expect(result.paid).toBe(true);
  });
});

describe("getPaymentProvider", () => {
  it("returns provider with correct name for kaspi", () => {
    expect(getPaymentProvider("kaspi").name).toBe("kaspi");
  });

  it("returns provider with correct name for halyk_qr", () => {
    expect(getPaymentProvider("halyk_qr").name).toBe("halyk_qr");
  });

  it("returns provider with correct name for halyk_card", () => {
    expect(getPaymentProvider("halyk_card").name).toBe("halyk_card");
  });

  it("returns mock provider for unknown name", () => {
    expect(getPaymentProvider("unknown").name).toBe("mock");
  });
});
