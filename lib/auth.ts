import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireSeller() {
  const { supabase, user } = await requireUser();
  const [{ data: isAdmin }, { data: seller }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("seller_accounts").select("status").eq("user_id", user.id).maybeSingle(),
  ]);
  if (isAdmin === true || !seller) redirect("/login?erro=" + encodeURIComponent("Entre com uma conta seller para acessar esta área."));
  return { supabase, user, seller };
}

export async function requireApprovedSeller() {
  const { supabase, user, seller } = await requireSeller();
  if (seller?.status !== "approved") redirect("/onboarding");
  return { supabase, user, seller };
}

export async function requireAdmin() {
  const supabase = await createAdminClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/admin/login");
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) redirect("/admin/login?erro=" + encodeURIComponent("Acesso administrativo não autorizado."));
  return { supabase, user };
}
