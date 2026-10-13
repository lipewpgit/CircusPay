"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function withMessage(path: string, key: "erro" | "sucesso", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}

export async function signIn(formData: FormData) {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect(withMessage("/login", "erro", "Confira seu e-mail e sua senha."));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(withMessage("/login", "erro", "E-mail ou senha inválidos."));
  redirect("/dashboard");
}

export async function signInAdmin(formData: FormData) {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect(withMessage("/admin/login", "erro", "Confira seu e-mail e sua senha."));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(withMessage("/admin/login", "erro", "E-mail ou senha inválidos."));

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect(withMessage("/admin/login", "erro", "Esta conta não possui acesso administrativo."));
  }

  redirect("/admin");
}

export async function activateAdmin(formData: FormData) {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect(withMessage("/admin/ativar", "erro", "Informe um e-mail válido e uma senha com pelo menos 8 caracteres."));

  const configuredEmail = process.env.CIRCUSPAY_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail || parsed.data.email.trim().toLowerCase() !== configuredEmail) {
    redirect(withMessage("/admin/ativar", "erro", "Este e-mail não está autorizado para o painel administrativo."));
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      data: { full_name: "Administrador CircusPay", account_type: "cpf" },
    },
  });

  if (error) redirect(withMessage("/admin/ativar", "erro", "Não foi possível ativar o acesso. Tente novamente ou recupere a senha."));
  redirect(withMessage("/admin/login", "sucesso", "Ativação solicitada. Confirme o e-mail recebido e depois entre no painel."));
}

export async function signUp(formData: FormData) {
  const parsed = z.object({
    fullName: z.string().trim().min(3).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    accountType: z.enum(["cpf", "cnpj"]),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect(withMessage("/cadastro", "erro", "Preencha todos os campos. A senha precisa ter 8 caracteres."));

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: { full_name: parsed.data.fullName, account_type: parsed.data.accountType },
    },
  });

  if (error) redirect(withMessage("/cadastro", "erro", "Não foi possível criar a conta. Confira os dados e tente novamente."));
  redirect(withMessage("/login", "sucesso", "Conta criada. Confira seu e-mail para confirmar o acesso."));
}

export async function requestPasswordReset(formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) redirect(withMessage("/recuperar-senha", "erro", "Informe um e-mail válido."));
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/nova-senha`,
  });
  redirect(withMessage("/login", "sucesso", "Se o e-mail estiver cadastrado, você receberá o link de recuperação."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
