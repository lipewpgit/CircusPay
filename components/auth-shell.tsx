import Link from "next/link";
import { BarChart3, CircleCheck, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
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
        <div className="auth-brand-row">
          <Brand />
          <span className="auth-live"><i /> Ambiente seguro</span>
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">CIRCUSPAY BUSINESS</span>
          <h1>O controle da sua operação em um só lugar.</h1>
          <p>Acompanhe pagamentos, produtos e saques em uma experiência simples, segura e profissional.</p>

          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-head">
              <div><span>VISÃO GERAL</span><strong>Resumo da operação</strong></div>
              <span className="auth-preview-period">Últimos 30 dias</span>
            </div>
            <div className="auth-preview-grid">
              <article><span><WalletCards size={15}/> Saldo disponível</span><strong>R$ 0,00</strong><small>Pronto para movimentar</small></article>
              <article><span><BarChart3 size={15}/> Vendas aprovadas</span><strong>0</strong><small>Acompanhe em tempo real</small></article>
            </div>
            <div className="auth-preview-status"><CircleCheck size={15}/><span><strong>Operação protegida</strong><small>Dados e documentos com acesso individual</small></span></div>
          </div>

          <div className="trust-line"><ShieldCheck size={18} /> Segurança em cada etapa da sua operação</div>
        </div>
        <div className="auth-visual-footer"><Link href="/" className="back-home">CircusPay © 2026</Link><span>Pagamentos • Gestão • Resultados</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><Brand compact /></div>
          <span className="auth-lock"><LockKeyhole size={15}/></span>
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
