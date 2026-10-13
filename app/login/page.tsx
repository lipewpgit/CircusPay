import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Entre na sua conta" description="Acesse sua operação CircusPay." footer={<>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>}>
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      {query.sucesso && <div className="form-alert success">{query.sucesso}</div>}
      <form action={signIn} className="auth-form">
        <label><span>E-mail</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></div></label>
        <label><span>Senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" minLength={6} required /></div></label>
        <Link className="forgot" href="/recuperar-senha">Esqueci minha senha</Link>
        <button className="primary-button" type="submit">Entrar</button>
      </form>
    </AuthShell>
  );
}
