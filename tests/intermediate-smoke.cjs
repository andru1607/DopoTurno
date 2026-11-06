'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const files=['intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js','turn-tips.js','shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js'];
function engine(){
 const sandbox={window:{}};vm.createContext(sandbox);
 for(const f of files)vm.runInContext(read(f),sandbox,{filename:f,timeout:5000});
 return sandbox.window;
}
function grade(w,id,bad=[]){
 const c=w.DT_INTERMEDIATE_COURSES[id],badSet=new Set(bad);
 return w.DopoTurnoPlacement.build(id,c,c.skill_questions.map(item=>({item,ok:!badSet.has(item.id)})));
}
test('Three distinct intermediate curricula have substantive and complete lesson material',()=>{
 const w=engine(),courses=w.DT_INTERMEDIATE_COURSES;
 assert.deepEqual(Object.keys(courses).sort(),['bar-intermedio','cucina-intermedio','sala-intermedio']);
 const allIds=new Set();
 for(const c of Object.values(courses)){
  assert.equal(c.level,'intermedio');
  assert.equal(c.modules.length,4);
  assert.equal(c.lessons.length,12);
  assert.equal(c.questions.length,24);
  assert.equal(c.skill_questions.length,16);
  assert.equal(c.final_questions.length,8);
  for(const l of c.lessons){
   assert.ok(!allIds.has(l.id),'Duplicate '+l.id);allIds.add(l.id);
   assert.ok(c.modules.some(m=>m.id===l.module),l.id);
   assert.equal(l.sections.length,3,l.id);
   assert.ok(l.steps.length>=4&&l.errors.length>=3,l.id);
   assert.ok(l.case.length>180&&l.practice.length>70,l.id);
   assert.ok([l.intro,...l.sections.map(x=>x.text),l.case,l.practice,...l.steps,...l.errors].join(' ').split(/\s+/).length>=200,l.id);
   assert.ok(l.sections.every(s=>s.text.length>135),l.id);
   assert.ok(c.questions.some(q=>q.lesson===l.id),l.id);
  }
  const ids=new Set();
  for(const q of [...c.questions,...c.skill_questions,...c.final_questions]){
   assert.ok(!ids.has(q.id),'duplicate question '+q.id);ids.add(q.id);
   assert.equal(q.options.length,3,q.id);
   assert.ok(q.correct>=0&&q.correct<=2,q.id);
   assert.ok(q.prompt.length>40&&q.explanation.length>28,q.id);
  }
  for(const module of c.modules)assert.equal(c.skill_questions.filter(q=>q.module===module.id).length,4,module.id);
 }
 assert.equal(allIds.size,36);
});
test('No automatic qualification: full success routes to applied work but not a certificate',()=>{
 const w=engine();
 for(const id of Object.keys(w.DT_INTERMEDIATE_COURSES)){
  const c=w.DT_INTERMEDIATE_COURSES[id],p=grade(w,id);
  assert.ok(w.DopoTurnoPlacement.valid(p,id,c),id);
  assert.equal(p.masteredCount,4,id);
  assert.equal(p.level,'applicazione',id);
  assert.equal(p.lessonIds.length,0,id);
  assert.equal(p.assessmentScope,'intermedio',id);
  assert.match(p.note,/Non certifica/);
 }
});
test('Critical errors are prioritized even with 15 correct of 16',()=>{
 const w=engine();
 for(const id of Object.keys(w.DT_INTERMEDIATE_COURSES)){
  const c=w.DT_INTERMEDIATE_COURSES[id],critical=c.skill_questions.find(q=>q.critical);
  assert.ok(critical,id);
  const p=grade(w,id,[critical.id]);
  assert.equal(p.percent,94,id);
  assert.ok(p.criticalErrors>=1,id);
  assert.notEqual(p.level,'applicazione',id);
  const module=p.modules.find(m=>m.id===critical.module);
  assert.equal(module.status,'prioritario',id);
  assert.ok(w.DopoTurnoPlacement.next(p,c,[]),id);
 }
});
test('Course references, deep links and privacy backups remain connected',()=>{
 const app=read('academy-app.js'),html=read('index.html');
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'academy-app.js'}));
 assert.match(app,/ALL_COURSES=\{\.\.\.EXTRA,\.\.\.INTER\}/);
 assert.match(app,/SAL-I/);
 assert.match(app,/cucina-intermedio/);
 assert.match(app,/clean\.placements/);
 assert.match(app,/courseData\(e\.courseId\)\.title/);
 assert.match(app,/nessun feedback durante la prova/i);
 for(const src of files)assert.ok(html.includes(src),src);
 assert.doesNotMatch(html,/<script>(?:.|\n)*?<\/script>/);
});
test('Boot, navigation, all test flows and resume are runnable without a backend',()=>{
 const source=['academy-sala-data.js','academy-extra-data.js',...files].map(read).join('\n');
 const root={innerHTML:''},storage={},events={};
 const sandbox={
   window:{addEventListener(){},scrollTo(){},print(){}},
   document:{getElementById:n=>n==='app'?root:null,addEventListener(n,fn){events[n]=fn},querySelector(){return null},createElement(){return {remove(){}}},body:{appendChild(){}}},
   localStorage:{getItem:k=>storage[k]||null,setItem(k,v){storage[k]=v}},
   location:{hash:'#academy'},
   history:{pushState(_,__,hash){sandbox.location.hash=hash}},
   setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox,{timeout:5000});
 const original=read('academy-app.js'),tail='render();\n})();';
 assert.equal(original.split(tail).length,2);
 vm.runInContext(original.replace(tail,'window.TEST={state,saved,render,onAction,buildTest,submitExam,placementFor,courseData};render();\n})();'),sandbox,{timeout:8000});
 const api=sandbox.window.TEST;
 assert.match(root.innerHTML,/Sala intermedia/);
 assert.match(root.innerHTML,/Bar intermedio/);
 for(const id of ['sala-intermedio','cucina-intermedio','bar-intermedio']){
   api.onAction('openCourse',{dataset:{id}});
   assert.equal(api.state.page,'microCourse',id);
   const first=api.courseData(id).lessons[0];
   api.onAction('lesson',{dataset:{id:first.id}});
   assert.equal(api.state.page,'microStep',id);
   api.onAction('microOpen',{dataset:{id:first.id,step:'4'}});
   assert.ok(root.innerHTML.includes(api.courseData(id).questions[0].prompt),id);
   api.state.selfAssessment='4';api.buildTest('skill');
   assert.equal(api.state.exam.items.length,16,id);
   assert.doesNotMatch(root.innerHTML,/Risposta corretta:/i);
   for(const q of api.state.exam.items)api.state.exam.answers[q.id]=q.correct;
   api.submitExam();
   assert.equal(api.placementFor(id).level,'applicazione',id);
   assert.equal(api.state.page,'testResults',id);
   api.onAction('openRecommended',{dataset:{id}});
   assert.equal(api.state.exam.type,'final',id);
   assert.equal(api.state.exam.items.length,8,id);
 }
});
