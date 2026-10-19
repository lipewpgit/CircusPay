import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const isAdmin = query.next === "/admin";
  const loginPath = isAdmin ? "/admin/login" : "/login";
  return (
    <AuthShell
      variant={isAdmin ? "admin" : undefined}
      title={isAdmin ? "Recuperar acesso administrativo" : "Recuperar senha"}
      description="Enviaremos um link seguro para o seu e-mail."
      footer={<Link href={loginPath}>Voltar para entrar</Link>}
    >
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      <form action={requestPasswordReset} className="auth-form">
        <input type="hidden" name="next" value={isAdmin ? "/admin" : "/dashboard"} />
        <label><span>E-mail</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></div></label>
        <button className="primary-button" type="submit">Enviar link de recuperação</button>
      </form>
    </AuthShell>
  );
}
