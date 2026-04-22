/**
 * OTP delivery via smsc.kz API
 * Uses flash-call method: user receives a call, code = last 4 digits of caller number
 * Cheaper (5 тг) and doesn't require SMS sender registration
 * Docs: https://smsc.kz/api/
 */

const SMSC_LOGIN = process.env.SMSC_LOGIN ?? "";
const SMSC_PASSWORD = process.env.SMSC_PASSWORD ?? "";

interface OtpResult {
  ok: boolean;
  code?: string; // 4-digit code returned by smsc.kz
  error?: string;
}

/**
 * Send OTP via flash-call.
 * smsc.kz calls the phone and returns a 4-digit code
 * (last digits of the calling number).
 * The user sees a missed call and enters the code.
 */
export async function sendOtpCall(phone: string): Promise<OtpResult> {
  if (!SMSC_LOGIN || !SMSC_PASSWORD) {
    // Dev mode — generate fake code and log it
    const fakeCode = String(Math.floor(1000 + Math.random() * 9000));
    console.log(`[otp] DEV MODE — phone: ${phone}, code: ${fakeCode}`);
    return { ok: true, code: fakeCode };
  }

  // Normalize phone: remove spaces, dashes, parens
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  const params = new URLSearchParams({
    login: SMSC_LOGIN,
    psw: SMSC_PASSWORD,
    phones: cleanPhone,
    mes: "code",
    call: "1", // flash-call mode
    fmt: "3", // JSON response
  });

  try {
    const url = `https://smsc.kz/sys/send.php?${params.toString()}`;
    const res = await fetch(url);
    const text = await res.text();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[otp] failed to parse response:", text);
      return { ok: false, error: "Invalid response from OTP service" };
    }

    if (data.error) {
      console.error("[otp] smsc.kz error:", data.error, "code:", data.error_code);
      return { ok: false, error: String(data.error) };
    }

    // smsc.kz returns { id, cnt, code } on success
    const code = String(data.code ?? "");
    if (!code) {
      console.error("[otp] no code in response:", data);
      return { ok: false, error: "No code received" };
    }

    console.log("[otp] call sent, code:", code);
    return { ok: true, code };
  } catch (err) {
    console.error("[otp] fetch error:", err);
    return { ok: false, error: "OTP service unavailable" };
  }
}
