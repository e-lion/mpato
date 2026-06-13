"use server";

export async function initiateStkPush(amount: number, phone: string) {
  try {
    const appKey = process.env.NOVAPAY_SECRET_KEY;
    if (!appKey) throw new Error("Missing Novapay Secret Key");

    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
      return { ok: false, error: "Invalid Kenyan phone number format" };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
                    "https://mpato.com");

    const payload = {
      phone: formattedPhone,
      amount: Math.ceil(amount),
      accountReference: "Mpato POS",
      transactionDesc: "POS Payment",
      callbackUrl: `${siteUrl}/api/mpesa/callback`,
    };

    const response = await fetch("https://pay.novaworks.pro/api/mpesa/stkpush", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && (data.ResponseCode === "0" || data.success || data.CheckoutRequestID)) {
      return { ok: true, checkoutRequestId: data.CheckoutRequestID || data.checkoutRequestId };
    } else {
      console.error("STK Push failed:", data);
      return { ok: false, error: data.errorMessage || data.CustomerMessage || data.message || "Failed to initiate STK Push" };
    }
  } catch (error: any) {
    console.error("STK Push error:", error);
    return { ok: false, error: error.message || "An unexpected error occurred" };
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function checkStkPushStatus(checkoutRequestId: string): Promise<{ status: "success", receipt: string } | { status: "pending" } | { status: "failed", error: string }> {
  try {
    // 1. Check if the webhook already saved the receipt in Supabase
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Actions
          }
        },
      },
    });

    const { data: cbData } = await supabase
      .from("mpato_stk_callbacks")
      .select("receipt_number")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (cbData?.receipt_number) {
      return { status: "success", receipt: cbData.receipt_number };
    }

    return { status: "pending" };
  } catch (error: any) {
    console.error("STK Query error:", error);
    // Ignore network errors on polling and keep pending
    return { status: "pending" };
  }
}
