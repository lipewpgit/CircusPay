import { ArrowDownToLine, Clock3, WalletCards } from "lucide-react";
import { requestWithdrawal } from "@/app/actions/seller";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: balance }, { data: finance }, { data: withdrawals }] = await Promise.all([
    supabase.from("seller_balances").select("available_cents,held_cents").eq("seller_id", user.id).maybeSingle(),
    supabase.from("finance_accounts").select("holder_name,pix_key_type,pix_key,status").eq("user_id", user.id).maybeSingle(),
    supabase.from("withdrawal_requests").select("id,requested_cents,fee_cents,net_cents,status,requested_at").order("requested_at", { ascending: false }).limit(20),
  ]);
  return <>
    <div className="page-heading"><div><span className="eyebrow">FINANCEIRO</span><h1>Saldo e saques.</h1><p>A taxa fixa é descontada do valor solicitado.</p></div></div>
    {query.erro && <div className="banner error">{query.erro}</div>}{query.sucesso && <div className="banner success">{query.sucesso}</div>}
    <section className="balance-hero"><div><span>SALDO DISPONÍVEL</span><strong>{brl(Number(balance?.available_cents ?? 0))}</strong><small><Clock3 size={14}/> Saldo retido: {brl(Number(balance?.held_cents ?? 0))}</small></div><form action={requestWithdrawal}><label><span>Valor do saque</span><div className="money-field light"><b>R$</b><input name="amount" inputMode="decimal" placeholder="100,00" required/></div></label><div className="fee-preview"><span>Taxa por saque</span><strong>R$ 3,50</strong></div><button className="dark-button" disabled={finance?.status !== "approved"}><ArrowDownToLine size={17}/>Solicitar saque</button>{finance?.status !== "approved" && <small>Sua chave Pix precisa estar aprovada.</small>}</form></section>
    <section className="content-card"><div className="card-heading"><div><h2>Conta de recebimento</h2><p>Chave cadastrada na análise da conta.</p></div><b className={`table-status ${finance?.status}`}>{finance?.status ?? "não cadastrada"}</b></div>{finance ? <div className="finance-account"><WalletCards size={22}/><div><strong>{finance.holder_name}</strong><small>{String(finance.pix_key_type).toUpperCase()} · •••• {String(finance.pix_key).slice(-4)}</small></div></div> : <div className="empty-state"><p>Complete seu cadastro para informar uma chave Pix.</p></div>}</section>
    <section className="content-card"><div className="card-heading"><div><h2>Histórico de saques</h2><p>Valor solicitado, taxa e valor líquido.</p></div></div><div className="data-table"><div className="table-row table-head five"><span>Data</span><span>Solicitado</span><span>Taxa</span><span>Líquido</span><span>Status</span></div>{withdrawals?.length ? withdrawals.map((item) => <div className="table-row five" key={item.id}><span>{new Date(item.requested_at).toLocaleDateString("pt-BR")}</span><span>{brl(Number(item.requested_cents))}</span><span>{brl(Number(item.fee_cents))}</span><span>{brl(Number(item.net_cents))}</span><span><b className={`table-status ${item.status}`}>{item.status}</b></span></div>) : <div className="empty-state"><p>Nenhum saque solicitado.</p></div>}</div></section>
  </>;
}
