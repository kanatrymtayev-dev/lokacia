import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockSignOut } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    auth: {
      signOut: mockSignOut,
    },
  },
}));

import { deactivateAccount } from "../deactivate-account";

describe("deactivateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.rpc with deactivate_account and reason", async () => {
    mockRpc.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});

    await deactivateAccount("Не нужен больше");

    expect(mockRpc).toHaveBeenCalledWith("deactivate_account", {
      reason: "Не нужен больше",
    });
  });

  it("calls signOut after successful deactivation", async () => {
    mockRpc.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});

    await deactivateAccount("Тест");

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns { ok: true } on success", async () => {
    mockRpc.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});

    const result = await deactivateAccount("Тест");

    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false, error } on rpc failure", async () => {
    mockRpc.mockResolvedValue({ error: { message: "DB error" } });

    const result = await deactivateAccount("Тест");

    expect(result).toEqual({ ok: false, error: "DB error" });
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
