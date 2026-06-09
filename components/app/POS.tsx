"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icon";
import { Avatar, Badge, Btn } from "./primitives";
import { KES } from "@/lib/format";
import { TILES } from "@/lib/mockData";
import { CATEGORIES, type Customer, type Product } from "@/lib/data/types";
import type { StoreSettings } from "@/lib/data/queries";
import { recordSale } from "@/app/actions/sales";
import { initiateStkPush, checkStkPushStatus } from "@/app/actions/mpesa";
import { Receipt, type ReceiptData } from "./Receipt";

type Cart = Record<string, number>;
type Done = {
  method: "mpesa" | "cash";
  total: number;
  receiptNo: string;
  mpesaRef: string | null;
  customerName: string | null;
  lines: { name: string; qty: number; unitPrice: number }[];
  createdAt: string;
};

export function POS({
  products,
  customers,
  settings,
}: {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings | null;
}) {
  const router = useRouter();
  const [cat, setCat] = useState<string>("All");
  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpesaPrompt, setMpesaPrompt] = useState(false);
  const [mpesaRef, setMpesaRef] = useState("");
  const [stkPhone, setStkPhone] = useState("");
  const [stkRequestId, setStkRequestId] = useState<string | null>(null);
  const [stkStatus, setStkStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [manualMpesa, setManualMpesa] = useState(false);

  const defaultMethod = settings?.defaultPaymentMethod ?? "mpesa";
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Pre-select a customer when the page is opened via "New sale" from a
  // profile (URL like /pos?customer=<id>). Runs once on mount.
  useEffect(() => {
    const cid = searchParams?.get("customer");
    if (cid && customers.some((c) => c.id === cid)) {
      setCustomerId(cid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedCustomer = useMemo(
    () => (customerId ? customers.find((c) => c.id === customerId) ?? null : null),
    [customerId, customers],
  );

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [customers, pickerQuery]);

  const add = (p: Product) =>
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));

  const bump = (id: string, d: number) =>
    setCart((c) => {
      const n = (c[id] || 0) + d;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const list = products.filter(
    (p) =>
      (cat === "All" || p.cat === cat) &&
      (query === "" || p.name.toLowerCase().includes(query.toLowerCase())),
  );

  const lines = Object.entries(cart)
    .map(([id, q]) => {
      const p = products.find((x) => x.id === id);
      return p ? { p, q } : null;
    })
    .filter((l): l is { p: Product; q: number } => l !== null);

  const subtotal = lines.reduce((s, l) => s + l.p.price * l.q, 0);
  const count = lines.reduce((s, l) => s + l.q, 0);

  const submit = (method: "mpesa" | "cash", ref?: string) => {
    setError(null);
    const items = lines.map((l) => ({ productId: l.p.id, qty: l.q }));
    const snapshotLines = lines.map((l) => ({
      name: l.p.name,
      qty: l.q,
      unitPrice: l.p.price,
    }));
    const attachedName = selectedCustomer?.name ?? null;
    startTransition(async () => {
      const result = await recordSale({
        method,
        items,
        mpesaRef: ref,
        customerId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMpesaPrompt(false);
      setMpesaRef("");
      setDone({
        method,
        total: Math.round(result.totalCents / 100),
        receiptNo: result.receiptNo,
        mpesaRef: result.mpesaRef,
        customerName: attachedName,
        lines: snapshotLines,
        createdAt: new Date().toISOString(),
      });
    });
  };

  const openMpesa = () => {
    setError(null);
    setMpesaRef("");
    setStkRequestId(null);
    setStkStatus("idle");
    setStkPhone(selectedCustomer?.phone || "");
    setManualMpesa(false);
    setMpesaPrompt(true);
  };

  const cancelMpesa = () => {
    if (isPending || stkStatus === "pending") return;
    setMpesaPrompt(false);
    setMpesaRef("");
    setStkRequestId(null);
    setError(null);
  };

  const confirmMpesa = () => {
    submit("mpesa", mpesaRef.trim().toUpperCase() || undefined);
  };

  const handleStkPush = async () => {
    setError(null);
    if (!stkPhone) {
      setError("Please enter a phone number");
      return;
    }
    setStkStatus("pending");
    const res = await initiateStkPush(subtotal, stkPhone);
    if (!res.ok) {
      setError(res.error);
      setStkStatus("failed");
      return;
    }
    setStkRequestId(res.checkoutRequestId!);
  };

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      if (!stkRequestId || stkStatus !== "pending") return;
      const pollRes = await checkStkPushStatus(stkRequestId);
      if (!active) return;

      if (pollRes.status === "success") {
        setStkStatus("success");
        submit("mpesa", pollRes.receipt);
      } else if (pollRes.status === "failed") {
        setStkStatus("failed");
        setError(pollRes.error || "M-PESA request failed");
      } else {
        timer = setTimeout(poll, 2000);
      }
    };

    if (stkRequestId && stkStatus === "pending") {
      timer = setTimeout(poll, 2000);
    }

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stkRequestId, stkStatus]);

  const reset = () => {
    setDone(null);
    setShowReceipt(false);
    setCart({});
    setCustomerId(null);
    setError(null);
    // Server already revalidated dashboard/inventory; refresh the POS data
    // so the in-memory product list reflects the new (decremented) stock.
    router.refresh();
  };

  const openPicker = () => {
    setPickerQuery("");
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerQuery("");
  };

  const choose = (id: string | null) => {
    setCustomerId(id);
    closePicker();
  };

  return (
    <div className="pos">
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="topsearch" style={{ width: "100%", marginBottom: 14 }}>
          <Icon name="search" size={16} />
          <input
            placeholder="Search products or scan barcode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="pos-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={"cat" + (cat === c ? " on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
          <div className="pos-grid">
            {list.map((p) => (
              <button className="pcard" key={p.id} onClick={() => add(p)} disabled={p.stock === 0}>
                <div className="ph" style={{ background: TILES[p.tile].bg }}>
                  <Icon name={p.glyph} />
                </div>
                <div className="bd">
                  <div className="nm">{p.name}</div>
                  <div className="pr num">{KES(p.price)}</div>
                  <div className="st">
                    {p.stock === 0 ? (
                      <span style={{ color: "var(--danger-fg)" }}>Out of stock</span>
                    ) : p.stock <= 6 ? (
                      <span style={{ color: "var(--warning-fg)" }}>Low · {p.stock} left</span>
                    ) : (
                      p.stock + " in stock"
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cart">
        <div className="cart-h">
          <span className="ttl">Current sale</span>
          {count > 0 && (
            <Badge kind="success">
              {count} item{count > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={openPicker}
          className="cust-chip"
          aria-label={
            selectedCustomer
              ? `Customer: ${selectedCustomer.name}. Click to change.`
              : "Attach a customer to this sale"
          }
        >
          {selectedCustomer ? (
            <>
              <Avatar name={selectedCustomer.name} color={selectedCustomer.color} size={28} />
              <div className="cust-chip-mid">
                <div className="cust-chip-nm">{selectedCustomer.name}</div>
                <div className="cust-chip-sub">
                  {selectedCustomer.phone ?? "No phone"} · {selectedCustomer.visits} visit
                  {selectedCustomer.visits === 1 ? "" : "s"}
                </div>
              </div>
              <span
                role="button"
                tabIndex={0}
                aria-label="Remove customer"
                className="cust-chip-x"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomerId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setCustomerId(null);
                  }
                }}
              >
                <Icon name="x" size={14} />
              </span>
            </>
          ) : (
            <>
              <span className="cust-chip-ic">
                <Icon name="user-plus" size={15} />
              </span>
              <span className="cust-chip-mid">
                <div className="cust-chip-nm">Walk-in customer</div>
                <div className="cust-chip-sub">Tap to attach a customer (optional)</div>
              </span>
              <Icon name="chevrons-up-down" size={14} color="var(--fg3)" />
            </>
          )}
        </button>
        <div className="cart-items">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <Icon name="shopping-cart" />
              <div style={{ fontWeight: 600, color: "var(--fg2)" }}>No items yet</div>
              <div style={{ fontSize: 13 }}>Tap a product to start a sale</div>
            </div>
          ) : (
            lines.map((l) => (
              <div className="citem" key={l.p.id}>
                <div
                  className="thumb"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "var(--r-sm)",
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    background: TILES[l.p.tile].bg,
                    flex: "none",
                  }}
                >
                  <Icon name={l.p.glyph} size={15} />
                </div>
                <div className="ci-mid" style={{ flex: 1, minWidth: 0 }}>
                  <div className="ci-nm">{l.p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg3)" }} className="num">
                    {KES(l.p.price)} each
                  </div>
                </div>
                <div className="qty">
                  <button onClick={() => bump(l.p.id, -1)} aria-label="decrease">
                    <Icon name="minus" size={13} />
                  </button>
                  <span className="n num">{l.q}</span>
                  <button onClick={() => bump(l.p.id, 1)} aria-label="increase">
                    <Icon name="plus" size={13} />
                  </button>
                </div>
                <div className="ci-pr num" style={{ width: 72, textAlign: "right" }}>
                  {KES(l.p.price * l.q)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-foot">
          {error && (
            <div
              style={{
                background: "var(--danger-bg)",
                color: "var(--danger-fg)",
                padding: "8px 12px",
                borderRadius: "var(--r-md)",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              {error}
            </div>
          )}
          <div className="totrow"><span>Subtotal</span><span className="num">{KES(subtotal)}</span></div>
          <div className="totrow"><span>VAT included</span><span className="num">{KES(Math.round((subtotal * 0.16) / 1.16))}</span></div>
          <div className="totrow grand"><span>Total</span><span className="num">{KES(subtotal)}</span></div>
          <div className="pay-row">
            {defaultMethod === "cash" ? (
              <>
                <Btn variant="primary" size="lg" icon="banknote" disabled={count === 0 || isPending} onClick={() => submit("cash")}>
                  {isPending && !mpesaPrompt ? "…" : "Cash"}
                </Btn>
                <Btn variant="secondary" size="lg" icon="smartphone" disabled={count === 0 || isPending} onClick={openMpesa}>
                  {isPending && mpesaPrompt ? "…" : "M-PESA"}
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="mpesa" size="lg" icon="smartphone" disabled={count === 0 || isPending} onClick={openMpesa}>
                  {isPending && mpesaPrompt ? "…" : "M-PESA"}
                </Btn>
                <Btn variant="secondary" size="lg" icon="banknote" disabled={count === 0 || isPending} onClick={() => submit("cash")}>
                  {isPending && !mpesaPrompt ? "…" : "Cash"}
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>

      {pickerOpen && !done && (
        <div className="scrim" onClick={closePicker}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left", maxWidth: 440, padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 20,
                  margin: 0,
                  letterSpacing: "-.3px",
                }}
              >
                Attach customer
              </h2>
              <button
                aria-label="Close customer picker"
                onClick={closePicker}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--fg3)",
                  padding: 4,
                  borderRadius: "var(--r-sm)",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="topsearch" style={{ width: "100%", marginBottom: 10 }}>
              <Icon name="search" size={16} />
              <input
                autoFocus
                placeholder="Search by name or phone…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closePicker();
                  if (e.key === "Enter" && pickerResults[0]) choose(pickerResults[0].id);
                }}
              />
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", margin: "0 -4px" }}>
              <button
                type="button"
                onClick={() => choose(null)}
                className="cust-row"
                aria-pressed={customerId === null}
              >
                <span className="cust-chip-ic">
                  <Icon name="user-plus" size={15} />
                </span>
                <div className="cust-chip-mid">
                  <div className="cust-chip-nm">Walk-in customer</div>
                  <div className="cust-chip-sub">No customer attached</div>
                </div>
                {customerId === null && <Icon name="check" size={16} color="var(--rose-600)" />}
              </button>
              {pickerResults.length === 0 ? (
                <div
                  style={{
                    padding: "24px 12px",
                    textAlign: "center",
                    color: "var(--fg3)",
                    fontSize: 13,
                  }}
                >
                  {customers.length === 0
                    ? "No customers yet. Add one in the Customers tab."
                    : "No matches for that search."}
                </div>
              ) : (
                pickerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => choose(c.id)}
                    className="cust-row"
                    aria-pressed={customerId === c.id}
                  >
                    <Avatar name={c.name} color={c.color} size={32} />
                    <div className="cust-chip-mid">
                      <div className="cust-chip-nm">{c.name}</div>
                      <div className="cust-chip-sub">
                        {c.phone ?? "No phone"} · {KES(c.spent)} lifetime
                      </div>
                    </div>
                    {customerId === c.id && (
                      <Icon name="check" size={16} color="var(--rose-600)" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {mpesaPrompt && !done && (
        <div className="scrim" onClick={cancelMpesa}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="success-ic"
              style={{ background: "var(--mpesa-bg, #00a651)", color: "#fff" }}
            >
              <Icon name="smartphone" />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                margin: "0 0 4px",
                letterSpacing: "-.4px",
              }}
            >
              Confirm M-PESA payment
            </h2>
            <p style={{ color: "var(--fg2)", fontSize: 14, margin: "0 0 4px" }}>
              Amount due
            </p>
            <div
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: "-1px",
                margin: "0 0 6px",
              }}
            >
              {KES(subtotal)}
            </div>
            {(settings?.mpesaTillNumber || settings?.mpesaPaybillNumber) && (
              <div
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  margin: "0 0 14px",
                }}
              >
                {settings?.mpesaTillNumber && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0C744F",
                      background: "var(--mpesa-bg)",
                      borderRadius: "var(--r-pill)",
                      padding: "4px 10px",
                    }}
                  >
                    Till {settings.mpesaTillNumber}
                  </span>
                )}
                {settings?.mpesaPaybillNumber && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0C744F",
                      background: "var(--mpesa-bg)",
                      borderRadius: "var(--r-pill)",
                      padding: "4px 10px",
                    }}
                  >
                    Paybill {settings.mpesaPaybillNumber}
                  </span>
                )}
              </div>
            )}
            
            {!manualMpesa ? (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ display: "block", textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}
                >
                  Customer Phone Number
                </label>
                <input
                  autoFocus
                  placeholder="e.g. 0712345678"
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleStkPush();
                    if (e.key === "Escape") cancelMpesa();
                  }}
                  disabled={stkStatus === "pending"}
                  style={{
                    width: "100%", fontSize: 18, padding: "12px 14px", border: "1.5px solid var(--border)",
                    borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--fg1)", outline: "none",
                    marginBottom: 10,
                  }}
                />
                {stkStatus === "pending" && (
                  <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textAlign: "center", marginBottom: 10 }}>
                    <Icon name="loader" size={14} className="spin" /> Waiting for customer to enter PIN...
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <Btn variant="secondary" block onClick={cancelMpesa} disabled={isPending || stkStatus === "pending"}>
                    Cancel
                  </Btn>
                  <Btn variant="mpesa" block icon="send" onClick={handleStkPush} disabled={isPending || stkStatus === "pending"}>
                    {stkStatus === "pending" ? "Waiting..." : "Send Request"}
                  </Btn>
                </div>
                <button
                  onClick={() => setManualMpesa(true)}
                  disabled={stkStatus === "pending"}
                  style={{
                    background: "none", border: "none", color: "var(--fg3)", fontSize: 13, textDecoration: "underline",
                    cursor: "pointer", marginTop: 16, width: "100%"
                  }}
                >
                  Enter receipt manually instead
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg2)",
                    marginBottom: 6,
                  }}
                  htmlFor="mpesa-ref"
                >
                  M-PESA confirmation code
                </label>
                <input
                  id="mpesa-ref"
                  autoFocus
                  className="mono"
                  placeholder="e.g. QGH7X2P1LM"
                  value={mpesaRef}
                  maxLength={12}
                  onChange={(e) =>
                    setMpesaRef(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmMpesa();
                    if (e.key === "Escape") cancelMpesa();
                  }}
                  style={{
                    width: "100%",
                    fontSize: 18,
                    letterSpacing: "2px",
                    textAlign: "center",
                    padding: "12px 14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface)",
                    color: "var(--fg1)",
                    outline: "none",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                />
                <p style={{ color: "var(--fg3)", fontSize: 12, margin: "0 0 16px" }}>
                  Type the code from the customer&apos;s M-PESA SMS. Leave blank to
                  record without a code.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="secondary" block onClick={() => setManualMpesa(false)} disabled={isPending}>
                    Back
                  </Btn>
                  <Btn variant="mpesa" block icon="check" onClick={confirmMpesa} disabled={isPending}>
                    {isPending ? "Recording…" : "Confirm payment"}
                  </Btn>
                </div>
              </div>
            )}
            
            {error && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger-fg)",
                  padding: "8px 12px",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                  marginTop: 12,
                  textAlign: "left",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="scrim" onClick={reset}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-ic"><Icon name="check" /></div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, margin: "0 0 4px", letterSpacing: "-.6px" }}>
              Sale complete
            </h2>
            <div className="num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, letterSpacing: "-1.2px", margin: "6px 0" }}>
              {KES(done.total)}
            </div>
            <p style={{ color: "var(--fg2)", fontSize: 14, margin: "0 0 6px" }}>
              {done.method === "mpesa" ? "Paid via M-PESA · ref " : "Paid in cash"}
              {done.method === "mpesa" && done.mpesaRef && <span className="mono">{done.mpesaRef}</span>}
            </p>
            {done.customerName && (
              <p style={{ color: "var(--fg2)", fontSize: 13, margin: "0 0 2px" }}>
                For <strong style={{ color: "var(--fg1)" }}>{done.customerName}</strong>
              </p>
            )}
            <p className="mono" style={{ color: "var(--fg3)", fontSize: 13, margin: "0 0 20px" }}>
              #{done.receiptNo}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                variant="secondary"
                block
                icon="printer"
                onClick={() => setShowReceipt(true)}
              >
                Receipt
              </Btn>
              <Btn variant="primary" block icon="plus" onClick={reset}>New sale</Btn>
            </div>
          </div>
        </div>
      )}

      {done && showReceipt && (
        <ReceiptModal
          onClose={() => setShowReceipt(false)}
          data={{
            shopName: settings?.name ?? "Your shop",
            shopArea: settings?.area ?? null,
            showContact: settings?.receiptShowContact ?? true,
            footer: settings?.receiptFooter ?? null,
            tillNumber: settings?.mpesaTillNumber ?? null,
            paybillNumber: settings?.mpesaPaybillNumber ?? null,
            receiptNo: done.receiptNo,
            createdAt: done.createdAt,
            method: done.method,
            mpesaRef: done.mpesaRef,
            customerName: done.customerName,
            lines: done.lines,
            total: done.total,
          }}
        />
      )}
    </div>
  );
}

function ReceiptModal({
  onClose,
  data,
}: {
  onClose: () => void;
  data: ReceiptData;
}) {
  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380, padding: 0, textAlign: "left", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Receipt
          </div>
          <button
            aria-label="Close receipt"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--fg3)",
              padding: 4,
              borderRadius: "var(--r-sm)",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 18, background: "var(--bg2)" }}>
          <Receipt data={data} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <Btn variant="secondary" block onClick={onClose}>
            Close
          </Btn>
          <Btn
            variant="primary"
            block
            icon="printer"
            onClick={() => window.print()}
          >
            Print
          </Btn>
        </div>
      </div>
    </div>
  );
}
