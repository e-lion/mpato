"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type StoreProfileInput = {
  name: string;
  area: string;
};

export async function updateStoreProfile(input: StoreProfileInput): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Shop name is required" };
  if (name.length > 80) return { ok: false, error: "Shop name is too long" };
  const area = input.area.trim();
  if (area.length > 80) return { ok: false, error: "Area is too long" };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_stores") as any
  )
    .update({ name, area: area || null })
    .eq("id", storeId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type PaymentSettingsInput = {
  tillNumber: string;
  paybillNumber: string;
  defaultMethod: "mpesa" | "cash";
};

const MPESA_NUMBER_RE = /^[0-9]{4,10}$/;

export async function updatePaymentSettings(input: PaymentSettingsInput): Promise<ActionResult> {
  const till = input.tillNumber.trim();
  const paybill = input.paybillNumber.trim();
  if (till && !MPESA_NUMBER_RE.test(till)) {
    return { ok: false, error: "Till number must be 4–10 digits" };
  }
  if (paybill && !MPESA_NUMBER_RE.test(paybill)) {
    return { ok: false, error: "Paybill number must be 4–10 digits" };
  }
  if (input.defaultMethod !== "mpesa" && input.defaultMethod !== "cash") {
    return { ok: false, error: "Invalid payment method" };
  }

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_stores") as any
  )
    .update({
      mpesa_till_number: till || null,
      mpesa_paybill_number: paybill || null,
      default_payment_method: input.defaultMethod,
    })
    .eq("id", storeId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type ReceiptSettingsInput = {
  footer: string;
  showContact: boolean;
};

export async function updateReceiptSettings(input: ReceiptSettingsInput): Promise<ActionResult> {
  const footer = input.footer.trim();
  if (footer.length > 280) return { ok: false, error: "Footer must be 280 characters or fewer" };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_stores") as any
  )
    .update({
      receipt_footer: footer || null,
      receipt_show_contact: input.showContact,
    })
    .eq("id", storeId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type AccountProfileInput = {
  fullName: string;
};

export async function updateAccountProfile(input: AccountProfileInput): Promise<ActionResult> {
  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false, error: "Your name is required" };
  if (fullName.length > 80) return { ok: false, error: "Name is too long" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
