import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable mock that returns itself for any method call
const { mockFrom, mockInsert, mockUpdate } = vi.hoisted(() => {
  const chainResult = { data: { id: "msg-1" }, error: null };

  // A proxy that returns itself for any property/call, resolves to chainResult
  const makeChain = (): Record<string, unknown> => {
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop) {
        if (prop === "then") {
          // Make it thenable — resolves to chainResult
          return (resolve: (v: unknown) => void) => resolve(chainResult);
        }
        return (..._args: unknown[]) => new Proxy({}, handler);
      },
    };
    return new Proxy({}, handler);
  };

  const mockUpdate = vi.fn().mockReturnValue(makeChain());
  const mockInsert = vi.fn().mockReturnValue(makeChain());

  const mockFrom = vi.fn().mockImplementation(() => ({
    update: mockUpdate,
    insert: mockInsert,
    select: vi.fn().mockReturnValue(makeChain()),
    eq: vi.fn().mockReturnValue(makeChain()),
    in: vi.fn().mockReturnValue(makeChain()),
    single: vi.fn().mockResolvedValue(chainResult),
  }));

  return { mockFrom, mockInsert, mockUpdate };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

vi.mock("@/lib/sanitize-message", () => ({
  sanitizeMessage: vi.fn((t: string) => ({ text: t, blocked: false })),
}));

vi.mock("@/lib/email", () => ({
  sendNewMessageEmail: vi.fn(),
}));

import { sendScoutInvite, respondToScout } from "../api";

describe("sendScoutInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates conversation with scout_status invited", async () => {
    const result = await sendScoutInvite("conv-1", "host-1", "2026-05-01", "14:00");

    expect(mockFrom).toHaveBeenCalledWith("conversations");
    expect(mockUpdate).toHaveBeenCalledWith({
      scout_status: "invited",
      scout_date: "2026-05-01",
      scout_time: "14:00",
    });
    expect(result.error).toBeNull();
  });

  it("sends system message with scout_invite metadata", async () => {
    await sendScoutInvite("conv-1", "host-1", "2026-05-01", "14:00");

    // messages insert is the second from() call
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "system",
        metadata: { type: "scout_invite", date: "2026-05-01", time: "14:00" },
      })
    );
  });

  it("includes date and time in message content", async () => {
    await sendScoutInvite("conv-1", "host-1", "2026-05-01", "14:00");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("2026-05-01"),
      })
    );
  });
});

describe("respondToScout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets scout_status to visited when result is book", async () => {
    await respondToScout("conv-1", "renter-1", "book");

    expect(mockUpdate).toHaveBeenCalledWith({ scout_status: "visited" });
  });

  it("sets scout_status to declined when result is declined", async () => {
    await respondToScout("conv-1", "renter-1", "declined");

    expect(mockUpdate).toHaveBeenCalledWith({ scout_status: "declined" });
  });

  it("sends scout_response metadata with reason", async () => {
    await respondToScout("conv-1", "renter-1", "declined", "Маленькая площадь");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { type: "scout_response", result: "declined", reason: "Маленькая площадь" },
      })
    );
  });

  it("returns no error on success", async () => {
    const result = await respondToScout("conv-1", "renter-1", "book");

    expect(result.error).toBeNull();
  });
});
