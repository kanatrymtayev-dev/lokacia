import { z } from "zod";

// ──── Auth ────
export const sendOtpSchema = z.object({
  userId: z.string().uuid(),
  phone: z.string().min(10).max(20),
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(4).regex(/^\d{4}$/),
});

// ──── Payments ────
export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  provider: z.enum(["kaspi", "halyk_qr", "halyk_card", "mock"]),
});

export const paymentCallbackSchema = z.object({
  payment_id: z.string().min(1),
  provider: z.string().optional(),
});

// ──── Admin Listing ────
export const adminUpdateListingSchema = z.object({
  listingId: z.string().uuid(),
  status: z.string().optional(),
  moderationStatus: z.enum(["approved", "rejected"]).optional(),
  moderationNote: z.string().nullable().optional(),
});

// ──── Admin Blog ────
export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().max(100).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().default(""),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(300).optional(),
});

export const updateBlogPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  slug: z.string().max(100).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(300).optional(),
});

export const deleteBlogPostSchema = z.object({
  id: z.string().uuid(),
});

// ──── Helper ────
export function validate<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { success: false, error: msg };
}
