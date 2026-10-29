/** Only allow same-origin relative paths as post-login redirect targets.
 *  Rejects absolute URLs, protocol-relative ("//evil.com") and "/\evil.com". */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
