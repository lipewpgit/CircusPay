import { PortalShell } from "@/components/portal-shell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: seller }, { data: admin }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
    supabase.from("seller_accounts").select("status").eq("user_id", user.id).single(),
    supabase.rpc("is_admin"),
  ]);
  return (
    <PortalShell name={profile?.full_name ?? user.email?.split("@")[0] ?? "Conta"} email={user.email ?? ""} status={seller?.status}>
      {admin === true && <a href="/admin" className="admin-shortcut"><ShieldIcon/> Abrir painel administrativo</a>}
      {children}
    </PortalShell>
  );
}

function ShieldIcon() { return <span aria-hidden>◆</span>; }
