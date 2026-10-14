import Link from "next/link";
import {
  ArrowUpRight,
  Barcode,
  Clock3,
  CreditCard,
  Landmark,
  Package,
  QrCode,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

const awardTargets = [
  { label: "10 mil", value: 1_000_000, short: "10K" },
  { label: "100 mil", value: 10_000_000, short: "100K" },
  { label: "500 mil", value: 50_000_000, short: "500K" },
  { label: "1 milhão", value: 100_000_000, short: "1M" },
];

const methodMeta = {
  pix: { label: "Pix", Icon: QrCode },
  card: { label: "Cartão", Icon: CreditCard },
  boleto: { label: "Boleto", Icon: Barcode },
};

function saoPauloDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function saoPauloHour(value: string) {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date(value)).replace(/\D/g, ""));
  return hour === 24 ? 0 : hour;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: seller }, { data: balance }, { data: payments }, { count: productCount }] = await Promise.all([
    supabase.from("seller_accounts").select("status,review_notes").eq("user_id", user.id).single(),
    supabase.from("seller_balances").select("available_cents,held_cents").eq("seller_id", user.id).maybeSingle(),
    supabase.from("payments").select("id,gross_cents,status,method,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const allPayments = payments ?? [];
  const approved = seller?.status === "approved";
  const approvedPayments = allPayments.filter((payment) => payment.status === "approved");
  const pendingPayments = allPayments.filter((payment) => payment.status === "pending");
  const refundedPayments = allPayments.filter((payment) => ["refunded", "charged_back"].includes(payment.status));
  const gross = approvedPayments.reduce((sum, payment) => sum + Number(payment.gross_cents), 0);
  const pendingGross = pendingPayments.reduce((sum, payment) => sum + Number(payment.gross_cents), 0);
  const averageTicket = approvedPayments.length ? Math.round(gross / approvedPayments.length) : 0;
  const refundRate = approvedPayments.length + refundedPayments.length
    ? Math.round((refundedPayments.length / (approvedPayments.length + refundedPayments.length)) * 1000) / 10
    : 0;
  const conversion = allPayments.length ? Math.round((approvedPayments.length / allPayments.length) * 1000) / 10 : 0;

  const todayKey = saoPauloDateKey(new Date());
  const todayApproved = approvedPayments.filter((payment) => saoPauloDateKey(payment.created_at) === todayKey);
  const todayGross = todayApproved.reduce((sum, payment) => sum + Number(payment.gross_cents), 0);
  const chartHours = [0, 4, 8, 12, 16, 20];
  const chart = chartHours.map((start) => ({
    label: `${String(start).padStart(2, "0")}:00`,
    value: todayApproved
      .filter((payment) => {
        const hour = saoPauloHour(payment.created_at);
        return hour >= start && hour < start + 4;
      })
      .reduce((sum, payment) => sum + Number(payment.gross_cents), 0),
  }));
  const chartMax = Math.max(...chart.map((item) => item.value), 1);

  const methods = (Object.keys(methodMeta) as Array<keyof typeof methodMeta>).map((key) => {
    const count = approvedPayments.filter((payment) => payment.method === key).length;
    return { key, count, share: approvedPayments.length ? (count / approvedPayments.length) * 100 : 0, ...methodMeta[key] };
  });

  const nextAward = awardTargets.find((award) => gross < award.value) ?? awardTargets[awardTargets.length - 1];
  const awardProgress = Math.min(100, (gross / nextAward.value) * 100);

  return (
    <div className="legacy-dashboard">
      {query.sucesso && <div className="banner success">{query.sucesso}</div>}
      {query.erro && <div className="banner error">Você não tem acesso a essa área.</div>}

      <div className="ops-heading">
        <div>
          <span className="ops-kicker">CIRCUS PAY / OPERAÇÃO</span>
          <h1>Visão geral da operação.</h1>
          <p>Acompanhe vendas, volume e desempenho em um só painel.</p>
        </div>
        <div className="ops-actions">
          <span className="test-badge"><i /> Ambiente de testes</span>
          {approved && <Link className="red-action" href="/dashboard/produtos">Criar produto <ArrowUpRight size={17} /></Link>}
        </div>
      </div>

      {!approved && (
        <section className="approval-callout">
          <span><ShieldAlert size={25} /></span>
          <div>
            <strong>{seller?.status === "pending" ? "Sua documentação está em análise" : seller?.status === "rejected" ? "Precisamos de novos documentos" : "Conclua seu cadastro para começar a vender"}</strong>
            <p>{seller?.review_notes || "Produtos e checkouts são liberados depois que seus dados forem aprovados."}</p>
          </div>
          <Link href="/onboarding">{seller?.status === "pending" ? "Ver dados enviados" : "Enviar documentação"}</Link>
        </section>
      )}

      <section className="ops-metrics">
        <article><span>Faturamento bruto</span><strong>{brl(gross)}</strong><ShoppingBag size={20} /><small>Volume aprovado</small></article>
        <article><span>Vendas aprovadas</span><strong>{approvedPayments.length}</strong><Sparkles size={20} /><small>{todayApproved.length} hoje</small></article>
        <article><span>Ticket médio</span><strong>{brl(averageTicket)}</strong><CreditCard size={20} /><small>Por venda aprovada</small></article>
        <article><span>Saldo pendente</span><strong>{brl(pendingGross)}</strong><Clock3 size={20} /><small>{pendingPayments.length} pagamentos</small></article>
        <article><span>Saldo retido</span><strong>{brl(Number(balance?.held_cents ?? 0))}</strong><WalletCards size={20} /><small>Em processamento</small></article>
        <article><span>Taxa de reembolso</span><strong>{refundRate.toLocaleString("pt-BR")}%</strong><RotateCcw size={20} /><small>{refundedPayments.length} ocorrências</small></article>
      </section>

      <div className="ops-main-grid">
        <section className="ops-panel performance-panel">
          <div className="ops-panel-heading">
            <div><span>DESEMPENHO</span><h2>Hoje</h2></div>
            <strong>{brl(todayGross)}</strong>
          </div>
          <div className="performance-chart">
            {chart.map((item) => (
              <div className="chart-column" key={item.label}>
                <span>{item.value ? brl(item.value) : ""}</span>
                <div><i style={{ height: `${Math.max(7, (item.value / chartMax) * 100)}%` }} /></div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel conversion-panel">
          <div className="ops-panel-heading"><div><span>CONVERSÃO</span><h2>Performance do checkout</h2></div></div>
          <div className="conversion-ring" style={{ "--conversion": `${conversion * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{conversion.toLocaleString("pt-BR")}%</strong><small>conversão</small></div>
          </div>
          <p>{approvedPayments.length} de {allPayments.length} tentativas aprovadas</p>
        </section>
      </div>

      <section className="ops-panel awards-panel">
        <div className="ops-panel-heading">
          <div><span>PREMIAÇÕES</span><h2>Sua jornada CircusPay</h2><p>As placas ficam sempre visíveis. A conquista é liberada ao atingir cada meta.</p></div>
          <div className="award-next"><small>Próxima premiação</small><strong>{nextAward.short}</strong></div>
        </div>
        <div className="award-track">
          {awardTargets.map((award) => {
            const unlocked = gross >= award.value;
            return (
              <article className={unlocked ? "unlocked" : ""} key={award.value}>
                <div className="plaque-art"><Trophy size={28} /><b>{award.short}</b><small>EM SAQUES</small></div>
                <div><strong>Placa de {award.label}</strong><small>{unlocked ? "Conquistada" : `Meta de ${brl(award.value)}`}</small></div>
              </article>
            );
          })}
        </div>
        <div className="award-progress-copy"><span>Progresso para {nextAward.short}</span><strong>{brl(gross)} / {brl(nextAward.value)}</strong></div>
        <div className="award-progress"><i style={{ width: `${awardProgress}%` }} /></div>
      </section>

      <div className="ops-lower-grid">
        <section className="ops-panel payments-panel">
          <div className="ops-panel-heading"><div><span>MEIOS DE PAGAMENTO</span><h2>Distribuição das vendas</h2></div></div>
          <div className="payment-methods">
            {methods.map(({ key, label, Icon, count, share }) => (
              <article key={key}>
                <span><Icon size={18} /></span>
                <div><strong>{label}</strong><small>{count} {count === 1 ? "venda" : "vendas"}</small></div>
                <b>{share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</b>
                <i><em style={{ width: `${share}%` }} /></i>
              </article>
            ))}
          </div>
        </section>

        <section className="ops-panel quick-panel">
          <div className="ops-panel-heading"><div><span>ATALHOS</span><h2>Gerencie sua operação</h2></div></div>
          <Link href="/dashboard/produtos"><span><Package size={19} /></span><div><strong>Criar produto</strong><small>Defina o valor e gere seu checkout</small></div><ArrowUpRight size={17} /></Link>
          <Link href="/dashboard/financeiro"><span><Landmark size={19} /></span><div><strong>Financeiro</strong><small>Saldo disponível: {brl(Number(balance?.available_cents ?? 0))}</small></div><ArrowUpRight size={17} /></Link>
          <Link href="/dashboard/vendas"><span><Users size={19} /></span><div><strong>Vendas recentes</strong><small>Acompanhe pagamentos em tempo real</small></div><ArrowUpRight size={17} /></Link>
        </section>
      </div>
    </div>
  );
}
