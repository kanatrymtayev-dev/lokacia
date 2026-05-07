import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { promises as fs } from "fs";
import path from "path";
import type { InvoiceData } from "./api";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;
const PRIMARY = rgb(109 / 255, 40 / 255, 217 / 255); // #6d28d9
const TEXT = rgb(0.07, 0.09, 0.16);
const MUTED = rgb(0.45, 0.5, 0.55);
const BORDER = rgb(0.9, 0.9, 0.92);

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₸";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function invoiceNumber(bookingId: string): string {
  return "INV-" + bookingId.slice(0, 8).toUpperCase();
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Шрифт с кириллицей
  let regular: PDFFont;
  let bold: PDFFont;
  try {
    const regBytes = await fs.readFile(path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"));
    const boldBytes = await fs.readFile(path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"));
    regular = await pdf.embedFont(regBytes);
    bold = await pdf.embedFont(boldBytes);
  } catch {
    regular = await pdf.embedFont(StandardFonts.Helvetica);
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  }

  const page = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - MARGIN;

  // Шапка
  page.drawRectangle({ x: 0, y: A4_H - 60, width: A4_W, height: 60, color: PRIMARY });
  page.drawText("LOKACIA.KZ", { x: MARGIN, y: A4_H - 38, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Электронный счёт", { x: MARGIN, y: A4_H - 56, size: 11, font: regular, color: rgb(0.95, 0.92, 1) });

  y = A4_H - 90;

  const invNo = invoiceNumber(data.booking.id);
  drawLeft(page, bold, 14, MARGIN, y, `Счёт № ${invNo}`);
  drawRight(page, regular, 10, A4_W - MARGIN, y + 4, `от ${fmtDate(new Date().toISOString())}`, MUTED);
  y -= 28;

  // Поставщик / Покупатель — две колонки
  const colW = (A4_W - MARGIN * 2 - 16) / 2;
  drawParty(page, bold, regular, MARGIN, y, colW, "Поставщик", {
    name: data.host.name,
    company: data.host.company_name,
    bin: data.host.company_bin,
    address: data.host.company_address,
  });
  drawParty(page, bold, regular, MARGIN + colW + 16, y, colW, "Покупатель", {
    name: data.renter.name,
    company: data.renter.company_name,
    bin: data.renter.company_bin,
    address: data.renter.company_address,
    extra: data.renter.email ? `Email: ${data.renter.email}` : undefined,
  });

  y -= 110;

  // Таблица услуг
  const tableY = y;
  const cols = { item: MARGIN, qty: A4_W - MARGIN - 280, price: A4_W - MARGIN - 160, sum: A4_W - MARGIN - 60 };

  page.drawRectangle({ x: MARGIN, y: tableY, width: A4_W - MARGIN * 2, height: 24, color: rgb(0.96, 0.96, 0.98) });
  drawLeft(page, bold, 9, cols.item + 6, tableY + 8, "НАИМЕНОВАНИЕ", MUTED);
  drawLeft(page, bold, 9, cols.qty, tableY + 8, "КОЛ-ВО", MUTED);
  drawLeft(page, bold, 9, cols.price, tableY + 8, "ЦЕНА", MUTED);
  drawRight(page, bold, 9, A4_W - MARGIN - 6, tableY + 8, "СУММА", MUTED);

  // Строка услуги
  const rowY = tableY - 28;
  const desc = `Аренда локации «${data.listing.title}»`;
  const descSub = `${data.listing.address}, ${fmtDate(data.booking.date)}, ${data.booking.start_time}–${data.booking.end_time}`;
  drawLeft(page, regular, 11, cols.item + 6, rowY + 14, desc, TEXT);
  drawLeft(page, regular, 9, cols.item + 6, rowY, descSub, MUTED);
  drawLeft(page, regular, 11, cols.qty, rowY + 14, "1");
  drawLeft(page, regular, 11, cols.price, rowY + 14, fmtMoney(data.booking.total_price));
  drawRight(page, regular, 11, A4_W - MARGIN - 6, rowY + 14, fmtMoney(data.booking.total_price));

  page.drawLine({
    start: { x: MARGIN, y: rowY - 6 },
    end: { x: A4_W - MARGIN, y: rowY - 6 },
    thickness: 0.5,
    color: BORDER,
  });

  // Итоги
  const total = data.booking.total_price;
  const serviceFee = 0;
  const baseAmount = total;
  const commissionRate = data.booking.commission_rate ?? 0;
  const commissionAmount = Math.round(baseAmount * commissionRate);
  const hostNet = baseAmount - commissionAmount;
  const vat = Math.round(total / 1.12 * 0.12); // 12% НДС включён в total

  let totalsY = rowY - 30;
  const totalsX = A4_W - MARGIN - 220;
  const lineH = 18;

  function totalLine(label: string, val: string, strong = false) {
    drawLeft(page, strong ? bold : regular, 11, totalsX, totalsY, label, strong ? TEXT : MUTED);
    drawRight(page, strong ? bold : regular, 11, A4_W - MARGIN - 6, totalsY, val, TEXT);
    totalsY -= lineH;
  }
  totalLine("Стоимость бронирования", fmtMoney(baseAmount));
  totalLine("Сервисный сбор Lokacia", "Бесплатно");
  totalLine("Комиссия Lokacia", "0%");
  totalLine("В т.ч. НДС 12%", fmtMoney(vat));
  totalsY -= 4;
  page.drawLine({
    start: { x: totalsX, y: totalsY + 12 },
    end: { x: A4_W - MARGIN, y: totalsY + 12 },
    thickness: 0.7,
    color: BORDER,
  });
  totalLine("Итого к оплате", fmtMoney(total), true);
  totalsY -= 8;
  drawLeft(page, regular, 9, totalsX, totalsY, "Хост получает", MUTED);
  drawRight(page, regular, 9, A4_W - MARGIN - 6, totalsY, fmtMoney(hostNet), MUTED);

  // Футер
  const footerY = MARGIN + 12;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 16 },
    end: { x: A4_W - MARGIN, y: footerY + 16 },
    thickness: 0.5,
    color: BORDER,
  });
  drawLeft(page, regular, 9, MARGIN, footerY, "Документ сгенерирован автоматически на lokacia.kz", MUTED);
  drawRight(page, regular, 9, A4_W - MARGIN, footerY, `Lokacia · маркетплейс локаций`, MUTED);

  return await pdf.save();
}

// ──── helpers ────

function drawLeft(p: PDFPage, font: PDFFont, size: number, x: number, y: number, text: string, color = TEXT) {
  p.drawText(text, { x, y, size, font, color });
}

function drawRight(p: PDFPage, font: PDFFont, size: number, xRight: number, y: number, text: string, color = TEXT) {
  const w = font.widthOfTextAtSize(text, size);
  p.drawText(text, { x: xRight - w, y, size, font, color });
}

function drawParty(
  p: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  x: number,
  y: number,
  width: number,
  title: string,
  party: { name: string; company: string | null; bin: string | null; address: string | null; extra?: string }
) {
  drawLeft(p, bold, 9, x, y, title.toUpperCase(), MUTED);
  let cy = y - 18;
  drawLeft(p, bold, 12, x, cy, party.company || party.name, TEXT);
  cy -= 14;
  if (party.company && party.name !== party.company) {
    drawLeft(p, regular, 10, x, cy, `Контактное лицо: ${party.name}`, MUTED);
    cy -= 12;
  }
  if (party.bin) {
    drawLeft(p, regular, 10, x, cy, `БИН: ${party.bin}`, TEXT);
    cy -= 12;
  }
  if (party.address) {
    drawLeft(p, regular, 9, x, cy, party.address, MUTED);
    cy -= 12;
  }
  if (party.extra) {
    drawLeft(p, regular, 9, x, cy, party.extra, MUTED);
  }
  // dummy use of width to silence lint
  void width;
}
