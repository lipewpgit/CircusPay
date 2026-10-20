"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/constants";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions: { name: ADMIN_AUTH_COOKIE, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" } },
  );
}
