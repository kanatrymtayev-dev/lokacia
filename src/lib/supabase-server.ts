import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const isProduction = process.env.NODE_ENV === "production";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: isProduction,
        sameSite: "lax" as const,
        path: "/",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure: isProduction,
                sameSite: "lax",
                path: "/",
              })
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
