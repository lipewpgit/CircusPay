import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, WalletCards, UserRoundCheck, LogOut, ShieldCheck, Users, ScrollText, BadgeDollarSign } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

const sellerNav = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/dashboard/vendas", "Vendas", ShoppingBag],
  ["/dashboard/produtos", "Produtos", Package],
  ["/dashboard/financeiro", "Financeiro", WalletCards],
];

const adminNav = [
  ["/admin", "Visão geral", LayoutDashboard],
  ["/admin#aprovacoes", "Aprovações", UserRoundCheck],
  ["/admin#saques", "Saques", BadgeDollarSign],
  ["/admin#sellers", "Sellers", Users],
  ["/admin#movimentacoes", "Movimentações", ScrollText],
];

export function PortalShell({ children, name, email, status, admin = false }: { children: React.ReactNode; name: string; email: string; status?: string; admin?: boolean }) {
  const nav = admin ? adminNav : sellerNav;
  return (
    <div className="portal">
      <aside className="sidebar">
        <Brand compact />
        <div className="workspace-card">
          <span className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{admin ? "Administração" : name}</strong><small>{admin ? "Acesso exclusivo" : status === "approved" ? "Conta aprovada" : "Em configuração"}</small></div>
        </div>
        <span className="nav-label">{admin ? "CONTROLE" : "OPERAÇÃO"}</span>
        <nav>{nav.map(([href, label, Icon]) => <Link href={href as string} key={href as string}><Icon size={18}/><span>{label as string}</span></Link>)}</nav>
        {!admin && <div className="secure-note"><ShieldCheck size={20}/><div><strong>Ambiente seguro</strong><small>Seus dados são privados.</small></div></div>}
        <div className="sidebar-footer">
          <span className="profile-dot">{name.slice(0, 2).toUpperCase()}</span>
          <div><strong>{name}</strong><small>{email}</small></div>
          <form action={signOut}><button title="Sair"><LogOut size={18}/></button></form>
        </div>
      </aside>
      <div className="portal-main">
        <header className="topbar"><span>{admin ? "PAINEL ADMINISTRATIVO" : "WORKSPACE / CIRCUSPAY"}</span><span className={`status-pill ${status ?? "approved"}`}><i/>{admin ? "Administrador" : status === "approved" ? "Aprovado" : status === "pending" ? "Em análise" : "Cadastro pendente"}</span></header>
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
