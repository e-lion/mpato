// Role-based access control for the app shell. Pure functions only — safe to
// import from both server components/middleware and client components.

export type Role = "owner" | "manager" | "cashier";

export const ROLES: Role[] = ["owner", "manager", "cashier"];

export function isRole(v: unknown): v is Role {
  return v === "owner" || v === "manager" || v === "cashier";
}

// Every protected app route, mapped to the roles allowed to open it. Matched by
// prefix, longest-first, so a more specific rule wins over a general one.
type Rule = { prefix: string; roles: Role[] };

const ALL: Role[] = ["owner", "manager", "cashier"];
const MANAGE: Role[] = ["owner", "manager"];
const OWNER_ONLY: Role[] = ["owner"];

const RULES: Rule[] = [
  { prefix: "/dashboard", roles: ALL },
  { prefix: "/pos", roles: ALL },
  { prefix: "/customers", roles: ALL },
  { prefix: "/messages", roles: MANAGE },
  { prefix: "/inventory", roles: MANAGE },
  { prefix: "/suppliers", roles: MANAGE },
  { prefix: "/reports", roles: MANAGE },
  { prefix: "/storefront", roles: MANAGE },
  { prefix: "/staff", roles: OWNER_ONLY },
  { prefix: "/settings", roles: OWNER_ONLY },
];

function ruleFor(path: string): Rule | null {
  let match: Rule | null = null;
  for (const r of RULES) {
    if (path === r.prefix || path.startsWith(r.prefix + "/")) {
      if (!match || r.prefix.length > match.prefix.length) match = r;
    }
  }
  return match;
}

/** Can this role open this app path? Unknown/unprotected paths default to allow
 *  (auth is handled separately in middleware). */
export function canAccess(role: Role, path: string): boolean {
  const rule = ruleFor(path);
  return rule ? rule.roles.includes(role) : true;
}

/** Where to send a user who lands somewhere their role can't access. */
export function landingFor(role: Role): string {
  return role === "cashier" ? "/pos" : "/dashboard";
}
