import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSecret } from "@/lib/auth/webhook";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEXT = 4000;

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req, "WHATSAPP_WEBHOOK_SECRET")) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { event, sessionId, data } = payload ?? {};

    if (event !== "whatsapp_message" || !data?.message) {
      return NextResponse.json({ success: true });
    }
    // The session id is the store id; never let a payload name a non-UUID.
    if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ success: false, error: "bad session" }, { status: 400 });
    }

    const msg = data.message;
    if (msg.key?.fromMe) return NextResponse.json({ success: true, ignored: true });

    const phoneNumber = String(msg.key?.remoteJid ?? "").split("@")[0].replace(/\D/g, "");
    const textContent = String(
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "",
    ).slice(0, MAX_TEXT);

    if (phoneNumber && textContent) {
      const supabase = createSupabaseAdminClient();

      const possiblePhones = [phoneNumber];
      if (phoneNumber.startsWith("254")) possiblePhones.push("0" + phoneNumber.substring(3));
      if (phoneNumber.startsWith("0")) possiblePhones.push("254" + phoneNumber.substring(1));

      const { data: customer } = await supabase
        .from("mpato_customers")
        .select("id, phone")
        .eq("store_id", sessionId)
        .in("phone", possiblePhones)
        .limit(1)
        .maybeSingle();

      const { error } = await supabase.from("mpato_whatsapp_messages").insert({
        store_id: sessionId,
        customer_id: customer?.id ?? null,
        phone_number: customer?.phone ?? phoneNumber,
        direction: "inbound",
        content: textContent,
      });
      if (error) console.error("WhatsApp webhook insert error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WhatsApp webhook error", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
