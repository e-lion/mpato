import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccess, landingFor } from "@/lib/auth/access";
import {
  ACTIVE_STORE_COOKIE,
  getMemberships,
  pickActiveStore,
} from "@/lib/data/active-store";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED = ["/dashboard", "/pos", "/inventory", "/customers", "/messages", "/suppliers", "/reports", "/storefront", "/staff", "/settings"];
const AUTH_PAGES = ["/login", "/signup", "/join"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet: CookieToSet[]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based guard: keep cashiers/managers out of pages above their role.
  // Use the role for the *active* store, since a user's role varies per store.
  if (user && isProtected) {
    const memberships = await getMemberships(supabase, user.id);
    const active = pickActiveStore(
      memberships,
      request.cookies.get(ACTIVE_STORE_COOKIE)?.value,
    );
    if (active && !canAccess(active.role, path)) {
      const url = request.nextUrl.clone();
      url.pathname = landingFor(active.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
