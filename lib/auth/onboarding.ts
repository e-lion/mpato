// Shared post-authentication onboarding. Works with any Supabase client's
// `.rpc` (browser or server). First tries to claim a pending staff invite for
// the signed-in user; only if there's no invite does it provision a fresh store
// (the normal owner path). Idempotent — safe to call on every signup/login.

type RpcResult = { data: unknown; error: { message: string } | null };
export type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;

/** Returns true if a staff invite was claimed (i.e. this user is staff, not a
 *  brand-new shop owner). */
export async function claimInvite(rpc: RpcFn): Promise<boolean> {
  const { data, error } = await rpc("mpato_accept_invite", {});
  if (error) {
    console.error("[onboarding] mpato_accept_invite failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function onboardUser(rpc: RpcFn, shopName?: string): Promise<{ claimed: boolean }> {
  if (await claimInvite(rpc)) return { claimed: true };

  const { error } = await rpc("mpato_provision_store", {
    p_shop_name: shopName?.trim() || "My Shop",
  });
  if (error) console.error("[onboarding] mpato_provision_store failed:", error.message);
  return { claimed: false };
}
