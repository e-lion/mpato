import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time check of the shared secret a provider echoes back to us
 *  (?token=… on the callback URL, or an x-webhook-secret header). Fails closed
 *  when no secret is configured. */
export function verifyWebhookSecret(req: Request, envName: string): boolean {
  const expected = process.env[envName];
  if (!expected) return false;
  const given =
    new URL(req.url).searchParams.get("token") ??
    req.headers.get("x-webhook-secret") ??
    "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
