import { Customers } from "@/components/app/Customers";
import { getCurrentStoreId, getCustomers } from "@/lib/data/queries";

export default async function CustomersPage() {
  const storeId = await getCurrentStoreId();
  const customers = storeId ? await getCustomers(storeId) : [];
  return <Customers customers={customers} />;
}
