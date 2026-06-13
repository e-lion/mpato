"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { claimInvite, type RpcFn } from "@/lib/auth/onboarding";
import { GoogleButton } from "@/components/auth/GoogleButton";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Attach any pending staff invite for this account (no-op otherwise).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await claimInvite((supabase as any).rpc.bind(supabase) as RpcFn);
    setLoading(false);
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="brand">
        <img src="/logomark.svg" alt="Mpato" />
        <span className="wm">Mpato</span>
      </div>
      <h1>Welcome back</h1>
      <p className="lede">Log in to your shop.</p>

      <GoogleButton next={next} label="Continue with Google" />
      <div className="auth-divider">or with email</div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={onSubmit}>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-foot">
        New to Mpato? <Link href="/signup">Start free</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-card">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
