import "./legacy.css";
import { requireApprovedSeller } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireApprovedSeller();
  return children;
}
