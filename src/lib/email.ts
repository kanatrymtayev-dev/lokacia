// Email-уведомления через Resend.
// Если RESEND_API_KEY не задан — функции тихо логируют warn и не падают.
// Получить ключ: https://resend.com → API Keys. Бесплатно 100 писем/день, 3000/мес.

import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "Lokacia <hello@lokacia.kz>";
const SITE = "https://lokacia.kz";

const client = API_KEY ? new Resend(API_KEY) : null;

type SendResult = { ok: true; id?: string } | { ok: false; skipped?: true; error?: string };

async function send({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  if (!client) {
    console.warn("[email] RESEND_API_KEY не задан — письмо не отправлено:", subject);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      replyTo: "hello@lokacia.kz",
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email] send exception:", msg);
    return { ok: false, error: msg };
  }
}

// ── Layout ────────────────────────────────────────────────────────────

function layout(opts: { preheader: string; heading: string; body: string; cta?: { label: string; url: string } }): string {
  const cta = opts.cta
    ? `<tr><td align="center" style="padding:24px 0 8px">
         <a href="${opts.cta.url}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">${opts.cta.label}</a>
       </td></tr>`
    : "";
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${opts.heading}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#6d28d9;padding:18px 24px">
        <a href="${SITE}" style="color:#fff;font-weight:700;font-size:18px;text-decoration:none;letter-spacing:-0.01em">LOKACIA<span style="opacity:0.7">.KZ</span></a>
      </td></tr>
      <tr><td style="padding:28px 24px 8px">
        <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111827">${opts.heading}</h1>
        <div style="font-size:14px;line-height:1.55;color:#374151">${opts.body}</div>
      </td></tr>
      ${cta}
      <tr><td style="padding:24px;border-top:1px solid #f3f4f6">
        <div style="font-size:11px;color:#9ca3af;line-height:1.5">
          Маркетплейс локаций для съёмок, мероприятий и встреч в Казахстане.<br/>
          <a href="${SITE}" style="color:#6d28d9;text-decoration:none">${SITE}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₸";
}

// ── Public API ────────────────────────────────────────────────────────

export function sendBookingPendingEmail(input: {
  to: string;
  hostName: string;
  listingTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  guestName: string;
  totalPrice: number;
  dashboardUrl?: string;
}): Promise<SendResult> {
  const url = input.dashboardUrl ?? `${SITE}/dashboard`;
  const heading = "Новый запрос на бронирование";
  const body = `
    <p>Здравствуйте, ${input.hostName}.</p>
    <p><strong>${input.guestName}</strong> хочет забронировать вашу локацию <strong>${input.listingTitle}</strong>.</p>
    <p style="margin:14px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:13px">
      <strong>Дата:</strong> ${fmtDate(input.date)}<br/>
      <strong>Время:</strong> ${input.startTime} – ${input.endTime}<br/>
      <strong>Сумма:</strong> ${fmtMoney(input.totalPrice)}
    </p>
    <p>Откройте панель, чтобы подтвердить или отклонить запрос.</p>
  `;
  const text = `Новый запрос на бронирование\n\n${input.guestName} хочет забронировать ${input.listingTitle}.\nДата: ${fmtDate(input.date)}\nВремя: ${input.startTime}–${input.endTime}\nСумма: ${fmtMoney(input.totalPrice)}\n\nПодтвердите: ${url}`;
  return send({
    to: input.to,
    subject: `Новый запрос: ${input.listingTitle}`,
    html: layout({ preheader: "Подтвердите бронирование", heading, body, cta: { label: "Открыть панель", url } }),
    text,
  });
}

export function sendBookingConfirmedEmail(input: {
  to: string;
  renterName: string;
  listingTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  hostName: string;
  listingUrl: string;
}): Promise<SendResult> {
  const heading = "Бронь подтверждена ✓";
  const body = `
    <p>Здравствуйте, ${input.renterName}.</p>
    <p>Хост <strong>${input.hostName}</strong> подтвердил вашу бронь локации <strong>${input.listingTitle}</strong>.</p>
    <p style="margin:14px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px 14px;font-size:13px">
      <strong>Дата:</strong> ${fmtDate(input.date)}<br/>
      <strong>Время:</strong> ${input.startTime} – ${input.endTime}
    </p>
    <p>Точный адрес и контакты хоста теперь доступны на странице локации.</p>
  `;
  const text = `Бронь подтверждена.\n${input.listingTitle}\n${fmtDate(input.date)} · ${input.startTime}–${input.endTime}\n\nЛокация: ${input.listingUrl}`;
  return send({
    to: input.to,
    subject: `Бронь подтверждена: ${input.listingTitle}`,
    html: layout({ preheader: "Бронь подтверждена хостом", heading, body, cta: { label: "Открыть локацию", url: input.listingUrl } }),
    text,
  });
}

export function sendBookingRejectedEmail(input: {
  to: string;
  renterName: string;
  listingTitle: string;
  hostName: string;
}): Promise<SendResult> {
  const heading = "Запрос отклонён";
  const body = `
    <p>Здравствуйте, ${input.renterName}.</p>
    <p>К сожалению, хост <strong>${input.hostName}</strong> отклонил ваш запрос на бронирование локации <strong>${input.listingTitle}</strong>.</p>
    <p>Не расстраивайтесь — в каталоге много похожих вариантов.</p>
  `;
  const text = `Хост ${input.hostName} отклонил запрос на ${input.listingTitle}. Посмотрите другие локации: ${SITE}/catalog`;
  return send({
    to: input.to,
    subject: `Запрос отклонён: ${input.listingTitle}`,
    html: layout({ preheader: "Хост отклонил запрос", heading, body, cta: { label: "В каталог", url: `${SITE}/catalog` } }),
    text,
  });
}

export function sendListingApprovedEmail(input: {
  to: string;
  hostName: string;
  listingTitle: string;
  listingUrl: string;
}): Promise<SendResult> {
  const heading = "Локация одобрена!";
  const body = `
    <p>Здравствуйте, ${input.hostName}.</p>
    <p>Ваша локация <strong>${input.listingTitle}</strong> прошла модерацию и опубликована в каталоге.</p>
    <p>Арендаторы уже могут её найти и забронировать.</p>
  `;
  const text = `Локация "${input.listingTitle}" одобрена и опубликована. Смотреть: ${input.listingUrl}`;
  return send({
    to: input.to,
    subject: `Локация одобрена: ${input.listingTitle}`,
    html: layout({ preheader: "Локация опубликована в каталоге", heading, body, cta: { label: "Посмотреть", url: input.listingUrl } }),
    text,
  });
}

export function sendListingRejectedEmail(input: {
  to: string;
  hostName: string;
  listingTitle: string;
  reason?: string;
}): Promise<SendResult> {
  const heading = "Локация не прошла модерацию";
  const reasonBlock = input.reason
    ? `<p>Причина: <em>${input.reason}</em></p>`
    : "";
  const body = `
    <p>Здравствуйте, ${input.hostName}.</p>
    <p>К сожалению, ваша локация <strong>${input.listingTitle}</strong> не прошла модерацию.</p>
    ${reasonBlock}
    <p>Вы можете исправить замечания и отправить листинг на повторную проверку.</p>
  `;
  const text = `Локация "${input.listingTitle}" не прошла модерацию.${input.reason ? ` Причина: ${input.reason}` : ""} Исправьте и отправьте повторно: ${SITE}/dashboard`;
  return send({
    to: input.to,
    subject: `Локация отклонена: ${input.listingTitle}`,
    html: layout({ preheader: "Локация не прошла модерацию", heading, body, cta: { label: "В панель хоста", url: `${SITE}/dashboard` } }),
    text,
  });
}

export function sendNewMessageEmail(input: {
  to: string;
  recipientName: string;
  senderName: string;
  listingTitle: string;
  snippet: string;
  inboxUrl: string;
}): Promise<SendResult> {
  const heading = `Новое сообщение от ${input.senderName}`;
  const safeSnippet = input.snippet.replace(/[<>]/g, "");
  const body = `
    <p>Здравствуйте, ${input.recipientName}.</p>
    <p>В диалоге по локации <strong>${input.listingTitle}</strong> — новое сообщение:</p>
    <blockquote style="margin:14px 0;background:#f3f4f6;border-left:3px solid #6d28d9;border-radius:6px;padding:10px 14px;font-size:13px;color:#374151">
      ${safeSnippet}
    </blockquote>
  `;
  const text = `Новое сообщение от ${input.senderName} (${input.listingTitle}):\n\n${safeSnippet}\n\nОтветить: ${input.inboxUrl}`;
  return send({
    to: input.to,
    subject: `Сообщение от ${input.senderName}`,
    html: layout({ preheader: safeSnippet.slice(0, 90), heading, body, cta: { label: "Ответить", url: input.inboxUrl } }),
    text,
  });
}
