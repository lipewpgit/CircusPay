import { ScrollText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { brl } from "@/lib/money";

export default async function LedgerAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: entries } = await supabase.from("ledger_entries").select("id,seller_id,entry_type,amount_cents,status,description,created_at,seller_accounts(profiles(full_name))").order("created_at", { ascending: false }).limit(250);
  return <><div className="page-heading"><div><span className="eyebrow">AUDITORIA FINANCEIRA</span><h1>Movimentações.</h1><p>Entradas, reembolsos, reservas de saque e ajustes.</p></div></div><section className="content-card"><div className="data-table"><div className="table-row table-head five"><span>Data</span><span>Vendedor</span><span>Tipo</span><span>Status</span><span>Valor</span></div>{entries?.length ? entries.map((entry) => { const seller = entry.seller_accounts as unknown as {profiles:{full_name:string}}; const profile = seller?.profiles; return <div className="table-row five" key={entry.id}><span>{new Date(entry.created_at).toLocaleString("pt-BR")}</span><span>{profile?.full_name ?? String(entry.seller_id).slice(0,8)}</span><span><strong>{entry.entry_type}</strong><small>{entry.description}</small></span><span><b className={`table-status ${entry.status}`}>{entry.status}</b></span><span className={Number(entry.amount_cents) < 0 ? "negative" : "positive"}>{Number(entry.amount_cents) > 0 ? "+ " : ""}{brl(Number(entry.amount_cents))}</span></div>; }) : <div className="empty-state"><ScrollText size={28}/><strong>Nenhuma movimentação</strong></div>}</div></section></>;
}
