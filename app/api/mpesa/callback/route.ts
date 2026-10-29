import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSecret } from "@/lib/auth/webhook";

type StkItem = { Name?: string; Value?: unknown };

const RECEIPT_RE = /^[A-Z0-9]{6,12}$/;
const CHECKOUT_RE = /^[A-Za-z0-9_-]{8,100}$/;

export async function POST(req: Request) {
  // The callback URL carries a secret token (see initiateStkPush); anything
  // without it is not from our payment gateway.
  if (!verifyWebhookSecret(req, "MPESA_CALLBACK_SECRET")) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const data = await req.json();

    let checkoutRequestId: unknown;
    let receipt: unknown;

    if (data?.success && data.checkoutRequestID && data.receiptNumber) {
      // NovaPay clean format
      checkoutRequestId = data.checkoutRequestID;
      receipt = data.receiptNumber;
    } else if (data?.Body?.stkCallback?.ResultCode === 0) {
      // Raw Safaricom Daraja format
      const cb = data.Body.stkCallback;
      checkoutRequestId = cb.CheckoutRequestID;
      const items: StkItem[] = cb.CallbackMetadata?.Item ?? [];
      receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
    }

    if (
      typeof checkoutRequestId === "string" && CHECKOUT_RE.test(checkoutRequestId) &&
      typeof receipt === "string" && RECEIPT_RE.test(receipt.toUpperCase())
    ) {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("mpato_payments_transactions").upsert({
        checkout_request_id: checkoutRequestId,
        receipt_number: receipt.toUpperCase(),
      });
      if (error) console.error("M-PESA callback upsert error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("M-PESA callback error", err instanceof Error ? err.message : err);
    // 200 so the gateway doesn't retry malformed payloads forever.
    return NextResponse.json({ success: false });
  }
}
