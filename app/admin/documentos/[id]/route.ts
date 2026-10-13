import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: document } = await supabase.from("kyc_documents").select("storage_path").eq("id", id).single();
  if (!document) return new NextResponse("Documento não encontrado", { status: 404 });
  const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(document.storage_path, 60);
  if (error || !data) return new NextResponse("Não foi possível abrir o documento", { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
