"use server";

function getEnv() {
  const isProd = process.env.MPESA_ENV === "production" || process.env.NODE_ENV === "production";
  const baseUrl = isProd
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  return {
    baseUrl,
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    shortcode: process.env.MPESA_SHORTCODE,
  };
}

async function getAccessToken() {
  const env = getEnv();
  if (!env.consumerKey || !env.consumerSecret) throw new Error("Missing M-PESA credentials");

  const auth = Buffer.from(`${env.consumerKey}:${env.consumerSecret}`).toString("base64");
  const response = await fetch(`${env.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("M-PESA auth failed:", text);
    throw new Error("Failed to authenticate with M-PESA");
  }

  const data = await response.json();
  return data.access_token;
}

export async function initiateStkPush(amount: number, phone: string) {
  try {
    const env = getEnv();
    if (!env.shortcode || !env.passkey) throw new Error("Missing M-PESA shortcode/passkey");

    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
      return { ok: false, error: "Invalid Kenyan phone number format" };
    }

    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const password = Buffer.from(`${env.shortcode}${env.passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: env.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // Change to CustomerBuyGoodsOnline if Till Number
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: env.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: "https://mpato.com/api/mpesa/callback", // Dummy or actual callback
      AccountReference: "Mpato POS",
      TransactionDesc: "POS Payment",
    };

    const response = await fetch(`${env.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ResponseCode === "0") {
      return { ok: true, checkoutRequestId: data.CheckoutRequestID };
    } else {
      console.error("STK Push failed:", data);
      return { ok: false, error: data.errorMessage || data.CustomerMessage || "Failed to initiate STK Push" };
    }
  } catch (error: any) {
    console.error("STK Push error:", error);
    return { ok: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function checkStkPushStatus(checkoutRequestId: string) {
  try {
    const env = getEnv();
    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const password = Buffer.from(`${env.shortcode}${env.passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: env.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await fetch(`${env.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // If errorCode is present, the transaction is likely still processing
    if (data.errorCode) {
      return { status: "pending" };
    }

    if (data.ResultCode === "0") {
      // Success. We use a mock M-PESA receipt ID or the checkout request ID
      return { status: "success", receipt: "STK" + checkoutRequestId.slice(-8).toUpperCase() };
    } else if (data.ResultCode) {
      // A specific ResultCode indicates failure/cancellation
      return { status: "failed", error: data.ResultDesc || "Transaction failed" };
    }

    return { status: "pending" };
  } catch (error: any) {
    console.error("STK Query error:", error);
    // Ignore network errors on polling and keep pending
    return { status: "pending" };
  }
}
