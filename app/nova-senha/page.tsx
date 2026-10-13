"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function updatePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) return setMessage("Use pelo menos 8 caracteres.");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMessage("O link expirou. Solicite uma nova recuperação.");
    router.replace("/dashboard");
  }
  return <AuthShell title="Crie uma nova senha" description="Escolha uma senha forte para sua conta." footer={<Link href="/login">Voltar para entrar</Link>}>{message && <div className="form-alert error">{message}</div>}<form action={updatePassword} className="auth-form"><label><span>Nova senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" minLength={8} autoComplete="new-password" required/></div></label><button className="primary-button">Salvar nova senha</button></form></AuthShell>;
}
