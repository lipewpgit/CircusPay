import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
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
  Smartphone,
  Trophy,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { signOut, signOutAdmin } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

const sellerWorkspace = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/dashboard/vendas", "Vendas", ShoppingBag],
  ["/dashboard/produtos", "Produtos", Package],
  ["/dashboard#reembolsos", "Reembolsos", RotateCcw],
  ["/dashboard#clientes", "Clientes", ContactRound],
  ["/dashboard#adquirentes", "Adquirentes", Landmark],
  ["/dashboard/financeiro", "Financeiro", WalletCards],
  ["/dashboard#top-sellers", "Top Sellers", Trophy],
  ["/dashboard#integracoes", "Integrações", PlugZap],
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
  if (admin) {
    return (
      <div className="portal">
        <aside className="sidebar">
          <Brand compact />
          <div className="workspace-card">
            <span className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</span>
            <div><strong>Administração</strong><small>Acesso exclusivo</small></div>
          </div>
          <span className="nav-label">CONTROLE</span>
          <NavLinks items={adminNav} />
          <div className="secure-note"><ShieldCheck size={20} /><div><strong>Ambiente seguro</strong><small>Acesso administrativo.</small></div></div>
          <div className="sidebar-footer">
            <span className="profile-dot">{name.slice(0, 2).toUpperCase()}</span>
            <div><strong>{name}</strong><small>{email}</small></div>
            <form action={signOutAdmin}><button title="Sair"><LogOut size={18} /></button></form>
          </div>
        </aside>
        <div className="portal-main">
          <header className="topbar">
            <span>PAINEL ADMINISTRATIVO</span>
            <span className="status-pill approved"><i />Administrador</span>
          </header>
          <main className="portal-content">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-legacy app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard" aria-label="CircusPay início">
          <Image className="brand-mark" src="/circuspay-mark-transparent.png" width={45} height={45} alt="" />
          <span>Circus<span className="brand-pay">Pay</span></span>
        </Link>

        <div className="workspace">
          <div className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</div>
          <div><strong>Minha operação</strong><small>{status === "approved" ? "Conta aprovada" : "Ambiente de testes"}</small></div>
          <span className="workspace-dot" />
        </div>

        <span className="nav-label">WORKSPACE</span>
        <nav>
          {sellerWorkspace.map(([href, label, Icon], index) => {
            const IconComponent = Icon as typeof LayoutDashboard;
            return (
              <Link className={index === 0 ? "active" : ""} href={href as string} key={href as string}>
                <IconComponent size={18} /><span>{label as string}</span>{index === 0 && <i className="active-dot" />}
              </Link>
            );
          })}
        </nav>

        <span className="nav-label nav-label-secondary">SISTEMA</span>
        <nav className="system-nav">
          <Link href="/dashboard#notificacoes"><Bell size={18} /><span>Notificações</span></Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-install">
            <Smartphone size={22} />
            <strong>Sua operação no bolso.</strong>
            <p>Instale a CircusPay e acompanhe suas vendas no celular.</p>
            <Link href="/dashboard#notificacoes">Configurar notificações <ArrowUpRight size={16} /></Link>
          </div>
          <div className="profile">
            <span className="profile-avatar">{name.slice(0, 2).toUpperCase()}</span>
            <span><strong>{name}</strong><small>{email}</small></span>
            <form action={signOut}><button title="Sair"><LogOut size={17} /></button></form>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace <b>›</b><strong>Dashboard</strong></span></div>
          <div className="topbar-right">
            <span className="test-tag"><span />{status === "approved" ? "Conta ativa" : "Modo teste"}</span>
            <span className="top-avatar">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
