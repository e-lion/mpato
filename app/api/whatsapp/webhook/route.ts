import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("WhatsApp Webhook received:", JSON.stringify(payload, null, 2));

    const { event, sessionId, data } = payload;
    
    // We only care about incoming messages
    if (event === "whatsapp_message" && data?.message) {
      const msg = data.message;
      const key = msg.key;
      
      // If the message is from our own bot, ignore it (we save outbound manually for instant UI)
      if (key.fromMe) {
        return NextResponse.json({ success: true, ignored: true });
      }

      // Extract phone number from "254712345678@s.whatsapp.net"
      const remoteJid = key.remoteJid || "";
      const phoneNumber = remoteJid.split("@")[0];
      
      // Extract the text
      const textContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      
      if (phoneNumber && textContent) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Find existing customer id
        const possiblePhones = [phoneNumber];
        if (phoneNumber.startsWith("254")) possiblePhones.push("0" + phoneNumber.substring(3));
        if (phoneNumber.startsWith("0")) possiblePhones.push("254" + phoneNumber.substring(1));

        const { data: customerData } = await supabase
          .from("mpato_customers")
          .select("id, phone")
          .eq("store_id", sessionId)
          .in("phone", possiblePhones)
          .limit(1)
          .maybeSingle();

        const customerId = customerData ? (customerData as any).id : null;
        const finalPhone = customerData ? (customerData as any).phone : phoneNumber;

        const { error } = await supabase.from("mpato_whatsapp_messages").insert({
          store_id: sessionId,
          customer_id: customerId,
          phone_number: finalPhone,
          direction: "inbound",
          content: textContent,
        });

        if (error) {
          console.error("Webhook Supabase insert error:", error);
        }
      }
    } else if (event === "connection_status") {
      // Optional: Save connection status to a stores/settings table if needed
      console.log(`Session ${sessionId} connection status: ${data.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WhatsApp webhook error", err);
    // Return 200 so the worker doesn't endlessly retry bad payloads
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 200 });
  }
}
