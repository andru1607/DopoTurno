'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const dataFiles=['academy-sala-data.js','academy-extra-data.js','intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js'];
function setup(){
 const app={innerHTML:''},storage={},handlers={};let typed='';
 const browser={
  window:{addEventListener(){},scrollTo(){},print(){}},
  document:{getElementById(id){return id==='app'?app:id==='microCaseResponse'?{value:typed}:null},addEventListener(k,v){handlers[k]=v},querySelector(){return null},createElement(){return {remove(){},parentNode:null}},body:{appendChild(){}}},
  localStorage:{getItem:k=>storage[k]||null,setItem(k,v){storage[k]=v}},
  location:{hash:'#academy'},history:{pushState(_a,_b,h){browser.location.hash=h}},
  setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(browser);
 for(const file of dataFiles)vm.runInContext(read(file),browser,{filename:file,timeout:5000});
 const code=read('academy-app.js'),tail='render();\n})();';
 assert.equal(code.split(tail).length,2,'app test hooks');
 vm.runInContext(code.replace(tail,'window.TEST={state,saved,render,onAction,buildTest,submitExam,courseData,placementFor,microContext,backupData,readRoute};render();\n})();'),browser,{filename:'academy-app.js',timeout:9000});
 return {browser,app,storage,api:browser.window.TEST,micro:browser.window.DopoTurnoMicro,placement:browser.window.DopoTurnoPlacement,setText:t=>typed=t};
}
test('Seventy-two chapters generate 360 short activities; no legacy progress is discarded',()=>{
 const t=setup(),all=['sala','cucina','bar','sala-intermedio','cucina-intermedio','bar-intermedio'];
 assert.equal(all.reduce((n,id)=>n+t.api.courseData(id).lessons.length,0),72);
 assert.equal(all.reduce((n,id)=>n+t.micro.courseMetrics(t.api.microContext(),t.api.courseData(id)).total,0),360);
 assert.match(t.app.innerHTML,/Una competenza alla volta/);
 for(const id of all){t.api.onAction('openCourse',{dataset:{id}});assert.equal(t.api.state.page,'microCourse');assert.equal(t.api.state.activeCourse,id);assert.match(t.app.innerHTML,/12 capitoli/);}
 assert.equal(t.api.saved.done.length,0);
});
test('Professional five-step activity: autosaved case, delayed quiz feedback and review schedule',()=>{
 const t=setup(),id='CUC-I001',cid='cucina-intermedio';
 t.api.onAction('microOpen',{dataset:{id,step:'0'}});
 assert.equal(t.api.state.microAt.index,0);
 for(let index=1;index<=3;index++){
   t.api.onAction('microFinish',{dataset:{}});
   assert.equal(t.api.state.microAt.index,index);
 }
 assert.equal(t.micro.courseMetrics(t.api.microContext(),t.api.courseData(cid)).completed,3);
 t.setText('Valuto i limiti della postazione, definisco responsabilità, traccio la scelta e verifico prima del rilascio.');
 t.api.onAction('microFinish',{dataset:{}});
 assert.equal(t.api.state.microAt.index,4);
 const qs=t.api.courseData(cid).questions.filter(q=>q.lesson===id).slice(0,2);
 assert.equal(qs.length,2);
 assert.doesNotMatch(t.app.innerHTML,/Punto da rivedere/);
 // Formative quizzes permit correction after submission, never during Skill Check.
 for(const q of qs)t.api.onAction('microPick',{dataset:{id:q.id,step:String((q.correct+1)%3)}});
 t.api.onAction('microGrade',{dataset:{}});
 assert.equal(t.api.state.microGraded.passed,false);
 assert.equal(t.api.saved.done.includes(id),false);
 t.api.onAction('microRetry',{dataset:{}});
 for(const q of qs)t.api.onAction('microPick',{dataset:{id:q.id,step:String(q.correct)}});
 t.api.onAction('microGrade',{dataset:{}});
 assert.equal(t.api.state.microGraded.passed,true);
 assert.match(t.app.innerHTML,/Verifica formativa completata/);
 t.api.onAction('microFinish',{dataset:{}});
 assert.equal(t.api.saved.done.includes(id),true);
 assert.equal(t.api.saved.microProgress[id].done.length,5);
 assert.equal(typeof t.api.saved.microResponses[id],'string');
 assert.equal(t.api.saved.microReviews[id].level,0);
 assert.ok(t.api.saved.microReviews[id].dueAt>Date.now());
 assert.equal(t.api.state.microAt.lessonId,'CUC-I002');
});
test('Skill Check placement skips already-known reading but does not falsely mark it as studied',()=>{
 const t=setup(),course=t.api.courseData('bar-intermedio'),critical=course.skill_questions.find(q=>q.critical);
 const p=t.placement.build(course.id,course,course.skill_questions.map(q=>({item:q,ok:q.id!==critical.id})));
 assert.ok(p.criticalErrors>0);
 assert.notEqual(p.level,'applicazione');
 t.api.saved.placements={...t.api.saved.placements,[course.id]:p};
 const suggested=t.micro.recommendation(t.api.microContext(),course.id);
 assert.equal(suggested.kind,'step');
 assert.ok(suggested.index>=1);
 assert.equal(t.api.saved.done.length,0);
 t.api.onAction('microContinue',{dataset:{id:course.id}});
 assert.equal(t.api.state.page,'microStep');
 assert.ok(t.api.state.microAt.index>=1);
 assert.equal(t.api.saved.microProgress[critical.lesson]?.done?.length||0,0);
});
test('Perfect basic diagnostic recommends the intermediate course instead of redoing the basics',()=>{
 const t=setup(),course=t.api.courseData('bar'),p=t.placement.build('bar',course,course.skill_questions.map(item=>({item,ok:true})));
 assert.equal(p.level,'applicazione');
 t.api.saved.placements={bar:p};
 const next=t.micro.recommendation(t.api.microContext(),'bar');
 assert.equal(next.kind,'course');assert.equal(next.courseId,'bar-intermedio');
 t.api.onAction('microContinue',{dataset:{id:'bar'}});
 assert.equal(t.api.state.activeCourse,'bar-intermedio');
 assert.equal(t.api.state.page,'microCourse');
 assert.equal(t.api.saved.done.length,0);
});
test('Scheduled review advances the interval only upon successful re-test',()=>{
 const t=setup(),cid='sala-intermedio',id='SAL-I001';
 t.api.saved.microReviews[id]={level:0,dueAt:Date.now()-1000,lastAt:Date.now()-86400000,lastPassed:true};
 assert.equal(t.micro.dueReviews(t.api.microContext()).length,1);
 t.api.onAction('microStartReview',{dataset:{id}});
 assert.equal(t.api.state.microAt.review,true);
 assert.equal(t.api.state.microAt.index,4);
 const q=t.api.courseData(cid).questions.filter(x=>x.lesson===id).slice(0,2);
 for(const item of q)t.api.onAction('microPick',{dataset:{id:item.id,step:String(item.correct)}});
 t.api.onAction('microGrade',{dataset:{}});
 t.api.onAction('microFinish',{dataset:{}});
 assert.equal(t.api.state.page,'microReviews');
 assert.equal(t.api.saved.microReviews[id].level,1);
 assert.equal(t.micro.dueReviews(t.api.microContext()).length,0);
 assert.ok(t.api.saved.microReviews[id].dueAt>Date.now()+2*86400000);
});
test('Backup sanitation retains only known lesson IDs and limits private writing',()=>{
 const t=setup(),known='SAL-I001';
 const raw={microProgress:{[known]:{done:['contesto','contesto','caso','non-existent'],updatedAt:'2026-11-05T14:00:00'}},microReviews:{[known]:{level:99,dueAt:12345},'evil':{level:0,dueAt:12345}},microResponses:{[known]:'x'.repeat(3000),evil:'inject'},microLast:{courseId:'sala-intermedio',lessonId:known,index:3}};
 const restored=t.micro.restore(raw,[...t.api.courseData('sala').lessons,...t.api.courseData('sala-intermedio').lessons],id=>id.includes('-I')?'sala-intermedio':'sala');
 assert.equal(Object.keys(restored.microProgress).length,1);
 assert.equal(restored.microProgress[known].done.length,2);
 assert.equal(restored.microReviews[known],undefined);
 assert.equal(restored.microResponses[known].length,1500);
 assert.equal(restored.microResponses.evil,undefined);
 assert.equal(restored.microLast.index,3);
 assert.ok(t.api.backupData().microProgress);
 assert.ok(read('academy-app.js').includes('MICRO.restore(d,allCourseLessons(),courseForLesson)'));
});
test('Deep links do not execute scripts, and diagnosis is free from microlearning feedback',()=>{
 const t=setup(),file=read('index.html'),app=read('academy-app.js'),micro=read('microlearning.js');
 assert.match(file,/microlearning\.js\?v=2\.2/);
 assert.match(file,/microlearning\.css\?v=2\.2/);
 assert.doesNotMatch(file,/<script>(?:.|\n)*?<\/script>/);
 assert.ok(app.includes('microStep'));
 assert.ok(app.includes('microCourse'));
 assert.match(micro,/Le soluzioni compaiono solo dopo/);
 t.api.state.activeCourse='cucina-intermedio';t.api.state.selfAssessment='4';t.api.buildTest('skill');
 assert.equal(t.api.state.exam.items.length,16);
 assert.doesNotMatch(t.app.innerHTML,/Verifica formativa completata|Punto da rivedere/);
});