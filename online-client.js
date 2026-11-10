/* DopoTurno 2.9 online client, optional and fail-closed.
   No external dependencies, tokens stay in HttpOnly cookies.
   Local demo data are never published or synced automatically. */
(function(){
 'use strict';
 const data={configured:false,checked:false,user:null,loading:false,error:'',tab:'login',posts:[],comments:[],kind:null,composer:false,replyTo:null,cv:null,grants:[],received:[],snapshot:null,savedAt:null,busy:false,status:''};
 let render=()=>{};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const failure='Operazione non riuscita. Controlla la connessione e riprova.';
 const sanitizeDate=value=>{try{return new Intl.DateTimeFormat('it-IT',{dateStyle:'medium'}).format(new Date(value))}catch{return 'Data non disponibile'}};
 async function request(path,method='GET',body){
  const response=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  let result;
  try{result=await response.json()}catch{result={error:'Risposta non valida dal server.'}}
  if(!response.ok)throw new Error(result.error||failure);
  return result;
 }
 function notify(message){data.status=message;data.error='';render()}
 function warn(message){data.error=message;data.status='';render()}
 function hasUser(){return !!(data.configured&&data.user?.id)}
 async function bootstrap(rerender){
  render=rerender;
  if(typeof fetch!=='function'){data.checked=true;return}
  try{
   const status=await request('status');
   data.configured=!!status.configured;
   if(data.configured){
    const auth=await request('auth');
    data.user=auth.user||null;
   }
  }catch{data.configured=false}
  data.checked=true;render();
  if(hasUser()){await Promise.allSettled([loadThreads('messaggio'),loadCv()])}
 }
 async function loadThreads(kind){
  if(!hasUser())return;
  const selected=kind==='confronto'?'confronto':'messaggio';
  data.loading=true;data.kind=selected;render();
  try{
   const result=await request('community?kind='+encodeURIComponent(selected));
   // Ignore late network results for a different forum tab.
   if(data.kind!==selected)return;
   data.posts=Array.isArray(result.posts)?result.posts:[];
   data.comments=Array.isArray(result.comments)?result.comments:[];
   data.error='';
  }catch(e){data.error=e.message}
  finally{data.loading=false;render()}
 }
 async function loadCv(){
  if(!hasUser())return;
  try{
   const result=await request('cv');
   data.cv=result.profile||null;
   data.grants=Array.isArray(result.grants)?result.grants:[];
   render();
  }catch(e){data.error=e.message;render()}
 }
 function authPanel(){
  if(!data.checked)return '<div class="cloud-panel"><p>Verifica della disponibilità degli account…</p></div>';
  if(!data.configured)return '<div class="cloud-panel"><span class="studio-eyebrow">SERVIZIO ONLINE</span><h2>Accesso online non ancora attivo</h2><p>DopoTurno è ancora disponibile come anteprima locale: puoi studiare, usare la Community dimostrativa ed esportare il tuo backup. Nessun account o invio reale è abilitato finché non viene collegato un database dedicato.</p></div>';
  if(!hasUser()){
   return '<section class="cloud-panel" aria-labelledby="cloudLoginTitle"><span class="studio-eyebrow">DOPOTURNO / ACCOUNT</span><h2 id="cloudLoginTitle">'+(data.tab==='signup'?'Crea il tuo account':'Accedi a DopoTurno')+'</h2><p>L’account abilita le conversazioni condivise e il salvataggio volontario dei progressi. Conferma l’email per completare la registrazione.</p>'
    +'<div class="cloud-tabs"><button type="button" data-action="cloudMode" data-id="login" aria-pressed="'+(data.tab==='login')+'">Accedi</button><button type="button" data-action="cloudMode" data-id="signup" aria-pressed="'+(data.tab==='signup')+'">Registrati</button></div>'
    +'<form class="cloud-auth-form" data-cloud-form="auth" autocomplete="on"><label>Email<input id="cloudEmail" type="email" autocomplete="email" required maxlength="254" placeholder="nome@esempio.it"></label><label>Password<input id="cloudPassword" type="password" autocomplete="'+(data.tab==='signup'?'new-password':'current-password')+'" minlength="10" maxlength="128" required placeholder="Almeno 10 caratteri"></label><button type="submit" class="btn cloud-primary"'+(data.busy?' disabled':'')+'>'+(data.tab==='signup'?'Crea account':'Accedi')+'</button></form>'
    +'<p class="cloud-small">Non pubblicare dati personali di clienti o colleghi. I post online sono leggibili dagli utenti registrati.</p></section>';
  }
  return '<section class="cloud-panel" aria-labelledby="cloudAccountTitle"><span class="studio-eyebrow">ACCOUNT ATTIVO</span><h2 id="cloudAccountTitle">'+esc(data.user.email||'Profilo')+'</h2><p>La Community online è accessibile. Progressi e CV restano privati e sono inviati soltanto quando scegli un’azione esplicita.</p>'
   +'<div class="cloud-actions"><button class="btn cloud-primary" data-page="community">Apri la Community</button><button class="btn outline" data-action="cloudLogout">Esci dall’account</button></div></section>'
   +'<section class="cloud-panel"><span class="studio-eyebrow">SALVATAGGIO VOLONTARIO</span><h3>I tuoi progressi su più dispositivi</h3><p>Puoi salvare una copia del percorso formativo. I messaggi locali e il CV non vengono caricati insieme ai progressi. Il ripristino sostituisce i dati formativi locali solo con conferma.</p>'
   +'<div class="cloud-actions"><button type="button" class="btn cloud-primary" data-action="cloudSaveProgress">Salva progressi online</button><button type="button" class="btn outline" data-action="cloudLoadProgress">Controlla backup online</button>'+(data.snapshot?'<button type="button" class="btn outline" data-action="cloudRestoreProgress">Ripristina questo backup</button>':'')+'</div>'
   +(data.savedAt?'<p class="cloud-small">Ultimo backup online: '+esc(sanitizeDate(data.savedAt))+'</p>':'')+'</section>';
 }
 function compactAccount(){
  return '<section class="card card-pad cloud-profile-entry"><span class="studio-eyebrow">ACCOUNT E SINCRONIZZAZIONE</span><h3>'+(hasUser()?'Account connesso':data.configured?'Accedi per sincronizzare':'Modalità locale')+'</h3><p>'+(hasUser()?'Sincronizza i progressi solo quando lo decidi.':data.configured?'Registrati per accedere alle conversazioni online e ai backup volontari.':'L’account online non è ancora attivo. La tua formazione resta disponibile su questo dispositivo.')+'</p><button type="button" data-page="account" class="btn outline">'+(hasUser()?'Gestisci il mio account':'Stato account online')+'</button></section>';
 }
 function communityPage(kind){
  const isCompare=kind==='confronto',title=isCompare?'Confronti professionali':'Messaggi della Community';
  const nav='<nav class="studio-community-nav" aria-label="Community online"><button type="button" data-page="community"'+(!isCompare?' aria-current="page"':'')+'>Messaggi e commenti</button><button type="button" data-page="confronti"'+(isCompare?' aria-current="page"':'')+'>Confronti professionali</button></nav>';
  if(data.kind!==kind&&!data.loading)Promise.resolve().then(()=>loadThreads(kind));
  const posts=data.kind===kind?data.posts:[];
  const thread=posts.map(p=>{
   const comments=data.comments.filter(c=>c.post_id===p.id),self=p.author_id===data.user?.id;
   return '<article class="cloud-thread"><div class="cloud-thread-top"><span class="cloud-category">'+esc(p.category)+'</span><small>'+esc(sanitizeDate(p.created_at))+'</small></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p><div class="cloud-thread-actions"><button type="button" data-action="cloudReplyToggle" data-id="'+esc(p.id)+'">'+(data.replyTo===p.id?'Chiudi risposte':'Commenti ('+comments.length+')')+'</button>'+(self?'<button type="button" data-action="cloudDeletePost" data-id="'+esc(p.id)+'">Elimina il mio post</button>':'<button type="button" data-action="cloudReportPost" data-id="'+esc(p.id)+'">Segnala</button>')+'</div>'
    +(data.replyTo===p.id?'<div class="cloud-replies">'+comments.map(c=>'<div class="cloud-reply"><span>'+esc(c.author_id===data.user.id?'Tu':'Collega')+' · '+esc(sanitizeDate(c.created_at))+'</span><p>'+esc(c.body)+'</p></div>').join('')+'<label>Scrivi una risposta<textarea id="cloudReplyText" maxlength="1200" rows="3" placeholder="Condividi una risposta pertinente, senza dati personali"></textarea></label><button type="button" class="btn outline" data-action="cloudSendReply" data-id="'+esc(p.id)+'">Invia risposta</button></div>':'')+'</article>';
  }).join('');
  return '<div class="cloud-community">'+nav+'<header class="studio-page-head"><div><span class="studio-eyebrow">COMMUNITY ONLINE / MEMBRI</span><h1>'+title+'</h1><p>Conversazioni vere tra account registrati. Nessun post dimostrativo viene pubblicato automaticamente.</p></div></header>'
   +(data.composer?'<section class="cloud-panel"><h2>Nuova '+(isCompare?'discussione':'conversazione')+'</h2><label>Reparto<select id="cloudCategory"><option value="sala">Sala</option><option value="cucina">Cucina</option><option value="bar">Bar</option><option value="lavoro">Lavoro</option></select></label><label>Titolo<input id="cloudPostTitle" maxlength="120" placeholder="Spiega il tema in almeno 10 caratteri"></label><label>Situazione o domanda<textarea id="cloudPostBody" rows="5" maxlength="2000" placeholder="Almeno 40 caratteri: fatti, dubbi, confronto professionale"></textarea></label><p class="cloud-small">Pubblicando, il contenuto sarà visibile agli altri iscritti. Non inserire nomi, turni riconoscibili o dati di clienti e colleghi.</p><div class="cloud-actions"><button class="btn cloud-primary" data-action="cloudPublish" data-id="'+kind+'">Pubblica per gli iscritti</button><button class="btn outline" data-action="cloudCompose">Annulla</button></div></section>':'<button type="button" class="btn cloud-primary" data-action="cloudCompose">Scrivi '+(isCompare?'un confronto':'un messaggio')+'</button>')
   +(data.loading?'<p>Caricamento conversazioni…</p>':posts.length?'<section class="cloud-thread-list" aria-label="Conversazioni pubblicate">'+thread+'</section>':'<section class="cloud-panel"><h2>Nessun messaggio pubblicato</h2><p>Questa sezione contiene soltanto contenuti reali creati da utenti registrati. Puoi aprire la prima discussione.</p></section>')
   +'<p class="cloud-small">I post sono visibili agli iscritti. Le segnalazioni vengono registrate; la moderazione prima di un lancio pubblico deve essere presidiata.</p></div>';
 }
 function cvPanel(){
  if(!data.configured)return '<section class="cloud-panel cloud-cv-panel"><span class="studio-eyebrow">CURRICULUM ONLINE</span><p>La pubblicazione e la condivisione del CV non sono attive. Il documento qui sopra è salvato soltanto nel browser.</p></section>';
  if(!hasUser())return '<section class="cloud-panel cloud-cv-panel"><span class="studio-eyebrow">CURRICULUM PRIVATO</span><h3>Salvalo nel tuo account</h3><p>Per sincronizzare il curriculum e autorizzarne l’accesso a un destinatario serve un account personale.</p><button type="button" class="btn outline" data-page="account">Accedi o registrati</button></section>';
  const grants=data.grants.filter(x=>!x.revoked_at&&new Date(x.expires_at)>new Date());
  return '<section class="cloud-panel cloud-cv-panel"><span class="studio-eyebrow">CV PRIVATO / ACCOUNT ONLINE</span><h2>Controlla chi può leggerlo</h2><p>Il CV non è pubblico. Prima salva volontariamente una copia online, poi autorizza un indirizzo email preciso. Puoi revocare l’accesso in ogni momento.</p>'
   +'<div class="cloud-actions"><button type="button" data-action="cloudSaveCv" class="btn cloud-primary">Salva questo CV online</button><button type="button" data-action="cloudLoadCv" class="btn outline">Aggiorna autorizzazioni</button></div>'
   +'<div class="cloud-invite"><label>Email del destinatario<input type="email" id="cloudViewerEmail" maxlength="254" placeholder="seleziona@destinatario.it"></label><label>Durata<select id="cloudExpiry"><option value="7">7 giorni</option><option value="30">30 giorni</option><option value="90">90 giorni</option></select></label><button type="button" class="btn outline" data-action="cloudGrantCv">Autorizza questa email</button></div>'
   +'<h3>Autorizzazioni attive ('+grants.length+')</h3>'+(grants.length?'<div class="cloud-grant-list">'+grants.map(g=>'<div class="cloud-grant"><div><strong>'+esc(g.viewer_email)+'</strong><small>Scade il '+esc(sanitizeDate(g.expires_at))+'</small></div><button type="button" data-action="cloudRevokeCv" data-id="'+esc(g.id)+'">Revoca</button></div>').join('')+'</div>':'<p>Nessuna autorizzazione attiva. Solo tu puoi accedere al tuo CV.</p>')
   +'<button type="button" class="cloud-secondary" data-action="cloudReceivedCv">Mostra i CV autorizzati a me</button>'+(data.received.length?'<div class="cloud-received">'+data.received.map(p=>'<article class="cloud-thread"><h3>'+esc(p.display_name||'Curriculum')+'</h3><p>'+esc(p.professional_title)+'</p><p>'+esc(p.area)+'</p><p>'+esc(p.summary)+'</p><p>'+esc(p.skills)+'</p></article>').join('')+'</div>':'')
   +'</section>';
 }
 async function action(name,el,ctx){
  if(name==='cloudMode'){data.tab=el.dataset.id==='signup'?'signup':'login';render();return}
  if(name==='cloudCompose'){data.composer=!data.composer;render();return}
  if(name==='cloudReplyToggle'){data.replyTo=data.replyTo===el.dataset.id?null:el.dataset.id;render();return}
  if(data.busy)return;
  data.busy=true;data.error='';
  try{
   if(name==='cloudSubmitAuth'){
    const email=ctx.document.getElementById('cloudEmail')?.value||'';
    const password=ctx.document.getElementById('cloudPassword')?.value||'';
    const response=await request('auth','POST',{action:data.tab==='signup'?'signup':'login',email,password});
    data.user=response.user||null;data.status=response.message||'Accesso eseguito.';
    if(hasUser()){await Promise.allSettled([loadThreads('messaggio'),loadCv()]);ctx.setPage('community')}
   }else if(name==='cloudLogout'){
    await request('auth','POST',{action:'logout'});
    data.user=null;data.posts=[];data.comments=[];data.cv=null;data.grants=[];data.snapshot=null;data.savedAt=null;data.status='Sei uscito dall’account.';ctx.setPage('account');
   }else if(name==='cloudPublish'){
    const kind=el.dataset.id==='confronto'?'confronto':'messaggio';
    const category=ctx.document.getElementById('cloudCategory')?.value||'sala',title=ctx.document.getElementById('cloudPostTitle')?.value||'',body=ctx.document.getElementById('cloudPostBody')?.value||'';
    if(!confirm('Pubblicare per tutti gli iscritti? Evita nomi, contatti e situazioni che rendano riconoscibili altre persone.'))return;
    await request('community','POST',{action:'post',kind,category,title,body});
    data.composer=false;data.status='Messaggio pubblicato agli utenti registrati.';await loadThreads(kind);
   }else if(name==='cloudSendReply'){
    const body=ctx.document.getElementById('cloudReplyText')?.value||'';
    await request('community','POST',{action:'comment',postId:el.dataset.id,body});
    data.status='Risposta pubblicata.';await loadThreads(data.kind);
   }else if(name==='cloudDeletePost'){
    if(!confirm('Eliminare il tuo messaggio anche per gli altri iscritti?'))return;
    await request('community?postId='+encodeURIComponent(el.dataset.id),'DELETE');
    data.replyTo=null;await loadThreads(data.kind);
   }else if(name==='cloudReportPost'){
    if(!confirm('Inviare una segnalazione di contenuto inappropriato?'))return;
    await request('community','POST',{action:'report',postId:el.dataset.id,reason:'privacy'});
    data.status='Segnalazione registrata. È necessario un controllo di moderazione.';
   }else if(name==='cloudSaveProgress'){
    if(!confirm('Salvare online una copia dei progressi formativi? Il contenuto non comprende CV né post della demo.'))return;
    const all=ctx.backupData();
    const keys=['done','microProgress','microReviews','placements','assessments','activeCourse','lastLesson','shiftSimResults','shiftSimDrafts'];
    const snapshot=Object.fromEntries(keys.filter(k=>Object.prototype.hasOwnProperty.call(all,k)).map(k=>[k,all[k]]));
    await request('progress','POST',{action:'save',snapshot});
    data.status='Progressi formativi salvati sul tuo account.';
   }else if(name==='cloudLoadProgress'){
    const result=await request('progress');data.snapshot=result.snapshot;data.savedAt=result.savedAt;
    data.status=data.snapshot?'Backup online disponibile. Scegli se ripristinarlo.':'Nessun backup online ancora presente.';
   }else if(name==='cloudRestoreProgress'){
    if(!data.snapshot)throw Error('Nessun backup disponibile.');
    const merged={...ctx.backupData(),...data.snapshot};
    const documentBody=JSON.stringify({format:'dopoturno-demo-backup-v1',data:merged});
    await ctx.importBackupFile({size:new Blob([documentBody]).size,text:async()=>documentBody});
    data.status='Importazione dei progressi elaborata. Controlla il risultato sul dispositivo.';
   }else if(name==='cloudSaveCv'){
    const s=ctx.saved;
    await request('cv','POST',{action:'save',profile:{name:s.cvName||'',title:s.cvTitle||'',area:s.cvLocation||'',summary:s.cvSummary||'',skills:s.cvSkills||''}});
    data.status='CV salvato privatamente nel tuo account.';await loadCv();
   }else if(name==='cloudLoadCv'){
    await loadCv();data.status='Autorizzazioni aggiornate.';
   }else if(name==='cloudGrantCv'){
    const email=ctx.document.getElementById('cloudViewerEmail')?.value||'',days=Number(ctx.document.getElementById('cloudExpiry')?.value)||7;
    if(!data.cv)throw Error('Prima salva il CV online.');
    if(!confirm('Consentire a '+email+' di leggere il tuo CV fino alla scadenza scelta?'))return;
    await request('cv','POST',{action:'grant',viewerEmail:email,days});
    data.status='Accesso autorizzato. Potrai revocarlo quando vuoi.';await loadCv();
   }else if(name==='cloudRevokeCv'){
    if(!confirm('Revocare immediatamente questo accesso al curriculum?'))return;
    await request('cv','POST',{action:'revoke',id:el.dataset.id});
    data.status='Accesso revocato.';await loadCv();
   }else if(name==='cloudReceivedCv'){
    const result=await request('cv?scope=received');
    data.received=Array.isArray(result.profiles)?result.profiles:[];
    data.status=data.received.length?'Curriculum autorizzati caricati.':'Nessun curriculum condiviso con te.';
   }
  }catch(e){data.error=e?.message||failure}
  finally{data.busy=false;render()}
 }
 function alerts(){
  return (data.error?'<div role="alert" class="cloud-alert">'+esc(data.error)+'</div>':'')
   +(data.status?'<div role="status" class="cloud-status">'+esc(data.status)+'</div>':'');
 }
 window.DopoTurnoOnline={data,bootstrap,authPanel,compactAccount,communityPage,cvPanel,alerts,action,loadThreads,loadCv,hasUser};
})();
