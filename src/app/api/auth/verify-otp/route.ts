import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createHash } from "crypto";

const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = (await req.json()) as {
      userId: string;
      code: string;
    };

    if (!userId || !code) {
      return NextResponse.json(
        { error: "userId and code required" },
        { status: 400 }
      );
    }

    // Get the latest unused, unexpired code for this user
    const { data: otpRow, error: fetchErr } = await supabaseAdmin
      .from("phone_otp_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !otpRow) {
      return NextResponse.json(
        { error: "Код не найден или истёк. Запросите новый." },
        { status: 400 }
      );
    }

    const row = otpRow as Record<string, unknown>;

    // Check attempts
    if ((row.attempts as number) >= MAX_ATTEMPTS) {
      // Mark as used (exhausted)
      await supabaseAdmin
        .from("phone_otp_codes")
        .update({ used: true })
        .eq("id", row.id);

      return NextResponse.json(
        { error: "Слишком много попыток. Запросите новый код." },
        { status: 429 }
      );
    }

    // Increment attempts
    await supabaseAdmin
      .from("phone_otp_codes")
      .update({ attempts: (row.attempts as number) + 1 })
      .eq("id", row.id);

    // Verify code
    const inputHash = hashCode(code.trim());
    if (inputHash !== row.code_hash) {
      const remaining = MAX_ATTEMPTS - (row.attempts as number) - 1;
      return NextResponse.json(
        { error: `Неверный код. Осталось попыток: ${remaining}` },
        { status: 400 }
      );
    }

    // Code is correct — mark as used
    await supabaseAdmin
      .from("phone_otp_codes")
      .update({ used: true })
      .eq("id", row.id);

    // Update profile: phone_verified = true, phone = verified phone
    const phone = row.phone as string;
    await supabaseAdmin
      .from("profiles")
      .update({
        phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ ok: true, phone });
  } catch (err) {
    console.error("[verify-otp] unexpected error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
