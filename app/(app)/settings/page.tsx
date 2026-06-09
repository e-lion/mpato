import { redirect } from "next/navigation";
import { Settings } from "@/components/app/Settings";
import { getSessionContext } from "@/lib/data/session";
import { getCurrentStoreId, getStoreSettings } from "@/lib/data/queries";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const storeId = await getCurrentStoreId();
  const store = storeId ? await getStoreSettings(storeId) : null;

  return (
    <Settings
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        initials: ctx.user.initials,
      }}
      store={store}
    />
  );
}
