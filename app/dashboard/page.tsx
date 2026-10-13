import Link from "next/link";
import { ArrowUpRight, Clock3, Package, ShoppingBag, WalletCards, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: seller }, { data: balance }, { data: payments }, { count: productCount }] = await Promise.all([
    supabase.from("seller_accounts").select("status,review_notes").eq("user_id", user.id).single(),
    supabase.from("seller_balances").select("available_cents,held_cents").eq("seller_id", user.id).maybeSingle(),
    supabase.from("payments").select("id,gross_cents,status,method,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);
  const approved = seller?.status === "approved";
  const approvedPayments = payments?.filter((payment) => payment.status === "approved") ?? [];
  const gross = approvedPayments.reduce((sum, payment) => sum + Number(payment.gross_cents), 0);

  return <>
    {query.sucesso && <div className="banner success">{query.sucesso}</div>}
    {query.erro && <div className="banner error">Você não tem acesso a essa área.</div>}
    <div className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, acompanhe sua operação.</h1><p>Vendas, saldo e produtos em um só lugar.</p></div>{approved && <Link className="gold-button" href="/dashboard/produtos">Criar produto <ArrowUpRight size={17}/></Link>}</div>
    {!approved && <section className="approval-callout"><span><ShieldAlert size={25}/></span><div><strong>{seller?.status === "pending" ? "Sua documentação está em análise" : seller?.status === "rejected" ? "Precisamos de novos documentos" : "Conclua seu cadastro para começar a vender"}</strong><p>{seller?.review_notes || "Produtos e checkouts são liberados depois que seus dados forem aprovados."}</p></div><Link href="/onboarding">{seller?.status === "pending" ? "Ver dados enviados" : "Enviar documentação"}</Link></section>}
    <section className="metric-grid">
      <article><span>Faturamento aprovado</span><strong>{brl(gross)}</strong><ShoppingBag size={20}/></article>
      <article><span>Saldo disponível</span><strong>{brl(Number(balance?.available_cents ?? 0))}</strong><WalletCards size={20}/></article>
      <article><span>Saldo retido</span><strong>{brl(Number(balance?.held_cents ?? 0))}</strong><Clock3 size={20}/></article>
      <article><span>Produtos ativos</span><strong>{productCount ?? 0}</strong><Package size={20}/></article>
    </section>
    <section className="content-card">
      <div className="card-heading"><div><h2>Vendas recentes</h2><p>Últimas movimentações registradas.</p></div><Link href="/dashboard/vendas">Ver todas</Link></div>
      <div className="data-table"><div className="table-row table-head"><span>Data</span><span>Pagamento</span><span>Status</span><span>Valor</span></div>{payments?.length ? payments.map((payment) => <div className="table-row" key={payment.id}><span>{new Date(payment.created_at).toLocaleDateString("pt-BR")}</span><span>{payment.method?.toUpperCase() ?? "—"}</span><span><b className={`table-status ${payment.status}`}>{payment.status}</b></span><span>{brl(Number(payment.gross_cents))}</span></div>) : <div className="empty-state"><ShoppingBag size={28}/><strong>Nenhuma venda ainda</strong><p>Suas vendas aparecerão aqui depois da aprovação.</p></div>}</div>
    </section>
  </>;
}
