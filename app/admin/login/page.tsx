import Link from "next/link";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signInAdmin } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;

  return (
    <AuthShell
      variant="admin"
      title="Painel administrativo"
      description="Acesso exclusivo à administração da CircusPay."
      footer={<>Primeiro acesso? <Link href="/admin/ativar">Ativar painel</Link></>}
    >
      <div className="trust-line"><ShieldCheck size={18} /> Área restrita ao administrador</div>
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      {query.sucesso && <div className="form-alert success">{query.sucesso}</div>}
      <form action={signInAdmin} className="auth-form">
        <label><span>E-mail administrativo</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="username" placeholder="seu@email.com" required /></div></label>
        <label><span>Senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" minLength={8} required /></div></label>
        <Link className="forgot" href="/recuperar-senha">Esqueci minha senha</Link>
        <button className="primary-button" type="submit">Entrar no painel</button>
      </form>
    </AuthShell>
  );
}
