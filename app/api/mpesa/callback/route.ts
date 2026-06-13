import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("M-PESA Webhook received:", JSON.stringify(data, null, 2));
    const stkCallback = data?.Body?.stkCallback;
    
    if (stkCallback) {
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
      
      if (resultCode === 0) {
        const items = stkCallback.CallbackMetadata?.Item || [];
        const receiptItem = items.find((item: any) => item.Name === "MpesaReceiptNumber");
        const mpesaReceiptNumber = receiptItem?.Value;
        
        if (checkoutRequestId && mpesaReceiptNumber) {
          // Save to Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          // Using anon key since we added an anon policy for inserts
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await supabase.from("mpato_payments_transactions").upsert({
            checkout_request_id: checkoutRequestId,
            receipt_number: mpesaReceiptNumber
          });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("M-PESA callback error", err);
    // Always return 200 to Safaricom otherwise they might retry unnecessarily
    return NextResponse.json({ success: false });
  }
}
