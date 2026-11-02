(function installForum(){
  "use strict";
  const CATEGORY_LABELS={Sala:"Sala",Cucina:"Cucina",Bar:"Bar",Lavoro:"Turni e lavoro"};
  const ROLE_LABELS={sala:"Cameriere/a",cucina:"Cuoco/a",bar:"Barista",altro:"Collega della ristorazione"};
  const TOPIC_LABELS={consiglio:"Cerco un consiglio",esperienza:"Esperienza",domanda:"Domanda",sfogo:"Sfogo"};
  const EXAMPLES=[
    {id:"example-sala",category:"Sala",role:"sala",topic:"consiglio",title:"Il cliente si arrabbia per un ritardo che non dipende da me",body:"Sabato sera, locale pieno. La cucina è in ritardo e il tavolo comincia a prendersela con chi serve. Ho spiegato i tempi senza dare colpe ai colleghi, ma la tensione è aumentata. Voi cosa avreste fatto per calmare la situazione senza promettere ciò che non potete garantire?",createdAt:"",example:true},
    {id:"example-cucina",category:"Cucina",role:"cucina",topic:"domanda",title:"Due partite da seguire durante il pienone: come vi organizzate?",body:"Quando manca un collega mi ritrovo a seguire contemporaneamente due postazioni. Finché arrivano poche comande funziona, poi si accumula tutto. Come impostate le priorità e come chiedete supporto al responsabile prima che il servizio salti?",createdAt:"",example:true},
    {id:"example-bar",category:"Bar",role:"bar",topic:"esperienza",title:"Dieci ordinazioni insieme e qualcuno cambia il caffè all'ultimo",body:"Durante il servizio del mattino stavo preparando le bevande e continuavano ad arrivare variazioni dalla sala. Ho fermato trenta secondi il banco per riallineare le comande. È stato utile, ma un collega l'ha visto come una perdita di tempo. Come gestite questi momenti?",createdAt:"",example:true},
    {id:"example-lavoro",category:"Lavoro",role:"altro",topic:"consiglio",title:"Cambio turno comunicato con pochissimo preavviso",body:"Mi è stato chiesto di coprire un altro turno quasi all'ultimo momento, dopo che avevo già preso impegni. Vorrei mantenere un buon rapporto con i colleghi senza essere sempre la persona disponibile. Come avete affrontato una situazione simile?",createdAt:"",example:true},
    {id:"example-collega",category:"Sala",role:"sala",topic:"sfogo",title:"Il nuovo collega viene lasciato da solo nel turno più difficile",body:"Un ragazzo era al suo primo weekend e gli sono stati affidati troppi tavoli senza spiegazioni. Ho cercato di dargli una mano, però il servizio è stato caotico. Secondo voi come si può proporre un inserimento migliore senza mettere nessuno in cattiva luce?",createdAt:"",example:true}
  ];
  const EXAMPLE_COMMENTS={
    "example-sala":[
      {id:"seed-c1",role:"sala",body:"Esempio di risposta: darei un tempo realistico e tornerei al tavolo per aggiornarlo, anche se la situazione non è ancora risolta.",parentId:null,example:true},
      {id:"seed-c2",role:"cucina",body:"Esempio di altro punto di vista: avvisare la cucina della tensione aiuta, purché non interrompa continuamente il lavoro.",parentId:"seed-c1",example:true}
    ],
    "example-cucina":[{id:"seed-c3",role:"cucina",body:"Esempio di risposta: chiarire subito con il pass quali preparazioni non possono aspettare e quali possono essere spostate.",parentId:null,example:true}],
    "example-bar":[{id:"seed-c4",role:"bar",body:"Esempio di risposta: un riepilogo ad alta voce delle comande cambiate evita di rifare tutto da capo.",parentId:null,example:true}],
    "example-lavoro":[{id:"seed-c5",role:"sala",body:"Esempio di risposta: io distinguerei le emergenze vere dalle richieste frequenti e chiederei un'organizzazione dei turni più prevedibile.",parentId:null,example:true}]
  };
  const safe=(s)=>String(s??"");
  function ensure(saved){
    if(!Array.isArray(saved.forumThreads))saved.forumThreads=[];
    if(!saved.forumComments||typeof saved.forumComments!=="object"||Array.isArray(saved.forumComments))saved.forumComments={};
    if(!saved.forumVotes||typeof saved.forumVotes!=="object"||Array.isArray(saved.forumVotes))saved.forumVotes={};
    if(!saved.forumCommentVotes||typeof saved.forumCommentVotes!=="object"||Array.isArray(saved.forumCommentVotes))saved.forumCommentVotes={};
    if(!Array.isArray(saved.forumBookmarks))saved.forumBookmarks=[];
    if(!Array.isArray(saved.forumHidden))saved.forumHidden=[];
  }
  function age(s){
    if(!s)return "Esempio";
    let ms=Date.now()-new Date(s).getTime();
    if(!Number.isFinite(ms)||ms<0)return "Recente";
    const m=Math.floor(ms/60000);
    if(m<1)return "Ora";
    if(m<60)return `${m} min fa`;
    if(m<1440)return `${Math.floor(m/60)} h fa`;
    if(m<43200)return `${Math.floor(m/1440)} g fa`;
    return new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"short"}).format(new Date(s));
  }
  function commentsFor(saved,threadId){
    return [...(EXAMPLE_COMMENTS[threadId]||[]),...(Array.isArray(saved.forumComments[threadId])?saved.forumComments[threadId]:[])];
  }
  function items(saved){
    ensure(saved);
    return [...saved.forumThreads.map(x=>({...x,owned:true})),...EXAMPLES]
      .filter(x=>!saved.forumHidden.includes(x.id));
  }
  function tag(topic,esc){return `<span class="forum-tag">${esc(TOPIC_LABELS[topic]||"Esperienza")}</span>`;}
  function cat(category,esc){return `<span class="forum-category">${esc(CATEGORY_LABELS[category]||"Ristorazione")}</span>`;}
  function meta(thread,ctx){
    const {esc}=ctx;
    return `<span class="forum-avatar" aria-hidden="true">?</span><div class="forum-author"><strong>${esc(ROLE_LABELS[thread.role]||"Collega della ristorazione")} anonimo</strong><span>${esc(age(thread.createdAt))}${thread.example?" · Contenuto illustrativo":""}</span></div>`;
  }
  function filteredItems(ctx){
    const {state,saved}=ctx;
    let p=items(saved);
    const term=safe(state.forumSearch).trim().toLocaleLowerCase("it");
    if(term)p=p.filter(x=>[x.title,x.body,x.category,TOPIC_LABELS[x.topic],ROLE_LABELS[x.role]].join(" ").toLocaleLowerCase("it").includes(term));
    if(state.forumFilter==="salvati")p=p.filter(x=>saved.forumBookmarks.includes(x.id));
    else if(CATEGORY_LABELS[state.forumFilter])p=p.filter(x=>x.category===state.forumFilter);
    const score=x=>(saved.forumVotes[x.id]?1:0);
    const replies=x=>commentsFor(saved,x.id).length;
    p.sort((a,b)=>{
      if(state.forumSort==="discussioni")return replies(b)-replies(a)||Number(!!b.owned)-Number(!!a.owned);
      if(state.forumSort==="utili")return score(b)-score(a)||Number(!!b.owned)-Number(!!a.owned);
      if(a.example!==b.example)return a.example?1:-1;
      return new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime();
    });
    return p;
  }
  function threadCard(t,ctx){
    const {esc,ico,saved}=ctx;
    const n=commentsFor(saved,t.id).length;
    const voted=!!saved.forumVotes[t.id],savedIt=saved.forumBookmarks.includes(t.id);
    return `<article class="forum-thread card">
      <div class="forum-thread-head">${meta(t,ctx)}${t.example?'<span class="forum-example">ESEMPIO</span>':""}</div>
      <div class="forum-tags">${cat(t.category,esc)}${tag(t.topic,esc)}</div>
      <button class="forum-thread-title" data-action="forumOpen" data-id="${esc(t.id)}">${esc(t.title)}</button>
      <p class="forum-excerpt">${esc(t.body)}</p>
      <div class="forum-thread-foot">
        <button class="forum-vote ${voted?"is-active":""}" data-action="forumVote" data-id="${esc(t.id)}" aria-pressed="${voted}" aria-label="${voted?"Rimuovi voto utile":"Segna come utile"}">${ico("arrow",16)} <span>${voted?1:0}</span> utile</button>
        <button data-action="forumOpen" data-id="${esc(t.id)}">${ico("message",17)} ${n} ${n===1?"commento":"commenti"}</button>
        <button data-action="forumBookmark" data-id="${esc(t.id)}" aria-pressed="${savedIt}">${ico("book",16)} ${savedIt?"Salvato":"Salva"}</button>
      </div>
    </article>`;
  }
  function guide(ico){return `<aside class="forum-aside">
    <section class="forum-side-panel card"><span class="card-label">UNO SPAZIO PER CHI LAVORA</span><h3>Qui non devi avere tutte le risposte.</h3><p>Racconta un episodio, ascolta un altro punto di vista e trova consigli da colleghi di sala, cucina e bar.</p>
      <div class="forum-side-stat">${ico("message",19)} Discussioni e risposte</div><div class="forum-side-stat">${ico("shield",19)} Identità non mostrata nei post</div><div class="forum-side-stat">${ico("heart",19)} Rispetto prima dei voti</div>
    </section>
    <section class="forum-side-panel card"><span class="card-label">PRIMA DI SCRIVERE</span><h3>Proteggi te e gli altri.</h3><p>Non citare nomi di colleghi, clienti o locali. Evita indirizzi, turni precisi e dettagli che rendono riconoscibili le persone.</p><p class="micro">La privacy del racconto dipende anche dalle informazioni che scegli di inserire.</p></section>
  </aside>`;}
  function render(ctx){
    ensure(ctx.saved);
    const {state,saved,ico,esc,header}=ctx;
    if(state.forumOpened)return renderDetail(ctx);
    const filtered=filteredItems(ctx);
    return `${header("CONFRONTI","Il turno è finito. Parliamone.","Storie anonime di sala, cucina e bar. Qui ci si ascolta, si discute e si cercano soluzioni.",
      `<button class="btn forum-primary" data-action="forumCompose">${ico("plus",17)} Racconta un episodio</button>`)}
      <section class="forum-intro"><div class="forum-intro-copy"><span class="forum-intro-kicker">DOPOTURNO / CONFRONTI</span><h2>Ogni turno ha una storia.<br>La tua può aiutare qualcuno.</h2><p>Condividi un episodio, confrontati con altri punti di vista e impara dall'esperienza quotidiana.</p></div><div class="forum-intro-symbol" aria-hidden="true">“</div></section>
      <div class="forum-local-note" role="note">${ico("info",19)} <div><strong>Anteprima locale, non ancora una community online</strong><span>I racconti che aggiungi si vedono solo su questo dispositivo. Le storie e le risposte già presenti sono esempi inventati, non utenti reali.</span></div></div>
      <div class="forum-layout">
       <section class="forum-feed" aria-label="Discussioni">
        <div class="forum-toolbar">
          <div><h2>Le discussioni</h2><p>Esperienze, problemi e consigli tra colleghi</p></div>
          <label class="forum-sort-label" for="forumSort">Ordina
            <select id="forumSort" class="search-input" aria-label="Ordina le discussioni">
              ${[["recenti","Più recenti"],["discussioni","Più commentate"],["utili","Più utili"]].map(([v,n])=>`<option value="${v}" ${state.forumSort===v?"selected":""}>${n}</option>`).join("")}
            </select>
          </label>
        </div>
        <label class="sr-only" for="forumSearch">Cerca nelle discussioni</label>
        <input id="forumSearch" type="search" class="search-input forum-search" autocomplete="off" maxlength="120" value="${esc(state.forumSearch||"")}" placeholder="Cerca un'esperienza, una domanda, un argomento…">
        <div class="forum-filters" role="group" aria-label="Filtra le discussioni">
          ${[["tutti","Tutti"],["Sala","Sala"],["Cucina","Cucina"],["Bar","Bar"],["Lavoro","Lavoro"],["salvati","Salvati"]].map(([v,n])=>`<button class="forum-filter ${state.forumFilter===v?"active":""}" aria-pressed="${state.forumFilter===v}" data-action="forumFilter" data-id="${v}">${esc(n)}</button>`).join("")}
        </div>
        <div class="forum-list-top"><span>${filtered.length} ${filtered.length===1?"discussione":"discussioni"}</span><span>Nessuna classifica personale</span></div>
        ${filtered.length?filtered.map(x=>threadCard(x,ctx)).join(""):`<div class="card forum-empty"><h3>Nessuna discussione qui.</h3><p>Cambia filtro oppure inizia un nuovo confronto.</p><button class="btn" data-action="forumCompose">Scrivi il primo episodio</button></div>`}
       </section>${guide(ico)}
      </div>`;
  }
  function renderOneComment(c,ctx,threadId,child=false){
    const {esc,ico,saved}=ctx; const liked=!!saved.forumCommentVotes[c.id];
    return `<div class="forum-comment ${child?"forum-comment-child":""}" id="forum-comment-${esc(c.id)}">
      <div class="forum-comment-avatar" aria-hidden="true">?</div><div class="forum-comment-inner">
        <div class="forum-comment-meta"><strong>${esc(ROLE_LABELS[c.role]||"Collega della ristorazione")} anonimo</strong><span>${esc(age(c.createdAt))}${c.example?" · Esempio":""}</span></div>
        <p>${esc(c.body)}</p>
        <div class="forum-comment-actions">
          <button data-action="forumCommentVote" data-id="${esc(threadId)}" data-comment-id="${esc(c.id)}" aria-pressed="${liked}" class="${liked?"is-active":""}">${ico("arrow",15)} ${liked?"1":"0"} utile</button>
          <button data-action="forumReply" data-id="${esc(threadId)}" data-comment-id="${esc(child&&c.parentId?c.parentId:c.id)}">${ico("message",15)} Rispondi</button>
          ${c.owned?`<button data-action="forumDeleteComment" data-id="${esc(threadId)}" data-comment-id="${esc(c.id)}">Elimina</button>`:""}
        </div>
      </div>
    </div>`;
  }
  function renderDetail(ctx){
    const {state,saved,esc,ico,header}=ctx;
    const t=items(saved).find(x=>x.id===state.forumOpened);
    if(!t){state.forumOpened=null;return render(ctx);}
    const list=commentsFor(saved,t.id),roots=list.filter(x=>!x.parentId||!list.some(p=>p.id===x.parentId));
    const voted=!!saved.forumVotes[t.id],bookmarked=saved.forumBookmarks.includes(t.id);
    let replyTarget=list.find(x=>x.id===state.forumReplyTo);
    return `<div class="forum-detail">
      <button class="forum-back" data-action="forumBack">${ico("back",17)} Tutte le discussioni</button>
      <div class="forum-local-note" role="note">${ico("info",17)} Discussione in anteprima locale: nessun altro utente vede i tuoi commenti. I commenti contrassegnati come esempio sono inventati.</div>
      <article class="card forum-detail-post"><div class="forum-thread-head">${meta(t,ctx)}${t.example?'<span class="forum-example">ESEMPIO</span>':""}</div>
        <div class="forum-tags">${cat(t.category,esc)}${tag(t.topic,esc)}</div>
        <h1>${esc(t.title)}</h1><div class="forum-body">${esc(t.body)}</div>
        <div class="forum-thread-foot">
          <button class="forum-vote ${voted?"is-active":""}" data-action="forumVote" data-id="${esc(t.id)}" aria-pressed="${voted}">${ico("arrow",16)} ${voted?1:0} utile</button>
          <span class="forum-foot-stat">${ico("message",17)} ${list.length} commenti</span>
          <button data-action="forumBookmark" data-id="${esc(t.id)}" aria-pressed="${bookmarked}">${ico("book",16)} ${bookmarked?"Salvato":"Salva"}</button>
          ${t.owned?`<button data-action="forumEdit" data-id="${esc(t.id)}">${ico("edit",16)} Modifica</button><button data-action="forumDelete" data-id="${esc(t.id)}">Elimina</button>`:""}
        </div>
      </article>
      <section class="forum-discussion card" aria-label="Commenti e risposte"><div class="forum-discussion-title"><h2>Discussione</h2><span>${list.length} ${list.length===1?"commento":"commenti"}</span></div>
        ${list.length?roots.map(c=>`${renderOneComment(c,ctx,t.id)}${list.filter(x=>x.parentId===c.id).map(reply=>renderOneComment(reply,ctx,t.id,true)).join("")}`).join(""):`<p class="forum-no-comments">Nessun commento ancora. Condividi il tuo punto di vista.</p>`}
        <div class="forum-reply-form">
          <h3>${replyTarget?"Rispondi al commento":"Aggiungi un commento"}</h3>
          ${replyTarget?`<div class="forum-reply-target">Stai rispondendo a: «${esc(replyTarget.body.slice(0,100))}${replyTarget.body.length>100?"…":""}» <button data-action="forumCancelReply">Annulla</button></div>`:""}
          <label class="forum-field" for="forumReplyRole">Scrivi come
            <select id="forumReplyRole" class="search-input">${Object.entries(ROLE_LABELS).map(([v,n])=>`<option value="${v}">${esc(n)} anonimo</option>`).join("")}</select>
          </label>
          <label class="forum-field" for="forumReplyBody">La tua risposta
            <textarea id="forumReplyBody" rows="5" maxlength="1000" placeholder="Condividi la tua esperienza o un consiglio concreto. Rispetta gli altri e non inserire dati personali."></textarea>
          </label>
          <div class="forum-reply-footer"><span class="micro">I commenti si salvano soltanto in questa anteprima.</span><button class="btn" data-action="forumComment" data-id="${esc(t.id)}">${ico("send",17)} Pubblica commento</button></div>
        </div>
      </section>
    </div>`;
  }
  function modal(ctx){
    const {state,saved,esc,ico}=ctx;
    if(state.modal!=="forumCompose")return "";
    const t=state.forumEditing?saved.forumThreads.find(x=>x.id===state.forumEditing):null;
    return `<div class="modal-overlay" role="presentation"><section class="modal forum-compose-modal" role="dialog" aria-modal="true" aria-labelledby="forumModalTitle">
      <div class="forum-compose-head"><div><span class="card-label">CONFRONTI / ANONIMO</span><h2 id="forumModalTitle">${t?"Modifica il tuo episodio":"Racconta il tuo turno."}</h2><p>Un momento, un problema, una domanda. Nessun nome pubblico.</p></div><button class="btn ghost small" data-action="forumClose" aria-label="Chiudi">${ico("close",19)}</button></div>
      <div class="forum-compose-grid">
       <label class="forum-field" for="forumComposeRole">Il tuo ruolo
        <select class="search-input" id="forumComposeRole">${Object.entries(ROLE_LABELS).map(([key,val])=>`<option value="${key}" ${t?.role===key?"selected":""}>${esc(val)}</option>`).join("")}</select>
       </label>
       <label class="forum-field" for="forumComposeCategory">Ambito
        <select class="search-input" id="forumComposeCategory">${Object.entries(CATEGORY_LABELS).map(([key,val])=>`<option value="${key}" ${t?.category===key?"selected":""}>${esc(val)}</option>`).join("")}</select>
       </label>
      </div>
      <label class="forum-field" for="forumComposeTopic">Tipo di discussione
       <select class="search-input" id="forumComposeTopic">${Object.entries(TOPIC_LABELS).map(([key,val])=>`<option value="${key}" ${t?.topic===key?"selected":""}>${esc(val)}</option>`).join("")}</select>
      </label>
      <label class="forum-field" for="forumComposeTitle">Titolo <span class="forum-hint">(10-110 caratteri)</span>
       <input class="search-input" id="forumComposeTitle" maxlength="110" value="${esc(t?.title||"")}" placeholder="Es. Un cliente si è arrabbiato: come avreste reagito?">
      </label>
      <label class="forum-field" for="forumComposeBody">Che cosa è successo? <span class="forum-hint">(30-2500 caratteri)</span>
       <textarea id="forumComposeBody" rows="8" maxlength="2500" placeholder="Descrivi l'episodio, come hai reagito e che tipo di consiglio vorresti ricevere.">${esc(t?.body||"")}</textarea>
      </label>
      <label class="forum-privacy"><input type="checkbox" id="forumComposePrivacy"> Ho tolto nomi di persone, locali, indirizzi e dettagli che potrebbero identificare qualcuno.</label>
      <div class="forum-compose-foot"><span>Anteprima: resterà visibile solo nel tuo browser, non online.</span><div><button class="btn outline" data-action="forumClose">Annulla</button><button class="btn" data-action="forumPublish">${t?"Salva":"Pubblica nella demo"}</button></div></div>
    </section></div>`;
  }
  function highlights(ctx){
    const {saved,esc,ico}=ctx;
    const list=items(saved).slice(0,3);
    return `<section class="forum-home-highlight"><div class="section-head"><div><h2>Dal confronto nasce esperienza.</h2><p>Episodi anonimi, consigli e punti di vista di sala, cucina e bar.</p></div><button class="btn outline" data-page="confronti">Apri Confronti ${ico("arrow",16)}</button></div>
      <div class="forum-home-grid">${list.map(t=>`<article class="card forum-home-card"><div class="forum-tags">${cat(t.category,esc)}${t.example?'<span class="forum-example">ESEMPIO</span>':""}</div><h3>${esc(t.title)}</h3><p>${esc(t.body.slice(0,170))}${t.body.length>170?"…":""}</p><button class="text-link" data-action="forumOpen" data-id="${esc(t.id)}">Leggi la discussione ${ico("arrow",15)}</button></article>`).join("")}</div></section>`;
  }
  function action(name,el,ctx){
    const {state,saved,save,toast,render,setPage}=ctx;ensure(saved);
    const id=el.dataset.id, commentId=el.dataset.commentId;
    const rerender=()=>{render();};
    switch(name){
      case "forumCompose":state.modal="forumCompose";state.forumEditing=null;rerender();requestAnimationFrame(()=>document.getElementById("forumComposeTitle")?.focus());break;
      case "forumClose":state.modal=null;state.forumEditing=null;rerender();break;
      case "forumFilter":state.forumFilter=id||"tutti";rerender();break;
      case "forumOpen":
        if(state.page!=="confronti"){setPage("confronti",{forumOpened:id});}
        else{state.forumOpened=id;state.forumReplyTo=null;rerender();window.scrollTo({top:0,behavior:"instant"});}
        break;
      case "forumBack":state.forumOpened=null;state.forumReplyTo=null;rerender();window.scrollTo({top:0,behavior:"instant"});break;
      case "forumVote":saved.forumVotes[id]=!saved.forumVotes[id];if(!save())toast("Impossibile salvare il voto nel browser.");rerender();break;
      case "forumBookmark":{const idx=saved.forumBookmarks.indexOf(id);if(idx>=0)saved.forumBookmarks.splice(idx,1);else saved.forumBookmarks.push(id);save();rerender();break;}
      case "forumEdit":{const p=saved.forumThreads.find(x=>x.id===id);if(!p)return;state.forumEditing=id;state.modal="forumCompose";rerender();break;}
      case "forumDelete":{
        if(!saved.forumThreads.some(x=>x.id===id))return;
        if(!confirm("Eliminare definitivamente l'episodio e i suoi commenti locali?"))return;
        saved.forumThreads=saved.forumThreads.filter(x=>x.id!==id);
        delete saved.forumComments[id];delete saved.forumVotes[id];saved.forumBookmarks=saved.forumBookmarks.filter(x=>x!==id);
        save();state.forumOpened=null;rerender();toast("Episodio eliminato da questo dispositivo.");break;
      }
      case "forumPublish":{
        const role=document.getElementById("forumComposeRole")?.value,category=document.getElementById("forumComposeCategory")?.value,topic=document.getElementById("forumComposeTopic")?.value;
        const title=document.getElementById("forumComposeTitle")?.value.trim(),body=document.getElementById("forumComposeBody")?.value.trim();
        if(!ROLE_LABELS[role]||!CATEGORY_LABELS[category]||!TOPIC_LABELS[topic]){toast("Completa i campi del racconto.");break;}
        if(!title||title.length<10||title.length>110||!body||body.length<30||body.length>2500){toast("Titolo: 10-110 caratteri. Racconto: 30-2500 caratteri.");break;}
        if(!document.getElementById("forumComposePrivacy")?.checked){toast("Conferma prima di aver tolto le informazioni identificative.");break;}
        if(saved.forumThreads.length>=100&&!state.forumEditing){toast("Limite di episodi locali raggiunto.");break;}
        const prev=JSON.stringify(saved.forumThreads),editing=state.forumEditing;
        let p=editing?saved.forumThreads.find(x=>x.id===editing):null;
        if(editing&&!p){toast("Il racconto non esiste più.");break;}
        if(p)Object.assign(p,{role,category,topic,title,body});
        else{p={id:"thread-"+Date.now()+"-"+Math.random().toString(36).slice(2,9),role,category,topic,title,body,createdAt:new Date().toISOString()};saved.forumThreads.push(p);}
        if(!save()){saved.forumThreads=JSON.parse(prev);toast("Salvataggio locale non disponibile. Copia il testo prima di chiudere.");break;}
        state.modal=null;state.forumEditing=null;state.forumFilter="tutti";state.forumOpened=p.id;rerender();window.scrollTo({top:0,behavior:"instant"});
        toast("Episodio salvato nella tua anteprima privata.");break;
      }
      case "forumReply":state.forumReplyTo=commentId;rerender();requestAnimationFrame(()=>document.getElementById("forumReplyBody")?.focus());break;
      case "forumCancelReply":state.forumReplyTo=null;rerender();break;
      case "forumComment":{
        const body=document.getElementById("forumReplyBody")?.value.trim(),role=document.getElementById("forumReplyRole")?.value;
        if(!body||body.length<4||body.length>1000){toast("Il commento deve avere da 4 a 1000 caratteri.");break;}
        if(!ROLE_LABELS[role]){toast("Seleziona il tuo ruolo.");break;}
        const parent=state.forumReplyTo;
        const existing=commentsFor(saved,id);
        if(parent&&!existing.some(c=>c.id===parent)){toast("Il commento a cui vuoi rispondere non è più disponibile.");break;}
        const arr=saved.forumComments[id]||(saved.forumComments[id]=[]);
        if(arr.length>=120){toast("Limite di commenti locali raggiunto.");break;}
        const item={id:"reply-"+Date.now()+"-"+Math.random().toString(36).slice(2,9),role,body,parentId:parent||null,createdAt:new Date().toISOString(),owned:true};
        arr.push(item);
        if(!save()){arr.pop();toast("Commento non salvato. Riprova dopo aver liberato spazio.");break;}
        state.forumReplyTo=null;rerender();toast("Commento salvato nella tua anteprima privata.");break;
      }
      case "forumCommentVote":saved.forumCommentVotes[commentId]=!saved.forumCommentVotes[commentId];save();rerender();break;
      case "forumDeleteComment":{
        const arr=saved.forumComments[id]||[];
        if(!arr.some(x=>x.id===commentId))return;
        const childIds=arr.filter(x=>x.parentId===commentId).map(x=>x.id);
        saved.forumComments[id]=arr.filter(x=>x.id!==commentId&&!childIds.includes(x.id));
        save();rerender();toast("Commento eliminato dal dispositivo.");break;
      }
      default:break;
    }
  }
  window.DopoTurnoForum={render,modal,highlights,action,ensure,exampleIds:EXAMPLES.map(x=>x.id)};
})();