import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/constants";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  async function hasValidSession(cookieName?: string) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        ...(cookieName ? { cookieOptions: { name: cookieName, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" } } : {}),
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet, headers) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            const nextResponse = NextResponse.next({ request });
            response.cookies.getAll().forEach(({ name, value }) => nextResponse.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) => nextResponse.cookies.set(name, value, options));
            Object.entries(headers ?? {}).forEach(([key, value]) => nextResponse.headers.set(key, value));
            response = nextResponse;
          },
        },
      },
    );
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  }

  const sellerSignedIn = await hasValidSession();
  const adminSignedIn = await hasValidSession(ADMIN_AUTH_COOKIE);
  const pathname = request.nextUrl.pathname;
  const adminAuthPath = pathname === "/admin/login" || pathname === "/admin/ativar";
  const adminProtectedPath = pathname.startsWith("/admin") && !adminAuthPath;
  const sellerProtectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");

  function redirectWithSession(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(({ name, value }) => redirectResponse.cookies.set(name, value));
    return redirectResponse;
  }

  if (!adminSignedIn && adminProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return redirectWithSession(url);
  }

  if (!sellerSignedIn && sellerProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithSession(url);
  }

  if (adminSignedIn && adminAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return redirectWithSession(url);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
