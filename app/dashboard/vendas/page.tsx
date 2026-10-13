import { ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

export default async function SalesPage() {
  const { supabase } = await requireUser();
  const { data: payments } = await supabase.from("payments").select("id,gross_cents,net_cents,status,method,provider_payment_id,created_at").order("created_at", { ascending: false }).limit(100);
  return <><div className="page-heading"><div><span className="eyebrow">TRANSAÇÕES</span><h1>Vendas.</h1><p>Pagamentos recebidos e seus status.</p></div></div><section className="content-card"><div className="data-table"><div className="table-row table-head five"><span>Data</span><span>ID</span><span>Método</span><span>Status</span><span>Valor</span></div>{payments?.length ? payments.map((payment) => <div className="table-row five" key={payment.id}><span>{new Date(payment.created_at).toLocaleString("pt-BR")}</span><span>{payment.provider_payment_id ?? "—"}</span><span>{payment.method?.toUpperCase() ?? "—"}</span><span><b className={`table-status ${payment.status}`}>{payment.status}</b></span><span>{brl(Number(payment.gross_cents))}</span></div>) : <div className="empty-state"><ShoppingBag size={28}/><strong>Nenhuma venda registrada</strong></div>}</div></section></>;
}
