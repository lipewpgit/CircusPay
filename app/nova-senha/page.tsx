"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function restoreRecoverySession() {
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const linkError = hash.get("error_description");

      if (linkError) {
        if (active) setMessage("Este link não pôde ser validado. Solicite uma nova recuperação.");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (active) setMessage("Este link é inválido ou já foi utilizado. Solicite uma nova recuperação.");
          return;
        }

        window.history.replaceState(null, "", "/nova-senha");
        if (active) setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (active) setIsReady(true);
      } else if (active) {
        setMessage("Abra o link mais recente enviado ao seu e-mail ou solicite uma nova recuperação.");
      }
    }

    void restoreRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function updatePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) return setMessage("Use pelo menos 8 caracteres.");
    if (!isReady) return setMessage("Aguarde a validação do link de recuperação.");

    setIsSaving(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setIsSaving(false);
      return setMessage("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
    }
    router.replace("/dashboard");
  }

  return (
    <AuthShell
      title="Crie uma nova senha"
      description={isReady ? "Link validado. Agora escolha uma senha forte para sua conta." : "Validando seu link de recuperação..."}
      footer={<Link href="/login">Voltar para entrar</Link>}
    >
      {message && <div className="form-alert error">{message}</div>}
      <form action={updatePassword} className="auth-form">
        <label>
          <span>Nova senha</span>
          <div className="field">
            <LockKeyhole size={18}/>
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              disabled={!isReady || isSaving}
              required
            />
          </div>
        </label>
        <button className="primary-button" disabled={!isReady || isSaving}>
          {isSaving ? "Salvando..." : isReady ? "Salvar nova senha" : "Validando link..."}
        </button>
      </form>
    </AuthShell>
  );
}
