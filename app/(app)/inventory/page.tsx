import { Inventory } from "@/components/app/Inventory";
import { getCurrentStoreId, getProducts } from "@/lib/data/queries";

export default async function InventoryPage() {
  const storeId = await getCurrentStoreId();
  const products = storeId ? await getProducts(storeId) : [];
  return <Inventory products={products} />;
}
