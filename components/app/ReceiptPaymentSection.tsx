"use client";
import { useState, useTransition } from "react";
import { Btn } from "./primitives";
import { Icon } from "./Icon";
import { KES } from "@/lib/format";
import { recordSupplierPayment } from "@/app/actions/stock-receipts";

export function ReceiptPaymentSection({
  receiptId,
  totalCost,
  amountPaid,
  status,
}: {
  receiptId: string;
  totalCost: number;
  amountPaid: number;
  status: "unpaid" | "partial" | "paid";
}) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"cash" | "mpesa">("mpesa");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const balance = totalCost - amountPaid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (amount > balance) {
      setError(`Cannot pay more than the remaining balance (${KES(Math.round(balance / 100))}).`);
      return;
    }

    startTransition(async () => {
      const res = await recordSupplierPayment({
        receiptId,
        amountCents: Math.round(amount * 100),
        method,
        reference,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowModal(false);
      setAmount("");
      setReference("");
    });
  };

  return (
    <>
      <div
        style={{
          marginTop: 18,
          padding: 18,
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ color: "var(--fg3)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 4 }}>
            Payment Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".5px",
                background:
                  status === "paid"
                    ? "var(--emerald-100)"
                    : status === "partial"
                      ? "var(--amber-100)"
                      : "var(--rose-100)",
                color:
                  status === "paid"
                    ? "var(--emerald-800)"
                    : status === "partial"
                      ? "var(--amber-800)"
                      : "var(--rose-800)",
              }}
            >
              {status}
            </div>
            {status !== "paid" && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>
                Balance: {KES(Math.round(balance / 100))}
              </span>
            )}
          </div>
        </div>
        {status !== "paid" && (
          <Btn variant="primary" icon="plus" onClick={() => setShowModal(true)}>
            Log Payment
          </Btn>
        )}
      </div>

      {showModal && (
        <div className="scrim" onClick={() => !isPending && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700 }}>Log Payment</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg3)" }}
              >
                <Icon name="x" />
              </button>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="m-field" style={{ marginBottom: 0 }}>
                <label>Amount (KES)</label>
                <input
                  type="number"
                  min={1}
                  max={balance / 100}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  autoFocus
                  required
                />
              </div>
              <div className="m-field" style={{ marginBottom: 0 }}>
                <label>Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "mpesa")}>
                  <option value="mpesa">M-PESA</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              {method === "mpesa" && (
                <div className="m-field" style={{ marginBottom: 0 }}>
                  <label>M-PESA Code (optional)</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    placeholder="e.g. QFE..."
                  />
                </div>
              )}
              {error && <div className="m-error">{error}</div>}
              <div style={{ marginTop: 8 }}>
                <Btn variant="primary" type="submit" block disabled={isPending}>
                  {isPending ? "Saving..." : "Save Payment"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
