import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { reviewDocument, reviewSeller, updateWithdrawal } from "@/app/admin/actions";
import { formatDocument } from "@/lib/br-documents";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  onboarding: "Cadastro iniciado",
  pending: "Aguardando análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
  processing: "Em processamento",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Chargeback",
  resubmission: "Reenvio solicitado",
};

function money(cents: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents ?? 0) / 100);
}

function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function Status({ value }: { value: string }) {
  const positive = value === "approved" || value === "paid";
  const warning = value === "pending" || value === "onboarding" || value === "processing" || value === "resubmission";
  return <span className={`admin-status ${positive ? "is-positive" : warning ? "is-warning" : "is-negative"}`}>{statusLabels[value] ?? value}</span>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) redirect("/admin/login?erro=" + encodeURIComponent("Esta conta não possui acesso administrativo."));

  const [profilesResult, sellersResult, withdrawalsResult, paymentsResult, documentsResult, auditResult] = await Promise.all([
    supabase.from("profiles").select("user_id,full_name,email,account_type,document_number,document_last4,phone,created_at").order("created_at", { ascending: false }),
    supabase.from("seller_accounts").select("user_id,trading_name,status,submitted_at,reviewed_at,created_at").order("created_at", { ascending: false }),
    supabase.from("withdrawal_requests").select("id,seller_id,requested_cents,fee_cents,net_cents,status,requested_at,processed_at").order("requested_at", { ascending: false }).limit(30),
    supabase.from("payments").select("id,seller_id,method,gross_cents,net_cents,status,paid_at,created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("kyc_documents").select("id,user_id,document_type,original_name,status,created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("audit_logs").select("id,action,entity_type,entity_id,created_at").order("created_at", { ascending: false }).limit(12),
  ]);

  const profiles = profilesResult.data ?? [];
  const sellers = sellersResult.data ?? [];
  const withdrawals = withdrawalsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const audit = auditResult.data ?? [];
  const profileById = new Map(profiles.map((profile) => [profile.user_id, profile]));

  const approvedVolume = payments.filter((payment) => payment.status === "approved").reduce((sum, payment) => sum + Number(payment.gross_cents ?? 0), 0);
  const pendingSellers = sellers.filter((seller) => seller.status === "pending" || seller.status === "onboarding").length;
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "pending" || withdrawal.status === "processing");
  const pendingDocuments = documents.filter((document) => document.status === "pending" || document.status === "resubmission");

  return (
    <main className="admin-console">
      <aside className="admin-console-sidebar">
        <Brand compact />
        <div className="admin-console-badge"><ShieldCheck size={15} /> Acesso proprietário</div>
        <nav>
          <a href="#visao"><LayoutDashboard size={17} /> Visão geral</a>
          <a href="#sellers"><UsersRound size={17} /> Sellers <b>{pendingSellers}</b></a>
          <a href="#documentos"><FileCheck2 size={17} /> Documentos <b>{pendingDocuments.length}</b></a>
          <a href="#saques"><Wallet size={17} /> Saques <b>{pendingWithdrawals.length}</b></a>
          <a href="#movimentacoes"><ReceiptText size={17} /> Movimentações</a>
          <a href="#auditoria"><Activity size={17} /> Auditoria</a>
        </nav>
        <div className="admin-console-user">
          <span>Administrador</span>
          <small>{user.email}</small>
          <form action={signOut}><button type="submit"><LogOut size={15} /> Sair</button></form>
        </div>
      </aside>

      <section className="admin-console-main">
        <header className="admin-console-topbar">
          <div><span>ADMINISTRAÇÃO</span><strong>CircusPay Control</strong></div>
          <Link href="/dashboard">Abrir painel seller</Link>
        </header>

        <div className="admin-console-content" id="visao">
          <div className="admin-console-title">
            <div><span>CONTROLE CENTRAL</span><h1>Painel administrativo</h1><p>Acompanhe sellers, documentos, pagamentos e saques em um só lugar.</p></div>
            <div className="admin-live"><i /> Sistema online</div>
          </div>

          {query.sucesso && <div className="admin-message success"><CheckCircle2 size={17} /> {query.sucesso}</div>}
          {query.erro && <div className="admin-message error"><XCircle size={17} /> {query.erro}</div>}

          <div className="admin-stats">
            <article><span><UsersRound size={17} /> Sellers cadastrados</span><strong>{sellers.length}</strong><small>{pendingSellers} aguardando análise</small></article>
            <article><span><BadgeCheck size={17} /> Sellers aprovados</span><strong>{sellers.filter((seller) => seller.status === "approved").length}</strong><small>Acesso liberado à operação</small></article>
            <article><span><Wallet size={17} /> Saques pendentes</span><strong>{money(pendingWithdrawals.reduce((sum, item) => sum + Number(item.net_cents ?? 0), 0))}</strong><small>{pendingWithdrawals.length} solicitações</small></article>
            <article><span><Activity size={17} /> Volume aprovado</span><strong>{money(approvedVolume)}</strong><small>{payments.filter((payment) => payment.status === "approved").length} pagamentos</small></article>
          </div>

          <section className="admin-block" id="sellers">
            <div className="admin-block-head"><div><span>CADASTROS</span><h2>Análise de sellers</h2></div><b>{sellers.length}</b></div>
            <div className="admin-table-wrap"><table><thead><tr><th>Seller</th><th>Contato</th><th>Conta</th><th>Documento</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>
              {sellers.length === 0 && <tr><td colSpan={7} className="admin-empty">Nenhum seller cadastrado ainda.</td></tr>}
              {sellers.map((seller) => { const profile = profileById.get(seller.user_id); return <tr key={seller.user_id}>
                <td><strong>{profile?.full_name ?? seller.trading_name ?? "Seller"}</strong><small>{seller.trading_name || "Nome comercial não informado"}</small></td>
                <td><strong>{profile?.email ?? "—"}</strong><small>{profile?.phone ?? "Telefone não informado"}</small></td>
                <td>{profile?.account_type?.toUpperCase() ?? "—"}</td><td>{profile?.document_number ? formatDocument(profile.document_number) : "Pendente"}</td><td><Status value={seller.status} /></td><td>{dateTime(seller.created_at)}</td>
                <td><form action={reviewSeller} className="admin-actions"><input type="hidden" name="userId" value={seller.user_id}/><button name="decision" value="approved" className="approve" title="Aprovar"><CheckCircle2 size={15}/></button><button name="decision" value="rejected" className="reject" title="Rejeitar"><XCircle size={15}/></button></form></td>
              </tr>; })}
            </tbody></table></div>
          </section>

          <section className="admin-block" id="documentos">
            <div className="admin-block-head"><div><span>KYC</span><h2>Documentos enviados</h2></div><b>{pendingDocuments.length} pendentes</b></div>
            <div className="admin-table-wrap"><table><thead><tr><th>Seller</th><th>Documento</th><th>Arquivo</th><th>Status</th><th>Envio</th><th>Ações</th></tr></thead><tbody>
              {documents.length === 0 && <tr><td colSpan={6} className="admin-empty">Nenhum documento enviado.</td></tr>}
              {documents.map((document) => <tr key={document.id}><td><strong>{profileById.get(document.user_id)?.full_name ?? "Seller"}</strong></td><td>{document.document_type.replaceAll("_", " ")}</td><td>{document.original_name}</td><td><Status value={document.status}/></td><td>{dateTime(document.created_at)}</td><td><form action={reviewDocument} className="admin-actions"><input type="hidden" name="documentId" value={document.id}/><button name="status" value="approved" className="approve" title="Aprovar"><CheckCircle2 size={15}/></button><button name="status" value="resubmission" className="reject" title="Solicitar reenvio"><XCircle size={15}/></button></form></td></tr>)}
            </tbody></table></div>
          </section>

          <section className="admin-block" id="saques">
            <div className="admin-block-head"><div><span>FINANCEIRO</span><h2>Solicitações de saque</h2></div><b>Taxa fixa R$ 3,50</b></div>
            <div className="admin-table-wrap"><table><thead><tr><th>Seller</th><th>Solicitado</th><th>Taxa</th><th>Valor líquido</th><th>Status</th><th>Solicitação</th><th>Ações</th></tr></thead><tbody>
              {withdrawals.length === 0 && <tr><td colSpan={7} className="admin-empty">Nenhum saque solicitado.</td></tr>}
              {withdrawals.map((withdrawal) => <tr key={withdrawal.id}><td><strong>{profileById.get(withdrawal.seller_id)?.full_name ?? "Seller"}</strong></td><td>{money(withdrawal.requested_cents)}</td><td>{money(withdrawal.fee_cents)}</td><td><strong>{money(withdrawal.net_cents)}</strong></td><td><Status value={withdrawal.status}/></td><td>{dateTime(withdrawal.requested_at)}</td><td><form action={updateWithdrawal} className="admin-actions"><input type="hidden" name="withdrawalId" value={withdrawal.id}/><button name="status" value="processing" className="process" title="Processar"><Clock3 size={15}/></button><button name="status" value="paid" className="approve" title="Marcar como pago"><CheckCircle2 size={15}/></button><button name="status" value="rejected" className="reject" title="Rejeitar"><XCircle size={15}/></button></form></td></tr>)}
            </tbody></table></div>
          </section>

          <div className="admin-grid-two">
            <section className="admin-block" id="movimentacoes"><div className="admin-block-head"><div><span>TRANSAÇÕES</span><h2>Movimentações recentes</h2></div></div><div className="admin-feed">
              {payments.length === 0 && <div className="admin-empty">Nenhum pagamento registrado.</div>}
              {payments.slice(0, 10).map((payment) => <article key={payment.id}><span className={`admin-feed-icon ${payment.status === "approved" ? "ok" : ""}`}><ReceiptText size={16}/></span><div><strong>{money(payment.gross_cents)}</strong><small>{payment.method?.toUpperCase() ?? "Pagamento"} • {profileById.get(payment.seller_id)?.full_name ?? "Seller"}</small></div><Status value={payment.status}/><time>{dateTime(payment.created_at)}</time></article>)}
            </div></section>
            <section className="admin-block" id="auditoria"><div className="admin-block-head"><div><span>SEGURANÇA</span><h2>Auditoria</h2></div></div><div className="admin-feed audit">
              {audit.length === 0 && <div className="admin-empty">Nenhuma ação administrativa registrada.</div>}
              {audit.map((item) => <article key={item.id}><span className="admin-feed-icon"><ShieldCheck size={16}/></span><div><strong>{item.action}</strong><small>{item.entity_type} • {item.entity_id?.slice(0, 8) ?? "—"}</small></div><time>{dateTime(item.created_at)}</time></article>)}
            </div></section>
          </div>
        </div>
      </section>
    </main>
  );
}
