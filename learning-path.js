/* DopoTurno Academy v2.0 · Learning placement.
   This is advisory and diagnostic. It is NOT a professional qualification.
   Assumes graded, submitted Skill Check data; never run during the test. */
(function(){
'use strict';
const VERSION=1;
const SAFE_LESSONS={
 sala:{M01:"SAL-003",M02:"SAL-006",M03:"SAL-008",M04:"SAL-011"},
 cucina:{CUCINAM1:"CUC-003",CUCINAM2:"CUC-006",CUCINAM3:"CUC-008",CUCINAM4:"CUC-011"},
 bar:{BARM1:"BAR-003",BARM2:"BAR-006",BARM3:"BAR-009",BARM4:"BAR-012"}
};
// Cross-cutting scenarios must contribute to the module they actually probe.
const TRANSVERSAL={
 cucina:{"CUC-SC17":"CUCINAM2","CUC-SC18":"CUCINAM2","CUC-SC19":"CUCINAM4","CUC-SC20":"CUCINAM4"},
 bar:{"BAR-SC17":"BARM3","BAR-SC18":"BARM3","BAR-SC19":"BARM2","BAR-SC20":"BARM4"}
};
const isId=x=>typeof x==="string"&&/^(?:SAL|BAR|CUC)-\d{3}$/.test(x);
function gradeToModule(courseId,item,course){
 if(course.modules.some(m=>m.id===item.module))return item.module;
 return TRANSVERSAL[courseId]?.[item.id]||null;
}
function build(courseId,course,grades,options={}){
 if(!["sala","cucina","bar"].includes(courseId)||!course||!Array.isArray(course.modules)||!Array.isArray(course.lessons)||!Array.isArray(grades)||grades.length<16)return null;
 const modIds=new Set(course.modules.map(m=>m.id));
 const validLessons=new Set(course.lessons.map(l=>l.id));
 const groups=Object.fromEntries(course.modules.map(m=>[m.id,[]]));
 for(const g of grades){
   if(!g||!g.item||typeof g.ok!=="boolean")continue;
   const mod=gradeToModule(courseId,g.item,course);
   if(mod&&modIds.has(mod))groups[mod].push(g);
 }
 if(course.modules.some(m=>groups[m.id].length<3))return null;
 const moduleResults=course.modules.map(m=>{
   const gs=groups[m.id],passed=gs.filter(g=>g.ok).length,critical=gs.filter(g=>g.item.critical&&!g.ok).length;
   const percent=Math.round(passed/gs.length*100);
   const mastered=percent>=80&&critical===0&&gs.length>=3;
   const status=mastered?"consolidato":(critical>0||percent<60)?"prioritario":"mirato";
   const lessons=course.lessons.filter(l=>l.module===m.id);
   const failed=gs.filter(g=>!g.ok);
   let targets=failed.map(g=>g.item.lesson).filter(id=>id&&validLessons.has(id)&&lessons.some(l=>l.id===id));
   if(critical>0&&SAFE_LESSONS[courseId]?.[m.id])targets.unshift(SAFE_LESSONS[courseId][m.id]);
   if(!mastered&&percent<60)targets.push(...lessons.map(l=>l.id));
   if(!mastered&&!targets.length&&lessons.length)targets.push(lessons[0].id);
   targets=[...new Set(targets)].filter(x=>isId(x));
   return {id:m.id,title:m.title,correct:passed,total:gs.length,percent,criticalErrors:critical,status,lessonIds:mastered?[]:targets};
 });
 const mastered=moduleResults.filter(m=>m.status==="consolidato").length;
 const criticalErrors=moduleResults.reduce((n,m)=>n+m.criticalErrors,0);
 const total=moduleResults.reduce((n,m)=>n+m.total,0);
 const correct=moduleResults.reduce((n,m)=>n+m.correct,0);
 const weak=moduleResults.filter(m=>m.status!=="consolidato");
 // Prioritize safety errors, then the least mastered module.
 const priorities=[...weak].sort((a,b)=>(b.criticalErrors>0?1:0)-(a.criticalErrors>0?1:0)||a.percent-b.percent);
 const lessonIds=[...new Set(priorities.flatMap(m=>m.lessonIds))];
 const level=mastered===4&&criticalErrors===0?"applicazione":mastered>=2?"mirato":"fondamenta";
 const summary=level==="applicazione"
   ?"Hai dimostrato una buona padronanza dei contenuti introduttivi: puoi passare alle prove applicative senza ripartire dalle basi."
   :level==="mirato"
   ?"Hai già solide conoscenze in alcuni moduli: concentrati sulle lacune individuate, senza ripetere tutto il programma."
   :"È consigliato lavorare sui moduli ancora fragili, iniziando dai rischi e dalle procedure fondamentali.";
 return {version:VERSION,courseId,createdAt:new Date().toISOString(),
   percent:Math.round(correct/total*100),correct,total,criticalErrors,masteredCount:mastered,
   level,summary,modules:moduleResults,lessonIds,enabled:true,
   accessibleMode:!!options.accessibleMode,assessmentScope:"fondamenta",
   note:"Diagnosi orientativa di conoscenze introduttive. Non certifica competenze pratiche, padronanza avanzata o sicurezza professionale."};
}
function valid(plan,courseId,course){
 if(!plan||plan.version!==VERSION||plan.courseId!==courseId||!Array.isArray(plan.modules)||plan.modules.length!==course.modules.length||!Array.isArray(plan.lessonIds)||typeof plan.enabled!=="boolean")return false;
 const idset=new Set(course.lessons.map(x=>x.id));
 if(plan.lessonIds.length>12||!plan.lessonIds.every(id=>idset.has(id)))return false;
 if(!["fondamenta","mirato","applicazione"].includes(plan.level))return false;
 if(!Number.isInteger(plan.percent)||plan.percent<0||plan.percent>100||!Number.isInteger(plan.criticalErrors)||plan.criticalErrors<0||!Number.isInteger(plan.masteredCount)||plan.masteredCount<0||plan.masteredCount>4)return false;
 if(!plan.modules.every((m,i)=>m&&m.id===course.modules[i].id&&["consolidato","mirato","prioritario"].includes(m.status)&&Number.isInteger(m.percent)&&m.percent>=0&&m.percent<=100&&Number.isInteger(m.total)&&m.total>=3&&m.total<=20&&Number.isInteger(m.criticalErrors)&&m.criticalErrors>=0))return false;
 return true;
}
function next(plan,course,done=[]){
 if(!plan||!plan.enabled||!valid(plan,plan.courseId,course))return null;
 return plan.lessonIds.find(id=>!done.includes(id))||null;
}
function statusLabel(status){
 return ({consolidato:"Basi verificate",mirato:"Ripasso selettivo",prioritario:"Da approfondire"})[status]||"Da valutare";
}
window.DopoTurnoPlacement={VERSION,build,valid,next,statusLabel};
})();
