"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login?erro=" + encodeURIComponent("Acesso administrativo não autorizado."));
  return { supabase, user };
}

function finish(message: string, error = false) {
  revalidatePath("/admin");
  redirect(`/admin?${error ? "erro" : "sucesso"}=${encodeURIComponent(message)}`);
}

export async function reviewSeller(formData: FormData) {
  const parsed = z.object({
    userId: z.string().uuid(),
    decision: z.enum(["approved", "rejected", "suspended"]),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) finish("Solicitação inválida.", true);

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_review_seller", {
    target_user: parsed.data.userId,
    decision: parsed.data.decision,
    notes: null,
  });
  if (error) finish("Não foi possível atualizar o seller.", true);
  finish(parsed.data.decision === "approved" ? "Seller aprovado com sucesso." : "Status do seller atualizado.");
}

export async function updateWithdrawal(formData: FormData) {
  const parsed = z.object({
    withdrawalId: z.string().uuid(),
    status: z.enum(["processing", "paid", "rejected", "cancelled"]),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) finish("Solicitação de saque inválida.", true);

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_withdrawal_status", {
    target_id: parsed.data.withdrawalId,
    new_status: parsed.data.status,
    notes: null,
  });
  if (error) finish("Não foi possível atualizar o saque.", true);
  finish("Saque atualizado com sucesso.");
}

export async function reviewDocument(formData: FormData) {
  const parsed = z.object({
    documentId: z.string().uuid(),
    status: z.enum(["approved", "rejected", "resubmission"]),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) finish("Documento inválido.", true);

  const { supabase, user } = await requireAdmin();
  const { error } = await supabase
    .from("kyc_documents")
    .update({
      status: parsed.data.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: parsed.data.status === "approved" ? null : "Documento precisa de nova análise.",
    })
    .eq("id", parsed.data.documentId);
  if (error) finish("Não foi possível revisar o documento.", true);
  finish(parsed.data.status === "approved" ? "Documento aprovado." : "Documento devolvido para correção.");
}
