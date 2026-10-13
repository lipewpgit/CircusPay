"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function withMessage(path: string, key: "erro" | "sucesso", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}

function getSiteUrl(requestHeaders: Headers) {
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  return (requestHeaders.get("origin") ?? "https://circus-pay.vercel.app").replace(/\/$/, "");
}

export async function signIn(formData: FormData) {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect(withMessage("/login", "erro", "Confira seu e-mail e sua senha."));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") {
    redirect("/login?erro=" + encodeURIComponent("Seu e-mail ainda não foi confirmado. Confirme pelo link recebido ou solicite um novo abaixo.") + "&confirmar=1");
  }
  if (error) redirect(withMessage("/login", "erro", "E-mail ou senha inválidos."));
  redirect("/dashboard");
}

export async function resendConfirmation(formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) {
    redirect("/login?erro=" + encodeURIComponent("Informe o mesmo e-mail usado no cadastro.") + "&confirmar=1");
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: origin ? { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` } : undefined,
  });

  if (error?.code === "over_email_send_rate_limit") {
    redirect("/login?erro=" + encodeURIComponent("Aguarde um minuto antes de solicitar outro e-mail.") + "&confirmar=1");
  }
  if (error) {
    redirect("/login?erro=" + encodeURIComponent("Não foi possível reenviar agora. Confira o e-mail e tente novamente.") + "&confirmar=1");
  }
  redirect(withMessage("/login", "sucesso", "Novo link enviado. Verifique também a caixa de spam."));
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
  const origin = getSiteUrl(requestHeaders);
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
