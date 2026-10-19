"use client";

import { useState } from "react";
import { Building2, Fingerprint, LockKeyhole, Mail, Phone, Store, UserRound } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export function SellerSignupForm() {
  const [accountType, setAccountType] = useState<"cpf" | "cnpj">("cpf");
  const isCompany = accountType === "cnpj";

  return (
    <form action={signUp} className="auth-form seller-signup-form">
      <input type="hidden" name="accountType" value={accountType} />
      <fieldset className="account-kind">
        <legend>Como você vai vender?</legend>
        <div>
          <button type="button" aria-pressed={accountType === "cpf"} className={accountType === "cpf" ? "active" : ""} onClick={() => setAccountType("cpf")}><UserRound size={17} /> Pessoa física <small>CPF</small></button>
          <button type="button" aria-pressed={accountType === "cnpj"} className={accountType === "cnpj" ? "active" : ""} onClick={() => setAccountType("cnpj")}><Building2 size={17} /> Pessoa jurídica <small>CNPJ</small></button>
        </div>
      </fieldset>
      <label><span>{isCompany ? "Razão social" : "Nome completo"}</span><div className="field"><UserRound size={18}/><input name="fullName" autoComplete="name" placeholder={isCompany ? "Nome registrado da empresa" : "Seu nome completo"} required /></div></label>
      <label><span>{isCompany ? "CNPJ" : "CPF"}</span><div className="field"><Fingerprint size={18}/><input name="documentNumber" inputMode="numeric" autoComplete="off" placeholder={isCompany ? "00.000.000/0000-00" : "000.000.000-00"} maxLength={18} required /></div><small className="field-help">Este será seu identificador para entrar na CircusPay.</small></label>
      <label><span>Nome da operação</span><div className="field"><Store size={18}/><input name="tradingName" placeholder="Ex.: Minha loja" maxLength={120} required /></div></label>
      <label><span>Telefone</span><div className="field"><Phone size={18}/><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" maxLength={20} required /></div></label>
      <label><span>E-mail</span><div className="field"><Mail size={18}/><input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></div><small className="field-help">Usado para confirmar a conta e recuperar sua senha.</small></label>
      <label><span>Senha</span><div className="field"><LockKeyhole size={18}/><input name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" minLength={8} maxLength={72} required /></div></label>
      <div className="approval-notice"><Fingerprint size={18}/><span>Após confirmar o e-mail e enviar os documentos, sua conta ficará aguardando aprovação da CircusPay.</span></div>
      <PendingSubmitButton idleLabel="Criar minha conta" pendingLabel="Criando sua conta..." />
      <small className="terms">Ao continuar, você confirma que os dados informados são verdadeiros.</small>
    </form>
  );
}
