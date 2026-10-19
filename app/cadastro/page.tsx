import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SellerSignupForm } from "@/components/seller-signup-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Abra sua conta seller" description="Escolha PF ou PJ e cadastre os dados do titular da operação." footer={<>Já tem uma conta? <Link href="/login">Entrar</Link></>}>
      {query.erro && <div className="form-alert error">{query.erro}</div>}
      <SellerSignupForm />
    </AuthShell>
  );
}
