import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  Menu,
  PackagePlus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trophy,
  WalletCards,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { LandingEffects } from "@/components/landing-effects";

const awards = [
  { image: "/award-10k.webp", value: "R$ 10 mil", label: "Primeira conquista" },
  { image: "/award-100k.webp", value: "R$ 100 mil", label: "Operação em expansão" },
  { image: "/award-500k.webp", value: "R$ 500 mil", label: "Alta performance" },
  { image: "/award-1m.webp", value: "R$ 1 milhão", label: "Clube do milhão" },
];

const features = [
  { icon: ChartNoAxesCombined, title: "Visão da operação", text: "Vendas, ticket médio, reembolsos e saldo organizados em um painel direto ao ponto." },
  { icon: PackagePlus, title: "Produtos e checkout", text: "Crie seus produtos, defina o valor e gere o checkout para começar a vender." },
  { icon: BellRing, title: "Notificações de venda", text: "Receba alertas de pagamento pendente e aprovado sem precisar atualizar a tela." },
  { icon: WalletCards, title: "Financeiro e saques", text: "Cadastre sua chave Pix, acompanhe o saldo e solicite saques pela CircusPay." },
];

export default function Home() {
  return (
    <main className="landing-page">
      <LandingEffects />
      <div className="landing-pointer-glow" aria-hidden="true" />
      <header className="landing-header">
        <Link href="/" aria-label="Página inicial"><Brand compact /></Link>
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#premiacoes">Premiações</a>
        </nav>
        <div className="landing-actions">
          <Link className="landing-login" href="/login">Entrar</Link>
          <Link className="landing-start" href="/cadastro">Criar conta <ArrowRight size={15}/></Link>
        </div>
        <Link className="landing-mobile-menu" href="/login" aria-label="Abrir acesso"><Menu size={21}/></Link>
      </header>

      <section className="landing-hero">
        <div className="landing-glow landing-glow-one" />
        <div className="landing-glow landing-glow-two" />
        <div className="landing-hero-copy">
          <span className="landing-pill"><i /> PAGAMENTOS • GESTÃO • RESULTADOS</span>
          <h1>O controle está<br/>nas <em>suas mãos.</em></h1>
          <p>Venda com uma operação organizada, acompanhe cada pagamento e solicite seus saques em uma experiência feita para crescer com você.</p>
          <div className="landing-hero-actions">
            <Link className="landing-primary" href="/cadastro">Começar agora <ArrowRight size={17}/></Link>
            <Link className="landing-secondary" href="/login">Já tenho uma conta</Link>
          </div>
          <div className="landing-trust">
            <span><ShieldCheck size={15}/> Acesso protegido</span>
            <span><BadgeCheck size={15}/> Operação verificada</span>
          </div>
        </div>

        <div className="landing-hero-art" aria-hidden="true">
          <div className="hero-ring ring-a" />
          <div className="hero-ring ring-b" />
          <div className="hero-logo-orb"><Image src="/circuspay-mark-transparent.png" alt="" width={142} height={142}/></div>
          <div className="hero-sale-card">
            <span>VENDA APROVADA</span>
            <strong>R$ 497,00</strong>
            <small><i /> Confirmada agora</small>
          </div>
          <div className="hero-notification">
            <Image src="/circuspay-original-v5-192.png" width={39} height={39} alt=""/>
            <div><strong>Venda Aprovada!</strong><span>Comissão: R$ 81,64</span></div>
          </div>
          <div className="hero-pix-card"><QrCode size={24}/><div><span>PIX</span><strong>Pagamento rápido</strong></div></div>
        </div>
      </section>

      <div className="landing-marquee" aria-hidden="true">
        <div>PIX <i/> CHECKOUT <i/> NOTIFICAÇÕES <i/> PRODUTOS <i/> SAQUES <i/> DASHBOARD <i/> PIX <i/> CHECKOUT <i/> NOTIFICAÇÕES <i/> PRODUTOS <i/> SAQUES <i/> DASHBOARD</div>
      </div>

      <section className="landing-section feature-section" id="recursos" data-reveal>
        <div className="landing-section-head">
          <span>TUDO EM UM SÓ LUGAR</span>
          <h2>Uma operação bonita por fora.<br/><em>Completa por dentro.</em></h2>
          <p>A CircusPay reúne o essencial para você criar, vender, acompanhar e movimentar.</p>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article key={title} style={{ "--feature-index": index } as React.CSSProperties}>
              <div><Icon size={22}/><span>0{index + 1}</span></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <ChevronRight size={18}/>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-dark-story" id="como-funciona" data-reveal>
        <div className="story-copy">
          <span>DA CRIAÇÃO AO SAQUE</span>
          <h2>Cada etapa da venda,<br/><em>sem sair do palco.</em></h2>
          <p>Você cria o produto, compartilha o checkout e acompanha o pagamento. Quando o saldo estiver disponível, solicita o saque direto pelo financeiro.</p>
          <ul>
            <li><Check size={15}/> Produto e valor configurados por você</li>
            <li><Check size={15}/> Pagamento Pix acompanhado em tempo real</li>
            <li><Check size={15}/> Histórico de movimentações e solicitações</li>
          </ul>
          <Link href="/cadastro">Montar minha operação <ArrowRight size={16}/></Link>
        </div>
        <div className="story-flow" aria-label="Fluxo da operação">
          <div className="flow-line" />
          <article><span>01</span><div><PackagePlus size={21}/><strong>Crie o produto</strong><small>Nome, valor e checkout</small></div></article>
          <article><span>02</span><div><CreditCard size={21}/><strong>Receba o pagamento</strong><small>Status em tempo real</small></div></article>
          <article><span>03</span><div><BellRing size={21}/><strong>Venda aprovada</strong><small>Notificação instantânea</small></div></article>
          <article><span>04</span><div><WalletCards size={21}/><strong>Solicite o saque</strong><small>Controle pelo financeiro</small></div></article>
        </div>
      </section>

      <section className="landing-section awards-section" id="premiacoes" data-reveal>
        <div className="awards-heading">
          <div>
            <span><Trophy size={15}/> CONQUISTAS CIRCUSPAY</span>
            <h2>Seu volume de saques<br/>vira <em>história.</em></h2>
          </div>
          <p>As plaquinhas marcam os grandes momentos da sua operação. Cada meta considera o total de saques aprovados pela CircusPay.</p>
        </div>
        <div className="award-grid">
          {awards.map((award, index) => (
            <article key={award.value} className={index === 0 ? "award-active" : ""} style={{ "--award-index": index } as React.CSSProperties}>
              <div className="award-image-wrap">
                <Image src={award.image} alt={`Plaquinha CircusPay de ${award.value} em saques`} width={600} height={800}/>
                {index > 0 && <span className="award-lock"><LockKeyhole size={18}/> Meta bloqueada</span>}
              </div>
              <div className="award-meta"><span>{award.label}</span><strong>{award.value} em saques</strong></div>
            </article>
          ))}
        </div>
        <div className="award-note"><Sparkles size={18}/><div><strong>Conquistas que acompanham o seu crescimento</strong><span>O progresso de cada meta poderá ser acompanhado dentro do painel.</span></div></div>
      </section>

      <section className="landing-cta" data-reveal>
        <div className="cta-orbit" />
        <Image src="/circuspay-mark-transparent.png" width={90} height={90} alt="Logo CircusPay"/>
        <span>O PRÓXIMO RESULTADO COMEÇA AGORA</span>
        <h2>Pronto para colocar sua<br/>operação no centro do espetáculo?</h2>
        <p>Crie sua conta, envie seus dados e comece a preparar seus produtos.</p>
        <Link href="/cadastro">Criar minha conta <ArrowRight size={17}/></Link>
      </section>

      <footer className="landing-footer">
        <Brand compact />
        <p>Pagamentos, gestão e resultados em uma experiência CircusPay.</p>
        <div><Link href="/login">Entrar</Link><Link href="/cadastro">Criar conta</Link><Link href="/admin/login">Administração</Link></div>
        <small>© 2026 CircusPay. Todos os direitos reservados.</small>
      </footer>
    </main>
  );
}
