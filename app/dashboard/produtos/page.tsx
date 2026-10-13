import { Copy, ExternalLink, LockKeyhole, Package } from "lucide-react";
import { createProduct } from "@/app/actions/seller";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/money";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: seller }, { data: products }] = await Promise.all([
    supabase.from("seller_accounts").select("status").eq("user_id", user.id).single(),
    supabase.from("products").select("id,name,price_cents,active,checkout_links(slug)").order("created_at", { ascending: false }),
  ]);
  const approved = seller?.status === "approved";
  return <>
    <div className="page-heading"><div><span className="eyebrow">CATÁLOGO</span><h1>Produtos e checkout.</h1><p>Crie seus produtos e compartilhe o link de pagamento da CircusPay.</p></div></div>
    {query.erro && <div className="banner error">{query.erro}</div>}{query.sucesso && <div className="banner success">{query.sucesso}</div>}
    <div className="two-column">
      <section className={`content-card form-card ${!approved ? "locked-card" : ""}`}>
        {!approved && <div className="locked-layer"><LockKeyhole size={26}/><strong>Disponível após aprovação</strong><p>Envie sua documentação para liberar produtos e checkouts.</p></div>}
        <div className="card-heading"><div><h2>Novo produto</h2><p>Defina o nome e o valor da oferta.</p></div></div>
        <form action={createProduct} className="stack-form"><label><span>Nome do produto</span><input name="name" placeholder="Ex.: Curso Circus" required disabled={!approved}/></label><label><span>Preço</span><div className="money-field"><b>R$</b><input name="price" inputMode="decimal" placeholder="0,00" required disabled={!approved}/></div></label><button className="gold-button" disabled={!approved}>Criar produto e checkout</button></form>
      </section>
      <section className="content-card"><div className="card-heading"><div><h2>Seus produtos</h2><p>{products?.length ?? 0} cadastrado(s)</p></div></div><div className="product-list">{products?.length ? products.map((product) => { const links = product.checkout_links as unknown as Array<{slug:string}>; const slug = links?.[0]?.slug; return <article key={product.id}><span className="product-icon"><Package size={20}/></span><div><strong>{product.name}</strong><small>{brl(Number(product.price_cents))} · {product.active ? "Ativo" : "Pausado"}</small></div>{slug && <div className="row-actions"><button title="Copie pelo endereço do checkout"><Copy size={16}/></button><a href={`/checkout/${slug}`} target="_blank"><ExternalLink size={16}/></a></div>}</article>; }) : <div className="empty-state"><Package size={28}/><strong>Nenhum produto criado</strong><p>Seu primeiro produto aparecerá aqui.</p></div>}</div></section>
    </div>
  </>;
}
