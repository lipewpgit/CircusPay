import Link from "next/link";
import { Building2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Crie sua conta" description="Cadastre-se como pessoa física ou empresa." footer={<>Já tem uma conta? <Link href="/login">Entrar</Link></>}>
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      <form action={signUp} className="auth-form">
        <label><span>Nome completo ou razão social</span><div className="field"><UserRound size={18}/><input name="fullName" autoComplete="name" placeholder="Como devemos chamar você?" required /></div></label>
        <label><span>Tipo da conta</span><div className="field"><Building2 size={18}/><select name="accountType" defaultValue="cpf"><option value="cpf">Pessoa física (CPF)</option><option value="cnpj">Pessoa jurídica (CNPJ)</option></select></div></label>
        <label><span>E-mail</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></div></label>
        <label><span>Senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" minLength={8} required /></div></label>
        <button className="primary-button" type="submit">Criar minha conta</button>
        <small className="terms">Ao continuar, você confirma que os dados informados são verdadeiros.</small>
      </form>
    </AuthShell>
  );
}
