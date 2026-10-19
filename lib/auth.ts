import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireApprovedSeller() {
  const { supabase, user } = await requireUser();
  const { data: seller } = await supabase.from("seller_accounts").select("status").eq("user_id", user.id).maybeSingle();
  if (seller?.status !== "approved") redirect("/onboarding");
  return { supabase, user, seller };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) redirect("/dashboard?erro=acesso-negado");
  return { supabase, user };
}
