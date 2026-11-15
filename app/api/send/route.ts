import { NextRequest, NextResponse } from "next/server";
import webpush, { type PushSubscription } from "web-push";
import { z } from "zod";
import { brl } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const saleSchema = z.object({
  id: z.string().uuid(),
  cents: z.number().int().min(1).max(100_000_000),
  kind: z.enum(["approved", "pending"]),
  paymentMethod: z.enum(["pix", "card", "boleto"]),
});

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export async function POST(request: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "As notificações ainda não foram configuradas." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const parsed = saleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados da venda." }, { status: 400 });

  const { id, cents, kind, paymentMethod } = parsed.data;
  const externalReference = `test_${id}`;
  const status = kind === "approved" ? "approved" : "pending";

  const { data: order, error: orderError } = await supabase.from("orders").insert({
    seller_id: user.id,
    gross_cents: cents,
    status,
    external_reference: externalReference,
  }).select("id").single();

  if (orderError || !order) {
    console.error("Failed to create test order", orderError);
    const duplicate = orderError?.code === "23505";
    return NextResponse.json({ error: duplicate ? "Esta venda já foi criada." : "Não foi possível registrar a venda." }, { status: duplicate ? 409 : 500 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    seller_id: user.id,
    provider: "syncpay_test",
    provider_payment_id: externalReference,
    method: paymentMethod,
    gross_cents: cents,
    status,
    paid_at: status === "approved" ? new Date().toISOString() : null,
    provider_payload: { test: true, source: "manual_beta" },
  });

  if (paymentError) {
    console.error("Failed to create test payment", paymentError);
    return NextResponse.json({ error: "A venda foi iniciada, mas não foi possível registrar o pagamento." }, { status: 500 });
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth_key")
    .eq("user_id", user.id);

  if (subscriptionError) {
    console.error("Failed to load push subscriptions", subscriptionError);
    return NextResponse.json({ accepted: 0, failed: 0, saved: true });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:suporte@syncpay.app",
    publicKey,
    privateKey,
  );

  const payload = JSON.stringify({
    kind,
    title: kind === "pending" ? "Venda pendente!" : "Venda aprovada!",
    body: `Valor: ${brl(cents)}`,
    url: "/dashboard",
    tag: `syncpay-sale-${id}`,
  });

  let accepted = 0;
  let failed = 0;
  const expired: string[] = [];

  await Promise.all(((subscriptions ?? []) as StoredSubscription[]).map(async (item) => {
    const subscription: PushSubscription = {
      endpoint: item.endpoint,
      keys: { p256dh: item.p256dh, auth: item.auth_key },
    };
    try {
      await webpush.sendNotification(subscription, payload, { TTL: 60, urgency: "high" });
      accepted += 1;
    } catch (error) {
      failed += 1;
      const statusCode = typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) expired.push(item.endpoint);
      console.error("Push delivery failed", statusCode || error);
    }
  }));

  if (expired.length) {
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id).in("endpoint", expired);
  }

  return NextResponse.json({ accepted, failed, saved: true });
}
