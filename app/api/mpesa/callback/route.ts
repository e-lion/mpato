import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("NovaPay Webhook received:", JSON.stringify(data, null, 2));
    
    if (data.success && data.checkoutRequestID && data.receiptNumber) {
      // NovaPay Clean Format
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from("mpato_payments_transactions").upsert({
        checkout_request_id: data.checkoutRequestID,
        receipt_number: data.receiptNumber
      });
    } else if (data?.Body?.stkCallback) {
      // Raw Safaricom Daraja Format
      const stkCallback = data.Body.stkCallback;
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
      
      if (resultCode === 0) {
        const items = stkCallback.CallbackMetadata?.Item || [];
        const receiptItem = items.find((item: any) => item.Name === "MpesaReceiptNumber");
        const mpesaReceiptNumber = receiptItem?.Value;
        
        if (checkoutRequestId && mpesaReceiptNumber) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { error } = await supabase.from("mpato_payments_transactions").upsert({
            checkout_request_id: checkoutRequestId,
            receipt_number: mpesaReceiptNumber
          });
          if (error) {
            console.error("Webhook Supabase upsert error:", error);
          }
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("NovaPay callback error", err);
    // Always return 200 to NovaPay otherwise they might retry unnecessarily
    return NextResponse.json({ success: false });
  }
}
