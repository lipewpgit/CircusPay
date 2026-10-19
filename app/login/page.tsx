import Link from "next/link";
import { Fingerprint, LockKeyhole, Mail } from "lucide-react";
import { resendConfirmation, signIn } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Entre na sua conta" description="Seller entra com CPF ou CNPJ. Seu e-mail continua disponível para confirmação e recuperação." footer={<>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>}>
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      {query.sucesso && <div className="form-alert success">{query.sucesso}</div>}
      {query.confirmar === "1" && (
        <form action={resendConfirmation} className="confirmation-box">
          <strong>Não recebeu a confirmação?</strong>
          <span>Digite o e-mail cadastrado para receber um novo link.</span>
          <div className="field"><Mail size={17}/><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></div>
          <button type="submit">Reenviar confirmação</button>
        </form>
      )}
      <form action={signIn} className="auth-form">
        <label><span>CPF ou CNPJ</span><div className="field"><Fingerprint size={18}/><input name="identifier" type="text" autoComplete="username" placeholder="Digite seu CPF ou CNPJ" required /></div><small className="field-help">Durante a configuração, seu e-mail também pode ser usado neste campo.</small></label>
        <label><span>Senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" minLength={8} required /></div></label>
        <Link className="forgot" href="/recuperar-senha">Esqueci minha senha</Link>
        <button className="primary-button" type="submit">Entrar como seller</button>
      </form>
    </AuthShell>
  );
}
