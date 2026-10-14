import "./legacy.css";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
