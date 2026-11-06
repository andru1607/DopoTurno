'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=[
 'academy-sala-data.js','academy-extra-data.js','intermediate-course-builder.js',
 'intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js',
 'learning-path.js','microlearning.js','turn-tips.js',
 'shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js'
];
function boot(){
 const root={innerHTML:''},store={},focus=[],scroll=[];
 const dom={
   getElementById(id){return id==='app'?root:null},
   addEventListener(){},createElement(){return {remove(){},parentNode:null}},body:{appendChild(){}},
   querySelector(sel){
    const targets=['.shift-feedback','.shift-decision h2','.shift-result h2','.shift-case-header h1'];
    if(!targets.includes(sel))return null;
    const key=sel.includes('feedback')?'shift-feedback':sel.includes('decision')?'shift-decision':sel.includes('result')?'shift-result':'shift-case-header';
    if(!root.innerHTML.includes(key))return null;
    return {focus(){focus.push(sel)},scrollIntoView(){scroll.push(sel)}};
   }
 };
 const sandbox={
  window:{addEventListener(){},scrollTo(){},print(){},matchMedia(){return {matches:true}},requestAnimationFrame(fn){fn()}},
  document:dom,localStorage:{getItem:k=>store[k]||null,setItem(k,v){store[k]=v}},
  location:{hash:'#academy'},
  history:{pushState(_a,_b,hash){sandbox.location.hash=hash}},
  setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(sandbox);
 for(const file of files)vm.runInContext(read(file),sandbox,{filename:file,timeout:5000});
 const original=read('academy-app.js'),tail='render();\n})();';
 assert.equal(original.split(tail).length,2);
 vm.runInContext(original.replace(tail,'window.TEST={state,saved,render,onAction,setPage,readRoute,shiftContext,backupData};render();\n})();'),sandbox,{filename:'academy-app.js',timeout:8000});
 return {root,focus,scroll,sandbox,app:sandbox.window.TEST,shift:sandbox.window.DopoTurnoShift};
}
test('Controls are touch sized and iOS search fields avoid unintended zoom',()=>{
 const css=read('shift-sim.css'),micro=read('microlearning.css'),tips=read('turn-tips.css');
 assert.match(css,/\.shift-pin\{[^}]*min-width:44px;min-height:44px/);
 assert.match(css,/\.shift-filters>input\{[^}]*font-size:16px/);
 assert.match(css,/\.shift-layout\{grid-template-areas:"play map"\}/);
 assert.match(css,/grid-template-areas:"map" "play"/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(micro,/\.micro-track-item\{min-width:44px;min-height:44px/);
 assert.match(micro,/\.micro-reading textarea\{font-size:16px\}/);
 assert.match(tips,/\.tips-controls input\{min-height:46px;font-size:16px\}/);
});
test('Responsive map appears before the decision, with visible accessible station controls',()=>{
 const b=boot(),a=b.app;
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 assert.equal(a.state.page,'shiftSimRun');
 const html=b.root.innerHTML;
 assert.ok(html.indexOf('<aside class="shift-map-panel">')<html.indexOf('<div class="shift-play-container">'));
 assert.match(html,/Schema del reparto/);
 assert.equal((html.match(/data-action="shiftInspect"/g)||[]).length,5);
 assert.match(html,/aria-label="Esamina/);
 assert.match(html,/shift-map-list/);
});
test('Every choice restores reading position and shows the better method only after submission',()=>{
 const b=boot(),a=b.app,c=b.shift.lookup('S01');
 a.onAction('shiftOpen',{dataset:{id:c.id}});
 assert.doesNotMatch(b.root.innerHTML,/Intervento preferibile/);
 const bad=c.steps[0].choices.findIndex(x=>x.kind==='weak');
 a.onAction('shiftChoose',{dataset:{step:String(bad)}});
 assert.match(b.root.innerHTML,/Intervento preferibile/);
 assert.equal(b.focus.at(-1),'.shift-feedback');
 assert.equal(b.scroll.at(-1),'.shift-feedback');
 a.onAction('shiftNext',{dataset:{}});
 assert.equal(b.focus.at(-1),'.shift-decision h2');
 assert.equal(b.scroll.at(-1),'.shift-decision h2');
 for(let i=1;i<3;i++){
  const best=c.steps[i].choices.findIndex(x=>x.kind==='strong');
  a.onAction('shiftChoose',{dataset:{step:String(best)}});
  a.onAction('shiftNext',{dataset:{}});
 }
 assert.equal(a.state.shiftSimRun.phase,'finished');
 assert.equal(b.focus.at(-1),'.shift-result h2');
 assert.match(b.root.innerHTML,/Intervento di riferimento/);
 assert.match(b.root.innerHTML,/Rivedi e riprova/);
});
test('Several interrupted cases are independently resumable; only the completed case is cleared',()=>{
 const b=boot(),a=b.app;
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 a.onAction('shiftChoose',{dataset:{step:'0'}});
 a.onAction('shiftNext',{dataset:{}});
 a.onAction('shiftOpen',{dataset:{id:'C02'}});
 a.onAction('shiftChoose',{dataset:{step:'2'}});
 assert.ok(a.saved.shiftSimDrafts.S01);
 assert.ok(a.saved.shiftSimDrafts.C02);
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 assert.equal(a.state.shiftSimRun.step,1);
 assert.equal(a.state.shiftSimRun.phase,'question');
 a.onAction('shiftOpen',{dataset:{id:'C02'}});
 assert.equal(a.state.shiftSimRun.phase,'feedback');
 assert.equal(a.state.shiftSimRun.choices[0],2);
 const previous=a.backupData();
 const imported=b.shift.importState(previous);
 assert.ok(imported.shiftSimDrafts.S01);
 assert.ok(imported.shiftSimDrafts.C02);
 a.onAction('shiftRetry',{dataset:{}});
 assert.equal(a.saved.shiftSimDrafts.C02,undefined);
 assert.ok(a.saved.shiftSimDrafts.S01);
 for(let i=0;i<3;i++){
  const c=b.shift.lookup('C02'),best=c.steps[i].choices.findIndex(x=>x.kind==='strong');
  a.onAction('shiftChoose',{dataset:{step:String(best)}});
  a.onAction('shiftNext',{dataset:{}});
 }
 assert.equal(a.saved.shiftSimDrafts.C02,undefined);
 assert.ok(a.saved.shiftSimDrafts.S01);
 assert.equal(a.saved.shiftSimResults.C02.strong,3);
});
test('New contextual actions lead to a relevant next case or an exact technical tip',()=>{
 const b=boot(),a=b.app,c=b.shift.lookup('B05');
 a.onAction('shiftOpen',{dataset:{id:'B05'}});
 for(const step of c.steps){
  const best=step.choices.findIndex(x=>x.kind==='strong');
  a.onAction('shiftChoose',{dataset:{step:String(best)}});
  a.onAction('shiftNext',{dataset:{}});
 }
 assert.match(b.root.innerHTML,/Prossimo caso di Bar/);
 a.onAction('shiftReviewTip',{dataset:{id:c.tips[0]}});
 assert.equal(a.state.page,'turnTips');
 assert.equal(a.state.turnTips.open,c.tips[0]);
 assert.equal(a.state.turnTips.role,'bar');
 a.onAction('shiftOpen',{dataset:{id:'B05'}});
 for(let i=0;i<3;i++){a.onAction('shiftChoose',{dataset:{step:'0'}});a.onAction('shiftNext',{dataset:{}});}
 const nextId=b.shift.CASES.filter(s=>s.role==='bar')[5].id;
 a.onAction('shiftNextCase',{dataset:{id:nextId}});
 assert.equal(a.state.page,'shiftSimRun');
 assert.equal(a.state.shiftSimId,nextId);
});
test('Invalid routes and backup data cannot break the simulated Academy',()=>{
 const b=boot();
 b.sandbox.location.hash='#simulazione/%E0%A4%A';
 assert.equal(b.app.readRoute().page,'academy');
 const importData=b.shift.importState({shiftSimDrafts:{
  S01:{id:'S02',step:0,phase:'question',choices:[]},
  C01:{id:'C01',step:2,phase:'feedback',choices:[1]},
  B01:{id:'B01',step:0,phase:'feedback',choices:[0]}
 }});
 assert.equal(Object.keys(importData.shiftSimDrafts).length,1);
 assert.ok(importData.shiftSimDrafts.B01);
 assert.match(read('academy-app.js'),/SHIFT\.importState\(d\)/);
 assert.match(read('academy-app.js'),/'shiftSimDrafts'/);
});
