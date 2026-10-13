import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthShell({
  children,
  title,
  description,
  footer,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  footer: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Brand />
        <div className="auth-pitch">
          <span className="eyebrow">PAGAMENTOS • GESTÃO • RESULTADOS</span>
          <h1>Seu negócio no centro do espetáculo.</h1>
          <p>Controle vendas, produtos, saldos e saques em uma operação segura e organizada.</p>
          <div className="trust-line"><ShieldCheck size={18} /> Documentos protegidos e acesso individual</div>
        </div>
        <Link href="/" className="back-home">CircusPay © 2026</Link>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><Brand compact /></div>
          <span className="auth-kicker">ACESSO SEGURO</span>
          <h2>{title}</h2>
          <p>{description}</p>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
