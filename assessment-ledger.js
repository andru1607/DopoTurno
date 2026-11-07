/* DopoTurno Academy 2.6 | Private, advisory assessment history.
   This is a client-side learning journal, never an audited qualification. */
(function(){
'use strict';
const KINDS=new Set(['skill','final','module','visual','photo']);
const COURSE_IDS=new Set(['sala','cucina','bar','sala-intermedio','cucina-intermedio','bar-intermedio']);
const clamp=(n,max)=>Math.max(0,Math.min(max,Math.floor(n)));
function count(n,max){return typeof n==='number'&&Number.isFinite(n)?clamp(n,max):0}
function safeDate(raw){
 if(typeof raw!=='string'||raw.length>45)return '';
 const ms=Date.parse(raw);
 return Number.isFinite(ms)&&ms>=0&&ms<4102444800000?new Date(ms).toISOString():'';
}
function displayDate(raw){
 const s=safeDate(raw);
 return s?new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(s)):'Data non disponibile';
}
function normalizeOne(raw,getCourse){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||typeof raw.type!=='string')return null;
 const label=raw.type.trim().slice(0,70);
 if(!label||!Number.isFinite(Number(raw.percent)))return null;
 const courseId=COURSE_IDS.has(raw.courseId)?raw.courseId:(label.includes('Sala')?'sala':null);
 const course=courseId?getCourse(courseId):null;
 const kind=KINDS.has(raw.typeKey)?raw.typeKey:(label.startsWith('Skill Check')?'skill':label.includes('finale')||label.includes('final')?'final':label.includes('modulo')?'module':null);
 const percent=clamp(Number(raw.percent),100),critical=count(raw.critical,40);
 const total=count(raw.total,100),correct=Math.min(total,count(raw.correct,100));
 const validModules=new Map((course?.modules||[]).map(x=>[x.id,x]));
 const groups=Array.isArray(raw.modules)?raw.modules.slice(0,10).filter(x=>x&&typeof x==='object'&&validModules.has(x.id)).map(x=>{
  const t=count(x.total,40),c=Math.min(t,count(x.correct,40));
  return {id:x.id,title:validModules.get(x.id).title,total:t,correct:c,critical:Math.min(t,count(x.critical,40)),percent:t?Math.round(c/t*100):0};
 }):[];
 const unique=[...new Map(groups.map(x=>[x.id,x])).values()].slice(0,4);
 return {type:label,typeKey:kind,courseId:course?.id||courseId,moduleId:validModules.has(raw.moduleId)?raw.moduleId:null,
  percent,critical,date:safeDate(raw.date),passed:typeof raw.passed==='boolean'?raw.passed:percent>=80&&critical===0,
  total,correct,modules:unique,accessibleMode:!!raw.accessibleMode};
}
function normalize(raw,getCourse){
 if(!Array.isArray(raw))return [];
 return raw.slice(-100).map(a=>normalizeOne(a,getCourse)).filter(Boolean);
}
function fromExam(exam,result,course){
 const label=exam.courseId?({skill:'Skill Check',final:'Prova finale',module:'Verifica modulo'})[exam.type]+' · '+course.title:
  ({skill:'Skill Check Sala',final:'Esame finale Sala',module:'Verifica modulo',visual:'Prova visiva',photo:'Caso professionale illustrato'})[exam.type];
 const groups=course.modules.map(mod=>{
  const grades=result.grades.filter(g=>g.item?.module===mod.id);
  const correct=grades.filter(g=>g.ok).length;
  return {id:mod.id,title:mod.title,total:grades.length,correct,critical:grades.filter(g=>g.item?.critical&&!g.ok).length,percent:grades.length?Math.round(correct/grades.length*100):0};
 }).filter(x=>x.total>0);
 return normalizeOne({
  type:label||'Verifica formativa',typeKey:exam.type,courseId:course.id,moduleId:exam.type==='module'?exam.id:null,
  percent:result.percent,critical:result.errors,date:new Date().toISOString(),passed:result.passed,
  correct:result.correct,total:exam.items.length,modules:groups,accessibleMode:exam.accessibleMode
 },id=>id===course.id?course:null);
}
function focusAreas(entry){
 if(!entry?.modules?.length)return [];
 return entry.modules.filter(x=>x.critical>0||x.percent<80).sort((a,b)=>(b.critical-a.critical)||(a.percent-b.percent)).map(x=>({id:x.id,title:x.title,critical:x.critical,percent:x.percent}));
}
function latest(raw,courseId,getCourse,kind=null){
 return normalize(raw,getCourse).filter(a=>a.courseId===courseId&&(!kind||a.typeKey===kind)).slice(-1)[0]||null;
}
window.DopoTurnoAssessments={normalize,normalizeOne,fromExam,focusAreas,latest,safeDate,displayDate};
})();