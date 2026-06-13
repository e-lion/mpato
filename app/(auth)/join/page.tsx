"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { claimInvite, type RpcFn } from "@/lib/auth/onboarding";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function JoinPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    // Sign in first — most joiners already have (or will create) the account.
    // If they don't have one yet, create it. We need a live session before the
    // claim, so we check for one explicitly (email confirmation may defer it).
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    let session = signIn.data.session;

    if (!session) {
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) {
        // Account exists but the password was wrong (sign-in failed above).
        setLoading(false);
        setError("That email already has an account, but the password didn't match. Try again or reset it.");
        return;
      }
      session = signUp.data.session;
      if (!session) {
        // Email confirmation is required before a session is issued.
        setLoading(false);
        setError(
          "Almost there — check your email and tap the confirmation link, then come back and sign in to finish joining.",
        );
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpc = (supabase as any).rpc.bind(supabase) as RpcFn;
    const claimed = await claimInvite(rpc);
    if (!claimed) {
      setLoading(false);
      setError(
        `We couldn't find an invite for ${email.trim() || "this email"}. Ask your shop owner to add you with this exact email, then try again.`,
      );
      return;
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
      <h1>Join your team</h1>
      <p className="lede">
        Your shop owner added you. Sign in with the email they used to get access.
      </p>

      <GoogleButton label="Continue with Google" />
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
          <label htmlFor="password">Choose a password</label>
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
          {loading ? "Joining…" : "Join shop"}
        </button>
      </form>

      <div className="auth-foot">
        Opening your own shop? <Link href="/signup">Start free</Link>
      </div>
    </div>
  );
}
