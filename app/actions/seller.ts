"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseBRLCents } from "@/lib/money";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

async function uploadKycFile(file: File, kind: string, userId: string) {
  if (!file.size) return;
  if (file.size > 10 * 1024 * 1024 || !allowedTypes.has(file.type)) {
    throw new Error("Documento inválido. Use PDF, JPG, PNG ou WebP de até 10 MB.");
  }
  const { supabase } = await requireUser();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  const path = `${userId}/${crypto.randomUUID()}-${cleanName}`;
  const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { error: rowError } = await supabase.from("kyc_documents").insert({
    user_id: userId,
    document_type: kind,
    storage_path: path,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (rowError) {
    await supabase.storage.from("kyc-documents").remove([path]);
    throw rowError;
  }
}

export async function submitOnboarding(formData: FormData) {
  const schema = z.object({
    fullName: z.string().trim().min(3).max(120),
    phone: z.string().trim().min(8).max(24),
    accountType: z.enum(["cpf", "cnpj"]),
    documentNumber: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length === 11 || value.length === 14),
    tradingName: z.string().trim().min(2).max(120),
    holderName: z.string().trim().min(3).max(120),
    pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
    pixKey: z.string().trim().min(3).max(160),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/onboarding?erro=Confira os dados informados.");
  const { supabase, user } = await requireUser();
  const identity = formData.get("identity");
  const extra = formData.get("extraDocument");
  if (!(identity instanceof File) || !identity.size || !(extra instanceof File) || !extra.size) {
    redirect("/onboarding?erro=Envie os dois documentos solicitados.");
  }

  try {
    const { error: profileError } = await supabase.from("profiles").update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      account_type: parsed.data.accountType,
      document_number: parsed.data.documentNumber,
    }).eq("user_id", user.id);
    if (profileError) throw profileError;

    await uploadKycFile(identity, "identity_front", user.id);
    await uploadKycFile(extra, parsed.data.accountType === "cnpj" ? "company_document" : "selfie", user.id);

    const { error: financeError } = await supabase.from("finance_accounts").upsert({
      user_id: user.id,
      holder_name: parsed.data.holderName,
      pix_key_type: parsed.data.pixKeyType,
      pix_key: parsed.data.pixKey,
      status: "pending",
      reviewed_at: null,
      reviewed_by: null,
    });
    if (financeError) throw financeError;

    const { error: sellerError } = await supabase.from("seller_accounts").update({
      trading_name: parsed.data.tradingName,
      status: "pending",
      submitted_at: new Date().toISOString(),
      review_notes: null,
    }).eq("user_id", user.id);
    if (sellerError) throw sellerError;
  } catch {
    redirect("/onboarding?erro=Não foi possível enviar sua análise. Revise os dados e tente novamente.");
  }
  redirect("/dashboard?sucesso=Documentos enviados para análise.");
}

export async function createProduct(formData: FormData) {
  const name = z.string().trim().min(2).max(120).safeParse(formData.get("name"));
  const priceCents = parseBRLCents(formData.get("price"));
  if (!name.success || priceCents < 100) redirect("/dashboard/produtos?erro=Informe nome e preço válidos.");
  const { supabase, user } = await requireUser();
  const { data: product, error } = await supabase.from("products").insert({
    seller_id: user.id,
    name: name.data,
    price_cents: priceCents,
  }).select("id").single();
  if (error || !product) redirect("/dashboard/produtos?erro=Sua conta precisa estar aprovada para criar produtos.");
  const slug = `${name.data.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${crypto.randomUUID().slice(0, 8)}`;
  const { error: linkError } = await supabase.from("checkout_links").insert({
    product_id: product.id,
    seller_id: user.id,
    slug,
  });
  if (linkError) redirect("/dashboard/produtos?erro=Produto criado, mas não foi possível gerar o checkout.");
  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?sucesso=Produto e checkout criados.");
}

export async function requestWithdrawal(formData: FormData) {
  const cents = parseBRLCents(formData.get("amount"));
  if (cents <= 350) redirect("/dashboard/financeiro?erro=O saque precisa ser maior que R$ 3,50.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("request_withdrawal", { amount_cents: cents });
  if (error) redirect("/dashboard/financeiro?erro=Confira o saldo e a aprovação da sua chave Pix.");
  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?sucesso=Saque solicitado. A taxa de R$ 3,50 foi descontada do valor.");
}
