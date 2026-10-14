import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function eventStatus(status: string) {
  if (status === "approved") return "payment_confirmed";
  if (status === "pending") return "payment_pending";
  return "payment_failed";
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select("id,gross_cents,status,method,created_at")
    .eq("seller_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Failed to load dashboard", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a dashboard." },
      { status: 500 },
    );
  }

  const rows = payments ?? [];
  const approvedRows = rows.filter((payment) => payment.status === "approved");
  const pendingRows = rows.filter((payment) => payment.status === "pending");
  const refundedRows = rows.filter((payment) =>
    ["refunded", "charged_back"].includes(payment.status),
  );

  const sum = (items: typeof rows) =>
    items.reduce((total, item) => total + Number(item.gross_cents ?? 0), 0);

  const events = rows.map((payment) => ({
    id: payment.id,
    cents: Number(payment.gross_cents ?? 0),
    kind: payment.status === "pending" ? "pending" : "approved",
    status: eventStatus(payment.status),
    accepted: 0,
    failed: 0,
    payment_method: payment.method ?? "pix",
    refunded: ["refunded", "charged_back"].includes(payment.status)
      ? Number(payment.gross_cents ?? 0)
      : 0,
    held: payment.status === "pending" ? Number(payment.gross_cents ?? 0) : 0,
    created_at: payment.created_at,
  }));

  return NextResponse.json(
    {
      events,
      devices: [],
      stats: {
        tests: rows.length,
        total: sum(approvedRows),
        pendingTotal: sum(pendingRows),
        approved: approvedRows.length,
        pending: pendingRows.length,
        refunded: refundedRows.length,
        refundedTotal: sum(refundedRows),
        heldTotal: 0,
        pix: approvedRows.filter((payment) => payment.method === "pix").length,
        card: approvedRows.filter((payment) => payment.method === "card").length,
        boleto: approvedRows.filter((payment) => payment.method === "boleto").length,
        notifications: 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
