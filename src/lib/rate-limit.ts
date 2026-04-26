/**
 * Simple in-memory rate limiter by IP.
 * Resets automatically after the window expires.
 * For production at scale, use Redis-backed solution.
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function rateLimit(
  ip: string,
  route: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const key = `${route}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1 };
  }

  entry.count++;

  if (entry.count > opts.limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: opts.limit - entry.count };
}

/** Get client IP from request headers */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
