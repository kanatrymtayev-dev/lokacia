import { supabase } from "@/lib/supabase";

export async function deactivateAccount(
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("deactivate_account", { reason });

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.auth.signOut();
  return { ok: true };
}
