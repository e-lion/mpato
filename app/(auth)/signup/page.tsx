"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function SignupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { shop_name: shopName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpc = (supabase as any).rpc.bind(supabase) as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
      const { error: rpcError } = await rpc("mpato_provision_store", {
        p_shop_name: shopName || "My Shop",
      });
      if (rpcError) {
        console.error("[signup] mpato_provision_store failed:", rpcError);
      }
    }

    setLoading(false);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="brand">
        <img src="/logomark.svg" alt="Mpato" />
        <span className="wm">Mpato</span>
      </div>
      <h1>Start free</h1>
      <p className="lede">Set up your shop in 10 minutes. No card needed.</p>

      <GoogleButton label="Sign up with Google" />
      <div className="auth-divider">or with email</div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="shop">Shop name</label>
          <input
            id="shop"
            type="text"
            required
            placeholder="Soko Mini-Mart"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading} type="submit">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="auth-foot">
        Already have an account? <Link href="/login">Log in</Link>
      </div>
    </div>
  );
}
