"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export async function reviewSeller(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 500);
  if (!userId || !["approved", "rejected", "suspended"].includes(decision)) redirect("/admin?erro=Ação inválida.");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_review_seller", {
    target_user: userId,
    decision,
    notes: notes || null,
  });
  if (error?.message.includes("DOCUMENTS_MISSING")) redirect("/admin?erro=O seller precisa enviar os dois documentos antes da aprovação.");
  if (error?.message.includes("FINANCE_ACCOUNT_MISSING")) redirect("/admin?erro=O seller precisa cadastrar uma chave Pix antes da aprovação.");
  if (error) redirect("/admin?erro=Não foi possível atualizar o seller.");
  const { data: updatedSeller } = await supabase.from("seller_accounts").select("status").eq("user_id", userId).single();
  if (updatedSeller?.status !== decision) redirect("/admin?erro=A atualização não foi confirmada.");
  revalidatePath("/admin");
  redirect("/admin?sucesso=Seller atualizado.");
}

export async function updateWithdrawal(formData: FormData) {
  const id = String(formData.get("withdrawalId") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 500);
  if (!id || !["processing", "paid", "rejected", "cancelled"].includes(status)) redirect("/admin?erro=Ação inválida.");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_withdrawal_status", {
    target_id: id,
    new_status: status,
    notes: notes || null,
  });
  if (error) redirect("/admin?erro=Não foi possível atualizar o saque.");
  revalidatePath("/admin");
  redirect("/admin?sucesso=Saque atualizado.");
}
