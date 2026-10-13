import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
  return <PortalShell admin name={profile?.full_name ?? "Administrador"} email={user.email ?? ""}>{children}</PortalShell>;
}
