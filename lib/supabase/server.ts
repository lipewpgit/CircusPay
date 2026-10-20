import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/constants";

async function createServerSupabaseClient(cookieName?: string) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      ...(cookieName ? { cookieOptions: { name: cookieName, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" } } : {}),
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}

export async function createClient() {
  return createServerSupabaseClient();
}

export async function createAdminClient() {
  return createServerSupabaseClient(ADMIN_AUTH_COOKIE);
}
