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
  WalletCards,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

const awardTargets = [
  { label: "10 mil", value: 1_000_000, short: "10K", image: "/award-10k.webp" },
  { label: "100 mil", value: 10_000_000, short: "100K", image: "/award-100k.webp" },
  { label: "500 mil", value: 50_000_000, short: "500K", image: "/award-500k.webp" },
  { label: "1 milhão", value: 100_000_000, short: "1M", image: "/award-1m.webp" },
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
    timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false,
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
    ? Math.round((refundedPayments.length / (approvedPayments.length + refundedPayments.length)) * 1000) / 10 : 0;
  const conversion = allPayments.length ? Math.round((approvedPayments.length / allPayments.length) * 1000) / 10 : 0;

  const todayKey = saoPauloDateKey(new Date());
  const todayApproved = approvedPayments.filter((payment) => saoPauloDateKey(payment.created_at) === todayKey);
  const todayGross = todayApproved.reduce((sum, payment) => sum + Number(payment.gross_cents), 0);
  const chartHours = [0, 4, 8, 12, 16, 20];
  const chart = chartHours.map((start) => ({
    label: `${String(start).padStart(2, "0")}:00`,
    value: todayApproved.filter((payment) => {
      const hour = saoPauloHour(payment.created_at);
      return hour >= start && hour < start + 4;
    }).reduce((sum, payment) => sum + Number(payment.gross_cents), 0),
  }));
  const chartMax = Math.max(...chart.map((item) => item.value), 1);
  const graphPoints = chart.map((item, index) => {
    const x = 5 + index * 19;
    const y = 78 - (item.value / chartMax) * 58;
    return `${x},${y}`;
  }).join(" ");

  const methods = (Object.keys(methodMeta) as Array<keyof typeof methodMeta>).map((key) => {
    const count = approvedPayments.filter((payment) => payment.method === key).length;
    return { key, count, share: approvedPayments.length ? (count / approvedPayments.length) * 100 : 0, ...methodMeta[key] };
  });
  const nextAwardIndex = Math.max(0, awardTargets.findIndex((award) => gross < award.value));
  const nextAward = awardTargets[nextAwardIndex] ?? awardTargets[awardTargets.length - 1];
  const awardProgress = Math.min(100, (gross / nextAward.value) * 100);

  const stats = [
    { label: "Faturamento bruto", value: brl(gross), helper: "Volume aprovado", Icon: ShoppingBag },
    { label: "Vendas aprovadas", value: String(approvedPayments.length), helper: `${todayApproved.length} hoje`, Icon: Sparkles },
    { label: "Ticket médio", value: brl(averageTicket), helper: "Por venda aprovada", Icon: CreditCard },
    { label: "Saldo pendente", value: brl(pendingGross), helper: `${pendingPayments.length} pagamentos`, Icon: Clock3 },
    { label: "Saldo retido", value: brl(Number(balance?.held_cents ?? 0)), helper: "Em processamento", Icon: WalletCards },
    { label: "Taxa de reembolso", value: `${refundRate.toLocaleString("pt-BR")}%`, helper: `${refundedPayments.length} ocorrências`, Icon: RotateCcw },
  ];

  return (
    <>
      {query.sucesso && <div className="notice">{query.sucesso}</div>}
      {query.erro && <div className="notice error">Você não tem acesso a essa área.</div>}

      <div className="page-title">
        <div><span className="eyebrow">VISÃO GERAL</span><h1>Dashboard</h1><p>Acompanhe os números da sua operação em tempo real.</p></div>
        <Link className="secondary" href="/dashboard/produtos"><Package size={16} /> Criar produto</Link>
      </div>

      {!approved && (
        <div className="notice error">
          <ShieldAlert size={18} />
          <span><strong>{seller?.status === "pending" ? "Sua documentação está em análise." : "Conclua seu cadastro para começar a vender."}</strong> {seller?.review_notes || "Os checkouts são liberados após a aprovação."}</span>
          <Link href="/onboarding">Ver cadastro →</Link>
        </div>
      )}

      <section className="dashboard-stats">
        {stats.map(({ label, value, helper, Icon }) => (
          <article className="stat-card" key={label}>
            <div><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div>
            <strong>{value}</strong>
            <small><span className="green-dot" />{helper}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <article className="card performance-card">
          <div className="section-head">
            <div><span className="section-icon"><ShoppingBag size={17} /></span><div><strong>Desempenho de hoje</strong><small>Volume aprovado por horário</small></div></div>
            <b>{brl(todayGross)}</b>
          </div>
          <div className="performance-chart">
            <span className="chart-value">{brl(chartMax)}</span>
            <svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-label="Gráfico de vendas">
              <line x1="0" y1="20" x2="100" y2="20" /><line x1="0" y1="49" x2="100" y2="49" /><line x1="0" y1="78" x2="100" y2="78" />
              <polyline points={graphPoints} />
              {chart.map((item, index) => <circle key={item.label} cx={5 + index * 19} cy={78 - (item.value / chartMax) * 58} r="1.6" />)}
            </svg>
            <div className="chart-times">{chart.map((item) => <span key={item.label}>{item.label}</span>)}</div>
          </div>
        </article>

        <article className="card awards-card">
          <div className="section-head">
            <div><span className="section-icon"><Sparkles size={17} /></span><div><strong>Premiações</strong><small>Metas da sua jornada</small></div></div>
          </div>
          <div className="award-showcase">
            <img src={nextAward.image} alt={`Placa CircusPay ${nextAward.label}`} />
            <span>{nextAward.short}</span>
          </div>
          <div className="award-progress"><i style={{ width: `${awardProgress}%` }} /></div>
          <div className="award-meta"><span>Próxima placa</span><strong>{brl(gross)} / {brl(nextAward.value)}</strong></div>
          <div className="award-dots">{awardTargets.map((award, index) => <span className={index === nextAwardIndex ? "active" : ""} key={award.short} />)}</div>
        </article>

        <article className="card payments-card">
          <div className="section-head">
            <div><span className="section-icon"><CreditCard size={17} /></span><div><strong>Meios de pagamento</strong><small>Distribuição das vendas</small></div></div>
          </div>
          {methods.map(({ key, label, Icon, count, share }) => (
            <div className="payment-row" key={key}>
              <span><Icon size={17} /></span>
              <div><strong>{label}</strong><small>{count} {count === 1 ? "venda" : "vendas"}</small></div>
              <b>{share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</b>
            </div>
          ))}
          <div className="conversion-box"><span>Conversão do checkout</span><strong>{conversion.toLocaleString("pt-BR")}%</strong><div><i style={{ width: `${conversion}%` }} /></div></div>
        </article>
      </section>

      <section className="card dashboard-bottom-card">
        <div>
          <span className="section-icon"><Landmark size={18} /></span>
          <div><strong>Comece sua operação</strong><p>{productCount ? `Você possui ${productCount} produto(s) cadastrado(s).` : "Crie seu primeiro produto, defina o valor e gere um checkout."}</p></div>
        </div>
        <div>
          <span>Saldo disponível <strong>{brl(Number(balance?.available_cents ?? 0))}</strong></span>
          <Link href="/dashboard/produtos">Ir para produtos <ArrowUpRight size={16} /></Link>
        </div>
      </section>
    </>
  );
}
