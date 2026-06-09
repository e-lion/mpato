import { StockReceiptList } from "@/components/app/StockReceiptList";
import { getCurrentStoreId, getStockReceipts } from "@/lib/data/queries";

export default async function StockReceiptsPage() {
  const storeId = await getCurrentStoreId();
  const receipts = storeId ? await getStockReceipts(storeId, 100) : [];
  return <StockReceiptList receipts={receipts} />;
}
