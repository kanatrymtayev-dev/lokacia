import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * PayBox failure redirect — user lands here after failed/cancelled payment.
 */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/bookings?payment=failed", req.url));
}
