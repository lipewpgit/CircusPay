const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const source = JSON.parse(fs.readFileSync(path.join(__dirname, "legacy-dashboard-source.json"), "utf8"));
let page = zlib.gunzipSync(Buffer.from(source.page, "base64")).toString("utf8");
const css = zlib.gunzipSync(Buffer.from(source.css, "base64"));

function replaceOnce(input, from, to, label) {
  if (!input.includes(from)) {
    throw new Error(`Legacy dashboard patch not found: ${label}`);
  }
  return input.replace(from, to);
}

page = replaceOnce(
  page,
  "ExternalLink} from 'lucide-react';",
  "ExternalLink,LockKeyhole} from 'lucide-react';",
  "award lock icon",
);
page = replaceOnce(
  page,
  "const [refunding,setRefunding]=useState<string|null>(null),[awardIndex,setAwardIndex]=useState(0);",
  "const [refunding,setRefunding]=useState<string|null>(null),[awardIndex,setAwardIndex]=useState(0),[withdrawnTotal,setWithdrawnTotal]=useState(0);",
  "withdrawal progress state",
);
page = replaceOnce(
  page,
  "const award=awards[awardIndex],awardUnlocked=dashboard.stats.total>=award.cents,awardProgress=Math.min(100,Math.round((dashboard.stats.total/award.cents)*100));",
  "const award=awards[awardIndex],awardUnlocked=withdrawnTotal>=award.cents,awardProgress=Math.min(100,Math.round((withdrawnTotal/award.cents)*100));",
  "award progress rule",
);
page = replaceOnce(
  page,
  "const refresh=useCallback(async()=>{try{setDashboard(await api('dashboard'));}catch(e){setNotice({text:(e as Error).message,error:true});}finally{setLoading(false);}},[]);",
  "const refresh=useCallback(async()=>{try{const [nextDashboard,awardData]=await Promise.all([api<Dashboard>('dashboard'),api<{withdrawnTotal:number}>('awards',undefined,'GET')]);setDashboard(nextDashboard);setWithdrawnTotal(awardData.withdrawnTotal||0);}catch(e){setNotice({text:(e as Error).message,error:true});}finally{setLoading(false);}},[]);",
  "award API refresh",
);
page = replaceOnce(
  page,
  `<div className="award-visual unlocked"><img src={award.image} alt={'Placa da premiação '+award.label}/></div><div className="award-progress"><span style={{width:awardProgress+'%'}}/></div><div className="award-meta"><span>{awardUnlocked?'DESBLOQUEADA':'META'}</span><strong>{brl(dashboard.stats.total)} / {award.label}</strong></div>`,
  `<div className="award-visual" style={{position:'relative'}}><img src={award.image} alt={'Placa da premiação '+award.label} style={{filter:awardUnlocked?'none':'brightness(.78) saturate(.75)',transition:'filter .35s ease'}}/>{!awardUnlocked&&<div aria-label="Premiação bloqueada" style={{position:'absolute',inset:0,display:'grid',placeItems:'center',pointerEvents:'none'}}><span style={{width:52,height:52,borderRadius:'50%',display:'grid',placeItems:'center',background:'rgba(8,8,10,.88)',border:'1px solid rgba(214,168,75,.46)',boxShadow:'0 10px 30px rgba(0,0,0,.42)',color:'#d6a84b',backdropFilter:'blur(10px)'}}><LockKeyhole size={21}/></span></div>}</div><div className="award-progress"><span style={{width:awardProgress+'%'}}/></div><div className="award-meta"><span>{awardUnlocked?'DESBLOQUEADA':'SAQUES PAGOS'}</span><strong>{brl(withdrawnTotal)} / {award.label}</strong></div>`,
  "award card",
);
page = replaceOnce(
  page,
  'src="/icon-192.png"',
  'src="/syncpay-logo-192.png"',
  "install modal logo",
);
page = replaceOnce(
  page,
  `        </div>
        
      </>}
      {tab==='transactions'`,
  `        </div>
        <section className="card compact-sale"><div className="compact-sale-head"><div><span className="section-icon"><Plus size={18}/></span><div><h2>Criar nova venda</h2><p>Área compacta para seus testes.</p></div></div><span className="mini-label">TESTE</span></div><div className="compact-sale-form"><label className="compact-amount"><span>R$</span><input id="amount" inputMode="decimal" maxLength={20} value={amount} onChange={e=>setAmount(e.target.value)} aria-label="Valor da venda" autoComplete="off"/></label><div className="type-switch compact-switch"><button className={kind==='approved'?'selected':''} onClick={()=>setKind('approved')}><Check size={16}/>Aprovada</button><button className={kind==='pending'?'selected pending-selected':''} onClick={()=>setKind('pending')}><History size={16}/>Pendente</button></div><div className="payment-switch" aria-label="Meio de pagamento">{[{id:'pix',label:'Pix'},{id:'card',label:'Cartão'},{id:'boleto',label:'Boleto'}].map(method=><button key={method.id} className={paymentMethod===method.id?'selected':''} onClick={()=>setPaymentMethod(method.id)}>{method.label}</button>)}</div><button className="primary compact-send" onClick={send} disabled={busy||loading||!cents}>{busy?<LoaderCircle className="spin" size={18}/>:<Send size={17}/>} {busy?'Enviando…':'Criar venda'}</button></div></section>
      </>}
      {tab==='transactions'`,
  "manual test sale card",
);
page = page
  .replaceAll('/sw.js?v=5', '/sw.js?v=9')
  .replaceAll('/circuspay-mark-transparent.png', '/syncpay-logo.png')
  .replaceAll('/circuspay-original-v5-192.png', '/syncpay-logo-192.png')
  .replaceAll('Circus<span className="brand-pay">Pay</span>', 'Sync <span className="brand-pay">Pay</span>')
  .replaceAll('CIRCUS PAY', 'SYNC PAY')
  .replaceAll('Circus Pay', 'Sync Pay')
  .replaceAll('CircusPay', 'Sync Pay')
  .replaceAll('>CP</span>', '>SP</span>')
  .replaceAll('Ex.: Curso Circus', 'Ex.: Curso Sync');

fs.writeFileSync(path.join(root, "app/dashboard/page.tsx"), page);
fs.writeFileSync(path.join(root, "app/dashboard/legacy.css"), css);
console.log("Sync Pay dashboard restored with production patches.");
