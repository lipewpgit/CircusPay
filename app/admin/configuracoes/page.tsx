import { ShieldCheck, WalletCards } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export default async function SettingsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: setting } = await supabase.from("platform_settings").select("value,updated_at").eq("key", "withdrawal_fee_cents").single();
  return <><div className="page-heading"><div><span className="eyebrow">SISTEMA</span><h1>Configurações.</h1><p>Parâmetros centrais e proteção da operação.</p></div></div><div className="two-column"><section className="content-card setting-card"><WalletCards size={24}/><div><span>TAXA DE SAQUE</span><strong>R$ {((Number(setting?.value ?? 350))/100).toFixed(2).replace(".", ",")}</strong><p>A taxa é descontada do valor solicitado. Ex.: saque de R$ 100,00 libera R$ 96,50.</p></div></section><section className="content-card setting-card"><ShieldCheck size={24}/><div><span>ACESSO ADMINISTRATIVO</span><strong>Exclusivo</strong><p>O painel usa uma lista privada no banco e não confia em dados editáveis do perfil.</p></div></section></div></>;
}
