"use client";
import { useState, useTransition } from "react";
import { Icon } from "./Icon";
import { Btn } from "./primitives";
import {
  signOut,
  updateAccountProfile,
  updatePaymentSettings,
  updateReceiptSettings,
  updateStoreProfile,
} from "@/app/actions/settings";
import type { StoreSettings } from "@/lib/data/queries";
import { WhatsAppIntegration } from "./WhatsAppIntegration";

type Props = {
  user: { email: string | null; fullName: string; initials: string };
  store: StoreSettings | null;
};

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            background: "var(--rose-50)",
            color: "var(--rose-600)",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <Icon name={icon} size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-.3px",
              margin: 0,
              color: "var(--fg1)",
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg3)", margin: "3px 0 0" }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SaveRow({
  saved,
  dirty,
  isPending,
  disabled,
}: {
  saved: boolean;
  dirty: boolean;
  isPending: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 4,
      }}
    >
      {saved && !dirty && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--success-fg)",
            fontWeight: 600,
          }}
        >
          <Icon name="check" size={14} /> Saved
        </span>
      )}
      <Btn variant="primary" type="submit" disabled={isPending || !dirty || disabled}>
        {isPending ? "Saving…" : "Save changes"}
      </Btn>
    </div>
  );
}

function BusinessProfile({ store }: { store: Props["store"] }) {
  const [name, setName] = useState(store?.name ?? "");
  const [area, setArea] = useState(store?.area ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = name !== (store?.name ?? "") || area !== (store?.area ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateStoreProfile({ name, area });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <SectionCard
      icon="store"
      title="Business profile"
      description="The name and location that appear on receipts and your storefront."
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="s-name">Shop name</label>
          <input
            id="s-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Soko Mini-Mart"
            required
          />
        </div>
        <div className="m-field">
          <label htmlFor="s-area">Area</label>
          <input
            id="s-area"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. Kileleshwa, Nairobi"
          />
        </div>
        <SaveRow saved={saved} dirty={dirty} isPending={isPending} disabled={!name.trim()} />
      </form>
    </SectionCard>
  );
}

function Payments({ store }: { store: Props["store"] }) {
  const [till, setTill] = useState(store?.mpesaTillNumber ?? "");
  const [paybill, setPaybill] = useState(store?.mpesaPaybillNumber ?? "");
  const [method, setMethod] = useState<"mpesa" | "cash">(store?.defaultPaymentMethod ?? "mpesa");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty =
    till !== (store?.mpesaTillNumber ?? "") ||
    paybill !== (store?.mpesaPaybillNumber ?? "") ||
    method !== (store?.defaultPaymentMethod ?? "mpesa");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePaymentSettings({
        tillNumber: till,
        paybillNumber: paybill,
        defaultMethod: method,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <SectionCard
      icon="smartphone"
      title="Payments"
      description="M-PESA numbers used at checkout and printed on receipts."
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-grid-2">
          <div className="m-field">
            <label htmlFor="p-till">Till number</label>
            <input
              id="p-till"
              inputMode="numeric"
              pattern="[0-9]*"
              value={till}
              onChange={(e) => {
                setTill(e.target.value.replace(/[^0-9]/g, ""));
                setSaved(false);
              }}
              placeholder="e.g. 123456"
            />
          </div>
          <div className="m-field">
            <label htmlFor="p-paybill">Paybill number</label>
            <input
              id="p-paybill"
              inputMode="numeric"
              pattern="[0-9]*"
              value={paybill}
              onChange={(e) => {
                setPaybill(e.target.value.replace(/[^0-9]/g, ""));
                setSaved(false);
              }}
              placeholder="e.g. 400200"
            />
          </div>
        </div>
        <div className="m-field">
          <label>Default payment at checkout</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <MethodOption
              icon="smartphone"
              label="M-PESA"
              sub="Open M-PESA first on the POS"
              selected={method === "mpesa"}
              onClick={() => {
                setMethod("mpesa");
                setSaved(false);
              }}
            />
            <MethodOption
              icon="banknote"
              label="Cash"
              sub="Open cash first on the POS"
              selected={method === "cash"}
              onClick={() => {
                setMethod("cash");
                setSaved(false);
              }}
            />
          </div>
        </div>
        <SaveRow saved={saved} dirty={dirty} isPending={isPending} />
      </form>
    </SectionCard>
  );
}

function MethodOption({
  icon,
  label,
  sub,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--r-md)",
        border: selected ? "1px solid var(--rose-300)" : "1px solid var(--border-strong)",
        background: selected ? "var(--rose-50)" : "var(--white)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "var(--transition)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--r-sm)",
          background: selected ? "var(--white)" : "var(--stone-50)",
          color: selected ? "var(--rose-700)" : "var(--fg2)",
          display: "grid",
          placeItems: "center",
          flex: "none",
        }}
      >
        <Icon name={icon} size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: selected ? "var(--rose-700)" : "var(--fg1)",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg3)" }}>{sub}</div>
      </div>
      {selected && <Icon name="check" size={16} />}
    </button>
  );
}

function Receipts({ store }: { store: Props["store"] }) {
  const [footer, setFooter] = useState(store?.receiptFooter ?? "");
  const [showContact, setShowContact] = useState(store?.receiptShowContact ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty =
    footer !== (store?.receiptFooter ?? "") || showContact !== (store?.receiptShowContact ?? true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateReceiptSettings({ footer, showContact });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <SectionCard
      icon="receipt"
      title="Receipts"
      description="What customers see on printed and SMS receipts."
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="r-footer">
            Footer message <span style={{ color: "var(--fg3)", fontWeight: 500 }}>· optional</span>
          </label>
          <textarea
            id="r-footer"
            value={footer}
            maxLength={280}
            onChange={(e) => {
              setFooter(e.target.value);
              setSaved(false);
            }}
            placeholder="Asante! Karibu tena."
          />
          <div style={{ fontSize: 12, color: "var(--fg3)", textAlign: "right" }}>
            {footer.length} / 280
          </div>
        </div>
        <ToggleRow
          title="Show shop contact info"
          sub="Print the shop name and area on every receipt."
          on={showContact}
          onToggle={() => {
            setShowContact((v) => !v);
            setSaved(false);
          }}
        />
        <SaveRow saved={saved} dirty={dirty} isPending={isPending} />
      </form>
    </SectionCard>
  );
}

function ToggleRow({
  title,
  sub,
  on,
  onToggle,
}: {
  title: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg1)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 2 }}>{sub}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        style={{
          position: "relative",
          width: 42,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: on ? "var(--rose-600)" : "var(--stone-300)",
          cursor: "pointer",
          transition: "background 160ms ease",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 160ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,.2)",
          }}
        />
      </button>
    </div>
  );
}

function AccountProfile({ user }: { user: Props["user"] }) {
  const [fullName, setFullName] = useState(user.fullName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = fullName !== user.fullName;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAccountProfile({ fullName });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <SectionCard
      icon="user-round"
      title="Your account"
      description="How your name appears across Mpato. Sign in is tied to your email."
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="a-name">Display name</label>
          <input
            id="a-name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSaved(false);
            }}
            placeholder="Grace Njeri"
            required
          />
        </div>
        <div className="m-field">
          <label htmlFor="a-email">Email</label>
          <input
            id="a-email"
            type="email"
            value={user.email ?? ""}
            readOnly
            disabled
            style={{ color: "var(--fg3)", background: "var(--stone-50)" }}
          />
        </div>
        <SaveRow saved={saved} dirty={dirty} isPending={isPending} disabled={!fullName.trim()} />
      </form>
    </SectionCard>
  );
}

function SignOutCard() {
  const [isPending, startTransition] = useTransition();
  function onSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }
  return (
    <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-md)",
          background: "var(--stone-100)",
          color: "var(--fg2)",
          display: "grid",
          placeItems: "center",
          flex: "none",
        }}
      >
        <Icon name="arrow-right" size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--fg1)" }}>
          Sign out
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 2 }}>
          End this session on this device.
        </div>
      </div>
      <Btn variant="secondary" onClick={onSignOut} disabled={isPending}>
        {isPending ? "Signing out…" : "Sign out"}
      </Btn>
    </div>
  );
}

export function Settings({ user, store }: Props) {
  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <BusinessProfile store={store} />
      <Payments store={store} />
      <Receipts store={store} />
      <WhatsAppIntegration storeId={store?.id} />
      <AccountProfile user={user} />
      <SignOutCard />
    </div>
  );
}
