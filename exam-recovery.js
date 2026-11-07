/* DopoTurno Academy 2.6 | Canonical reconstruction for suspended assessments.
   Imported backup data is never trusted as question text, scoring rules or keys. */
(function(){
'use strict';
const TTL=72*60*60*1000;
const MODES=new Set(['skill','final','module','visual','photo']);
function expected(type,id,courseId,providers,accessible){
 const course=providers.courseData(courseId);
 if(!course)return null;
 const data=providers.DATA;
 let items;
 if(courseId!=='sala'){
  items=type==='skill'?course.skill_questions:type==='final'?course.final_questions:type==='module'?course.questions.filter(q=>q.module===id):null;
 }else if(type==='skill'){
  items=[];
  for(const mod of course.modules){
   const group=data.questions.filter(q=>q.module===mod.id);
   for(const index of [1,4,7,10])if(group[index])items.push(group[index]);
  }
  for(const vid of ['SAL-V01','SAL-V03','SAL-V05','SAL-V08']){
   const v=data.visual_tests.find(x=>x.id===vid);if(v)items.push({...v,type:'visual'});
  }
 }else if(type==='final')items=data.final_questions;
 else if(type==='module')items=data.questions.filter(x=>x.module===id);
 else if(type==='visual')items=data.visual_tests.filter(x=>x.id===id).map(x=>({...x,type:'visual'}));
 else if(type==='photo')items=data.photo_tests.filter(x=>x.id===id).map(x=>({...x,type:'choice'}));
 if(!Array.isArray(items)||!items.length||items.length>50)return null;
 return items.map(item=>{
  if(accessible&&courseId==='sala'&&item.type==='visual'&&item.accessible_variant)return {...item,...item.accessible_variant,type:'choice',accessibleSubstitution:true};
  return {...item};
 });
}
function sanitize(raw,providers){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.submitted||!MODES.has(raw.type)||raw.version!==providers.DATA.version)return null;
 const now=Date.now();
 if(!Number.isFinite(raw.savedAt)||raw.savedAt>now+60000||now-raw.savedAt>TTL||now-raw.savedAt<0)return null;
 const courseId=typeof raw.courseId==='string'?raw.courseId:'sala',c=providers.courseData(courseId);
 if(!c)return null;
 if(courseId!=='sala'&&['visual','photo'].includes(raw.type))return null;
 const id=typeof raw.id==='string'?raw.id:null,accessible=courseId==='sala'&&!!raw.accessibleMode;
 const items=expected(raw.type,id,courseId,providers,accessible);
 if(!items||!Array.isArray(raw.items)||raw.items.length!==items.length||!Number.isInteger(raw.index)||raw.index<0||raw.index>=items.length)return null;
 // No arbitrary item metadata, reordered questions, injected keys or unknown IDs.
 if(items.some((it,index)=>it.id!==raw.items[index]?.id))return null;
 const answers=Object.create(null),received=raw.answers;
 if(!received||typeof received!=='object'||Array.isArray(received))return null;
 const known=new Set(items.map(it=>it.id));
 if(Object.keys(received).some(key=>!known.has(key)))return null;
 for(const item of items){
  if(!Object.prototype.hasOwnProperty.call(received,item.id))continue;
  const answer=received[item.id];
  if(item.type==='visual'){
   if(!Array.isArray(answer)||answer.length>10)return null;
   if(!answer.every(p=>p&&typeof p==='object'&&!Array.isArray(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=900&&p.y>=0&&p.y<=520))return null;
   answers[item.id]=answer.map(p=>({x:p.x,y:p.y}));
  }else{
   if(!Number.isInteger(answer)||!Array.isArray(item.options)||answer<0||answer>=item.options.length)return null;
   answers[item.id]=answer;
  }
 }
 return {type:raw.type,id,courseId:courseId==='sala'&&raw.courseId==null?undefined:courseId,
  items,index:raw.index,answers,started:Number.isFinite(raw.started)?Math.min(now,Math.max(0,raw.started)):now,
  submitted:false,selfAssessment:raw.type==='skill'&&['1','2','3','4'].includes(raw.selfAssessment)?raw.selfAssessment:null,
  accessibleMode:accessible,version:providers.DATA.version,savedAt:raw.savedAt};
}
function portable(raw,providers){
 const valid=sanitize(raw,providers);
 if(!valid)return null;
 return {version:valid.version,savedAt:valid.savedAt,started:valid.started,type:valid.type,id:valid.id,
  courseId:valid.courseId,index:valid.index,selfAssessment:valid.selfAssessment,accessibleMode:valid.accessibleMode,
  submitted:false,items:valid.items.map(it=>({id:it.id})),answers:valid.answers};
}
window.DopoTurnoExamRecovery={sanitize,portable};
})();