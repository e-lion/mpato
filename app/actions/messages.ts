"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveMessage(
  storeId: string,
  phoneNumber: string,
  direction: "inbound" | "outbound",
  content: string
) {
  const supabase = await createSupabaseServerClient();
  
  // Try to find if this phone number belongs to an existing customer
  let customerId = null;
  const { data: customerData } = await supabase
    .from("mpato_customers")
    .select("id")
    .eq("store_id", storeId)
    .eq("phone", phoneNumber)
    .maybeSingle();

  if (customerData) {
    customerId = customerData.id;
  }

  const { error } = await supabase.from("mpato_whatsapp_messages").insert({
    store_id: storeId,
    customer_id: customerId,
    phone_number: phoneNumber,
    direction,
    content,
  });

  if (error) {
    console.error("Failed to save message:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getChatHistory(storeId: string, phoneNumber: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_whatsapp_messages")
    .select("*")
    .eq("store_id", storeId)
    .eq("phone_number", phoneNumber)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to get chat history:", error);
    return [];
  }

  return data;
}
