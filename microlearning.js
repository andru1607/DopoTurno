/* DopoTurno Academy v2.2 | Microlearning.
   Private, browser-only progress. No grades are professional credentials. */
(function() {
"use strict";
const STEP_META=[
 {key:"contesto",label:"Contesto e obiettivo",minutes:5,short:"Capire il problema"},
 {key:"analisi",label:"Decisione e controlli",minutes:6,short:"Scegliere il metodo"},
 {key:"procedura",label:"Procedura operativa",minutes:7,short:"Applicare con criterio"},
 {key:"caso",label:"Caso sul campo",minutes:11,short:"Argomentare una scelta"},
 {key:"verifica",label:"Verifica ragionata",minutes:5,short:"Consolidare la decisione"}
];
const INTERVALS=[1,3,7,14,30];
const validId=id=>typeof id==="string"&&/^(SAL|CUC|BAR)-(?:I)?\d{3}$/.test(id);
const html=(ctx,v)=>ctx.esc(v==null?"":String(v));
const existsLesson=(ctx,id)=>{const cid=ctx.courseForLesson(id);const c=ctx.courseData(cid);return c&&c.lessons.find(x=>x.id===id)||null};
const getRecord=(saved,id)=>{const data=saved.microProgress?.[id];return data&&typeof data==="object"&&!Array.isArray(data)?data:{done:[],updatedAt:null}};
function doneKeys(saved,id){
 const rec=getRecord(saved,id);
 return Array.isArray(rec.done)?[...new Set(rec.done.filter(x=>STEP_META.some(s=>s.key===x)))]:[];
}
function ensure(saved){
 if(!saved.microProgress||typeof saved.microProgress!=="object"||Array.isArray(saved.microProgress))saved.microProgress={};
 if(!saved.microReviews||typeof saved.microReviews!=="object"||Array.isArray(saved.microReviews))saved.microReviews={};
 if(!saved.microResponses||typeof saved.microResponses!=="object"||Array.isArray(saved.microResponses))saved.microResponses={};
 if(!saved.microLast||typeof saved.microLast!=="object")saved.microLast=null;
}
function isLessonStudied(saved,lessonId){
 return doneKeys(saved,lessonId).length===STEP_META.length||Array.isArray(saved.done)&&saved.done.includes(lessonId);
}
function courseMetrics(ctx,c){
 const all=c.lessons.length*STEP_META.length,completed=c.lessons.reduce((n,l)=>n+doneKeys(ctx.saved,l.id).length,0);
 const completedLessons=c.lessons.filter(l=>isLessonStudied(ctx.saved,l.id)).length;
 return {total:all,completed,completedLessons,percent:Math.round(completed/all*100)};
}
function preferredStart(plan,lesson){
 if(!plan?.enabled)return 0;
 const mod=plan.modules?.find(x=>x.id===lesson.module);
 if(!mod)return 0;
 if(mod.criticalErrors>0)return 1; // Do not skip controls when the diagnostic flagged a critical error.
 if(mod.percent<60)return 0;
 return 3; // A stronger worker can begin with a real case; this is not a completed lesson.
}
function planTargets(ctx,c){
 const p=ctx.placementFor(c.id);
 if(!p?.enabled)return null;
 if(p.level==="applicazione")return {kind:c.level==="intermedio"?"final":"higher",target:c.id+"-intermedio"};
 const targets=p.lessonIds.filter(id=>c.lessons.some(l=>l.id===id));
 return {kind:"lessons",plan:p,targets};
}
function recommendation(ctx,courseId,options={}){
 const c=ctx.courseData(courseId);
 if(!c)return null;
 const target=planTargets(ctx,c);
 if(target?.kind==="higher"&&ctx.courseData(target.target))return {kind:"course",courseId:target.target,reason:"Fondamentali verificati: passa all'intermedio."};
 if(target?.kind==="final")return {kind:"final",courseId};
 const picks=target?.kind==="lessons"?target.targets:c.lessons.map(l=>l.id);
 const last=ctx.saved.microLast;
 const ordered=(!target&&last?.courseId===courseId&&picks.includes(last.lessonId))?
  [last.lessonId,...picks.filter(x=>x!==last.lessonId)]:picks;
 for(const lid of ordered){
   const l=c.lessons.find(x=>x.id===lid);
   if(!l||isLessonStudied(ctx.saved,lid))continue;
   const start=target?.plan?preferredStart(target.plan,l):0;
   const done=doneKeys(ctx.saved,lid);
   const candidates=STEP_META.map((s,i)=>i).filter(i=>i>=start&&!done.includes(STEP_META[i].key));
   if(!candidates.length)continue;
   const idx=last?.lessonId===lid&&last.courseId===courseId&&!done.includes(STEP_META[last.index]?.key)&&last.index>=start?last.index:candidates[0];
   return {kind:"step",courseId,lessonId:lid,index:idx,reason:start>0?"Attività consigliata in base alle risposte dello Skill Check. Le parti precedenti restano consultabili.":"Attività da continuare"};
 }
 if(target?.kind==="lessons")return {kind:"course",courseId,reason:"Hai svolto le attività mirate. Puoi scegliere liberamente il prossimo capitolo e le verifiche di modulo."};
 const remaining=c.lessons.some(l=>!isLessonStudied(ctx.saved,l.id));
 return remaining?{kind:"course",courseId,reason:"Continua dal programma completo."}:{kind:"done",courseId};
}
function dueReviews(ctx,courseId=null){
 ensure(ctx.saved);
 const now=Date.now(),list=[];
 for(const [id,rec] of Object.entries(ctx.saved.microReviews)){
   if(!validId(id)||!rec||!Number.isFinite(rec.dueAt)||rec.dueAt>now)continue;
   const cid=ctx.courseForLesson(id),lesson=existsLesson(ctx,id);
   if(!lesson||(courseId&&cid!==courseId))continue;
   list.push({lesson,courseId:cid,record:rec});
 }
 return list.sort((a,b)=>a.record.dueAt-b.record.dueAt).slice(0,72);
}
function scheduleReview(saved,lessonId,passed,review){
 ensure(saved);
 const old=saved.microReviews[lessonId];
 const level=passed?(review?Math.min(4,Math.max(-1,Number.isInteger(old?.level)?old.level:-1)+1):0):0;
 const days=INTERVALS[level];
 saved.microReviews[lessonId]={level,dueAt:Date.now()+days*86400000,lastAt:Date.now(),lastPassed:passed};
}
function saveDraft(ctx,raw){
 ensure(ctx.saved);
 const id=ctx.state.microAt?.lessonId;
 if(!existsLesson(ctx,id))return false;
 const value=String(raw||"").slice(0,1500);
 ctx.saved.microResponses[id]=value;
 return ctx.save();
}
function completion(ctx){
 const at=ctx.state.microAt;if(!at)return false;
 const course=ctx.courseData(at.courseId),lesson=course?.lessons.find(l=>l.id===at.lessonId),step=STEP_META[at.index];
 if(!lesson||!step)return false;
 ensure(ctx.saved);
 if(step.key==="caso"){
   const value=ctx.document.getElementById("microCaseResponse")?.value??ctx.saved.microResponses[at.lessonId]??"";
   if(value.trim().length<40){ctx.toast("Descrivi la tua decisione operativa in almeno 40 caratteri, includendo il controllo previsto.");return false}
   ctx.saved.microResponses[at.lessonId]=String(value).slice(0,1500);
 }
 if(step.key==="verifica"){
   if(!ctx.state.microGraded?.passed){ctx.toast("Concludi prima la verifica ragionata, senza errori critici.");return false}
   scheduleReview(ctx.saved,at.lessonId,true,!!at.review);
 }
 if(!at.review){
   const completed=doneKeys(ctx.saved,at.lessonId);
   if(!completed.includes(step.key))completed.push(step.key);
   ctx.saved.microProgress[at.lessonId]={done:completed,updatedAt:new Date().toISOString()};
   if(completed.length===STEP_META.length&&!ctx.saved.done.includes(at.lessonId))ctx.saved.done.push(at.lessonId);
 }
 const following=at.index<4?at.index+1:null;
 ctx.saved.microLast=at.review?ctx.saved.microLast:{courseId:at.courseId,lessonId:at.lessonId,index:following===null?4:following,updatedAt:Date.now()};
 if(!ctx.save()){ctx.toast("Il browser non ha salvato il progresso; libera spazio o abilita l'archiviazione locale.");return false}
 if(at.review){ctx.setPage("microReviews");ctx.toast("Ripasso registrato. La prossima revisione comparirà nella sezione Ripassi.");return true}
 ctx.state.microAnswers={};ctx.state.microGraded=null;
 const next=recommendation(ctx,at.courseId);
 if(at.index<4){
   // Continue the current chapter even when skipping first activities by placement.
   go(ctx,at.courseId,at.lessonId,at.index+1,false);
 }else if(next?.kind==="step"){
   go(ctx,next.courseId,next.lessonId,next.index,false);
 }else{
   ctx.setPage("microCourse",{activeCourse:at.courseId});
   ctx.toast("Attività completata. Puoi scegliere il prossimo capitolo dal programma.");
 }
 return true;
}
function go(ctx,courseId,lessonId,index=0,review=false){
 const c=ctx.courseData(courseId);
 if(!c?.lessons.some(l=>l.id===lessonId)||!Number.isInteger(index)||index<0||index>4)return false;
 if(review&&index!==4)return false;
 ctx.state.microAnswers={};ctx.state.microGraded=null;
 ctx.state.activeCourse=courseId;ctx.saved.activeCourse=courseId;
 const microAt={courseId,lessonId,index,review:!!review};
 if(!review){ctx.saved.microLast={...microAt,updatedAt:Date.now()};}
 ctx.save();ctx.setPage("microStep",{activeCourse:courseId,microAt});
 return true;
}
function pick(ctx,questionId,value){
 if(ctx.state.microGraded)return;
 const at=ctx.state.microAt,c=ctx.courseData(at?.courseId);
 const questions=c?.questions.filter(q=>q.lesson===at.lessonId).slice(0,2)||[];
 if(!questions.some(q=>q.id===questionId)||!Number.isInteger(value)||value<0||value>2)return;
 ctx.state.microAnswers??={};ctx.state.microAnswers[questionId]=value;ctx.render();
}
function grade(ctx){
 const at=ctx.state.microAt,c=ctx.courseData(at?.courseId);
 if(!c||at.index!==4)return false;
 const questions=c.questions.filter(q=>q.lesson===at.lessonId).slice(0,2);
 if(!questions.length)return false;
 const answers=ctx.state.microAnswers||{};
 if(questions.some(q=>!Object.prototype.hasOwnProperty.call(answers,q.id))){ctx.toast("Rispondi a tutti i casi prima della correzione.");return false;}
 const correct=questions.filter(q=>answers[q.id]===q.correct).length;
 const critical=questions.filter(q=>q.critical&&answers[q.id]!==q.correct).length;
 const passed=correct>=Math.ceil(questions.length*.8)&&critical===0;
 ctx.state.microGraded={passed,correct,total:questions.length,critical};
 ctx.render();return true;
}
function retry(ctx){ctx.state.microAnswers={};ctx.state.microGraded=null;ctx.render()}
function action(ctx,action,el){
 ensure(ctx.saved);
 const id=el?.dataset?.id,idx=Number(el?.dataset?.step);
 if(action==="microOpen")return go(ctx,ctx.courseForLesson(id),id,Number.isInteger(idx)&&idx>=0&&idx<=4?idx:0,false);
 if(action==="microToggleModule"){
   const course=ctx.courseData(ctx.state.activeCourse);
   if(!course?.modules.some(m=>m.id===id))return false;
   ctx.state.microModuleOpen??={};
   ctx.state.microModuleOpen[course.id]=ctx.state.microModuleOpen[course.id]===id?"none":id;
   ctx.render();
   const control=Array.from(ctx.document.querySelectorAll?.('[data-action="microToggleModule"]')||[]).find(x=>x.dataset?.id===id);
   if(typeof control?.focus==="function")control.focus();
   return true;
 }
 if(action==="microChapter")return ctx.setPage("microCourse",{activeCourse:id||ctx.state.activeCourse});
 if(action==="microContinue"){
   const suggested=recommendation(ctx,id||ctx.state.activeCourse);
   if(suggested?.kind==="step")return go(ctx,suggested.courseId,suggested.lessonId,suggested.index,false);
   if(suggested?.kind==="course")return ctx.setPage("microCourse",{activeCourse:suggested.courseId});
   if(suggested?.kind==="final"){ctx.state.activeCourse=suggested.courseId;return ctx.buildTest("final");}
   return ctx.setPage("microCourse",{activeCourse:id||ctx.state.activeCourse});
 }
 if(action==="microPick")return pick(ctx,id,idx);
 if(action==="microGrade")return grade(ctx);
 if(action==="microRetry")return retry(ctx);
 if(action==="microFinish")return completion(ctx);
 if(action==="microStartReview"){
   const cid=ctx.courseForLesson(id);
   if(!dueReviews(ctx).some(r=>r.lesson.id===id)){ctx.toast("Il ripasso non è ancora previsto.");return false}
   return go(ctx,cid,id,4,true);
 }
 if(action==="microReviews")return ctx.setPage("microReviews");
 return false;
}
function activityContent(ctx,l,step){
 const h=x=>html(ctx,x),sect=l.sections||[];
 if(step.key==="contesto")return '<div class="micro-reading"><p class="micro-intro">'+h(l.intro)+'</p><h3>'+h(sect[0]?.title||"Lettura del problema")+'</h3><p>'+h(sect[0]?.text)+'</p><div class="micro-prompt"><strong>Domanda guida</strong><p>Quali informazioni servono per prendere una decisione professionale corretta? Distingui un fatto verificato da un’ipotesi.</p></div></div>';
 if(step.key==="analisi")return '<div class="micro-reading">'+sect.slice(1).map(x=>'<h3>'+h(x.title)+'</h3><p>'+h(x.text)+'</p>').join("")+'<div class="micro-prompt"><strong>Argomenta la scelta</strong><p>Quale passaggio può produrre un errore a catena? Indica il controllo che lo intercetta prima che raggiunga il cliente.</p></div><div class="micro-term"><strong>Lessico di reparto</strong><p>'+h(l.glossary)+'</p></div></div>';
 if(step.key==="procedura")return '<div class="micro-reading"><h3>Sequenza di intervento</h3><ol class="micro-procedure">'+(l.steps||[]).map(x=>'<li>'+h(x)+'</li>').join("")+'</ol><div class="micro-risk"><strong>Errori che compromettono il risultato</strong><ul>'+(l.errors||[]).map(x=>'<li>'+h(x)+'</li>').join("")+'</ul></div><h3>Varianti operative</h3><p>'+h(l.environments)+'</p><div class="micro-prompt"><strong>Punto di stop</strong><p>Prima di andare avanti, identifica il requisito che deve essere confermato e chi può autorizzare l’attività.</p></div></div>';
 if(step.key==="caso")return '<div class="micro-reading"><h3>Scenario da risolvere</h3><p class="micro-scenario">'+h(l.case)+'</p><h3>Consegna operativa</h3><p>'+h(l.practice)+'</p><div class="micro-prompt"><strong>Comunicazione da preparare</strong><p>'+h(l.dialogue)+'</p></div><h3>Criteri di autocontrollo</h3><ul>'+(l.criteria||[]).map(x=>'<li>'+h(x)+'</li>').join("")+'</ul><label class="micro-response-label" for="microCaseResponse">La tua decisione e il controllo previsto</label><textarea id="microCaseResponse" rows="5" maxlength="1500" placeholder="Scrivi come intervieni, chi coinvolgi e come controlli l’esito. Non inserire dati personali di clienti o colleghi.">'+h(ctx.saved.microResponses?.[l.id]||"")+'</textarea><p class="micro-privacy">Risposta privata salvata nel browser, non valutata automaticamente. Non inserire nomi o dati personali.</p><p id="microDraftStatus" class="micro-draft-status" role="status">Bozza locale: digitando il testo viene salvato su questo dispositivo.</p></div>';
 const c=ctx.courseData(ctx.state.microAt?.courseId),questions=c?.questions.filter(q=>q.lesson===l.id).slice(0,2)||[],answers=ctx.state.microAnswers||{},graded=ctx.state.microGraded;
 return '<div class="micro-reading"><p>Questi sono esercizi formativi, distinti dallo Skill Check diagnostico. Le soluzioni compaiono solo dopo aver confermato le risposte.</p>'+
 questions.map((q,i)=>'<fieldset class="micro-question"><legend>'+(i+1)+'. '+h(q.prompt)+'</legend>'+q.options.map((op,j)=>{
   const selected=answers[q.id]===j,correct=graded&&j===q.correct,wrong=graded&&selected&&!correct;
   return '<button type="button" class="micro-option'+(selected?' selected':'')+(correct?' correct':'')+(wrong?' wrong':'')+'" data-action="microPick" data-id="'+h(q.id)+'" data-step="'+j+'" aria-pressed="'+selected+'" '+(graded?'disabled':'')+'><span class="micro-opt-letter">'+String.fromCharCode(65+j)+'</span>'+h(op)+'</button>';
 }).join("")+(graded?'<div class="micro-explanation"><strong>'+(answers[q.id]===q.correct?'Decisione corretta':'Punto da rivedere')+(q.critical?' · controllo critico':'')+'</strong><p>'+h(q.explanation)+'</p></div>':'')+'</fieldset>').join("")+
 (graded?'<div class="micro-result" role="status"><strong>'+graded.correct+'/'+graded.total+' risposte corrette</strong><p>'+(graded.passed?'Verifica formativa completata. Le risposte saranno riprese anche nel ripasso distribuito.':'Rivedi il ragionamento e ripeti la verifica. Non perdi punti o tentativi.')+'</p></div>':'')+'</div>';
}
function coursePage(ctx){
 const c=ctx.courseData(ctx.state.activeCourse),h=x=>html(ctx,x);if(!c)return "";
 ensure(ctx.saved);
 const metric=courseMetrics(ctx,c),suggest=recommendation(ctx,c.id),reviews=dueReviews(ctx,c.id),p=ctx.placementFor(c.id);
 const defaultModule=c.lessons.find(l=>l.id===suggest?.lessonId)?.module||c.modules[0].id;
 const openModule=ctx.state.microModuleOpen?.[c.id]||defaultModule;
 const chapters=c.modules.map((m,mi)=>{
   const lessons=c.lessons.filter(l=>l.module===m.id),mDone=lessons.reduce((n,l)=>n+doneKeys(ctx.saved,l.id).length,0);
   const expanded=openModule===m.id;
   return '<section class="micro-module" aria-label="Modulo '+(mi+1)+': '+h(m.title)+'"><button type="button" class="micro-module-head micro-module-toggle" data-action="microToggleModule" data-id="'+h(m.id)+'" aria-expanded="'+expanded+'" aria-controls="micro-module-'+h(m.id)+'"><span class="micro-module-index">0'+(mi+1)+'</span><span class="micro-module-copy"><strong>'+h(m.title)+'</strong><small>'+h(m.desc)+'</small></span><span class="micro-module-count">'+mDone+'/'+(lessons.length*STEP_META.length)+'</span><span class="micro-module-chevron" aria-hidden="true">'+(expanded?"−":"+")+'</span></button>'+(expanded?'<div class="micro-chapter-list" id="micro-module-'+h(m.id)+'">'+lessons.map(l=>{
      const done=doneKeys(ctx.saved,l.id),legacy=Array.isArray(ctx.saved.done)&&ctx.saved.done.includes(l.id)&&done.length<5;
      const start=p?.enabled?preferredStart(p,l):0;
      const next=STEP_META.findIndex((s,i)=>i>=start&&!done.includes(s.key));
      const idx=next>=0?next:0,complete=done.length===5;
      const recommended=p?.enabled&&p.lessonIds.includes(l.id);
      return '<article class="micro-chapter'+(recommended?' recommended':'')+'"><div class="micro-chapter-text"><span class="micro-chapter-label">'+(recommended?'CONSIGLIATO DAL TEST · ':'')+h(l.id)+(legacy?' · Studiata nel formato precedente':'')+'</span><h3>'+h(l.title)+'</h3><p>'+h(l.objective)+'</p></div><div class="micro-chapter-foot"><div class="micro-mini-track" aria-label="'+done.length+' delle 5 attività completate">'+STEP_META.map((s,i)=>'<button class="micro-track-item'+(done.includes(s.key)?' done':'')+'" title="'+h(s.label)+'" data-action="microOpen" data-id="'+h(l.id)+'" data-step="'+i+'" aria-label="'+h(s.label)+' · '+(done.includes(s.key)?'completata':'da svolgere')+'">'+(done.includes(s.key)?'✓':i+1)+'</button>').join("")+'</div><button class="btn outline small" data-action="microOpen" data-id="'+h(l.id)+'" data-step="'+idx+'">'+(complete?'Rivedi':'Continua')+'</button></div><span class="micro-chapter-progress">'+done.length+'/5 attività svolte'+(recommended&&start>0?' · Accesso mirato, senza ripetere i passaggi già verificati':'')+'</span></article>';
   }).join("")+'</div>':'')+'</section>';
 }).join("");
 return '<div class="micro-wrap"><div class="micro-back"><button data-page="academy">'+ctx.ico("back")+' Panoramica Academy</button></div>'
 +'<header class="micro-course-hero"><div class="micro-eyebrow">DOPOTURNO ACADEMY · '+(c.level==="intermedio"?"INTERMEDIO":"FONDAMENTA")+'</div><h1>'+h(c.title)+'</h1><p>12 capitoli professionali. Ogni capitolo è diviso in cinque attività brevi: concetto, decisione, procedura, caso e verifica.</p><div class="micro-hero-meta"><strong>'+metric.completed+'/'+metric.total+' attività svolte</strong><span>'+metric.completedLessons+'/12 capitoli studiati</span><span>Il tempo è indicativo, non un cronometro</span></div><div class="micro-progress-track" role="progressbar" aria-valuenow="'+metric.percent+'" aria-valuemin="0" aria-valuemax="100" aria-label="Avanzamento delle attività"><span style="width:'+metric.percent+'%"></span></div><div class="micro-hero-actions"><button class="btn" data-action="microContinue" data-id="'+h(c.id)+'">Continua il percorso '+ctx.ico("arrow")+'</button><button class="btn outline" data-action="microReviews">Ripassi da svolgere'+(reviews.length?' ('+reviews.length+')':'')+'</button></div><p class="micro-caption">Il risultato dello Skill Check può suggerire attività più avanzate, ma non marca come studiate quelle saltate. Progressi e risposte restano sul dispositivo.</p></header>'
 +(suggest?.reason?'<p class="micro-guidance">'+h(suggest.reason)+'</p>':'')+chapters
 +'<div class="micro-footer"><p>Le simulazioni guidano lo studio, non attestano capacità pratiche osservate o certificazioni professionali.</p></div></div>';
}
function activityPage(ctx){
 const at=ctx.state.microAt,c=ctx.courseData(at?.courseId),l=c?.lessons.find(l=>l.id===at.lessonId);
 if(!l||!STEP_META[at.index])return '<div class="micro-wrap"><p>Attività non trovata.</p><button data-page="academy">Torna all’Academy</button></div>';
 ensure(ctx.saved);
 const h=x=>html(ctx,x),meta=STEP_META[at.index],done=doneKeys(ctx.saved,l.id),graded=ctx.state.microGraded;
 const isReview=!!at.review;
 const action=isReview?"Concludi il ripasso":at.index===4?"Registra la verifica":"Completa e continua";
 const ready=meta.key!=="verifica"||graded?.passed;
 const activityTags=STEP_META.map((s,i)=>'<button class="micro-step-chip'+(i===at.index?' current':'')+(done.includes(s.key)?' completed':'')+'" data-action="microOpen" data-id="'+h(l.id)+'" data-step="'+i+'" '+(isReview?'disabled':'')+' aria-current="'+(i===at.index?'step':'false')+'"><span>'+(done.includes(s.key)?"✓":i+1)+'</span>'+h(s.short)+'</button>').join("");
 return '<div class="micro-wrap"><div class="micro-back"><button data-action="microChapter" data-id="'+h(c.id)+'">'+ctx.ico("back")+' Tutti i capitoli</button><button data-action="microReviews">Ripassi</button></div>'
 +'<div class="micro-step-layout"><section class="micro-lesson-panel"><div class="micro-eyebrow">'+h(c.title)+' · '+h(l.id)+(isReview?' · RIPASSO PROGRAMMATO':'')+'</div><div class="micro-lesson-heading"><div><h1>'+h(l.title)+'</h1><p>'+h(l.objective)+'</p></div><span class="micro-time">'+meta.minutes+' min indicativi</span></div>'
 +'<div class="micro-tabs" aria-label="Attività del capitolo">'+activityTags+'</div><div class="micro-lesson-content"><div class="micro-step-kicker">ATTIVITÀ '+(at.index+1)+' / 5</div><h2>'+h(meta.label)+'</h2><p class="micro-lead">'+h(meta.short)+'. Completa questa attività quando hai realmente elaborato il contenuto, non solo quando hai raggiunto la fine della pagina.</p>'
 +activityContent(ctx,l,meta)+'</div><div class="micro-bottom-actions">'
 +(meta.key==="verifica"&&!graded?'<button class="btn" data-action="microGrade">Verifica le risposte '+ctx.ico("arrow")+'</button>':meta.key==="verifica"&&graded&&!graded.passed?'<button class="btn" data-action="microRetry">Riprova con nuovi ragionamenti '+ctx.ico("refresh-cw")+'</button>':'<button class="btn" data-action="microFinish" '+(!ready?'disabled':'')+'>'+action+' '+ctx.ico("arrow")+'</button>')
 +'<button class="btn ghost" data-action="microChapter" data-id="'+h(c.id)+'">Chiudi e riprendi dopo</button></div></section>'
 +'<aside class="micro-aside"><div class="micro-aside-card"><div class="micro-eyebrow">IL TUO AVANZAMENTO</div><strong>'+done.length+'/5</strong><p>Attività svolte in questo capitolo</p><div class="micro-mini-bar"><span style="width:'+(done.length/5*100)+'%"></span></div><p>Il caso applicativo richiede una decisione motivata. La verifica formativa dà feedback solo dopo la consegna.</p><div class="micro-private">Le risposte sono private e conservate nel browser; non inserirvi dati di colleghi o clienti.</div></div></aside></div></div>';
}
function reviewPage(ctx){
 ensure(ctx.saved);const all=dueReviews(ctx),h=x=>html(ctx,x);
 const coming=Object.entries(ctx.saved.microReviews).filter(([id,r])=>validId(id)&&r&&Number.isFinite(r.dueAt)&&r.dueAt>Date.now()&&existsLesson(ctx,id)).sort((a,b)=>a[1].dueAt-b[1].dueAt).slice(0,5);
 return '<div class="micro-wrap"><div class="micro-back"><button data-page="academy">'+ctx.ico("back")+' Academy</button></div><header class="micro-review-hero"><div class="micro-eyebrow">RIPASSI PROGRAMMATI</div><h1>Consolidare, non ricominciare.</h1><p>Dopo una verifica riuscita, il ripasso viene proposto a intervalli progressivi: 1, 3, 7, 14 e 30 giorni. Se sbagli, il sistema torna a proporti la verifica a breve. Nessuna vita, penalità o classifica.</p><div class="micro-review-count">'+all.length+' '+(all.length===1?'ripasso disponibile':'ripassi disponibili')+'</div><p>Promemoria solo dentro l’app quando la apri. Non sono attive notifiche push o invii automatici.</p></header><section class="micro-review-list"><h2>Da rivedere adesso</h2>'
 +(all.length?all.map(r=>'<div class="micro-review-row"><div><strong>'+h(r.lesson.title)+'</strong><p>'+h(ctx.courseData(r.courseId).title)+' · Verifica di ripasso</p></div><button class="btn outline small" data-action="microStartReview" data-id="'+h(r.lesson.id)+'">Ripassa</button></div>').join(""):'<div class="micro-no-reviews">Nessun ripasso in scadenza. Le prossime attività appariranno qui dopo aver svolto le verifiche delle microlezioni.</div>')
 +'</section>'+(coming.length?'<section class="micro-review-list"><h2>Prossime scadenze</h2>'+coming.map(([id,r])=>'<p class="micro-next-due">'+h(existsLesson(ctx,id)?.title)+' · '+new Date(r.dueAt).toLocaleDateString('it-IT')+'</p>').join("")+'</section>':'')+'</div>';
}
function restore(raw,allLessons,courseForLesson){
 const allowed=new Set(allLessons.map(x=>x.id)),out={microProgress:{},microReviews:{},microResponses:{},microLast:null};
 if(!raw||typeof raw!=="object")return out;
 for(const [id,r] of Object.entries(raw.microProgress||{}).slice(0,90)){
  if(!allowed.has(id)||!r||!Array.isArray(r.done))continue;
  out.microProgress[id]={done:[...new Set(r.done.filter(x=>STEP_META.some(s=>s.key===x)))].slice(0,5),updatedAt:typeof r.updatedAt==="string"?r.updatedAt.slice(0,40):null};
 }
 for(const [id,r] of Object.entries(raw.microReviews||{}).slice(0,90)){
  if(!allowed.has(id)||!r||!Number.isInteger(r.level)||r.level<0||r.level>4||!Number.isFinite(r.dueAt)||r.dueAt<0||r.dueAt>4102444800000)continue;
  out.microReviews[id]={level:r.level,dueAt:r.dueAt,lastAt:Number.isFinite(r.lastAt)?r.lastAt:0,lastPassed:!!r.lastPassed};
 }
 for(const [id,answer] of Object.entries(raw.microResponses||{}).slice(0,90)){
   if(allowed.has(id)&&typeof answer==="string")out.microResponses[id]=answer.slice(0,1500);
 }
 const last=raw.microLast;
 if(last&&allowed.has(last.lessonId)&&courseForLesson(last.lessonId)===last.courseId&&Number.isInteger(last.index)&&last.index>=0&&last.index<=4)out.microLast={courseId:last.courseId,lessonId:last.lessonId,index:last.index,updatedAt:Number.isFinite(last.updatedAt)?last.updatedAt:0};
 return out;
}
window.DopoTurnoMicro={STEP_META,ensure,doneKeys,courseMetrics,recommendation,dueReviews,saveDraft,go,action,coursePage,activityPage,reviewPage,restore,grade,completion};
})();