import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next")?.startsWith("/")
    ? url.searchParams.get("next")!
    : "/dashboard";

  if (code) {
    const supabase = next === "/admin" ? await createAdminClient() : await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const errorPath = next === "/admin" ? "/admin/login" : "/login";
  return NextResponse.redirect(new URL(`${errorPath}?erro=${encodeURIComponent("Link inválido ou expirado.")}`, url.origin));
}
