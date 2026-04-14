import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseProxy } from "@/lib/supabase-proxy";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/bookings", "/admin", "/inbox"];

// Routes only for unauthenticated users
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseProxy(request);
  const { pathname } = request.nextUrl;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes to /login
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(url);
    // Copy refreshed auth cookies to the redirect response
    const supabaseResponse = response();
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Redirect authenticated users away from auth pages to /dashboard
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    const supabaseResponse = response();
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
