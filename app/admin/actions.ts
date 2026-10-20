"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

function finish(message: string, error = false): never {
  revalidatePath("/admin");
  return redirect(`/admin?${error ? "erro" : "sucesso"}=${encodeURIComponent(message)}`);
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
  if (error?.message.includes("DOCUMENTS_MISSING")) finish("O seller precisa enviar os dois documentos antes da aprovação.", true);
  if (error?.message.includes("FINANCE_ACCOUNT_MISSING")) finish("O seller precisa cadastrar uma chave Pix antes da aprovação.", true);
  if (error) finish("Não foi possível atualizar o seller. Tente novamente.", true);
  const { data: updatedSeller } = await supabase.from("seller_accounts").select("status").eq("user_id", parsed.data.userId).single();
  if (updatedSeller?.status !== parsed.data.decision) finish("A atualização não foi confirmada. Recarregue e tente novamente.", true);
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
  const { data: updatedDocument, error } = await supabase
    .from("kyc_documents")
    .update({
      status: parsed.data.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: parsed.data.status === "approved" ? null : "Documento precisa de nova análise.",
    })
    .eq("id", parsed.data.documentId)
    .select("id,status")
    .single();
  if (error || updatedDocument?.status !== parsed.data.status) finish("Não foi possível revisar o documento.", true);
  finish(parsed.data.status === "approved" ? "Documento aprovado." : "Documento devolvido para correção.");
}
