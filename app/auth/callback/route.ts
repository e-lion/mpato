import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardUser, type RpcFn } from "@/lib/auth/onboarding";

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

  // First-time users: claim a staff invite if one exists for this email,
  // otherwise provision a fresh store (the owner path). Idempotent.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const shopName =
      (user.user_metadata?.shop_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "My Shop";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpc = (supabase as any).rpc.bind(supabase) as RpcFn;
    await onboardUser(rpc, shopName);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
