'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=['academy-sala-data.js','academy-extra-data.js','intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js','turn-tips.js','shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','assessment-ledger.js','exam-recovery.js'];
function setup(data={},hash='#academy'){
 const app={innerHTML:''},storage={dt_design_preview_v1:JSON.stringify(data)},handlers={};
 const dom={
  window:{addEventListener(){},scrollTo(){},print(){}},
  document:{getElementById(id){return id==='app'?app:id==='main'?{focus(){}}:null},addEventListener(k,v){handlers[k]=v},querySelector(){return null},querySelectorAll(){return []},createElement(){return {remove(){},parentNode:null}},body:{appendChild(){}}},
  localStorage:{getItem:key=>storage[key]||null,setItem(key,value){storage[key]=value}},
  location:{hash},history:{pushState(_a,_b,to){dom.location.hash=to}},
  setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(dom);
 for(const file of files)vm.runInContext(read(file),dom,{filename:file,timeout:5000});
 const src=read('academy-app.js'),tail='render();\n})();';
 assert.equal(src.split(tail).length,2);
 vm.runInContext(src.replace(tail,'window.TEST={state,saved,render,onAction,readRoute,backupData,courseData};render();\n})();'),dom,{filename:'academy-app.js',timeout:9000});
 return {app,dom,storage,api:dom.window.TEST};
}
test('Academy homepage exposes one clear next step, three roles and concise learning navigation',()=>{
 const h=setup();
 assert.equal(h.api.state.page,'academy');
 assert.match(h.app.innerHTML,/La tua formazione, senza confusione/);
 assert.match(h.app.innerHTML,/Da dove vuoi continuare/);
 assert.equal((h.app.innerHTML.match(/data-action="academyRole"/g)||[]).length,3);
 assert.equal((h.app.innerHTML.match(/class="hub-course-card"/g)||[]).length,2);
 for(const text of ['Skill Check','Simulazioni','Progressi','Trucchi del turno','Una competenza alla volta'])assert.ok(h.app.innerHTML.includes(text),text);
 assert.match(h.app.innerHTML,/data-page="academy" aria-current="page"/);
 assert.match(h.app.innerHTML,/I progressi rimangono nel browser/);
});
test('Role tabs switch course, diagnostic and recommendation together',()=>{
 const h=setup();
 for(const role of ['cucina','bar','sala']){
  h.api.onAction('academyRole',{dataset:{id:role}});
  assert.equal(h.api.state.activeCourse,role);
  assert.equal(h.api.saved.activeCourse,role);
  assert.match(h.app.innerHTML,new RegExp('data-id="'+role+'" aria-pressed="true"'));
  assert.match(h.app.innerHTML,new RegExp('data-id="'+role+'-intermedio"'));
  assert.equal((h.app.innerHTML.match(/class="hub-course-card"/g)||[]).length,2);
 }
 h.api.onAction('academyRole',{dataset:{id:'nonsense'}});
 assert.equal(h.api.state.activeCourse,'sala');
});
test('The course program has four usable accordions with only one module expanded',()=>{
 const h=setup();
 h.api.onAction('openCourse',{dataset:{id:'cucina'}});
 assert.equal(h.api.state.page,'microCourse');
 assert.equal((h.app.innerHTML.match(/data-action="microToggleModule"/g)||[]).length,4);
 assert.equal((h.app.innerHTML.match(/class="micro-chapter"/g)||[]).length,3);
 assert.equal((h.app.innerHTML.match(/aria-expanded="true"/g)||[]).length,1);
 const mod=h.api.courseData('cucina').modules[1].id;
 h.api.onAction('microToggleModule',{dataset:{id:mod}});
 assert.equal(h.api.state.microModuleOpen.cucina,mod);
 assert.match(h.app.innerHTML,new RegExp('data-id="'+mod+'" aria-expanded="true" aria-controls="micro-module-'+mod+'"'));
 assert.equal((h.app.innerHTML.match(/class="micro-chapter"/g)||[]).length,3);
 h.api.onAction('microToggleModule',{dataset:{id:mod}});
 assert.equal((h.app.innerHTML.match(/class="micro-chapter"/g)||[]).length,0);
 assert.equal((h.app.innerHTML.match(/aria-expanded="true"/g)||[]).length,0);
});
test('Activity flow keeps a single main landmark and works after module selection',()=>{
 const h=setup();h.api.onAction('openCourse',{dataset:{id:'bar-intermedio'}});
 h.api.onAction('microOpen',{dataset:{id:'BAR-I001',step:'0'}});
 assert.equal(h.api.state.page,'microStep');
 assert.equal((h.app.innerHTML.match(/<main\b/g)||[]).length,1);
 assert.match(h.app.innerHTML,/<section class="micro-lesson-panel">/);
 h.api.onAction('microFinish',{dataset:{}});
 assert.equal(h.api.state.microAt.index,1);
 assert.ok(h.api.saved.microProgress['BAR-I001'].done.includes('contesto'));
 assert.equal(JSON.parse(h.storage.dt_design_preview_v1).microProgress['BAR-I001'].done[0],'contesto');
});
test('Damaged browser storage and malformed URL hash cannot break the Academy',()=>{
 const h=setup({done:'not-array',assessments:{type:'oops'},notes:99,activeCourse:'evil',readingSize:42},'#%NOT-VALID-URI');
 assert.equal(h.api.state.page,'academy');
 assert.equal(h.api.state.activeCourse,'sala');
 assert.equal(h.api.saved.done.length,0);
 assert.equal(h.api.saved.assessments.length,0);
 assert.equal(typeof h.api.saved.notes,'object');
 assert.equal(h.api.saved.readingSize,'medium');
 assert.match(h.app.innerHTML,/Da dove vuoi continuare/);
});
