import Link from "next/link";
import Image from "next/image";
import { Activity, BellRing, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthShell({
  children,
  title,
  description,
  footer,
  variant = "seller",
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  footer: React.ReactNode;
  variant?: "seller" | "admin";
}) {
  const isAdmin = variant === "admin";

  return (
    <main className={`auth-page ${isAdmin ? "admin-auth-page" : "seller-auth-page"}`}>
      {!isAdmin && <section className="auth-visual">
        <div className="auth-brand-row">
          <Brand />
          <span className="auth-live"><i /> Sistema online</span>
        </div>
        <div className="auth-pitch">
          <div className="auth-copy">
            <span className="eyebrow">SUA OPERAÇÃO CIRCUSPAY</span>
            <h1>Venda. Acompanhe.<br/><em>Cresça.</em></h1>
            <p>Uma experiência feita para quem quer vender com controle, agilidade e visão de negócio.</p>
          </div>

          <div className="auth-stage" aria-hidden="true">
            <span className="stage-orbit orbit-one" />
            <span className="stage-orbit orbit-two" />
            <div className="stage-core"><span /><Image src="/circuspay-mark-transparent.png" width={112} height={112} alt="" /></div>
            <div className="stage-chip stage-chip-one"><Activity size={14}/><span>Vendas em tempo real</span></div>
            <div className="stage-chip stage-chip-two"><WalletCards size={14}/><span>Gestão financeira</span></div>
            <div className="stage-chip stage-chip-three"><BellRing size={14}/><span>Notificação instantânea</span></div>
          </div>
        </div>
        <div className="auth-visual-footer"><Link href="/" className="back-home">CircusPay © 2026</Link><span><ShieldCheck size={13}/> Ambiente protegido</span></div>
      </section>}
      <section className="auth-panel">
        <div className="auth-card">
          <div className={`mobile-brand ${isAdmin ? "admin-brand" : ""}`}><Brand compact /></div>
          <span className="auth-lock"><LockKeyhole size={15}/></span>
          <span className="auth-kicker">{isAdmin ? "ADMINISTRAÇÃO" : "BEM-VINDO DE VOLTA"}</span>
          <h2>{title}</h2>
          <p>{description}</p>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
