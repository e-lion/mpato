"use server";

export async function sendWhatsAppMessage(sessionId: string, to: string, text: string) {
  const workerUrl = process.env.NEXT_PUBLIC_WHATSAPP_WORKER_URL || "https://wa.novaworks.pro";
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY;

  if (!apiKey) {
    console.error("Missing WHATSAPP_GATEWAY_API_KEY");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const response = await fetch(`${workerUrl}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ sessionId, to, text }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to send WhatsApp message:", data);
      return { success: false, error: data.error || "Failed to send message" };
    }

    // Attempt to save outbound message using the existing messages action
    try {
      const { saveMessage } = await import("@/app/actions/messages");
      await saveMessage(sessionId, to, "outbound", text);
    } catch (saveError) {
      console.error("Failed to save outbound message to db:", saveError);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message };
  }
}

export async function startWhatsAppSession(sessionId: string) {
  const workerUrl = process.env.NEXT_PUBLIC_WHATSAPP_WORKER_URL || "https://wa.novaworks.pro";
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Missing API Key" };
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mpato.novaworks.pro";
    const webhookUrl = `${siteUrl}/api/whatsapp/webhook`;

    const response = await fetch(`${workerUrl}/api/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ sessionId, webhookUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to start WhatsApp session:", data);
      return { success: false, error: data.error || "Failed to start session" };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error starting WhatsApp session:", error);
    return { success: false, error: error.message };
  }
}

export async function logoutWhatsAppSession(sessionId: string) {
  const workerUrl = process.env.NEXT_PUBLIC_WHATSAPP_WORKER_URL || "https://wa.novaworks.pro";
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Missing API Key" };
  }

  try {
    const response = await fetch(`${workerUrl}/api/session/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ sessionId }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to logout WhatsApp session:", data);
      return { success: false, error: data.error || "Failed to logout" };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error logging out WhatsApp session:", error);
    return { success: false, error: error.message };
  }
}

export async function getWhatsAppStatus(sessionId: string) {
  const workerUrl = process.env.NEXT_PUBLIC_WHATSAPP_WORKER_URL || "https://wa.novaworks.pro";
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY;

  if (!apiKey) return { success: false, error: "Missing API Key" };

  try {
    const response = await fetch(`${workerUrl}/api/session/${sessionId}/qr`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to fetch status" };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

