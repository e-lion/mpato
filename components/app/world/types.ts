// The single event currency the 3D world consumes. Produced from real DB rows
// (sales + stock receipts) by useStoreActivity, or synthesized for ambient life.
export type WorldEvent = {
  id: string;
  kind: "sale" | "delivery";
  storeId: string;
  amountKES: number;
  at: string; // ISO
  method?: "mpesa" | "cash";
  itemCount?: number;
  supplierName?: string | null;
};
