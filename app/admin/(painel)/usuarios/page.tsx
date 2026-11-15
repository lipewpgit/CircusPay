import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export default async function UsersAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: users } = await supabase.from("profiles").select("user_id,full_name,account_type,document_last4,created_at,seller_accounts(status,trading_name)").order("created_at", { ascending: false }).limit(200);
  return <><div className="page-heading"><div><span className="eyebrow">CONTAS</span><h1>Usuários.</h1><p>Todos os titulares cadastrados na Sync Pay.</p></div></div><section className="content-card"><div className="data-table"><div className="table-row table-head five"><span>Nome</span><span>Tipo</span><span>Documento</span><span>Status</span><span>Cadastro</span></div>{users?.length ? users.map((user) => { const seller = (user.seller_accounts as unknown as Array<{status:string;trading_name:string}>)?.[0]; const displayName = user.full_name === "Administrador CircusPay" ? "Administrador Sync Pay" : user.full_name; return <div className="table-row five" key={user.user_id}><span><strong>{displayName}</strong><small>{seller?.trading_name}</small></span><span>{user.account_type.toUpperCase()}</span><span>•••• {user.document_last4 || "—"}</span><span><b className={`table-status ${seller?.status}`}>{seller?.status ?? "onboarding"}</b></span><span>{new Date(user.created_at).toLocaleDateString("pt-BR")}</span></div>; }) : <div className="empty-state"><Users size={28}/><strong>Nenhum usuário</strong></div>}</div></section></>;
}
