import Link from "next/link";
import {
  BadgeDollarSign,
  BellRing,
  ContactRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  PlugZap,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

const sellerWorkspace = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/dashboard/vendas", "Vendas", ShoppingBag],
  ["/dashboard/produtos", "Produtos", Package],
  ["/dashboard#reembolsos", "Reembolsos", RotateCcw],
  ["/dashboard#clientes", "Clientes", ContactRound],
];

const sellerManagement = [
  ["/dashboard#adquirentes", "Adquirentes", Landmark],
  ["/dashboard/financeiro", "Financeiro", WalletCards],
  ["/dashboard#top-sellers", "Top Sellers", Trophy],
  ["/dashboard#integracoes", "Integrações", PlugZap],
];

const sellerSystem = [
  ["/dashboard#notificacoes", "Notificações", BellRing],
];

const adminNav = [
  ["/admin", "Visão geral", LayoutDashboard],
  ["/admin#aprovacoes", "Aprovações", UserRoundCheck],
  ["/admin#saques", "Saques", BadgeDollarSign],
  ["/admin#sellers", "Sellers", Users],
  ["/admin#movimentacoes", "Movimentações", ScrollText],
];

function NavLinks({ items }: { items: Array<(string | typeof LayoutDashboard)[]> }) {
  return (
    <nav>
      {items.map(([href, label, Icon]) => {
        const IconComponent = Icon as typeof LayoutDashboard;
        return <Link href={href as string} key={href as string}><IconComponent size={18} /><span>{label as string}</span></Link>;
      })}
    </nav>
  );
}

export function PortalShell({ children, name, email, status, admin = false }: { children: React.ReactNode; name: string; email: string; status?: string; admin?: boolean }) {
  return (
    <div className="portal">
      <aside className="sidebar">
        <Brand compact />
        <div className="workspace-card">
          <span className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{admin ? "Administração" : "Minha operação"}</strong><small>{admin ? "Acesso exclusivo" : status === "approved" ? "Conta aprovada" : "Ambiente de testes"}</small></div>
        </div>

        {admin ? (
          <>
            <span className="nav-label">CONTROLE</span>
            <NavLinks items={adminNav} />
          </>
        ) : (
          <div className="seller-navigation">
            <span className="nav-label">WORKSPACE</span>
            <NavLinks items={sellerWorkspace} />
            <span className="nav-label nav-label-spaced">GESTÃO</span>
            <NavLinks items={sellerManagement} />
            <span className="nav-label nav-label-spaced">SISTEMA</span>
            <NavLinks items={sellerSystem} />
          </div>
        )}

        {!admin && <div className="secure-note"><ShieldCheck size={20} /><div><strong>Ambiente seguro</strong><small>Seus dados são privados.</small></div></div>}
        <div className="sidebar-footer">
          <span className="profile-dot">{name.slice(0, 2).toUpperCase()}</span>
          <div><strong>{name}</strong><small>{email}</small></div>
          <form action={signOut}><button title="Sair"><LogOut size={18} /></button></form>
        </div>
      </aside>
      <div className="portal-main">
        <header className="topbar">
          <span>{admin ? "PAINEL ADMINISTRATIVO" : "CIRCUS PAY / WORKSPACE"}</span>
          <span className={`status-pill ${status ?? "approved"}`}><i />{admin ? "Administrador" : status === "approved" ? "Aprovado" : status === "pending" ? "Em análise" : "Modo teste"}</span>
        </header>
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
