import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendOtpCall } from "@/lib/sms";
import { createHash } from "crypto";

const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 60;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { userId, phone } = (await req.json()) as {
      userId: string;
      phone: string;
    };

    if (!userId || !phone) {
      return NextResponse.json(
        { error: "userId and phone required" },
        { status: 400 }
      );
    }

    // Normalize phone
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (!/^\+?[78]\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Неверный формат телефона. Используйте +7XXXXXXXXXX" },
        { status: 400 }
      );
    }

    // Rate limit: check if there's a recent unexpired code for this user
    const { data: recent } = await supabaseAdmin
      .from("phone_otp_codes")
      .select("created_at")
      .eq("user_id", userId)
      .eq("used", false)
      .gte(
        "created_at",
        new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000).toISOString()
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: "Подождите минуту перед повторным звонком" },
        { status: 429 }
      );
    }

    // Send OTP call — smsc.kz generates the code and calls the user
    const callResult = await sendOtpCall(cleanPhone);

    if (!callResult.ok || !callResult.code) {
      return NextResponse.json(
        { error: "Не удалось совершить звонок. Попробуйте позже." },
        { status: 502 }
      );
    }

    const codeHash = hashCode(callResult.code);

    // Invalidate previous unused codes for this user
    await supabaseAdmin
      .from("phone_otp_codes")
      .update({ used: true })
      .eq("user_id", userId)
      .eq("used", false);

    // Insert new code
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const { error: insertErr } = await supabaseAdmin
      .from("phone_otp_codes")
      .insert({
        user_id: userId,
        phone: cleanPhone,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertErr) {
      console.error("[send-otp] insert error:", insertErr);
      return NextResponse.json(
        { error: "Ошибка сервера" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      method: "call", // inform frontend it's a call, not SMS
    });
  } catch (err) {
    console.error("[send-otp] unexpected error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
