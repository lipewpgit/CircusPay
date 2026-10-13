import Link from "next/link";
import {
  BadgeDollarSign,
  Clock3,
  FileText,
  ScrollText,
  ShoppingBag,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { reviewSeller, updateWithdrawal } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { brl } from "@/lib/money";

type SellerProfile = {
  full_name: string;
  account_type: string;
  document_last4: string | null;
};

type SellerDocument = {
  id: string;
  original_name: string;
  document_type: string;
  status: string;
};

const statusLabel: Record<string, string> = {
  onboarding: "Cadastro incompleto",
  pending: "Aguardando análise",
  approved: "Aprovado",
  rejected: "Reenvio solicitado",
  suspended: "Suspenso",
  processing: "Em processamento",
  paid: "Pago",
  cancelled: "Cancelado",
  posted: "Confirmado",
};

const movementLabel: Record<string, string> = {
  sale: "Venda",
  refund: "Reembolso",
  chargeback: "Chargeback",
  withdrawal_reserve: "Reserva de saque",
  withdrawal_reversal: "Estorno de saque",
  adjustment: "Ajuste manual",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();

  const [
    { count: users },
    { count: pendingCount },
    { count: sales },
    { count: withdrawalCount },
    { data: payments },
    { data: ledgerBalance },
    { data: pendingSellers },
    { data: recentSellers },
    { data: withdrawals },
    { data: movements },
  ] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("seller_accounts").select("user_id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
    supabase.from("payments").select("gross_cents,net_cents").eq("status", "approved"),
    supabase.from("ledger_entries").select("amount_cents").eq("status", "posted"),
    supabase
      .from("seller_accounts")
      .select("user_id,trading_name,status,submitted_at,review_notes,profiles(full_name,account_type,document_last4),kyc_documents(id,original_name,document_type,status)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("user_id,full_name,account_type,document_last4,created_at,seller_accounts(status,trading_name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("withdrawal_requests")
      .select("id,seller_id,requested_cents,fee_cents,net_cents,pix_key_type,pix_key_snapshot,status,admin_notes,requested_at,seller_accounts(profiles(full_name))")
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: true })
      .limit(20),
    supabase
      .from("ledger_entries")
      .select("id,seller_id,entry_type,amount_cents,status,description,created_at,seller_accounts(profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const gross = payments?.reduce((sum, item) => sum + Number(item.gross_cents), 0) ?? 0;
  const balance = ledgerBalance?.reduce((sum, item) => sum + Number(item.amount_cents), 0) ?? 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CENTRAL DO ADMINISTRADOR</span>
          <h1>Tudo da CircusPay em uma tela.</h1>
          <p>Aprove sellers, acompanhe vendas, saldos, saques e toda a movimentação da plataforma.</p>
        </div>
      </div>

      {query.erro && <div className="banner error">{query.erro}</div>}
      {query.sucesso && <div className="banner success">{query.sucesso}</div>}

      <section className="metric-grid admin-metrics">
        <article><span>Sellers cadastrados</span><strong>{users ?? 0}</strong><Users size={20} /></article>
        <article><span>Aguardando aprovação</span><strong>{pendingCount ?? 0}</strong><UserRoundCheck size={20} /></article>
        <article><span>Vendas aprovadas</span><strong>{sales ?? 0}</strong><ShoppingBag size={20} /></article>
        <article><span>Saques para analisar</span><strong>{withdrawalCount ?? 0}</strong><Clock3 size={20} /></article>
        <article><span>Volume vendido</span><strong>{brl(gross)}</strong><BadgeDollarSign size={20} /></article>
        <article><span>Saldo dos sellers</span><strong>{brl(balance)}</strong><WalletCards size={20} /></article>
      </section>

      <section className="admin-section" id="aprovacoes">
        <div className="card-heading">
          <div><h2>Aprovações de sellers</h2><p>Confira os documentos antes de liberar a conta para vender.</p></div>
          <span className="section-count">{pendingSellers?.length ?? 0} pendente(s)</span>
        </div>
        <div className="review-list">
          {pendingSellers?.length ? pendingSellers.map((seller) => {
            const profile = seller.profiles as unknown as SellerProfile;
            const docs = seller.kyc_documents as unknown as SellerDocument[];
            return (
              <article className="review-card" key={seller.user_id}>
                <div className="review-top">
                  <span className="review-avatar"><UserRoundCheck size={24} /></span>
                  <div>
                    <h2>{profile?.full_name ?? seller.trading_name ?? "Seller"}</h2>
                    <p>{profile?.account_type?.toUpperCase()} final {profile?.document_last4 ?? "—"} · enviado {seller.submitted_at ? new Date(seller.submitted_at).toLocaleString("pt-BR") : "agora"}</p>
                  </div>
                  <b className="table-status pending">Aguardando análise</b>
                </div>
                <div className="document-links">
                  {docs?.map((doc) => (
                    <Link key={doc.id} href={`/admin/documentos/${doc.id}`} target="_blank" rel="noreferrer">
                      <FileText size={16} />{doc.original_name}
                    </Link>
                  ))}
                  {!docs?.length && <span className="missing-docs">Nenhum documento enviado</span>}
                </div>
                <form action={reviewSeller} className="review-form">
                  <input type="hidden" name="userId" value={seller.user_id} />
                  <textarea name="notes" aria-label="Observação para o seller" placeholder="Observação para o seller" defaultValue={seller.review_notes ?? ""} />
                  <div>
                    <button name="decision" value="approved" className="approve-button">Aprovar seller</button>
                    <button name="decision" value="rejected" className="reject-button">Pedir novos documentos</button>
                    <button name="decision" value="suspended" className="ghost-button">Suspender</button>
                  </div>
                </form>
              </article>
            );
          }) : (
            <div className="empty-state large"><UserRoundCheck size={30} /><strong>Nenhuma aprovação pendente</strong><p>Novos sellers aparecerão aqui quando enviarem os documentos.</p></div>
          )}
        </div>
      </section>

      <section className="admin-section" id="saques">
        <div className="card-heading">
          <div><h2>Saques pendentes</h2><p>Taxa fixa de R$ 3,50 descontada do valor solicitado.</p></div>
          <span className="section-count">{withdrawals?.length ?? 0} solicitação(ões)</span>
        </div>
        <div className="review-list">
          {withdrawals?.length ? withdrawals.map((item) => {
            const seller = item.seller_accounts as unknown as { profiles: { full_name: string } };
            return (
              <article className="withdraw-admin-card" key={item.id}>
                <div className="review-top">
                  <span className="review-avatar"><BadgeDollarSign size={24} /></span>
                  <div>
                    <h2>{seller?.profiles?.full_name ?? String(item.seller_id).slice(0, 8)}</h2>
                    <p>{new Date(item.requested_at).toLocaleString("pt-BR")} · {String(item.pix_key_type).toUpperCase()} •••• {String(item.pix_key_snapshot).slice(-4)}</p>
                  </div>
                  <b className={`table-status ${item.status}`}>{statusLabel[item.status] ?? item.status}</b>
                </div>
                <div className="withdraw-values">
                  <span>Solicitado<strong>{brl(Number(item.requested_cents))}</strong></span>
                  <span>Taxa CircusPay<strong>- {brl(Number(item.fee_cents))}</strong></span>
                  <span>Enviar ao seller<strong>{brl(Number(item.net_cents))}</strong></span>
                </div>
                <form action={updateWithdrawal} className="review-form">
                  <input type="hidden" name="withdrawalId" value={item.id} />
                  <textarea name="notes" aria-label="Observação administrativa do saque" placeholder="Observação administrativa" defaultValue={item.admin_notes ?? ""} />
                  <div>
                    <button name="status" value="processing" className="ghost-button">Em processamento</button>
                    <button name="status" value="paid" className="approve-button">Marcar como pago</button>
                    <button name="status" value="rejected" className="reject-button">Rejeitar e devolver saldo</button>
                  </div>
                </form>
              </article>
            );
          }) : (
            <div className="empty-state"><BadgeDollarSign size={28} /><strong>Nenhum saque aguardando ação</strong></div>
          )}
        </div>
      </section>

      <section className="admin-split">
        <div className="content-card" id="sellers">
          <div className="card-heading"><div><h2>Sellers recentes</h2><p>Últimas contas criadas na plataforma.</p></div></div>
          <div className="data-table">
            <div className="table-row table-head"><span>Seller</span><span>Documento</span><span>Status</span><span>Cadastro</span></div>
            {recentSellers?.length ? recentSellers.map((seller) => {
              const account = (seller.seller_accounts as unknown as Array<{ status: string; trading_name: string | null }>)?.[0];
              return (
                <div className="table-row" key={seller.user_id}>
                  <span><strong>{seller.full_name}</strong><small>{account?.trading_name || seller.account_type.toUpperCase()}</small></span>
                  <span>•••• {seller.document_last4 || "—"}</span>
                  <span><b className={`table-status ${account?.status}`}>{statusLabel[account?.status ?? "onboarding"]}</b></span>
                  <span>{new Date(seller.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              );
            }) : <div className="empty-state"><Users size={28} /><strong>Nenhum seller cadastrado</strong></div>}
          </div>
        </div>

        <div className="content-card" id="movimentacoes">
          <div className="card-heading"><div><h2>Movimentações recentes</h2><p>Entradas e saídas de todos os sellers.</p></div><ScrollText size={19} /></div>
          <div className="data-table">
            <div className="table-row table-head"><span>Seller</span><span>Tipo</span><span>Status</span><span>Valor</span></div>
            {movements?.length ? movements.map((entry) => {
              const seller = entry.seller_accounts as unknown as { profiles: { full_name: string } };
              return (
                <div className="table-row" key={entry.id}>
                  <span><strong>{seller?.profiles?.full_name ?? String(entry.seller_id).slice(0, 8)}</strong><small>{new Date(entry.created_at).toLocaleString("pt-BR")}</small></span>
                  <span><strong>{movementLabel[entry.entry_type] ?? entry.entry_type}</strong><small>{entry.description}</small></span>
                  <span><b className={`table-status ${entry.status}`}>{statusLabel[entry.status] ?? entry.status}</b></span>
                  <span className={Number(entry.amount_cents) < 0 ? "negative" : "positive"}>{Number(entry.amount_cents) > 0 ? "+ " : ""}{brl(Number(entry.amount_cents))}</span>
                </div>
              );
            }) : <div className="empty-state"><ScrollText size={28} /><strong>Nenhuma movimentação</strong></div>}
          </div>
        </div>
      </section>
    </>
  );
}
