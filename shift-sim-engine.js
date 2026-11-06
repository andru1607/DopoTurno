/* DopoTurno Academy v2.4: simulazioni formative, indipendenti dallo Skill Check. */
(function(){
"use strict";
const CASES=Array.isArray(window.DT_SHIFT_CASES)?window.DT_SHIFT_CASES:[];
const ROLES={sala:"Sala",cucina:"Cucina",bar:"Bar"};
const PHASES=["Prima del servizio","Durante il servizio","Chiusura e coordinamento"];
const POS={sala:[[13,24],[33,74],[65,25],[86,70],[53,48]],cucina:[[13,28],[35,76],[62,23],[87,70],[53,49]],bar:[[13,28],[35,76],[62,24],[86,70],[52,48]]};
const ESC=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lookup=id=>CASES.find(c=>c.id===id)||null;
function validate(){
 const ids=new Set();
 if(CASES.length!==18)throw Error("Expected 18 cases");
 for(const c of CASES){
  if(ids.has(c.id)||!/^[SCB]\d{2}$/.test(c.id)||!ROLES[c.role]||!PHASES.includes(c.phase)||c.places.length!==5||c.steps.length!==3||c.debrief.length!==3)throw Error("Invalid case "+c.id);
  ids.add(c.id);
  for(const b of c.steps){
   if(!b.question||!b.setting||b.choices.length!==3||b.choices.filter(x=>x.kind==="strong").length!==1)throw Error("Invalid decision "+c.id);
   for(const a of b.choices)if(!["strong","partial","weak"].includes(a.kind)||!a.label||!a.consequence||!a.explanation||a.critical&&a.kind!=="weak")throw Error("Invalid outcome "+c.id);
  }
 }
 return true;
}
validate();
function ensure(saved){
 if(!saved.shiftSimResults||typeof saved.shiftSimResults!=="object"||Array.isArray(saved.shiftSimResults))saved.shiftSimResults={};
 // Import old single-case drafts without deleting other unfinished scenarios.
 const legacy=validDraft(saved.shiftSimDraft);
 saved.shiftSimDrafts=validDrafts(saved.shiftSimDrafts);
 if(legacy&&legacy.phase!=="finished"&&!saved.shiftSimDrafts[legacy.id])saved.shiftSimDrafts[legacy.id]=legacy;
 saved.shiftSimDraft=legacy&&legacy.phase!=="finished"?legacy:null;
}
function validDraft(raw){
 if(!raw||!lookup(raw.id)||!Array.isArray(raw.choices)||raw.choices.length>3||!Number.isInteger(raw.step)||raw.step<0||raw.step>2||!["question","feedback","finished"].includes(raw.phase))return null;
 if(raw.choices.some(x=>!Number.isInteger(x)||x<0||x>2))return null;
 if(raw.phase==="question"&&raw.choices.length!==raw.step)return null;
 if(raw.phase==="feedback"&&raw.choices.length!==raw.step+1)return null;
 if(raw.phase==="finished"&&raw.choices.length!==3)return null;
 return {id:raw.id,step:raw.step,phase:raw.phase,choices:[...raw.choices]};
}
function score(c,choices){
 const s={strong:0,partial:0,weak:0,critical:0};
 choices.forEach((idx,i)=>{const a=c.steps[i].choices[idx];s[a.kind]++;if(a.critical)s.critical++});
 return s;
}
function validResults(raw){
 const out={};
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return out;
 for(const [id,record] of Object.entries(raw)){
  const c=lookup(id);
  if(!c||!record||!Array.isArray(record.choices)||record.choices.length!==3||record.choices.some(x=>!Number.isInteger(x)||x<0||x>2))continue;
  out[id]={choices:[...record.choices],finishedAt:typeof record.finishedAt==="string"?record.finishedAt.slice(0,40):"",...score(c,record.choices)};
 }
 return out;
}
function validDrafts(raw){
 const out={};
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return out;
 for(const [id,value] of Object.entries(raw)){
  if(!lookup(id))continue;
  const draft=validDraft(value);
  if(draft&&draft.id===id&&draft.phase!=="finished")out[id]=draft;
 }
 return out;
}
function importState(raw){
 const drafts=validDrafts(raw?.shiftSimDrafts);
 const legacy=validDraft(raw?.shiftSimDraft);
 if(legacy&&legacy.phase!=="finished"&&!drafts[legacy.id])drafts[legacy.id]=legacy;
 return {shiftSimResults:validResults(raw?.shiftSimResults),shiftSimDrafts:drafts,shiftSimDraft:legacy&&legacy.phase!=="finished"?legacy:null};
}
function getRun(ctx){
 ensure(ctx.saved);
 const id=ctx.state.shiftSimId;
 if(!lookup(id))return null;
 if(ctx.state.shiftSimRun?.id===id)return ctx.state.shiftSimRun;
 const saved=validDraft(ctx.saved.shiftSimDrafts[id])||((ctx.saved.shiftSimDraft?.id===id)?validDraft(ctx.saved.shiftSimDraft):null);
 const r=saved||{id,step:0,phase:"question",choices:[]};
 ctx.state.shiftSimRun=r;ctx.state.shiftInspect=null;return r;
}
function persist(ctx){
 const r=getRun(ctx);if(!r)return false;
 if(r.phase==="finished"){
  delete ctx.saved.shiftSimDrafts[r.id];
  if(ctx.saved.shiftSimDraft?.id===r.id)ctx.saved.shiftSimDraft=null;
 }else{
  const draft={id:r.id,step:r.step,phase:r.phase,choices:[...r.choices]};
  ctx.saved.shiftSimDrafts[r.id]=draft;
  ctx.saved.shiftSimDraft=draft; // Legacy field for older local backups.
 }
 if(!ctx.save()&&ctx.toast)ctx.toast("Il browser non ha salvato: verifica lo spazio disponibile.");return true;
}
/* The app redraws the current view after a choice. Move keyboard and VoiceOver
 * focus to the new relevant content, instead of leaving it on a removed button.
 * All selectors in this function are authored internally, never user input. */
function focusAfter(ctx,selector,scroll="nearest"){
 const node=ctx.document?.querySelector?.(selector);
 if(!node||typeof node.focus!=="function")return false;
 if(!node.hasAttribute?.("tabindex"))node.setAttribute?.("tabindex","-1");
 try{node.focus({preventScroll:true})}catch{node.focus()}
 if(typeof node.scrollIntoView==="function")node.scrollIntoView({block:scroll,behavior:"auto"});
 return true;
}
function focusControl(ctx,action,id){
 const controls=ctx.document?.querySelectorAll?.('[data-action="'+action+'"]');
 if(!controls)return false;
 const node=Array.from(controls).find(x=>(action==="shiftInspect"?x.dataset?.step:x.dataset?.id)===id);
 if(!node||typeof node.focus!=="function")return false;
 try{node.focus({preventScroll:true})}catch{node.focus()}
 return true;
}
function start(ctx,id,reset=false){
 if(!lookup(id))return false;
 ensure(ctx.saved);
 if(reset){
  delete ctx.saved.shiftSimDrafts[id];
  if(ctx.saved.shiftSimDraft?.id===id)ctx.saved.shiftSimDraft=null;
  if(!ctx.save()&&ctx.toast)ctx.toast("Il browser non ha salvato il riavvio dello scenario.");
 }
 ctx.state.shiftSimId=id;ctx.state.shiftSimRun=null;ctx.state.shiftInspect=null;
 ctx.setPage("shiftSimRun",{shiftSimId:id});focusAfter(ctx,".shift-case-header h1","start");return true;
}
function choose(ctx,index){
 const r=getRun(ctx);
 if(!r||r.phase!=="question"||!Number.isInteger(index)||index<0||index>2||r.choices.length!==r.step)return false;
 r.choices.push(index);r.phase="feedback";persist(ctx);ctx.render();focusAfter(ctx,".shift-feedback","start");return true;
}
function next(ctx){
 const r=getRun(ctx);if(!r||r.phase!=="feedback")return false;
 if(r.step<2){r.step++;r.phase="question";ctx.state.shiftInspect=null;persist(ctx);ctx.render();focusAfter(ctx,".shift-decision h2","start");return true;}
 r.phase="finished";
 ctx.saved.shiftSimResults[r.id]={choices:[...r.choices],finishedAt:new Date().toISOString(),...score(lookup(r.id),r.choices)};
 delete ctx.saved.shiftSimDrafts[r.id];
 if(ctx.saved.shiftSimDraft?.id===r.id)ctx.saved.shiftSimDraft=null;
 if(!ctx.save()&&ctx.toast)ctx.toast("Il risultato non è stato salvato sul dispositivo.");
 ctx.render();focusAfter(ctx,".shift-result h2","start");return true;
}
function forTip(tipId){
 const tip=window.DopoTurnoTips?.TIPS?.find(t=>t.id===tipId);
 if(!tip)return null;
 const pool=CASES.filter(c=>c.role===tip.role);
 const direct=pool.filter(c=>c.tips.includes(tipId));
 if(direct.length)return {case:direct.find(c=>c.phase===tip.stage)||direct[0],exact:true};
 const phase=pool.filter(c=>c.phase===tip.stage);
 return {case:phase[0]||pool[0],exact:false};
}
function diagram(ctx,c,r){
 const active=ctx.state.shiftInspect;
 const current=r.phase==="feedback"?c.steps[r.step].choices[r.choices[r.step]]:null;
 const status=current?(current.critical?"Rischio critico da contenere":current.kind==="strong"?"Flusso sotto controllo":"Servono correzioni"):null;
 return '<div class="shift-map-head"><strong>Schema del reparto</strong><span>Interattivo · non in scala</span></div>'
 +'<div class="shift-map shift-map-'+c.role+'"><span class="shift-map-title">FLUSSO DI SERVIZIO</span>'
 +c.places.map((place,i)=>{const p=POS[c.role][i],label=place.split(":")[0];return '<button type="button" class="shift-pin'+(active===i?' inspected':'')+'" data-action="shiftInspect" data-step="'+i+'" style="--px:'+p[0]+'%;--py:'+p[1]+'%" aria-label="Esamina '+ESC(label)+'" aria-pressed="'+(active===i)+'"><b>'+(i+1)+'</b><span>'+ESC(label)+'</span></button>'}).join("")+'</div>'
 +'<div class="shift-map-note" role="status">'+(active===null?"Seleziona un punto sulla mappa per leggere le informazioni di quella postazione.":'<strong>Postazione '+(active+1)+'</strong> · '+ESC(c.places[active]))+'</div>'
 +(status?'<div class="shift-state '+(current?.critical?"critical":current?.kind||"")+'">'+ESC(status)+'<small> Stato didattico dopo la scelta, non una misura reale dei tempi.</small></div>':'')
 +'<ol class="shift-map-list">'+c.places.map((place,i)=>'<li><strong>'+(i+1)+'</strong> '+ESC(place)+'</li>').join("")+'</ol>';
}
function decision(ctx,c,r){
 const b=c.steps[r.step],selected=r.choices[r.step],review=r.phase==="feedback",chosen=review?b.choices[selected]:null,best=b.choices.find(x=>x.kind==="strong");
 const before=r.step>0?c.steps[r.step-1].choices[r.choices[r.step-1]]:null;
 const branch=b.branches?(before?.kind==="strong"?b.branches.strong:b.branches.other):"";
 return '<section class="shift-decision"><div class="shift-meta"><span>DECISIONE '+(r.step+1)+' / 3</span><span>'+ESC(c.phase)+'</span></div><div class="shift-track"><span style="width:'+((r.step+1)/3*100)+'%"></span></div>'
 +(branch?'<div class="shift-branch"><strong>Come evolve la situazione</strong><p>'+ESC(branch)+'</p></div>':'')
 +'<p class="shift-setting">'+ESC(b.setting)+'</p><h2>'+ESC(b.question)+'</h2>'
 +'<div class="shift-choices" role="group" aria-label="Scegli come intervenire">'+b.choices.map((a,i)=>'<button type="button" data-action="shiftChoose" data-step="'+i+'" class="shift-choice'+(review&&selected===i?' selected':'')+'" aria-pressed="'+(review&&selected===i)+'" '+(review?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+ESC(a.label)+'</button>').join("")+'</div>'
 +(review?'<div role="status" class="shift-feedback '+(chosen.critical?"critical":chosen.kind)+'"><strong>'+(chosen.critical?"Rischio critico nella decisione":chosen.kind==="strong"?"Decisione solida":chosen.kind==="partial"?"Decisione incompleta":"Decisione da correggere")+'</strong><p>'+ESC(chosen.consequence)+'</p><p><strong>Motivazione.</strong> '+ESC(chosen.explanation)+'</p>'+(chosen.kind!=="strong"?'<div class="shift-professional-alternative"><strong>Intervento preferibile:</strong> '+ESC(best.label)+'<span>'+ESC(best.explanation)+'</span></div>':'')+'</div><button class="btn shift-next" data-action="shiftNext">'+(r.step===2?"Apri il debriefing":"Prosegui il servizio")+' →</button>':
 '<p class="shift-neutral">La conseguenza comparirà dopo la tua decisione. Lo Skill Check diagnostico rimane una prova separata e senza aiuti.</p>')+'</section>';
}
function result(ctx,c,r){
 const st=score(c,r.choices);
 const tone=st.critical?"critical":st.strong===3?"strong":"partial";
 const heading=st.critical?"È emerso un rischio critico.":st.strong===3?"Tre decisioni coerenti.":"Ci sono scelte da perfezionare.";
 const detail=st.critical?"Il caso è stato svolto, ma almeno una decisione avrebbe richiesto un blocco o una verifica prima di proseguire.":st.strong===3?"Hai seguito un metodo verificabile in questo scenario. Non equivale a competenza pratica certificata.":"Rileggi i passaggi ed esamina il criterio operativo più solido prima di riprovare.";
 const pool=CASES.filter(item=>item.role===c.role),nextCase=pool[(pool.findIndex(item=>item.id===c.id)+1)%pool.length];
 const reviewTip=c.tips?.find(id=>window.DopoTurnoTips?.TIPS?.some(t=>t.id===id));
 return '<section class="shift-result"><span class="shift-eyebrow">DEBRIEFING FORMATIVO</span><h2>'+heading+'</h2><div class="shift-outcome '+tone+'"><p>'+detail+'</p></div>'
 +'<div class="shift-scores"><span><strong>'+st.strong+'</strong> decisioni solide</span><span><strong>'+st.partial+'</strong> parziali</span><span><strong>'+st.weak+'</strong> da correggere</span>'+(st.critical?'<span><strong>'+st.critical+'</strong> rischi critici</span>':'')+'</div>'
 +r.choices.map((idx,i)=>{const b=c.steps[i],chosen=b.choices[idx],best=b.choices.find(a=>a.kind==="strong");return '<div class="shift-recap"><small>PASSAGGIO '+(i+1)+'</small><h3>'+ESC(b.question)+'</h3><p><strong>La tua decisione:</strong> '+ESC(chosen.label)+'</p><p>'+ESC(chosen.consequence)+'</p><div><strong>Intervento di riferimento:</strong> '+ESC(best.label)+'<p>'+ESC(best.explanation)+'</p></div></div>'}).join("")
 +'<div class="shift-principles"><h3>Da applicare al prossimo turno</h3><ol>'+c.debrief.map(x=>'<li>'+ESC(x)+'</li>').join("")+'</ol></div><div class="shift-actions">'
 +(st.critical||st.strong<3?'<button class="btn" data-action="shiftRetry">Rivedi e riprova</button>':'<button class="btn" data-action="shiftNextCase" data-id="'+nextCase.id+'">Prossimo caso di '+ESC(ROLES[c.role])+'</button>')
 +(st.critical||st.strong<3?'<button class="btn outline" data-action="shiftNextCase" data-id="'+nextCase.id+'">Prossimo caso</button>':'<button class="btn outline" data-action="shiftRetry">Ripeti il caso</button>')
 +(reviewTip?'<button class="btn ghost" data-action="shiftReviewTip" data-id="'+reviewTip+'">Approfondisci la tecnica</button>':'')
 +'<button class="btn ghost" data-page="shiftSimList">Tutti gli scenari</button></div><p class="shift-disclaimer">Esercitazione simulata, non attestazione professionale o formazione obbligatoria.</p></section>';
}
function playPage(ctx){
 const c=lookup(ctx.state.shiftSimId),r=getRun(ctx);
 if(!c||!r)return '<div class="shift-wrap"><p>Simulazione non disponibile.</p><button data-page="shiftSimList">Torna agli scenari</button></div>';
 return '<div class="shift-wrap"><div class="shift-back"><button data-page="shiftSimList">← Tutte le simulazioni</button><button data-page="turnTips">Trucchi del turno</button></div><header class="shift-case-header"><span class="shift-eyebrow">'+ESC(ROLES[c.role])+' · '+ESC(c.phase)+'</span><h1>'+ESC(c.title)+'</h1><p>'+ESC(c.opening)+'</p><div class="shift-goal"><strong>Obiettivo:</strong> '+ESC(c.goal)+'</div></header><div class="shift-layout"><aside class="shift-map-panel">'+diagram(ctx,c,r)+'</aside><div class="shift-play-container">'+ (r.phase==="finished"?result(ctx,c,r):decision(ctx,c,r)) +'</div></div></div>';
}
function catalogPage(ctx){
 ensure(ctx.saved);
 const f=ctx.state.shiftFilters||{role:"tutti",phase:"tutte",query:""},q=String(f.query||"").toLocaleLowerCase("it").trim();
 const list=CASES.filter(c=>(f.role==="tutti"||c.role===f.role)&&(f.phase==="tutte"||c.phase===f.phase));
 const visible=list.filter(c=>!q||[c.title,c.focus,c.opening,c.goal].join(" ").toLocaleLowerCase("it").includes(q));
 const count=Object.keys(validResults(ctx.saved.shiftSimResults)).length;
 return '<div class="shift-wrap"><div class="shift-back"><button data-page="academy">← Academy</button><button data-page="turnTips">Trucchi del turno</button></div><header class="shift-catalog-header"><span class="shift-eyebrow">DOPOTURNO / SIMULAZIONI FORMATIVE</span><h1>Dentro il servizio.</h1><p>18 casi di Sala, Cucina e Bar. Tre decisioni per caso, conseguenze visibili, schemi del reparto e debriefing professionale. Nessuna penalità per chi riprova.</p><div class="shift-numbers"><span><strong>18</strong> scenari</span><span><strong>54</strong> decisioni</span><span><strong>'+count+'</strong> già svolti</span></div></header>'
 +'<section class="shift-filters"><label for="shiftSearch">Cerca una situazione</label><input id="shiftSearch" type="search" maxlength="100" value="'+ESC(f.query||"")+'" placeholder="Allergeni, vassoio, pass, latte, gestione del pienone…"><div class="shift-filter-row">'+[["tutti","Tutti"],["sala","Sala"],["cucina","Cucina"],["bar","Bar"]].map(([id,name])=>'<button type="button" class="'+(f.role===id?"active":"")+'" data-action="shiftRole" data-id="'+id+'" aria-pressed="'+(f.role===id)+'">'+name+'</button>').join("")+'</div><div class="shift-filter-row">'+[["tutte","Tutte le fasi"],...PHASES.map(x=>[x,x])].map(([id,name])=>'<button type="button" class="'+(f.phase===id?"active":"")+'" data-action="shiftPhase" data-id="'+ESC(id)+'" aria-pressed="'+(f.phase===id)+'">'+ESC(name)+'</button>').join("")+'</div><p class="shift-count" role="status">'+visible.length+' scenari trovati</p></section>'
 +'<section class="shift-cards">'+(list.length?list.map(c=>{const done=ctx.saved.shiftSimResults[c.id],draft=!!ctx.saved.shiftSimDrafts[c.id]||ctx.saved.shiftSimDraft?.id===c.id,match=!q||[c.title,c.focus,c.opening,c.goal].join(" ").toLocaleLowerCase("it").includes(q);return '<article class="shift-card" data-case-id="'+c.id+'"'+(match?'':' hidden')+'><small>'+ESC(ROLES[c.role])+' · '+ESC(c.phase)+'</small><h2>'+ESC(c.title)+'</h2><p>'+ESC(c.focus)+'</p><div><span>'+(draft?"In corso":done?"Già svolto":"Tre scelte e debriefing")+'</span><button type="button" data-action="shiftOpen" data-id="'+c.id+'" class="btn outline small">'+(draft?"Riprendi":done?"Ripeti":"Inizia")+'</button></div></article>'}).join(""):'<div class="shift-empty">Nessuno scenario corrisponde a questi filtri.</div>')+'</section><p class="shift-disclaimer">Questi sono esercizi formativi, non test diagnostici. Le procedure aziendali e gli obblighi di sicurezza restano prioritari.</p></div>';
}
function action(ctx,key,el){
 const id=el?.dataset?.id,step=Number(el?.dataset?.step);
 if(key==="shiftOpen")return start(ctx,id);
 if(key==="shiftNextCase"&&lookup(id)&&lookup(id).role===lookup(ctx.state.shiftSimId)?.role)return start(ctx,id);
 if(key==="shiftReviewTip"){
  const c=lookup(ctx.state.shiftSimId),tip=window.DopoTurnoTips?.TIPS?.find(t=>t.id===id&&c?.tips.includes(t.id));
  if(!tip)return false;
  ctx.state.turnTips={role:tip.role,stage:tip.stage,query:"",open:tip.id};
  ctx.setPage("turnTips");return true;
 }
 if(key==="shiftRetry")return start(ctx,ctx.state.shiftSimId,true);
 if(key==="shiftChoose")return choose(ctx,step);
 if(key==="shiftNext")return next(ctx);
 if(key==="shiftInspect"&&Number.isInteger(step)&&step>=0&&step<5){ctx.state.shiftInspect=ctx.state.shiftInspect===step?null:step;ctx.render();focusControl(ctx,"shiftInspect",String(step));return true}
 if(key==="shiftRole"||key==="shiftPhase"){
  const f=ctx.state.shiftFilters||(ctx.state.shiftFilters={role:"tutti",phase:"tutte",query:""});
  if(key==="shiftRole"&&["tutti","sala","cucina","bar"].includes(id))f.role=id;
  else if(key==="shiftPhase"&&["tutte",...PHASES].includes(id))f.phase=id;
  else return false;
  ctx.render();focusControl(ctx,key,id);return true;
 }
 return false;
}
function search(ctx,text){
 const f=ctx.state.shiftFilters||(ctx.state.shiftFilters={role:"tutti",phase:"tutte",query:""});
 f.query=String(text||"").slice(0,100);
 const q=f.query.toLocaleLowerCase("it").trim();
 const cards=ctx.document?.querySelectorAll?.(".shift-card[data-case-id]");
 if(cards){
   let count=0;
   for(const card of cards){
     const c=lookup(card.dataset.caseId);
     const visible=!!c&&(!q||[c.title,c.focus,c.opening,c.goal].join(" ").toLocaleLowerCase("it").includes(q));
     card.hidden=!visible;if(visible)count++;
   }
   const status=ctx.document.querySelector?.(".shift-count");
   if(status)status.textContent=count+" scenari trovati";
   return true;
 }
 ctx.render();return true;
}
window.DopoTurnoShift={CASES,validate,lookup,ensure,score,validDraft,validDrafts,validResults,importState,forTip,getRun,start,choose,next,playPage,catalogPage,action,search};
})();