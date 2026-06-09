import { ReceiveStock } from "@/components/app/ReceiveStock";
import {
  getCurrentStoreId,
  getProducts,
  getStockReceipts,
  getSuppliers,
} from "@/lib/data/queries";

export default async function ReceiveStockPage() {
  const storeId = await getCurrentStoreId();
  const [products, suppliers, receipts] = storeId
    ? await Promise.all([
        getProducts(storeId),
        getSuppliers(storeId),
        getStockReceipts(storeId, 5),
      ])
    : [[], [], []];
  return (
    <ReceiveStock products={products} suppliers={suppliers} recentReceipts={receipts} />
  );
}
