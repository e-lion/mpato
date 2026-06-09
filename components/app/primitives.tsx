import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type BtnVariant = "primary" | "secondary" | "ghost" | "accent" | "mpesa" | "white";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "lg";
  block?: boolean;
  icon?: string;
  children?: ReactNode;
};

export function Btn({ variant = "primary", size, block, icon, children, className, ...rest }: BtnProps) {
  const cls = [
    "btn",
    "btn-" + variant,
    size === "lg" && "btn-lg",
    block && "btn-block",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}

type BadgeKind = "success" | "warning" | "danger" | "info" | "mpesa" | "cash" | "neutral";

export function Badge({
  kind = "neutral",
  dot,
  children,
}: {
  kind?: BadgeKind;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={"badge b-" + kind}>
      {dot && <span className="bd" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}

export function Avatar({
  name,
  color = "var(--peri-500)",
  size = 34,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="avatar-sm"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
