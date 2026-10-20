import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleCheck,
  Clock3,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import { submitOnboarding } from "@/app/actions/seller";
import { Brand } from "@/components/brand";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const documentLabels: Record<string, string> = {
  identity_front: "Documento de identificação",
  selfie: "Selfie de validação",
  company_document: "Documento empresarial",
};

function documentStatus(status: string) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Revisar";
  return "Recebido";
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: seller }, { data: finance }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,account_type,document_number").eq("user_id", user.id).single(),
    supabase.from("seller_accounts").select("trading_name,status,review_notes,submitted_at").eq("user_id", user.id).single(),
    supabase.from("finance_accounts").select("holder_name,pix_key_type,pix_key,status").eq("user_id", user.id).maybeSingle(),
    supabase.from("kyc_documents").select("id,original_name,document_type,status,created_at").order("created_at", { ascending: false }),
  ]);

  const isApproved = seller?.status === "approved";
  const locked = seller?.status === "pending" || isApproved;

  return (
    <main className="onboarding-page">
      <div className="onboarding-ambient onboarding-ambient-one" />
      <div className="onboarding-ambient onboarding-ambient-two" />

      <header className="onboarding-header">
        <Brand compact />
        <div className="onboarding-header-status"><span /><ShieldCheck size={14} /> Ambiente protegido</div>
        <Link href="/dashboard">Voltar ao painel <ArrowRight size={14} /></Link>
      </header>

      <div className="onboarding-wrap">
        <section className="onboarding-hero">
          <div className="onboarding-title">
            <span className="onboarding-kicker"><Sparkles size={14} /> ATIVAÇÃO CIRCUSPAY</span>
            <h1>Sua operação pronta para <em>entrar em cena.</em></h1>
            <p>Complete a validação uma única vez. Nós protegemos sua identidade, seus recebimentos e a segurança de cada venda.</p>
          </div>
          <div className="onboarding-hero-seal">
            <span><Fingerprint size={25} /></span>
            <div><small>VERIFICAÇÃO DE IDENTIDADE</small><strong>Proteção em cada etapa</strong><p>Dados criptografados e acesso restrito à análise.</p></div>
          </div>
        </section>

        <nav className="onboarding-progress" aria-label="Etapas de ativação">
          <div className={locked ? "complete" : "active"}><span>{locked ? <Check size={16} /> : "01"}</span><div><small>ETAPA 1</small><strong>Identificação</strong></div></div>
          <i />
          <div className={locked ? (isApproved ? "complete" : "active") : ""}><span>{isApproved ? <Check size={16} /> : "02"}</span><div><small>ETAPA 2</small><strong>Análise CircusPay</strong></div></div>
          <i />
          <div className={isApproved ? "active" : ""}><span>03</span><div><small>ETAPA 3</small><strong>Operação liberada</strong></div></div>
        </nav>

        {query.erro && <div className="onboarding-alert"><span>!</span><div><strong>Não foi possível continuar</strong><p>{query.erro}</p></div></div>}
        {seller?.review_notes && <div className="onboarding-alert"><span>!</span><div><strong>Observação da análise</strong><p>{seller.review_notes}</p></div></div>}

        {locked ? (
          <section className={`review-state ${isApproved ? "approved" : "pending"}`}>
            <div className="review-visual" aria-hidden="true">
              <div className="review-ring ring-one" />
              <div className="review-ring ring-two" />
              <span>{isApproved ? <BadgeCheck size={40} /> : <Clock3 size={38} />}</span>
            </div>

            <div className="review-copy">
              <span className="review-pill">{isApproved ? <CircleCheck size={13} /> : <Clock3 size={13} />}{isApproved ? "VERIFICAÇÃO CONCLUÍDA" : "ANÁLISE EM ANDAMENTO"}</span>
              <h2>{isApproved ? "Sua operação está liberada." : "Seus dados entraram em análise."}</h2>
              <p>{isApproved ? "Tudo certo. Você já pode criar produtos, gerar checkouts e começar a vender com a CircusPay." : "Nossa equipe está verificando os documentos e a conta de recebimento. Você verá a atualização aqui assim que concluirmos."}</p>

              <div className="review-timeline">
                <div className="done"><span><Check size={14} /></span><div><strong>Dados enviados</strong><small>Cadastro recebido com segurança</small></div></div>
                <i />
                <div className={isApproved ? "done" : "current"}><span>{isApproved ? <Check size={14} /> : <Clock3 size={14} />}</span><div><strong>Análise CircusPay</strong><small>{isApproved ? "Identidade validada" : "Verificação em andamento"}</small></div></div>
                <i />
                <div className={isApproved ? "current" : "waiting"}><span>{isApproved ? <Check size={14} /> : <LockKeyhole size={14} />}</span><div><strong>Operação liberada</strong><small>{isApproved ? "Pronta para receber vendas" : "Disponível após aprovação"}</small></div></div>
              </div>

              <Link className="circus-submit" href="/dashboard">{isApproved ? "Acessar minha operação" : "Acompanhar pelo painel"}<ArrowRight size={16} /></Link>
            </div>

            <aside className="review-documents">
              <div className="review-documents-head"><div><small>ARQUIVOS DA ANÁLISE</small><strong>{documents?.length ?? 0} documentos enviados</strong></div><ShieldCheck size={19} /></div>
              <div className="review-document-list">
                {documents?.map((doc) => (
                  <div key={doc.id}><span><FileCheck2 size={17} /></span><div><strong>{documentLabels[doc.document_type] ?? "Documento"}</strong><small>{doc.original_name}</small></div><em className={doc.status}>{documentStatus(doc.status)}</em></div>
                ))}
              </div>
              <p><LockKeyhole size={13} /> Somente você e a equipe de análise podem acessar estes arquivos.</p>
            </aside>
          </section>
        ) : (
          <div className="onboarding-stage">
            <aside className="onboarding-guide">
              <span className="guide-icon"><ShieldCheck size={25} /></span>
              <small>ANTES DE COMEÇAR</small>
              <h2>Leva poucos minutos.</h2>
              <p>Tenha seus documentos e a chave Pix do titular em mãos.</p>
              <div className="guide-list">
                <div><span><Check size={13} /></span><p><strong>Dados do responsável</strong><small>CPF ou CNPJ da operação</small></p></div>
                <div><span><Check size={13} /></span><p><strong>Documento legível</strong><small>Imagem ou PDF de até 10 MB</small></p></div>
                <div><span><Check size={13} /></span><p><strong>Chave Pix própria</strong><small>No nome do mesmo titular</small></p></div>
              </div>
              <div className="guide-security"><LockKeyhole size={15} /><span><strong>Seus dados estão seguros</strong><small>Proteção durante todo o envio.</small></span></div>
            </aside>

            <form action={submitOnboarding} className="onboarding-form">
              <section className="form-section">
                <div className="section-number"><span>01</span></div>
                <div className="section-fields">
                  <div className="section-title"><Building2 size={22} /><div><small>IDENTIFICAÇÃO</small><h2>Dados do titular</h2><p>Use exatamente os dados do CPF ou CNPJ responsável pela operação.</p></div></div>
                  <div className="field-grid">
                    <label><span>Nome completo ou razão social</span><input name="fullName" defaultValue={profile?.full_name ?? ""} placeholder="Como está no documento" required /></label>
                    <label><span>Telefone</span><input name="phone" defaultValue={profile?.phone ?? ""} placeholder="(11) 99999-9999" inputMode="tel" required /></label>
                    <label><span>Tipo de conta</span><select name="accountType" defaultValue={profile?.account_type ?? "cpf"}><option value="cpf">Pessoa física (CPF)</option><option value="cnpj">Pessoa jurídica (CNPJ)</option></select></label>
                    <label><span>CPF ou CNPJ</span><input name="documentNumber" defaultValue={profile?.document_number ?? ""} placeholder="Somente números" inputMode="numeric" required /></label>
                    <label className="full"><span>Nome da operação</span><input name="tradingName" defaultValue={seller?.trading_name ?? ""} placeholder="Ex.: Minha loja" required /></label>
                  </div>
                </div>
              </section>

              <section className="form-section">
                <div className="section-number"><span>02</span></div>
                <div className="section-fields">
                  <div className="section-title"><Upload size={22} /><div><small>VERIFICAÇÃO</small><h2>Documentos da operação</h2><p>Envie arquivos nítidos, completos e sem cortes.</p></div></div>
                  <div className="upload-grid">
                    <label className="file-box"><span className="file-icon"><Upload size={22} /></span><em>ARQUIVO OBRIGATÓRIO</em><strong>Documento com foto</strong><span>RG, CNH ou documento oficial</span><small>JPG, PNG, WEBP ou PDF · até 10 MB</small><input type="file" name="identity" accept="image/jpeg,image/png,image/webp,application/pdf" required /></label>
                    <label className="file-box"><span className="file-icon"><Upload size={22} /></span><em>ARQUIVO OBRIGATÓRIO</em><strong>Validação complementar</strong><span>Selfie para CPF; documento empresarial para CNPJ</span><small>JPG, PNG, WEBP ou PDF · até 10 MB</small><input type="file" name="extraDocument" accept="image/jpeg,image/png,image/webp,application/pdf" required /></label>
                  </div>
                </div>
              </section>

              <section className="form-section">
                <div className="section-number"><span>03</span></div>
                <div className="section-fields">
                  <div className="section-title"><WalletCards size={22} /><div><small>RECEBIMENTO</small><h2>Conta para saque</h2><p>A chave Pix precisa pertencer ao titular cadastrado acima.</p></div></div>
                  <div className="field-grid">
                    <label><span>Nome do titular</span><input name="holderName" defaultValue={finance?.holder_name ?? profile?.full_name ?? ""} placeholder="Titular da chave" required /></label>
                    <label><span>Tipo da chave</span><select name="pixKeyType" defaultValue={finance?.pix_key_type ?? "cpf"}><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="phone">Telefone</option><option value="random">Chave aleatória</option></select></label>
                    <label className="full"><span>Chave Pix</span><input name="pixKey" defaultValue={finance?.pix_key ?? ""} placeholder="Digite a chave sem espaços" required /></label>
                  </div>
                  <div className="onboarding-submit-row">
                    <div className="privacy-row"><ShieldCheck size={19} /><span><strong>Resumo do saque</strong>Taxa fixa de R$ 3,50 descontada do valor solicitado.</span></div>
                    <button className="circus-submit">Enviar para análise <ArrowRight size={16} /></button>
                  </div>
                </div>
              </section>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
