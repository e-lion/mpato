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

/** Events the in-world dashboard / inventory / customers drawers send to the engine. */
export type RoomSceneEvent =
  // dashboard: a bar board of the week stands in front of the counter
  | { type: "board"; values: number[]; labels: string[] }
  | { type: "boardHi"; index: number | null }
  // inventory: the keeper fetches a product off its shelf and holds it up
  | { type: "shelf"; name: string; cat?: string; stock: number; low: boolean }
  | { type: "shelfClear" }
  | { type: "shelfAdded"; cat?: string }
  | { type: "lowStock"; count: number }
  // customers: the selected regular walks in and the keeper greets them
  | { type: "visit"; name: string; tag: string; spent: number }
  | { type: "visitEnd" }
  // leaving a room: tidy away whatever it staged in the scene
  | { type: "clearAll" };
