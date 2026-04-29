import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "Lokacia <hello@lokacia.kz>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lokacia.kz";

function buildHtml(subject: string, body: string): string {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#7c3aed;padding:18px 24px">
        <a href="${SITE}" style="color:#fff;font-weight:700;font-size:18px;text-decoration:none;letter-spacing:-0.01em">LOKACIA<span style="opacity:0.7">.KZ</span></a>
      </td></tr>
      <tr><td style="padding:28px 24px 8px">
        <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111827">${subject}</h1>
        <div style="font-size:14px;line-height:1.6;color:#374151">${body}</div>
      </td></tr>
      <tr><td style="padding:24px;border-top:1px solid #f3f4f6">
        <div style="font-size:11px;color:#9ca3af;line-height:1.5">
          Вы получили это письмо, потому что зарегистрированы на <a href="${SITE}" style="color:#7c3aed;text-decoration:none">LOKACIA.KZ</a>.<br/>
          Маркетплейс локаций для съёмок, мероприятий и встреч в Казахстане.
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Parse body
    const { subject, body, audience } = await req.json() as {
      subject: string;
      body: string;
      audience: "all" | "hosts" | "renters";
    };

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Тема и текст обязательны" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY не настроен" }, { status: 500 });
    }

    // Fetch recipients
    let query = supabaseAdmin
      .from("profiles")
      .select("id, name, role")
      .is("suspended", false)
      .is("deactivated_at", null);

    if (audience === "hosts") {
      query = query.eq("role", "host");
    } else if (audience === "renters") {
      query = query.eq("role", "renter");
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Get emails from auth.users
    const userIds = (profiles ?? []).map((p) => p.id);
    if (userIds.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map<string, string>();
    for (const u of authUsers?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email);
    }

    const recipients = userIds
      .map((id) => ({ id, email: emailMap.get(id) }))
      .filter((r): r is { id: string; email: string } => !!r.email);

    console.log(`[broadcast] Sending to ${recipients.length} recipients:`, recipients.map((r) => r.email));

    // Send emails with Resend (batch) — short notification email
    const resend = new Resend(API_KEY);
    const emailBody = `<p>Вам пришло новое сообщение от <strong>LOKACIA</strong>.</p>
      <p style="margin:14px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:13px">
        <strong>${subject}</strong><br/><br/>${body.replace(/\n/g, "<br/>")}
      </p>
      <p>Прочитайте на платформе.</p>`;
    const html = buildHtml("Новое сообщение от LOKACIA", emailBody);
    const plainText = `Вам пришло новое сообщение от LOKACIA.\n\n${subject}\n\n${body}\n\nПрочитайте на платформе: ${SITE}/inbox`;

    let sent = 0;
    let failed = 0;

    // Send in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((r) =>
          resend.emails.send({
            from: FROM,
            to: r.email,
            subject,
            html,
            text: plainText,
            replyTo: "hello@lokacia.kz",
          })
        )
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled" && !result.value.error) {
          sent++;
        } else {
          failed++;
          const reason = result.status === "rejected"
            ? (result.reason as Error)?.message
            : result.value?.error?.message;
          console.error(`[broadcast] Failed to send to ${batch[j]?.email}: ${reason}`);
        }
      }

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Save to history
    const { data: broadcastRecord } = await supabaseAdmin.from("broadcasts").insert({
      subject,
      body,
      audience,
      sent_count: sent,
      failed_count: failed,
      total_count: recipients.length,
      sent_by: user.id,
    }).select("id").single();

    // Create in-app notifications for all recipients
    const broadcastId = (broadcastRecord as Record<string, unknown>)?.id as string | undefined;
    const notificationRows = recipients.map((r) => ({
      user_id: r.id,
      title: subject,
      body,
      type: "broadcast" as const,
      broadcast_id: broadcastId ?? null,
      link: "/inbox",
    }));

    // Insert in batches of 100
    for (let i = 0; i < notificationRows.length; i += 100) {
      await supabaseAdmin.from("notifications").insert(notificationRows.slice(i, i + 100));
    }

    return NextResponse.json({ sent, failed, total: recipients.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
