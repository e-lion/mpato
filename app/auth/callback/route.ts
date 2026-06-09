import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    return NextResponse.redirect(new URL(`/login?${params}`, url.origin));
  }

  // Auto-provision a store for first-time users (idempotent via RPC).
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const shopName =
      (user.user_metadata?.shop_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "My Shop";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpc = (supabase as any).rpc.bind(supabase) as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
    const { error: rpcError } = await rpc("mpato_provision_store", {
      p_shop_name: shopName,
    });
    if (rpcError) {
      console.error("[auth/callback] mpato_provision_store failed:", rpcError);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
