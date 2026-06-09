import { KES } from "@/lib/format";

export type ReceiptData = {
  shopName: string;
  shopArea: string | null;
  showContact: boolean;
  footer: string | null;
  tillNumber: string | null;
  paybillNumber: string | null;
  receiptNo: string;
  createdAt: string;
  method: "mpesa" | "cash";
  mpesaRef: string | null;
  customerName: string | null;
  lines: { name: string; qty: number; unitPrice: number }[];
  total: number;
};

function formatReceiptTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function Receipt({ data }: { data: ReceiptData }) {
  return (
    <div className="receipt" role="document" aria-label={`Receipt ${data.receiptNo}`}>
      <header className="r-head">
        <div className="r-shop">{data.shopName}</div>
        {data.showContact && data.shopArea && (
          <div className="r-sub">{data.shopArea}</div>
        )}
        {data.showContact && (data.tillNumber || data.paybillNumber) && (
          <div className="r-sub r-mpesa-line">
            {data.tillNumber && <span>Till {data.tillNumber}</span>}
            {data.tillNumber && data.paybillNumber && <span aria-hidden> · </span>}
            {data.paybillNumber && <span>Paybill {data.paybillNumber}</span>}
          </div>
        )}
      </header>

      <div className="r-rule" />

      <dl className="r-meta">
        <div>
          <dt>Receipt</dt>
          <dd className="mono">#{data.receiptNo}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatReceiptTime(data.createdAt)}</dd>
        </div>
        {data.customerName && (
          <div>
            <dt>Customer</dt>
            <dd>{data.customerName}</dd>
          </div>
        )}
      </dl>

      <div className="r-rule" />

      <table className="r-items">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Item</th>
            <th>Qty</th>
            <th style={{ textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l, i) => (
            <tr key={i}>
              <td>
                <div>{l.name}</div>
                <div className="r-line-sub num">{KES(l.unitPrice)} ea</div>
              </td>
              <td className="num" style={{ textAlign: "center" }}>{l.qty}</td>
              <td className="num" style={{ textAlign: "right" }}>
                {KES(l.unitPrice * l.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="r-rule" />

      <div className="r-total">
        <span>Total</span>
        <span className="num">{KES(data.total)}</span>
      </div>

      <div className="r-pay">
        {data.method === "mpesa" ? (
          <>
            <span>Paid via M-PESA</span>
            {data.mpesaRef && (
              <span className="mono">Ref {data.mpesaRef}</span>
            )}
          </>
        ) : (
          <span>Paid in cash</span>
        )}
      </div>

      {data.footer && (
        <>
          <div className="r-rule" />
          <p className="r-footer">{data.footer}</p>
        </>
      )}
    </div>
  );
}
