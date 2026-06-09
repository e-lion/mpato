import { POS } from "@/components/app/POS";
import {
  getCurrentStoreId,
  getProducts,
  getCustomers,
  getStoreSettings,
} from "@/lib/data/queries";

export default async function POSPage() {
  const storeId = await getCurrentStoreId();
  const [products, customers, settings] = storeId
    ? await Promise.all([
        getProducts(storeId),
        getCustomers(storeId),
        getStoreSettings(storeId),
      ])
    : [[], [], null];
  return (
    <POS products={products} customers={customers} settings={settings} />
  );
}
