import { Messages } from "@/components/app/Messages";
import { getCurrentStoreId, getCustomers } from "@/lib/data/queries";

export default async function MessagesPage() {
  const storeId = await getCurrentStoreId();
  if (!storeId) {
    return <div>No store selected</div>;
  }
  
  const customers = await getCustomers(storeId);
  return <Messages storeId={storeId} initialCustomers={customers} />;
}
