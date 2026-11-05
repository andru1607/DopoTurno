'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const load=file=>fs.readFileSync(path.join(root,file),'utf8');
function setup(){
 const sandbox={window:{},Date};
 vm.createContext(sandbox);
 for(const file of ['academy-sala-data.js','academy-extra-data.js','learning-path.js'])vm.runInContext(load(file),sandbox,{filename:file,timeout:5000});
 return {engine:sandbox.window.DopoTurnoPlacement,sala:sandbox.window.DT_DATA,other:sandbox.window.DT_EXTRA_COURSES};
}
function salaQuestions(d){
 const questions=[];
 for(const m of d.modules){const group=d.questions.filter(q=>q.module===m.id);for(const ix of [1,4,7,10])questions.push(group[ix]);}
 for(const id of ['SAL-V01','SAL-V03','SAL-V05','SAL-V08'])questions.push({...d.visual_tests.find(q=>q.id===id),type:'visual'});
 return questions;
}
function assess(e,id,course,items,bad=[]){
 const b=new Set(bad);
 return e.build(id,course,items.map(item=>({item,ok:!b.has(item.id)})));
}
test('A full Skill Check does not force an experienced worker to repeat the foundations',()=>{
 const {engine:e,sala:d,other}=setup();
 const cases=[['sala',{modules:d.modules,lessons:d.lessons},salaQuestions(d)],...['cucina','bar'].map(id=>[id,other[id],other[id].skill_questions])];
 for(const [id,course,items] of cases){
   const p=assess(e,id,course,items);
   assert.ok(e.valid(p,id,course),id);
   assert.equal(p.level,'applicazione',id);
   assert.equal(p.masteredCount,4,id);
   assert.equal(p.criticalErrors,0,id);
   assert.equal(p.lessonIds.length,0,id);
   assert.equal(e.next(p,course,[]),null,id);
   assert.equal(p.assessmentScope,'fondamenta',id);
   assert.ok(p.note.includes('Non certifica'),id);
 }
});
test('Critical allergen mistakes trigger a targeted safety lesson even with a high score',()=>{
 const {engine:e,sala:d,other}=setup();
 const cases=[
 ['sala',{modules:d.modules,lessons:d.lessons},salaQuestions(d),'Q023','SAL-006'],
 ['cucina',other.cucina,other.cucina.skill_questions,'CUC-SC18','CUC-006'],
 ['bar',other.bar,other.bar.skill_questions,'BAR-SC18','BAR-009']
 ];
 for(const [id,course,items,failed,expected] of cases){
   const p=assess(e,id,course,items,[failed]);
   assert.ok(p.percent>=90,id);
   assert.notEqual(p.level,'applicazione',id);
   assert.ok(p.criticalErrors>=1,id);
   assert.equal(e.next(p,course,[]),expected,id);
   assert.ok(p.modules.some(m=>m.status==='prioritario'),id);
 }
});
test('Missing several fundamentals gives a foundations path without false certificates',()=>{
 const {engine:e,sala:d}=setup();
 const c={modules:d.modules,lessons:d.lessons},qs=salaQuestions(d);
 const p=assess(e,'sala',c,qs,qs.map(q=>q.id));
 assert.equal(p.level,'fondamenta');
 assert.equal(p.masteredCount,0);
 assert.ok(p.lessonIds.length>=9);
 assert.ok(e.next(p,c,[]));
 assert.ok(e.valid(p,'sala',c));
});
test('Recommendations do not become completed lessons, and the user may choose manual navigation',()=>{
 const {engine:e,sala:d}=setup();
 const c={modules:d.modules,lessons:d.lessons},qs=salaQuestions(d);
 const p=assess(e,'sala',c,qs,['Q023']);
 const first=e.next(p,c,[]);
 assert.equal(first,'SAL-006');
 assert.equal(e.next(p,c,[first]),null);
 p.enabled=false;
 assert.equal(e.next(p,c,[]),null);
 assert.ok(e.valid(p,'sala',c));
});
test('Malformed, unrelated or incomplete stored placements are rejected',()=>{
 const {engine:e,sala:d}=setup();
 const c={modules:d.modules,lessons:d.lessons},qs=salaQuestions(d);
 const p=assess(e,'sala',c,qs);
 assert.equal(e.valid(p,'bar',c),false);
 assert.equal(e.valid({...p,modules:p.modules.slice(0,3)},'sala',c),false);
 assert.equal(e.valid({...p,lessonIds:['INJECTED']},'sala',c),false);
 assert.equal(e.build('sala',c,qs.slice(0,4).map(item=>({item,ok:true}))),null);
});
test('Diagnostic feedback is only integrated into results and course paths, not testRun',()=>{
 const app=load('academy-app.js'),html=load('index.html');
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'academy-app.js'}));
 assert.match(app,/e\.type==='skill'.*PLACEMENT\.build/);
 assert.match(app,/e\.type==="skill"\?placementPanel/);
 assert.match(app,/function placementFor/);
 assert.match(app,/recommendedLessonId/);
 const testRun=app.slice(app.indexOf('function testRun(){'),app.indexOf('function gradeItem('));
 assert.doesNotMatch(testRun,/placementPanel|PLACEMENT\.build/);
 assert.match(html,/learning-path\.js\?v=2\.2/);
 assert.match(html,/learning-path\.css\?v=2\.2/);
 assert.match(html,/microlearning\.js\?v=2\.2/);
});
