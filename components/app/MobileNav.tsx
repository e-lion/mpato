"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const MobileNavCtx = createContext<Ctx>({ open: false, setOpen: () => {} });

export const useMobileNav = () => useContext(MobileNavCtx);

/** Shares the phone nav drawer's open state between Topbar (trigger) and Sidebar (panel). */
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback((v: boolean) => setOpenState(v), []);

  // Close once a route lands, and on Escape.
  useEffect(() => setOpenState(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenState(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return (
    <MobileNavCtx.Provider value={value}>
      <div className="app" data-nav={open ? "open" : "closed"}>
        {children}
        <div className="nav-scrim" onClick={() => setOpenState(false)} aria-hidden="true" />
      </div>
    </MobileNavCtx.Provider>
  );
}
