/* SwingMom · Laboratorio (robots, pruebas de 5 años, salud del sistema). Depende de index.html: S, sb, app, $, esc, money, render. */
const ESQ=window.SM_ESQ||[],DEF=Object.fromEntries(ESQ.map(p=>[p.clave,p.defecto]));
const VER={MUESTRA_INSUFICIENTE:['Muestra insuficiente',''],EN_OBSERVACION:['En observación','ac'],ELEGIBLE_PARA_REAL:['Elegible para real','ok'],SIN_VENTAJA_DEMOSTRADA:['Sin ventaja demostrada','warn'],DESCARTAR:['Descartar','bad']};
const fr=x=>x==null?'—':(x>0?'+':'')+Number(x).toFixed(2)+'R';
const fp=x=>x==null?'—':(x>0?'+':'')+Number(x).toFixed(1)+'%';
const fw=x=>x==null?'—':Math.round(x*100)+'%';
const fm=d=>d?new Date(d).toLocaleString('es-MX',{timeZone:'America/Tijuana',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
const fd=d=>d?new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'}):'—';
const L=S.lab={vista:'robots',robot:null,sol:null,borr:null,base:'',nombre:'',padre:null,aviso:null,eq:[],aud:[],runs:[],pruebas:[],detSol:null,rech:null};
const BAD='background:var(--badbg);color:var(--bad)';
function toast(m,bad){L.aviso={m,bad};render();setTimeout(()=>{L.aviso=null;if(S.tab==='lab')render()},5000)}
const pillV=c=>{const v=VER[c]||[c||'—',''];return`<span class="pill ${v[1]}">${v[0]}</span>`};
function valTxt(p,v){if(v==null)return'—';if(p.tipo==='bool')return v?'Sí':'No';if(Array.isArray(v))return v.length?v.join(', '):'—';return String(v)}
function descRegla(r){const full={...DEF,...(r||{})};const out=[];ESQ.forEach(p=>{if(JSON.stringify(full[p.clave])!==JSON.stringify(p.defecto)||['clase_min','riesgo_pct','salida','max_posiciones','max_por_sector'].includes(p.clave))out.push([p.grupo,p.etiqueta,valTxt(p,full[p.clave])])});return out}

async function cargarLab(){
 const q=(t,f)=>f(sb.from(t)).then(r=>r.data||[]).catch(()=>[]);
 const[eq,aud,runs,pr,ops]=await Promise.all([
  q('sm_robot_equity',t=>t.select('robot_id,fecha,equity').order('fecha').limit(8000)),
  q('sm_auditorias',t=>t.select('robot_id,fecha,codigo,notas,stats').order('fecha',{ascending:false}).limit(400)),
  q('sm_runs',t=>t.select('id,creado_en,tipo,nivel,checks,resumen,duracion_s').order('creado_en',{ascending:false}).limit(30)),
  q('sm_lab',t=>t.select('id,creado_en,nombre,estado,grilla,error,terminado_en').order('creado_en',{ascending:false}).limit(25)),
  q('sm_robot_operaciones',t=>t.select('robot_id,ticker,estado,resultado_r,abierta_en,cerrada_en,motivo,entrada,stop,acciones,pnl_usd,clase,senal_id').order('abierta_en',{ascending:false}).limit(1500))]);
 L.eq=eq;L.aud=aud;L.runs=runs;L.pruebas=pr;S.ops=ops}
const audDe=id=>L.aud.find(a=>a.robot_id===id);
const eqDe=id=>L.eq.filter(e=>e.robot_id===id);

function chart(cv,pts,base,fmt){if(!cv||!pts||pts.length<2)return;const dpr=devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
 const cs=getComputedStyle(document.documentElement),ac=cs.getPropertyValue('--ac').trim(),tx2=cs.getPropertyValue('--tx2').trim(),line=cs.getPropertyValue('--line').trim();
 const v=pts.map(p=>p[1]);let mn=Math.min(...v),mx=Math.max(...v);if(base!=null){mn=Math.min(mn,base);mx=Math.max(mx,base)}const pad=(mx-mn)*.12||1;mn-=pad;mx+=pad;
 const X=i=>8+i*(W-16)/(pts.length-1),Y=y=>H-22-(y-mn)/(mx-mn)*(H-34);
 if(base!=null){x.strokeStyle=line;x.setLineDash([4,4]);x.beginPath();x.moveTo(8,Y(base));x.lineTo(W-8,Y(base));x.stroke();x.setLineDash([])}
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,ac+'44');g.addColorStop(1,ac+'00');
 x.beginPath();pts.forEach((p,i)=>i?x.lineTo(X(i),Y(p[1])):x.moveTo(X(i),Y(p[1])));x.strokeStyle=ac;x.lineWidth=2;x.lineJoin='round';x.stroke();
 x.lineTo(X(pts.length-1),H-22);x.lineTo(X(0),H-22);x.closePath();x.fillStyle=g;x.fill();
 x.fillStyle=tx2;x.font='11px -apple-system,system-ui';x.textAlign='left';x.fillText(fd(pts[0][0]),8,H-6);x.textAlign='right';x.fillText(fd(pts[pts.length-1][0]),W-8,H-6);
 x.fillStyle=ac;x.font='600 12px -apple-system,system-ui';x.fillText((fmt||(a=>a))(v[v.length-1]),W-8,Y(v[v.length-1])-8)}
const usd=v=>'$'+Math.round(v).toLocaleString('en-US');

function metr(e){if(!e)return'<div class="pad muted">Sin datos.</div>';return[['Operaciones cerradas',e.n],['Esperanza por operación',fr(e.esperanza_r)],['Intervalo de confianza 95%',e.ic95_bajo==null?'—':fr(e.ic95_bajo)+' a '+fr(e.ic95_alto)],['Aciertos',fw(e.win_rate)],['Factor de beneficio',e.factor_beneficio==null?'—':e.factor_beneficio],['SQN',e.sqn==null?'—':e.sqn],['Caída máxima (en R)',e.max_dd_r==null?'—':e.max_dd_r+'R']].map(([k,v])=>`<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}

function seg(){return`<div class="seg">${[['robots','Robots'],['probar','Probar'],['salud','Salud']].map(([k,l])=>`<button data-v="${k}" class="${L.vista===k?'on':''}">${l}</button>`).join('')}</div>`}
function bindSeg(){app.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{L.vista=b.dataset.v;L.robot=null;L.sol=null;render()})}
const avisoHtml=()=>L.aviso?`<div class="aviso" style="${L.aviso.bad?BAD:''}">${esc(L.aviso.m)}</div>`:'';

function lab(){
 if(L.robot)return robotDetalle();if(L.sol)return resultado();
 const head=`<div class="sub">Dinero de PAPEL (simulado) · robots, pruebas de 5 años y salud del sistema</div><h1>Laboratorio</h1>${avisoHtml()}${seg()}`;
 if(L.vista==='probar')return probar(head);if(L.vista==='salud')return salud(head);
 const act=S.robots.filter(r=>r.estado!=='retirado');const k=act.length;
 const filas=act.map(r=>{const a=audDe(r.id),st=a?.stats||{},e=st.r||{},q=st.equity||{};return{r,e,q,cod:a?.codigo,ab:st.abiertas||0}}).sort((x,y)=>(y.q.retorno_pct??-99)-(x.q.retorno_pct??-99));
 app.innerHTML=head+`<div class="card">${filas.map(({r,e,q,cod,ab})=>`<div class="item" data-id="${r.id}"><div class="grow"><div class="t">${esc(r.nombre)}${r.estado!=='simulando'?`<span class="pill">${esc(r.estado)}</span>`:''}</div><div class="s">${e.n??0} cerradas · ${ab} abiertas · ${fr(e.esperanza_r)}${e.ic95_bajo!=null?' ('+fr(e.ic95_bajo)+' a '+fr(e.ic95_alto)+')':''}</div></div><div class="r"><div class="t ${(q.retorno_pct||0)>=0?'up':'dn'}">${fp(q.retorno_pct)}</div><div>${pillV(cod)}</div></div></div>`).join('')||'<div class="pad muted">Aún no hay robots. Crea uno en “Probar”.</div>'}</div>
 <p class="muted" style="padding:0 4px">Los robots operan solos con cada escaneo (12:30 PM Tijuana). Con ${k} robots comparados, los intervalos ya se corrigen por selección: ninguno cuenta como “el mejor” hasta tener ≥100 operaciones. Pasar un robot a cuenta real siempre requiere tu aprobación (D-007).</p>`;
 bindSeg();app.querySelectorAll('.item[data-id]').forEach(e=>e.onclick=()=>{L.robot=e.dataset.id;L.rech=null;render()})}

async function robotDetalle(){
 const r=S.robots.find(x=>x.id===L.robot);if(!r){L.robot=null;return lab()}
 const a=audDe(r.id),st=a?.stats||{},e=st.r||{},q=st.equity||{},ops=S.ops.filter(o=>o.robot_id===r.id);
 const reg=descRegla(r.reglas);const grupos=[...new Set(reg.map(x=>x[0]))];
 app.innerHTML=`<button class="back" id="bk">‹ Laboratorio</button>${avisoHtml()}<h1>${esc(r.nombre)}</h1><div class="sub">${esc(r.descripcion||'')} · desde ${fd(r.inicio)}</div>
 <div style="margin:12px 0">${pillV(a?.codigo)}<span class="pill">${esc(r.estado)}</span></div>
 ${a?`<div class="card pad"><p class="muted" style="margin:0">${esc(a.notas||'')}</p></div>`:''}
 <div class="card"><canvas id="cv" style="height:170px"></canvas></div>
 <div class="card">${metr(e)}<div class="row"><span class="k">Rendimiento / caída máx. (capital)</span><span class="v">${fp(q.retorno_pct)} / ${q.max_dd_pct==null?'—':q.max_dd_pct+'%'}</span></div></div>
 <h2>Cómo opera</h2><div class="card">${grupos.map(g=>`<div class="pad" style="padding-bottom:4px"><div class="sub" style="font-weight:700">${g}</div></div>${reg.filter(x=>x[0]===g).map(x=>`<div class="row"><span class="k">${esc(x[1])}</span><span class="v" style="font-size:15px">${esc(x[2])}</span></div>`).join('')}`).join('')}</div>
 <h2>Operaciones</h2><div class="card">${ops.slice(0,40).map(o=>`<div class="item" style="cursor:default;min-height:56px"><div class="grow"><div class="t">${esc(o.ticker)}<span class="pill ${o.estado==='abierta'?'ac':''}">${o.estado==='abierta'?'abierta':esc(o.motivo||'')}</span></div><div class="s">${fd(o.abierta_en)}${o.cerrada_en?' → '+fd(o.cerrada_en):''} · ${o.acciones} acc. @ ${money(o.entrada)}</div></div><div class="r"><div class="t ${o.resultado_r>=0?'up':'dn'}">${fr(o.resultado_r)}</div><div class="s">${o.pnl_usd>=0?'+':''}${money(o.pnl_usd)}</div></div></div>`).join('')||'<div class="pad muted">Todavía no ha tomado ninguna operación.</div>'}</div>
 <h2>Por qué no entró</h2><div class="card" id="rech"><div class="pad muted">Cargando…</div></div>
 <button class="btn" id="cl">Clonar y editar</button>
 <button class="btn sec" id="pa">${r.estado==='simulando'?'Pausar':'Reanudar'}</button>
 <button class="btn sec" id="rt" style="${BAD}">Retirar robot</button>
 <p class="muted" style="padding:0 4px">Las reglas de un robot no se editan en caliente (rompería su historial y su auditoría): se clona, se cambia lo que quieras y nace un robot nuevo que parte de hoy.</p>`;
 $('#bk').onclick=()=>{L.robot=null;render()};
 chart($('#cv'),eqDe(r.id).map(p=>[p.fecha,Number(p.equity)]),Number((r.reglas||{}).capital_ini||DEF.capital_ini),usd);
 $('#cl').onclick=()=>{L.borr={...DEF,...(r.reglas||{})};L.base=r.id;L.nombre=r.nombre+' (v2)';L.padre=r.id;L.vista='probar';L.robot=null;render()};
 $('#pa').onclick=async()=>{const n=r.estado==='simulando'?'pausado':'simulando';const{error}=await sb.from('sm_robots').update({estado:n,actualizado:new Date().toISOString()}).eq('id',r.id);if(error)return toast(error.message,1);r.estado=n;render()};
 $('#rt').onclick=async()=>{if(!confirm('¿Retirar este robot? Su historial se conserva, pero deja de simular.'))return;const{error}=await sb.from('sm_robots').update({estado:'retirado',actualizado:new Date().toISOString()}).eq('id',r.id);if(error)return toast(error.message,1);r.estado='retirado';L.robot=null;render()};
 if(!L.rech||L.rech.id!==r.id){const{data}=await sb.from('sm_robot_rechazos').select('motivo').eq('robot_id',r.id).limit(2000);const c={};(data||[]).forEach(x=>{const k=(x.motivo||'').replace(/^filtro: /,'').replace(/\d+(\.\d+)?/g,'#').slice(0,50);c[k]=(c[k]||0)+1});L.rech={id:r.id,c}}
 const el=$('#rech');if(el&&L.robot===r.id){const t=Object.entries(L.rech.c).sort((a,b)=>b[1]-a[1]).slice(0,6);el.innerHTML=t.length?t.map(([k,n])=>`<div class="row"><span class="k" style="font-size:14px">${esc(k)}</span><span class="v">${n}</span></div>`).join(''):'<div class="pad muted">Ninguna señal rechazada todavía.</div>'}}

/* ───────── Probar: editor abierto de parámetros ───────── */
function parseV(p,v){if(p.tipo==='bool')return v==='1';if(p.tipo==='opcion')return v;if(p.tipo==='lista_int')return v.split(',').map(x=>parseInt(x)).filter(x=>!isNaN(x));if(p.tipo==='lista_txt')return v.split(',').map(x=>x.trim()).filter(Boolean);if(v.trim()==='')return null;return p.tipo==='int'?parseInt(v):Number(v)}
function validar(b){const er=[];ESQ.forEach(p=>{const v=b[p.clave];if(v==null){if(!p.nulo)er.push(p.etiqueta+': no puede quedar vacío');return}if(p.tipo==='num'||p.tipo==='int'){if(isNaN(v))er.push(p.etiqueta+': número inválido');else if((p.min!=null&&v<p.min)||(p.max!=null&&v>p.max))er.push(`${p.etiqueta}: debe estar entre ${p.min} y ${p.max}`)}if(p.tipo==='lista_int'&&(!v.length||v.some(x=>x<p.min||x>p.max)))er.push(p.etiqueta+': usa tiers entre 1 y 5')});if(b.score_min!=null&&b.score_max!=null&&b.score_min>b.score_max)er.push('Puntaje mínimo mayor que el máximo');return er}
function campo(p){const v=L.borr[p.clave];let c;
 if(p.tipo==='opcion')c=`<select data-k="${p.clave}">${p.opciones.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
 else if(p.tipo==='bool')c=`<select data-k="${p.clave}"><option value="1" ${v?'selected':''}>Sí</option><option value="0" ${!v?'selected':''}>No</option></select>`;
 else if(p.tipo==='lista_int'||p.tipo==='lista_txt')c=`<input data-k="${p.clave}" value="${esc((v||[]).join(', '))}" placeholder="separados por coma">`;
 else c=`<input data-k="${p.clave}" type="number" step="any" inputmode="decimal" value="${v==null?'':v}" placeholder="${p.nulo?'vacío = sin límite':''}">`;
 return`<div class="pad" style="padding:10px 16px;border-bottom:1px solid var(--line)"><div class="t" style="font-size:15px">${esc(p.etiqueta)}</div><div class="s">${esc(p.ayuda||'')}</div>${c}</div>`}
const errHtml=er=>er.length?`<div class="aviso" style="${BAD}">${er.map(esc).join('<br>')}</div>`:'';
function probar(head){
 if(!L.borr){L.borr={...DEF};L.base='';L.nombre=''}
 const grupos=[...new Set(ESQ.map(p=>p.grupo))];
 const opts=['',...ESQ.filter(p=>p.tipo!=='lista_txt').map(p=>p.clave)];
 const sel=(id,ph)=>`<select id="${id}">${opts.map(k=>`<option value="${k}">${k?esc(ESQ.find(p=>p.clave===k).etiqueta):ph}</option>`).join('')}</select>`;
 app.innerHTML=head+`<div class="card pad"><div class="sub" style="font-weight:600">Partir de</div><select id="base"><option value="">Valores de fábrica</option>${S.robots.map(r=>`<option value="${r.id}" ${L.base===r.id?'selected':''}>${esc(r.nombre)}</option>`).join('')}</select>
 <input id="nm" placeholder="Nombre (para la prueba o el robot)" value="${esc(L.nombre)}"></div>
 ${grupos.map((g,i)=>`<details class="card" ${i<1?'open':''}><summary style="padding:14px 16px;font-weight:700;font-size:16px;cursor:pointer">${g}</summary>${ESQ.filter(p=>p.grupo===g).map(campo).join('')}</details>`).join('')}
 <div id="errs"></div>
 <button class="btn" id="go">Probar en 5 años</button>
 <button class="btn sec" id="mk">Crear robot en vivo con estas reglas</button>
 <h2>Comparar variaciones</h2><div class="card pad"><p class="muted" style="margin:0 0 6px">Prueba varios valores de uno o dos parámetros a la vez (máx. 300 combinaciones). Cada combinación probada sube el listón: los resultados se corrigen por el total de pruebas hechas.</p>
 ${sel('g1','Parámetro 1…')}<input id="v1" placeholder="Valores, p. ej. 1, 1.5, 2">${sel('g2','Parámetro 2 (opcional)…')}<input id="v2" placeholder="Valores del parámetro 2">
 <button class="btn sec" id="gg">Probar variaciones</button></div>
 <h2>Pruebas anteriores</h2><div class="card">${L.pruebas.map(s=>`<div class="item" data-s="${s.id}"><div class="grow"><div class="t">${esc(s.nombre||'Prueba')}</div><div class="s">${fm(s.creado_en)}${s.grilla?' · variaciones':''}</div></div><span class="pill ${({listo:'ok',error:'bad',corriendo:'ac',pendiente:'warn'})[s.estado]}">${s.estado}</span></div>`).join('')||'<div class="pad muted">Aún no has pedido ninguna prueba.</div>'}</div>
 <p class="muted" style="padding:0 4px">Las pruebas se procesan en la nube: normalmente en unas horas o con el siguiente escaneo (12:30 PM Tijuana). Usan 5 años de historia congelada, con validación fuera de muestra.</p>`;
 bindSeg();
 $('#base').onchange=e=>{const r=S.robots.find(x=>x.id===e.target.value);L.base=e.target.value;L.borr=r?{...DEF,...(r.reglas||{})}:{...DEF};if(r)L.nombre=r.nombre+' (prueba)';L.padre=r?r.id:null;render()};
 $('#nm').oninput=e=>L.nombre=e.target.value;
 app.querySelectorAll('[data-k]').forEach(el=>el.onchange=()=>{const p=ESQ.find(x=>x.clave===el.dataset.k);L.borr[p.clave]=parseV(p,el.value);$('#errs').innerHTML=errHtml(validar(L.borr))});
 const pedir=async grilla=>{const er=validar(L.borr);if(er.length){$('#errs').innerHTML=errHtml(er);return}
  const{error}=await sb.from('sm_lab').insert({nombre:L.nombre||'Prueba '+new Date().toLocaleDateString('es-MX'),reglas:L.borr,grilla:grilla||null});if(error)return toast(error.message,1);await cargarLab();toast('Prueba en cola. Se procesa en la nube; vuelve a abrir esta pantalla en un rato.')};
 $('#go').onclick=()=>pedir(null);
 $('#gg').onclick=()=>{const k1=$('#g1').value,k2=$('#g2').value;if(!k1)return toast('Elige al menos el parámetro 1.',1);const lee=(k,s)=>{const p=ESQ.find(x=>x.clave===k);return s.split(',').map(x=>x.trim()).filter(x=>x!=='').map(x=>p.tipo==='bool'?(x==='1'||/^s/i.test(x)):(p.tipo==='opcion'?x:Number(x)))};const g={};g[k1]=lee(k1,$('#v1').value);if(k2&&k2!==k1)g[k2]=lee(k2,$('#v2').value);if(!Object.values(g).every(v=>v.length))return toast('Escribe valores para cada parámetro.',1);const n=Object.values(g).reduce((a,v)=>a*v.length,1);if(n>300)return toast(`Son ${n} combinaciones; el máximo es 300.`,1);pedir(g)};
 $('#mk').onclick=()=>crearRobot(L.borr,L.nombre,L.padre);
 app.querySelectorAll('.item[data-s]').forEach(e=>e.onclick=()=>{L.sol=e.dataset.s;L.detSol=null;render()})}

async function crearRobot(reglas,nombre,padre,desc){
 const er=validar({...DEF,...reglas});if(er.length)return toast(er[0],1);
 const nm=prompt('Nombre del robot:',nombre||'Robot nuevo');if(!nm)return;
 const hoy=confirm('¿Que empiece hoy? (Aceptar = desde hoy, recomendado.)\n\nCancelar = retroactivo desde el primer registro de señales: ojo, ya conoces esos resultados, así que no cuenta como prueba limpia.');
 let inicio=new Date().toLocaleDateString('en-CA',{timeZone:'America/Tijuana'});
 if(!hoy){const{data}=await sb.from('sm_senales').select('fecha').order('fecha').limit(1);if(data?.[0])inicio=data[0].fecha}
 const{data:cu}=await sb.from('sm_cuentas_sim').select('id').order('creado_en').limit(1);
 const{error}=await sb.from('sm_robots').insert({cuenta_id:cu?.[0]?.id,nombre:nm,descripcion:desc||'Creado en el laboratorio',reglas,estado:'simulando',inicio,padre_id:padre||null});
 if(error)return toast(error.message,1);
 const{data}=await sb.from('sm_robots').select('*').order('creado_en');S.robots=data||[];L.vista='robots';L.sol=null;toast('Robot creado. Empezará a operar con el siguiente escaneo.')}

/* ───────── Resultado de una prueba ───────── */
const ETQ_SEG={tier:'Tier',pos52:'Posición en rango 52s',rs:'RS',score:'Puntaje',sector:'Sector',earnings:'Earnings',mercado:'Mercado',dia_de_senal:'Día de la señal'};
function filtroDe(dim,etq){const m={};const n=s=>parseFloat(String(s).replace(/[^\d.]/g,''));
 if(dim==='tier'){m.tiers=[parseInt(etq.slice(1))];return m}
 if(dim==='mercado'&&etq==='favorable'){m.solo_mercado_ok=true;return m}
 if(dim==='earnings'&&etq.startsWith('>45')){m.excluir_earnings_dias=45;return m}
 const K={pos52:['pos52_min','pos52_max'],score:['score_min','score_max'],rs:['rs_min',null]}[dim];if(!K)return null;
 if(etq.startsWith('<')){if(!K[1])return null;m[K[1]]=n(etq)}else if(etq.startsWith('≥'))m[K[0]]=n(etq);else if(etq.includes('-')){const[a,b]=etq.split('-').map(Number);m[K[0]]=a;if(K[1])m[K[1]]=b}else return null;return m}
async function resultado(){
 const volver=()=>{L.sol=null;render()};
 if(!L.detSol||L.detSol.id!==L.sol){app.innerHTML='<button class="back" id="bk">‹ Laboratorio</button><p class="muted">Cargando…</p>';$('#bk').onclick=volver;const{data}=await sb.from('sm_lab').select('*').eq('id',L.sol).limit(1);L.detSol=data?.[0]||{id:L.sol,estado:'error',error:'No se encontró la prueba'}}
 const s=L.detSol;const head=`<button class="back" id="bk">‹ Laboratorio</button>${avisoHtml()}<h1>${esc(s.nombre||'Prueba')}</h1><div class="sub">${fm(s.creado_en)}</div>`;
 const fin=()=>{$('#bk').onclick=volver};
 if(s.estado!=='listo'){app.innerHTML=head+`<div class="card pad"><span class="pill ${s.estado==='error'?'bad':'warn'}">${s.estado}</span><p class="muted">${s.estado==='error'?esc(s.error||''):'Aún se está procesando en la nube (se revisa cada pocas horas y en cada escaneo diario).'}</p></div>`;return fin()}
 const o=s.resultado,rs=o.resultados||[],uno=rs.length===1&&!s.grilla;
 if(!uno){const ok=rs.filter(r=>!r.error);
  app.innerHTML=head+`<div class="card pad"><p class="muted" style="margin:0">${o.n_configs} combinaciones · ordenadas por esperanza <b>fuera de muestra</b> (último 40% del tiempo). Pruebas acumuladas: ${o.k_total}. ${esc(o.nota||'')}</p></div>
  <div class="card">${ok.map((r,i)=>{const e=r.fuera_de_muestra,m=r.muestra,c=r.completo,aj=r.fuera_de_muestra_ajustado;return`<div class="item" data-i="${i}" style="min-height:76px"><div class="grow"><div class="t" style="font-size:15px">${Object.entries(r.variacion||{}).map(([k,v])=>`${esc((ESQ.find(p=>p.clave===k)||{}).etiqueta||k)}: ${esc(String(v))}`).join(' · ')}${r.candidata?'<span class="pill ok">candidata</span>':''}</div><div class="s">Fuera de muestra ${fr(e.esperanza_r)} (${e.n}) · muestra ${fr(m.esperanza_r)} (${m.n}) · años + ${r.anios_positivos}</div><div class="s">Rend. ${fp(c.retorno_pct)} · caída ${c.max_dd_pct}% · IC ajustado ${aj.ic95_bajo==null?'—':fr(aj.ic95_bajo)+' a '+fr(aj.ic95_alto)}</div></div></div>`}).join('')}</div>
  <p class="muted" style="padding:0 4px">Toca una fila para crear un robot en vivo con esa combinación o para abrirla en el editor.${rs.some(r=>r.error)?` ${rs.filter(r=>r.error).length} combinación(es) con reglas inválidas se omitieron.`:''}</p>`;fin();
  app.querySelectorAll('.item[data-i]').forEach(e=>e.onclick=()=>{const r=ok[+e.dataset.i];if(confirm('¿Crear un robot en vivo con esta combinación?\n\nAceptar = crear robot (parte de hoy)\nCancelar = abrirla en el editor para ajustarla y volver a probar'))return crearRobot(r.reglas,(s.nombre||'Lab')+' · '+Object.values(r.variacion||{}).join('/'),null,'Candidata del laboratorio');L.borr={...DEF,...r.reglas};L.nombre=(s.nombre||'')+' (detalle)';L.base='';L.padre=null;L.vista='probar';L.sol=null;render()});
  return}
 const r=rs[0];if(r.error){app.innerHTML=head+`<div class="aviso" style="${BAD}">${esc(JSON.stringify(r.error))}</div>`;return fin()}
 const sg=r.segmentos||{},ex=r.excursiones,aj=r.fuera_de_muestra_ajustado;
 app.innerHTML=head+`<div style="margin:12px 0">${pillV(r.veredicto.codigo)}${r.candidata?'<span class="pill ok">candidata a robot en vivo</span>':''}</div>
 <div class="card pad"><p class="muted" style="margin:0">${esc(r.veredicto.texto)} <b>Lo que cuenta es “fuera de muestra”</b>: operaciones del último 40% del tiempo (desde ${fd(r.corte_muestra)}), que la configuración “no vio”. No es prueba de ventaja: es 1 de ${o.k_total} configuraciones probadas hasta hoy.</p></div>
 <h2>Fuera de muestra</h2><div class="card">${metr(r.fuera_de_muestra)}<div class="row"><span class="k">IC 95% corregido por ${o.k_total} pruebas</span><span class="v" style="font-size:15px">${aj.ic95_bajo==null?'—':fr(aj.ic95_bajo)+' a '+fr(aj.ic95_alto)}</span></div></div>
 <h2>En muestra (referencia)</h2><div class="card">${metr(r.muestra)}</div>
 <h2>Capital simulado</h2><div class="card"><canvas id="cv" style="height:170px"></canvas><div class="row"><span class="k">Rendimiento / caída máxima</span><span class="v">${fp(r.completo.retorno_pct)} / ${r.completo.max_dd_pct}%</span></div></div>
 <h2>Por año</h2><div class="card">${Object.entries(r.por_anio).map(([y,v])=>{const w=Math.min(100,Math.abs(v.esperanza_r||0)*60);return`<div class="row"><span class="k" style="width:50px">${y}</span><div style="flex:1;height:8px;background:var(--chip);border-radius:4px;overflow:hidden"><div style="width:${w}%;height:100%;background:var(${(v.esperanza_r||0)>=0?'--ok':'--bad'})"></div></div><span class="v" style="font-size:14px;width:120px;text-align:right">${fr(v.esperanza_r)} · ${v.n} op.</span></div>`}).join('')}</div>
 ${ex?`<h2>Cómo se mueven las operaciones</h2><div class="card pad"><p class="muted" style="margin:0;line-height:1.6">Antes de salir, la mitad de las operaciones llegó a <b>+${ex.mfe_p25_p50_p75[1]}R</b> a su favor. ${ex.mae_ganadoras_p50_p90?`Las ganadoras suelen aguantar un retroceso de <b>${ex.mae_ganadoras_p50_p90[0]}R</b> (90%: ${ex.mae_ganadoras_p50_p90[1]}R) antes de subir: si el stop es más ceñido que eso, las sacudes. `:''}${ex.perdedoras_que_tocaron_1R!=null?`De las perdedoras, <b>${fw(ex.perdedoras_que_tocaron_1R)}</b> llegó antes a +1R y <b>${fw(ex.perdedoras_que_tocaron_1_5R)}</b> a +1.5R: ahí está el dinero que se escapa (idea: salida parcial o breakeven más temprano).`:''}</p></div>`:''}
 <h2>Qué entradas pagan más</h2>${Object.entries(sg).filter(([d])=>d!=='sector').map(([d,f])=>`<div class="card"><div class="pad" style="padding-bottom:4px"><div class="sub" style="font-weight:700">${ETQ_SEG[d]||d}</div></div>${f.map(x=>{const fl=filtroDe(d,x.segmento);return`<div class="row" ${fl?`data-f='${esc(JSON.stringify(fl))}'`:''} style="${fl?'cursor:pointer':''}"><span class="k">${esc(x.segmento)} <span class="s">(${x.n})</span></span><span class="v ${x.esperanza_r>=0?'up':'dn'}" style="font-size:15px">${fr(x.esperanza_r)}${fl?' ›':''}</span></div>`}).join('')}</div>`).join('')}
 <p class="muted" style="padding:0 4px">Toca un segmento con “›” para armar una prueba nueva con ese filtro. Ojo: mirar muchos segmentos y quedarte con el mejor es otra forma de sobreajustar; confirma siempre fuera de muestra y con operaciones en vivo.</p>
 <button class="btn" id="ed">Editar y volver a probar</button><button class="btn sec" id="mk">Crear robot en vivo con estas reglas</button>`;
 fin();chart($('#cv'),(r.equity||[]).map(p=>[p[0],p[1]]),Number((r.reglas||{}).capital_ini||DEF.capital_ini),usd);
 $('#ed').onclick=()=>{L.borr={...DEF,...r.reglas};L.nombre=(s.nombre||'')+' (v2)';L.base='';L.padre=null;L.vista='probar';L.sol=null;render()};
 $('#mk').onclick=()=>crearRobot(r.reglas,(s.nombre||'Lab'),null,'Creado desde una prueba del laboratorio');
 app.querySelectorAll('.row[data-f]').forEach(e=>e.onclick=()=>{L.borr={...DEF,...r.reglas,...JSON.parse(e.dataset.f)};L.nombre=(s.nombre||'')+' + '+e.querySelector('.k').childNodes[0].textContent.trim();L.base='';L.padre=null;L.vista='probar';L.sol=null;render()})}

/* ───────── Salud del sistema ───────── */
const SIC={ok:['✓','ok'],aviso:['!','warn'],error:['✕','bad']};
function salud(head){
 const u=L.runs.find(r=>r.tipo==='diario'),cola=L.pruebas.filter(p=>p.estado==='pendiente'||p.estado==='corriendo').length;
 app.innerHTML=head+(u?`<div class="card pad"><div style="display:flex;align-items:center;gap:14px"><span class="pill ${SIC[u.nivel][1]}" style="font-size:22px;padding:10px 16px;border-radius:999px;margin:0">${SIC[u.nivel][0]}</span><div><div class="t">${u.nivel==='ok'?'Todo en orden':u.nivel==='aviso'?'Hay avisos':'Hay errores'}</div><div class="s">Último escaneo y auditoría: ${fm(u.creado_en)} · ${u.duracion_s}s</div></div></div></div>
 <h2>Chequeos de la última corrida</h2><div class="card">${(u.checks||[]).map(c=>`<div class="item" style="cursor:default;align-items:flex-start"><span class="pill ${SIC[c.nivel][1]}" style="margin:2px 0 0">${SIC[c.nivel][0]}</span><div class="grow"><div class="t" style="font-size:15px">${esc(c.nombre)}</div><div class="s" style="line-height:1.4">${esc(c.detalle)}</div></div></div>`).join('')}</div>
 <h2>Historial</h2><div class="card pad"><div style="display:flex;gap:6px;flex-wrap:wrap">${L.runs.filter(r=>r.tipo==='diario').map(r=>`<span class="pill ${SIC[r.nivel][1]}" style="margin:0;padding:6px 8px">${fd(r.creado_en)} ${SIC[r.nivel][0]}</span>`).join('')}</div></div>`:`<div class="card pad"><p class="muted" style="margin:0">Todavía no hay ninguna auditoría. Se guarda una al final de cada escaneo diario.</p></div>`)+`<div class="card"><div class="row"><span class="k">Pruebas del laboratorio en cola</span><span class="v">${cola}</span></div><div class="row"><span class="k">Robots activos</span><span class="v">${S.robots.filter(r=>r.estado==='simulando').length}</span></div></div>
 <p class="muted" style="padding:0 4px">La auditoría revisa en cada corrida: frescura y cordura de los datos, cobertura del universo, que lo subido coincida con la fuente, niveles de cada señal, y que cada robot respete sus reglas (sin apalancamiento, límites, R recalculado de forma independiente). Si algo falla, el escaneo queda en rojo en GitHub y llega aviso por Telegram si lo activas.</p>`;
 bindSeg()}
function saludPill(){const u=L.runs.find(r=>r.tipo==='diario');if(!u)return'';const m={ok:['Sistema en orden','ok'],aviso:['Sistema con avisos','warn'],error:['Sistema con errores','bad']}[u.nivel];return`<div style="margin:10px 0 0"><span class="pill ${m[1]}" id="sp" style="margin:0;padding:6px 12px;font-size:12px;cursor:pointer">${m[0]} · ${fm(u.creado_en)}</span></div>`}
