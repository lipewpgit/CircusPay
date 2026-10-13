import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import { activateAdmin } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function ActivateAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;

  return (
    <AuthShell
      title="Ativar administrador"
      description="Crie o acesso inicial usando o e-mail autorizado."
      footer={<>Já ativou? <Link href="/admin/login">Entrar no painel</Link></>}
    >
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      <form action={activateAdmin} className="auth-form">
        <label><span>E-mail autorizado</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="username" placeholder="seu@email.com" required /></div></label>
        <label><span>Crie uma senha</span><div className="field"><KeyRound size={18}/><input name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" minLength={8} maxLength={72} required /></div></label>
        <button className="primary-button" type="submit">Enviar confirmação</button>
      </form>
    </AuthShell>
  );
}
