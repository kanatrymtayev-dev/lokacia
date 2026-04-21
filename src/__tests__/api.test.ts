import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing api module
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const chainable = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  in: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

// Each method returns the chainable object
Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => chainable),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: { from: vi.fn() },
  },
}));

// Mock email module to prevent import errors
vi.mock("@/lib/email", () => ({
  sendBookingPendingEmail: vi.fn(),
  sendBookingConfirmedEmail: vi.fn(),
  sendBookingRejectedEmail: vi.fn(),
  sendNewMessageEmail: vi.fn(),
}));

// Mock geocoder
vi.mock("@/lib/geocoder", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 43.24, lng: 76.94 }),
}));

describe("API — getSiteSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable));
  });

  it("returns settings as key-value map", async () => {
    mockSelect.mockReturnValue({
      ...chainable,
      then: (cb: (v: { data: Array<{ key: string; value: string }>; error: null }) => void) =>
        cb({
          data: [
            { key: "email", value: "hello@lokacia.kz" },
            { key: "phone", value: "+7 700 123 45 67" },
          ],
          error: null,
        }),
    });

    const { getSiteSettings } = await import("@/lib/api");
    const result = await getSiteSettings();

    expect(result).toEqual({
      email: "hello@lokacia.kz",
      phone: "+7 700 123 45 67",
    });
  });

  it("returns empty object on error", async () => {
    mockSelect.mockReturnValue({
      ...chainable,
      then: (cb: (v: { data: null; error: { message: string } }) => void) =>
        cb({ data: null, error: { message: "fail" } }),
    });

    const { getSiteSettings } = await import("@/lib/api");
    const result = await getSiteSettings();

    expect(result).toEqual({});
  });
});
