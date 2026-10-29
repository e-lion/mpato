/**
 * Events the in-world POS drawer sends to the 3D engine. The engine turns each
 * into a piece of choreography (customer walks in, goods fly to the counter,
 * money moves to the till...). Only what the user does drives the scene.
 */
export type SaleSceneEvent =
  | { type: "start" }
  | { type: "item"; delta: 1 | -1; cat?: string }
  | { type: "paying"; method: "cash" | "mpesa" }
  | { type: "payCancel" }
  | { type: "paid"; method: "cash" | "mpesa"; total: number }
  | { type: "next" }
  | { type: "leave" };

/** Events the in-world receive-stock drawer sends to the engine. */
export type DeliverySceneEvent =
  | { type: "supplier"; name: string | null } // a supplier was chosen → their truck pulls up (null: truck leaves)
  | { type: "received"; lines: number; paid: number } // receipt saved → unload, pay, truck leaves
  | { type: "leave" };
