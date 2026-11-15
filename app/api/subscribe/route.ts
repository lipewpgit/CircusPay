import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(16).max(512),
      auth: z.string().min(8).max(512),
    }),
  }),
  label: z.string().trim().min(1).max(40),
});

const deleteSchema = z.object({ endpoint: z.string().url().max(2048) });

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados da notificação inválidos." }, { status: 400 });

  const { endpoint, keys } = parsed.data.subscription;
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth_key: keys.auth,
    label: parsed.data.label,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });

  if (error) {
    console.error("Failed to save push subscription", error);
    return NextResponse.json({ error: "Não foi possível ativar as notificações." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dispositivo inválido." }, { status: 400 });

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", parsed.data.endpoint);

  if (error) return NextResponse.json({ error: "Não foi possível desativar este dispositivo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
