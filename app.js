const KEY = 'contiBuste.v1';
const $ = (s) => document.querySelector(s);
const fmt = new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' });
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now();

let state = load();
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {
    accounts:[
      {id:uid(), name:'ING', balance:0},
      {id:uid(), name:'BBVA', balance:0}
    ],
    envelopes:[],
    transactions:[]
  };
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
function money(n){ return fmt.format(Number(n||0)); }
function totalAccounts(){ return state.accounts.reduce((s,a)=>s+Number(a.balance||0),0); }
function allocated(){ return state.envelopes.reduce((s,e)=>s+Number(e.balance||0),0); }
function freeMoney(){ return totalAccounts()-allocated(); }
function byId(arr,id){ return arr.find(x=>x.id===id); }
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }

function render(){
  $('#totalBalance').textContent = money(totalAccounts());
  $('#allocatedBalance').textContent = money(allocated());
  $('#freeBalance').textContent = money(freeMoney());
  $('#freeBalance').classList.toggle('warning', freeMoney() < 0);
  renderAccounts(); renderEnvelopes(); renderTx(); fillSelects();
}

function renderAccounts(){
  const el=$('#accountsList'); el.innerHTML='';
  if(!state.accounts.length){ el.append($('#emptyTpl').content.cloneNode(true)); return; }
  state.accounts.forEach(a=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML=`<div class="item-main"><div class="item-title">${esc(a.name)}</div><div class="item-sub">Conto reale</div></div><div style="display:flex;align-items:center;gap:8px"><div class="item-amount">${money(a.balance)}</div><button class="text-btn" data-edit-account="${a.id}" aria-label="Modifica">✎</button><button class="text-btn" data-del-account="${a.id}" aria-label="Elimina">⌫</button></div>`;
    el.append(row);
  });
}

function renderEnvelopes(){
  const el=$('#envelopesList'); el.innerHTML='';
  if(!state.envelopes.length){ el.append($('#emptyTpl').content.cloneNode(true)); return; }
  state.envelopes.forEach(e=>{
    const card=document.createElement('div'); card.className='envelope-card';
    card.innerHTML=`<div class="env-top"><div><div class="env-name">${esc(e.name)}</div><div class="item-sub">Busta virtuale</div></div><div class="env-icon">${esc(e.icon||'💰')}</div></div><div class="env-money">${money(e.balance)}</div><div class="env-actions"><button class="chip" data-edit-envelope="${e.id}">Modifica</button><button class="chip" data-del-envelope="${e.id}">Elimina</button></div>`;
    el.append(card);
  });
}

function renderTx(){
  const q=$('#searchInput').value.trim().toLowerCase();
  const fa=$('#filterAccount').value; const fe=$('#filterEnvelope').value;
  const txs=[...state.transactions].sort((a,b)=> (b.date+a.createdAt).localeCompare(a.date+a.createdAt)).filter(t=>{
    const matchesQ=!q || t.description.toLowerCase().includes(q);
    return matchesQ && (!fa||t.accountId===fa) && (!fe||t.envelopeId===fe);
  });
  const el=$('#txList'); el.innerHTML='';
  if(!txs.length){ el.append($('#emptyTpl').content.cloneNode(true)); return; }
  txs.forEach(t=>{
    const a=byId(state.accounts,t.accountId); const e=byId(state.envelopes,t.envelopeId);
    const sign=t.type==='expense' ? '-' : '+';
    const row=document.createElement('div'); row.className='item';
    row.innerHTML=`<div class="item-main"><div class="item-title">${esc(t.description)}</div><div class="item-sub">${esc(t.date)} · ${esc(a?.name||'Conto eliminato')}${e?' · '+esc(e.name):''}</div></div><div style="display:flex;align-items:center;gap:8px"><div class="item-amount ${t.type==='expense'?'amount-expense':'amount-income'}">${sign}${money(t.amount)}</div><button class="text-btn" data-del-tx="${t.id}" aria-label="Elimina">⌫</button></div>`;
    el.append(row);
  });
}

function fillSelects(){
  const oldA=$('#filterAccount').value, oldE=$('#filterEnvelope').value;
  $('#filterAccount').innerHTML='<option value="">Tutti i conti</option>'+state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');
  $('#filterEnvelope').innerHTML='<option value="">Tutte le buste</option>'+state.envelopes.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('');
  $('#txAccount').innerHTML=state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');
  $('#txEnvelope').innerHTML='<option value="">Nessuna busta</option>'+state.envelopes.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('');
  if([...$('#filterAccount').options].some(o=>o.value===oldA)) $('#filterAccount').value=oldA;
  if([...$('#filterEnvelope').options].some(o=>o.value===oldE)) $('#filterEnvelope').value=oldE;
}

function openAccount(a=null){
  $('#accountId').value=a?.id||''; $('#accountName').value=a?.name||''; $('#accountBalance').value=a?.balance??''; $('#accountDialog').showModal();
}
function openEnvelope(e=null){
  $('#envelopeId').value=e?.id||''; $('#envelopeName').value=e?.name||''; $('#envelopeBalance').value=e?.balance??''; $('#envelopeIcon').value=e?.icon||'💰'; updateEnvelopeHint(); $('#envelopeDialog').showModal();
}
function updateEnvelopeHint(){
  const id=$('#envelopeId').value; const current=byId(state.envelopes,id)?.balance||0; const proposed=Number($('#envelopeBalance').value||0);
  const futureAllocated=allocated()-Number(current)+proposed; const futureFree=totalAccounts()-futureAllocated;
  $('#envelopeHint').textContent=`Dopo il salvataggio resterebbero ${money(futureFree)} non assegnati.`;
  $('#envelopeHint').classList.toggle('warning', futureFree<0);
}
function openTx(){
  if(!state.accounts.length){ alert('Crea prima almeno un conto.'); return; }
  $('#txDate').value=new Date().toISOString().slice(0,10); $('#txDescription').value=''; $('#txAmount').value=''; $('#txType').value='expense'; $('#txEnvelope').value=''; $('#txDialog').showModal();
}

$('#addAccountBtn').onclick=()=>openAccount(); $('#addEnvelopeBtn').onclick=()=>openEnvelope(); $('#addTxBtn').onclick=openTx;
$('#envelopeBalance').addEventListener('input',updateEnvelopeHint);
$('#searchInput').addEventListener('input',renderTx); $('#filterAccount').addEventListener('change',renderTx); $('#filterEnvelope').addEventListener('change',renderTx);

$('#accountForm').addEventListener('submit',e=>{
  e.preventDefault();
  const id=$('#accountId').value; const name=$('#accountName').value.trim(); const balance=Number($('#accountBalance').value);
  if(!name || Number.isNaN(balance)) return;
  if(id){ const a=byId(state.accounts,id); a.name=name; a.balance=balance; }
  else state.accounts.push({id:uid(),name,balance});
  $('#accountDialog').close(); save();
});

$('#envelopeForm').addEventListener('submit',e=>{
  e.preventDefault();
  const id=$('#envelopeId').value; const name=$('#envelopeName').value.trim(); const balance=Number($('#envelopeBalance').value); const icon=$('#envelopeIcon').value;
  if(!name || Number.isNaN(balance) || balance<0) return;
  const old=byId(state.envelopes,id)?.balance||0; const future=allocated()-Number(old)+balance;
  if(future>totalAccounts() && !confirm(`Stai assegnando più denaro di quanto risulta sui conti (${money(totalAccounts())}). Vuoi continuare?`)) return;
  if(id){ const x=byId(state.envelopes,id); x.name=name; x.balance=balance; x.icon=icon; }
  else state.envelopes.push({id:uid(),name,balance,icon});
  $('#envelopeDialog').close(); save();
});

$('#txForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('#txType').value, date=$('#txDate').value, description=$('#txDescription').value.trim(), amount=Number($('#txAmount').value), accountId=$('#txAccount').value, envelopeId=$('#txEnvelope').value;
  if(!date||!description||!accountId||!amount||amount<=0) return;
  const a=byId(state.accounts,accountId); if(!a) return;
  if(type==='expense'){
    a.balance=Number(a.balance)-amount;
    if(envelopeId){ const env=byId(state.envelopes,envelopeId); if(env) env.balance=Number(env.balance)-amount; }
  }else{
    a.balance=Number(a.balance)+amount;
    if(envelopeId){ const env=byId(state.envelopes,envelopeId); if(env) env.balance=Number(env.balance)+amount; }
  }
  state.transactions.push({id:uid(),type,date,description,amount,accountId,envelopeId,createdAt:new Date().toISOString()});
  $('#txDialog').close(); save();
});

document.body.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.editAccount) openAccount(byId(state.accounts,b.dataset.editAccount));
  if(b.dataset.delAccount){
    const id=b.dataset.delAccount; const used=state.transactions.some(t=>t.accountId===id);
    if(used){ alert('Questo conto ha movimenti associati. Elimina prima i movimenti oppure lascialo nell’elenco.'); return; }
    if(confirm('Eliminare questo conto?')){ state.accounts=state.accounts.filter(a=>a.id!==id); save(); }
  }
  if(b.dataset.editEnvelope) openEnvelope(byId(state.envelopes,b.dataset.editEnvelope));
  if(b.dataset.delEnvelope){
    const id=b.dataset.delEnvelope; const used=state.transactions.some(t=>t.envelopeId===id);
    if(used){ alert('Questa busta ha movimenti associati. Puoi lasciarla a saldo zero oppure eliminare prima i movimenti.'); return; }
    if(confirm('Eliminare questa busta?')){ state.envelopes=state.envelopes.filter(x=>x.id!==id); save(); }
  }
  if(b.dataset.delTx){
    const t=byId(state.transactions,b.dataset.delTx); if(!t) return;
    if(confirm('Eliminare questo movimento e ripristinare i saldi?')){
      const a=byId(state.accounts,t.accountId); const env=byId(state.envelopes,t.envelopeId);
      if(a){ a.balance += t.type==='expense'?Number(t.amount):-Number(t.amount); }
      if(env){ env.balance += t.type==='expense'?Number(t.amount):-Number(t.amount); }
      state.transactions=state.transactions.filter(x=>x.id!==t.id); save();
    }
  }
});

$('#backupBtn').onclick=()=>$('#backupDialog').showModal();
function download(name, content, type){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
$('#exportJson').onclick=()=>download(`conti-buste-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json');
$('#exportCsv').onclick=()=>{
  const rows=[['data','descrizione','tipo','importo','conto','busta'],...state.transactions.map(t=>[t.date,t.description,t.type,t.amount,byId(state.accounts,t.accountId)?.name||'',byId(state.envelopes,t.envelopeId)?.name||''])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); download(`movimenti-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv;charset=utf-8');
};
$('#restoreJsonBtn').onclick=()=>$('#jsonFile').click();
$('#jsonFile').onchange=async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{ const obj=JSON.parse(await f.text()); if(!obj.accounts||!obj.envelopes||!obj.transactions) throw new Error(); if(confirm('Sostituire tutti i dati con questo backup?')){ state=obj; save(); $('#backupDialog').close(); } }catch{ alert('Backup non valido.'); }
  e.target.value='';
};
$('#resetApp').onclick=()=>{ if(confirm('Azzera davvero tutti i dati? Questa operazione non si può annullare senza backup.')){ localStorage.removeItem(KEY); state={accounts:[{id:uid(),name:'ING',balance:0},{id:uid(),name:'BBVA',balance:0}],envelopes:[],transactions:[]}; save(); $('#backupDialog').close(); } };

$('#importCsvBtn').onclick=()=>$('#csvFile').click();
$('#csvFile').onchange=async e=>{
  const f=e.target.files[0]; if(!f) return;
  const text=await f.text(); const lines=text.split(/\r?\n/).filter(Boolean); if(lines.length<2){alert('CSV vuoto o non valido.');return;}
  const parse=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out.map(x=>x.trim());};
  const headers=parse(lines[0]).map(h=>h.toLowerCase());
  const idx=(...names)=>names.map(n=>headers.indexOf(n)).find(i=>i>=0) ?? -1;
  const dI=idx('data','date'); const descI=idx('descrizione','description'); const amountI=idx('importo','amount'); const accI=idx('conto','account'); const envI=idx('busta','envelope','categoria','category'); const typeI=idx('tipo','type');
  if(dI<0||descI<0||amountI<0){alert('Servono almeno le colonne: data, descrizione, importo.');return;}
  let imported=0;
  for(const line of lines.slice(1)){
    const r=parse(line); let amount=Number(String(r[amountI]||'').replace(/\./g,'').replace(',','.')); if(!amount && amount!==0) continue;
    let type=(r[typeI]||'').toLowerCase(); if(type!=='income'&&type!=='entrata'&&type!=='expense'&&type!=='spesa') type=amount<0?'expense':'income';
    type=(type==='income'||type==='entrata')?'income':'expense'; amount=Math.abs(amount);
    let accName=r[accI]||'Importato'; let acc=state.accounts.find(a=>a.name.toLowerCase()===accName.toLowerCase()); if(!acc){acc={id:uid(),name:accName,balance:0};state.accounts.push(acc);}
    let env=null; const envName=r[envI]||''; if(envName){env=state.envelopes.find(x=>x.name.toLowerCase()===envName.toLowerCase());if(!env){env={id:uid(),name:envName,balance:0,icon:'💰'};state.envelopes.push(env);}}
    if(type==='expense'){acc.balance-=amount;if(env)env.balance-=amount;}else{acc.balance+=amount;if(env)env.balance+=amount;}
    state.transactions.push({id:uid(),type,date:r[dI],description:r[descI],amount,accountId:acc.id,envelopeId:env?.id||'',createdAt:new Date().toISOString()}); imported++;
  }
  save(); alert(`Importati ${imported} movimenti.`); e.target.value='';
};

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{})); }
render();
