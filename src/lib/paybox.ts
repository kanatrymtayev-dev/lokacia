/**
 * PayBox.money payment integration for Lokacia.kz
 * Docs: https://paybox.money/docs
 *
 * Flow:
 * 1. Server calls initPayment() → gets redirect URL
 * 2. User redirects to PayBox payment page
 * 3. PayBox calls result_url (server-to-server) with payment result
 * 4. User redirects to success_url or failure_url
 */

import { createHash } from "crypto";

const PAYBOX_MERCHANT_ID = process.env.PAYBOX_MERCHANT_ID ?? "";
const PAYBOX_SECRET_KEY = process.env.PAYBOX_SECRET_KEY ?? "";
const PAYBOX_API_URL = "https://api.paybox.money";
const PAYBOX_MOCK = !PAYBOX_MERCHANT_ID || process.env.PAYBOX_MOCK === "true";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lokacia.kz";

/**
 * Calculate PayBox signature.
 * 1. Take all params except pg_sig
 * 2. Sort by key (ksort)
 * 3. Build string: "scriptName;value1;value2;...;SECRET_KEY"
 * 4. pg_sig = md5(that string)
 */
export function makeSignature(
  scriptName: string,
  params: Record<string, string>,
  secretKey: string = PAYBOX_SECRET_KEY
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig")
    .sort();
  const values = sorted.map((k) => params[k]);
  const str = [scriptName, ...values, secretKey].join(";");
  return createHash("md5").update(str).digest("hex");
}

/**
 * Verify PayBox callback signature.
 */
export function verifySignature(
  scriptName: string,
  params: Record<string, string>,
  secretKey: string = PAYBOX_SECRET_KEY
): boolean {
  const expected = makeSignature(scriptName, params, secretKey);
  return expected === params.pg_sig;
}

export interface InitPaymentInput {
  orderId: string; // booking ID or payment ID
  amount: number; // in KZT
  description: string;
  userPhone?: string;
  userEmail?: string;
}

export interface InitPaymentResult {
  ok: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
  mock?: boolean;
}

/**
 * Create a payment on PayBox and get redirect URL.
 */
export async function initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
  if (PAYBOX_MOCK) {
    // Mock mode — return fake payment ID and redirect to success
    const mockId = `mock_${Date.now()}`;
    console.log(`[paybox] MOCK payment: order=${input.orderId}, amount=${input.amount}, id=${mockId}`);
    return {
      ok: true,
      paymentId: mockId,
      redirectUrl: `${SITE_URL}/api/paybox/success?pg_order_id=${input.orderId}&pg_payment_id=${mockId}&mock=1`,
      mock: true,
    };
  }

  const salt = Math.random().toString(36).slice(2);

  const params: Record<string, string> = {
    pg_merchant_id: PAYBOX_MERCHANT_ID,
    pg_amount: String(input.amount),
    pg_currency: "KZT",
    pg_description: input.description,
    pg_order_id: input.orderId,
    pg_salt: salt,
    pg_result_url: `${SITE_URL}/api/paybox/result`,
    pg_success_url: `${SITE_URL}/api/paybox/success`,
    pg_failure_url: `${SITE_URL}/api/paybox/failure`,
    pg_language: "ru",
    pg_testing_mode: process.env.PAYBOX_TESTING === "1" ? "1" : "0",
  };

  if (input.userPhone) params.pg_user_phone = input.userPhone;
  if (input.userEmail) params.pg_user_contact_email = input.userEmail;

  params.pg_sig = makeSignature("init_payment.php", params);

  try {
    const body = new URLSearchParams(params);
    const res = await fetch(`${PAYBOX_API_URL}/init_payment.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await res.text();

    // Parse XML response
    const status = text.match(/<pg_status>(\w+)<\/pg_status>/)?.[1];
    const paymentId = text.match(/<pg_payment_id>(\d+)<\/pg_payment_id>/)?.[1];
    const redirectUrl = text.match(/<pg_redirect_url>([^<]+)<\/pg_redirect_url>/)?.[1];
    const errorDesc = text.match(/<pg_error_description>([^<]+)<\/pg_error_description>/)?.[1];

    if (status !== "ok" || !redirectUrl) {
      console.error("[paybox] init error:", errorDesc ?? text);
      return { ok: false, error: errorDesc ?? "Payment init failed" };
    }

    return {
      ok: true,
      paymentId: paymentId ?? undefined,
      redirectUrl: redirectUrl.replace(/&amp;/g, "&"),
    };
  } catch (err) {
    console.error("[paybox] fetch error:", err);
    return { ok: false, error: "Payment service unavailable" };
  }
}
