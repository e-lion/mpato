import { Suppliers } from "@/components/app/Suppliers";
import { getCurrentStoreId, getSuppliers } from "@/lib/data/queries";

export default async function SuppliersPage() {
  const storeId = await getCurrentStoreId();
  const suppliers = storeId ? await getSuppliers(storeId) : [];
  return <Suppliers suppliers={suppliers} />;
}
