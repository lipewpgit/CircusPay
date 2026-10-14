import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("net_cents")
    .eq("seller_id", authData.user.id)
    .eq("status", "paid");

  if (error) {
    console.error("Failed to load award progress", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o progresso das premiações." },
      { status: 500 },
    );
  }

  const withdrawnTotal = (data ?? []).reduce(
    (total, withdrawal) => total + Number(withdrawal.net_cents ?? 0),
    0,
  );

  return NextResponse.json(
    { withdrawnTotal },
    { headers: { "Cache-Control": "no-store" } },
  );
}
