'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dataFiles=['academy-sala-data.js','academy-extra-data.js','intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js','turn-tips.js','shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','assessment-ledger.js','exam-recovery.js','confronti-forum.js'];
function browser(initial={}){
 const app={innerHTML:''},storage={dt_design_preview_v1:JSON.stringify(initial)};
 const ctx={
  window:{addEventListener(){},scrollTo(){},print(){}},
  document:{getElementById(id){return id==='app'?app:id==='main'?{focus(){}}:null},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},createElement(){return {remove(){},parentNode:null}},body:{appendChild(){}}},
  localStorage:{getItem(key){return storage[key]||null},setItem(key,value){storage[key]=value},removeItem(key){delete storage[key]}},
  location:{hash:'#academy'},history:{pushState(_a,_b,h){ctx.location.hash=h}},
  setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(ctx);
 for(const file of dataFiles)vm.runInContext(read(file),ctx,{filename:file,timeout:8000});
 const code=read('academy-app.js'),end='render();\n})();';
 assert.equal(code.split(end).length,2);
 vm.runInContext(code.replace(end,'window.TEST={state,saved,render,onAction,submitExam,buildTest,importBackupFile,backupData,draftValid,restoreExam,courseData,computeResult};render();\n})();'),ctx,{timeout:10000});
 return {app,ctx,storage,api:ctx.window.TEST,ledger:ctx.window.DopoTurnoAssessments,recovery:ctx.window.DopoTurnoExamRecovery};
}
test('Assessment journal normalizes old or corrupted records without elevating test scores to credentials',()=>{
 const h=browser({assessments:[
  {type:'Skill Check Sala',percent:78,critical:1,date:'2026-11-05T14:00:00.000Z'},
  {type:'Bad',percent:'NaN',critical:3,date:'yesterday'},
  {type:'Malicious',percent:30,critical:1,date:'invalid',modules:[{id:'__proto__',correct:3,total:3}]}
 ]});
 assert.equal(h.api.saved.assessments.length,2);
 assert.equal(h.api.saved.assessments[0].typeKey,'skill');
 assert.equal(h.api.saved.assessments[0].courseId,'sala');
 assert.equal(h.api.saved.assessments[0].passed,false);
 assert.equal(h.api.saved.assessments[1].date,'');
 h.api.state.page='progress';h.api.render();
 assert.match(h.app.innerHTML,/Storico delle verifiche/);
 assert.match(h.app.innerHTML,/Data non disponibile/);
 assert.doesNotMatch(h.app.innerHTML,/NaN%/);
});
test('Submitting a Skill Check stores only a compact module analysis and remains navigable',()=>{
 const h=browser(),a=h.api;
 a.state.selfAssessment='3';a.buildTest('skill');
 assert.equal(a.state.exam.items.length,20);
 for(const it of a.state.exam.items){
  if(it.type==='visual')a.state.exam.answers[it.id]=it.spots.map(([x,y])=>({x,y}));
  else a.state.exam.answers[it.id]=it.correct;
 }
 a.submitExam();
 assert.equal(a.state.page,'testResults');
 assert.equal(a.saved.assessments.length,1);
 const record=a.saved.assessments[0];
 assert.equal(record.typeKey,'skill');
 assert.equal(record.courseId,'sala');
 assert.equal(record.total,20);
 assert.equal(record.percent,100);
 assert.equal(record.passed,true);
 assert.ok(record.modules.length>=4);
 assert.equal(record.modules.reduce((n,m)=>n+m.total,0),16);
 assert.equal(Object.hasOwn(record,'answers'),false);
 assert.equal(a.saved.examDraft,null);
 a.onAction('progressRole',{dataset:{id:'sala'}});
 a.state.page='progress';a.render();
 assert.match(h.app.innerHTML,/Verifiche salvate/);
 a.onAction('assessmentDetails',{dataset:{id:'0'}});
 assert.match(h.app.innerHTML,/RIEPILOGO FORMATIVO/);
 assert.match(h.app.innerHTML,/Risposte adeguate|risposte adeguate/);
 assert.match(h.app.innerHTML,/Approfondisci il corso/);
});
test('All six course assessments are reconstructed using canonical items; invalid or expired drafts are rejected',()=>{
 const h=browser(),data=h.ctx.window.DT_DATA,REC=h.recovery,providers={DATA:data,courseData:h.api.courseData};
 for(const id of ['sala','cucina','bar','sala-intermedio','cucina-intermedio','bar-intermedio']){
  const course=h.api.courseData(id);
  const questions=id==='sala'?(()=>{const result=[];for(const mod of course.modules){const g=data.questions.filter(x=>x.module===mod.id);for(const i of [1,4,7,10])result.push({...g[i]});}for(const visualId of ['SAL-V01','SAL-V03','SAL-V05','SAL-V08'])result.push({...data.visual_tests.find(x=>x.id===visualId),type:'visual'});return result})():course.skill_questions.map(x=>({...x}));
  const raw={type:'skill',courseId:id==='sala'?undefined:id,index:0,answers:{},submitted:false,items:questions,version:data.version,started:Date.now(),savedAt:Date.now(),selfAssessment:'3'};
  const restored=REC.sanitize(raw,providers);
  assert.ok(restored,id);
  assert.equal(restored.items.length,questions.length);
  assert.ok(REC.portable(raw,providers).items.every(x=>Object.keys(x).length===1));
  const tampered={...raw,items:[...questions]};
  tampered.items[0]={id:'FAKE-SC-000'};
  assert.equal(REC.sanitize(tampered,providers),null,id+' mismatched question IDs rejected');
 }
});
test('Portability saves suspended answers, never exports scoring keys, and rejects stale or malicious responses',async()=>{
 const h=browser(),a=h.api;
 a.state.selfAssessment='4';a.buildTest('skill');
 a.state.exam.answers[a.state.exam.items[0].id]=1;
 a.state.exam.index=1;
 const raw=a.saved.examDraft;
 // draft is persisted on each change in the real app
 raw.answers[a.state.exam.items[0].id]=1;raw.index=1;
 const backup=a.backupData();
 assert.equal(backup.examDraft.index,1);
 assert.ok(backup.examDraft.items.every(x=>Object.keys(x).join(',')==='id'));
 assert.equal(JSON.stringify(backup.examDraft).includes('"correct"'),false);
 const files={format:'dopoturno-demo-backup-v1',data:backup};
 await a.importBackupFile({size:JSON.stringify(files).length,text:async()=>JSON.stringify(files)});
 assert.equal(a.draftValid(),true);
 a.restoreExam();
 assert.equal(a.state.page,'testRun');
 assert.equal(a.state.exam.index,1);
 assert.equal(a.state.exam.answers[a.state.exam.items[0].id],1);
 const invalid=h.recovery.sanitize({...backup.examDraft,answers:{EVIL:3}},{DATA:h.ctx.window.DT_DATA,courseData:a.courseData});
 assert.equal(invalid,null);
 assert.equal(h.recovery.sanitize({...backup.examDraft,savedAt:Date.now()-73*3600_000},{DATA:h.ctx.window.DT_DATA,courseData:a.courseData}),null);
});
