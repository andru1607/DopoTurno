'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dataFiles=[
 'academy-sala-data.js','academy-extra-data.js',
 'intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js',
 'learning-path.js','microlearning.js','turn-tips.js',
 'shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','assessment-ledger.js','exam-recovery.js'
];
function harness(hash='#academy'){
 const app={innerHTML:''},storage={},listeners={};
 const sandbox={
  window:{addEventListener(){},scrollTo(){},print(){}},
  document:{getElementById(id){return id==='app'?app:null},addEventListener(k,f){listeners[k]=f},querySelector(){return null},createElement(){return {remove(){},parentNode:null}},body:{appendChild(){}}},
  localStorage:{getItem:k=>storage[k]||null,setItem(k,v){storage[k]=v}},
  location:{hash},
  history:{pushState(_a,_b,url){sandbox.location.hash=url}},
  setTimeout(){},requestAnimationFrame(fn){fn()},confirm(){return true}
 };
 vm.createContext(sandbox);
 for(const f of dataFiles)vm.runInContext(read(f),sandbox,{filename:f,timeout:5000});
 const code=read('academy-app.js'),tail='render();\n})();';
 assert.equal(code.split(tail).length,2,'app source test hook');
 vm.runInContext(code.replace(tail,'window.TEST={state,saved,render,onAction,setPage,backupData,readRoute,shiftContext};render();\n})();'),sandbox,{filename:'academy-app.js',timeout:10000});
 return {app,api:sandbox.window.TEST,shift:sandbox.window.DopoTurnoShift,tips:sandbox.window.DopoTurnoTips,sandbox,storage};
}
test('Eighteen professional scenarios have 54 decision points and 162 plausible options',()=>{
 const h=harness(),cases=h.shift.CASES,ids=new Set();
 assert.equal(cases.length,18);
 assert.equal(cases.reduce((n,c)=>n+c.steps.length,0),54);
 assert.equal(cases.reduce((n,c)=>n+c.steps.reduce((m,s)=>m+s.choices.length,0),0),162);
 for(const role of ['sala','cucina','bar'])assert.equal(cases.filter(c=>c.role===role).length,6);
 for(const c of cases){
  assert.ok(!ids.has(c.id),c.id);ids.add(c.id);
  assert.equal(c.places.length,5,c.id);
  assert.equal(c.debrief.length,3,c.id);
  assert.ok(c.opening.length>100,c.id);
  for(const b of c.steps){
   assert.equal(b.choices.length,3,c.id);
   assert.equal(b.choices.filter(x=>x.kind==='strong').length,1,c.id);
   assert.ok(b.choices.every(x=>x.explanation.length>38),c.id);
   assert.ok(b.choices.every(x=>!x.critical||x.kind==='weak'),c.id);
  }
 }
});
test('Academy, tips, scenarios, filters and visual workplace maps are connected',()=>{
 const h=harness(),a=h.api,s=h.shift;
 assert.match(h.app.innerHTML,/18 (simulazioni formative|scenari)/);
 a.setPage('shiftSimList');
 assert.equal(a.state.page,'shiftSimList');
 assert.match(h.app.innerHTML,/18 scenari trovati/);
 a.onAction('shiftRole',{dataset:{id:'cucina'}});
 assert.match(h.app.innerHTML,/6 scenari trovati/);
 a.onAction('shiftPhase',{dataset:{id:'Prima del servizio'}});
 assert.match(h.app.innerHTML,/scenari trovati/);
 a.onAction('shiftOpen',{dataset:{id:'C01'}});
 assert.equal(a.state.page,'shiftSimRun');
 assert.match(h.app.innerHTML,/Schema del reparto/);
 assert.match(h.app.innerHTML,/aria-label="Esamina/);
 assert.doesNotMatch(h.app.innerHTML,/Decisione solida/);
 a.onAction('shiftInspect',{dataset:{step:'2'}});
 assert.match(h.app.innerHTML,/Postazione 3/);
 a.setPage('turnTips');
 a.onAction('tipsToggle',{dataset:{id:'T001'}});
 assert.match(h.app.innerHTML,/Simula questa situazione|Esercitati con un caso dello stesso reparto/);
 assert.equal(h.tips.TIPS.length,76);
 assert.ok(h.tips.TIPS.every(t=>s.forTip(t.id)?.case?.role===t.role));
});
test('A complete three-decision session saves state, reveals delayed feedback and provides a debrief',()=>{
 const h=harness(),a=h.api,s=h.shift,id='S03',c=s.lookup(id);
 a.onAction('shiftOpen',{dataset:{id}});
 for(let step=0;step<3;step++){
  assert.doesNotMatch(h.app.innerHTML,/Motivazione\./,'No answer feedback before the choice');
  const best=c.steps[step].choices.findIndex(x=>x.kind==='strong');
  a.onAction('shiftChoose',{dataset:{step:String(best)}});
  assert.equal(a.state.shiftSimRun.phase,'feedback');
  assert.match(h.app.innerHTML,/Decisione solida/);
  if(step<2)assert.ok(a.saved.shiftSimDraft?.choices.length===step+1);
  a.onAction('shiftNext',{dataset:{}});
 }
 assert.equal(a.state.shiftSimRun.phase,'finished');
 assert.equal(a.saved.shiftSimResults[id].strong,3);
 assert.equal(a.saved.shiftSimDraft,null);
 assert.match(h.app.innerHTML,/DEBRIEFING FORMATIVO/);
 assert.match(h.app.innerHTML,/Tre decisioni coerenti/);
 assert.match(h.app.innerHTML,/non attestazione professionale/);
 const backup=a.backupData();assert.ok(backup.shiftSimResults[id]);
 a.onAction('shiftRetry',{dataset:{}});
 assert.equal(a.state.shiftSimRun.step,0);
 assert.equal(a.state.shiftSimRun.choices.length,0);
});
test('Critical decisions remain visible as risks and never become certificates',()=>{
 const h=harness(),a=h.api,s=h.shift;
 for(const id of ['S02','C04','B05']){
  const c=s.lookup(id);
  a.onAction('shiftOpen',{dataset:{id}});
  for(let i=0;i<3;i++){
   const choices=c.steps[i].choices;
   const index=i===0?choices.findIndex(x=>x.critical):choices.findIndex(x=>x.kind==='strong');
   assert.ok(index>=0,id);
   a.onAction('shiftChoose',{dataset:{step:String(index)}});
   if(i===0)assert.match(h.app.innerHTML,/Rischio critico nella decisione/);
   a.onAction('shiftNext',{dataset:{}});
  }
  assert.ok(a.saved.shiftSimResults[id].critical>=1,id);
  assert.match(h.app.innerHTML,/rischio critico/i);
  assert.doesNotMatch(h.app.innerHTML,/certificazione riconosciuta|qualifica ottenuta/i);
 }
});
test('In-progress scenarios survive the saved draft; malformed imports are discarded',()=>{
 const h=harness(),a=h.api,s=h.shift,id='C02';
 a.onAction('shiftOpen',{dataset:{id}});
 a.onAction('shiftChoose',{dataset:{step:'1'}});
 assert.equal(a.saved.shiftSimDraft.id,id);
 a.state.shiftSimRun=null;
 assert.equal(s.getRun(a.shiftContext()).phase,'feedback');
 const data=s.importState({
  shiftSimDraft:{id:'C02',step:0,phase:'feedback',choices:[1]},
  shiftSimResults:{S01:{choices:[0,1,2],finishedAt:'2026-11-06'},EVIL:{choices:[0,1,2]}}
 });
 assert.ok(data.shiftSimDraft);
 assert.equal(data.shiftSimResults.EVIL,undefined);
 assert.equal(s.validDraft({id:'C02',step:2,phase:'feedback',choices:[1]}),null);
 assert.equal(s.validDraft({id:'Z99',step:0,phase:'question',choices:[]}),null);
 assert.ok(read('academy-app.js').includes('SHIFT.importState(d)'));
});
test('Each scenario keeps its own unfinished progress, survives backup and restores legacy drafts',()=>{
 const h=harness(),a=h.api,s=h.shift;
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 a.onAction('shiftChoose',{dataset:{step:'0'}});
 assert.equal(a.saved.shiftSimDrafts.S01.phase,'feedback');
 a.onAction('shiftOpen',{dataset:{id:'C02'}});
 assert.equal(a.state.shiftSimRun.phase,'question');
 a.onAction('shiftChoose',{dataset:{step:'2'}});
 assert.equal(a.saved.shiftSimDrafts.C02.choices[0],2);
 assert.equal(a.saved.shiftSimDrafts.S01.choices[0],0,'changing case must not erase previous draft');
 a.setPage('shiftSimList');
 assert.match(h.app.innerHTML,/data-case-id="S01"[\s\S]*?Riprendi/);
 assert.match(h.app.innerHTML,/data-case-id="C02"[\s\S]*?Riprendi/);
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 assert.equal(a.state.shiftSimRun.phase,'feedback');
 assert.equal(a.state.shiftSimRun.choices[0],0);
 const backup=a.backupData();
 assert.equal(Object.keys(backup.shiftSimDrafts).length,2);
 const imported=s.importState(backup);
 assert.deepEqual(Object.keys(imported.shiftSimDrafts).sort(),['C02','S01']);
 const old=s.importState({shiftSimDraft:{id:'B01',step:0,phase:'feedback',choices:[1]}});
 assert.equal(old.shiftSimDrafts.B01.choices[0],1,'old backups must still restore');
 assert.deepEqual(Object.keys(s.importState({shiftSimDrafts:{S01:{id:'C02',step:0,phase:'feedback',choices:[0]},EVIL:{id:'EVIL',step:0,phase:'question',choices:[]}}}).shiftSimDrafts),[],'invalid or mis-keyed imported drafts must be discarded');
 a.onAction('shiftRetry',{dataset:{}});
 assert.equal(a.saved.shiftSimDrafts.S01,undefined);
 assert.equal(a.saved.shiftSimDrafts.C02.choices[0],2,'restart must only reset selected case');
 a.onAction('shiftOpen',{dataset:{id:'C02'}});
 assert.equal(a.state.shiftSimRun.phase,'feedback');
 assert.equal(a.state.shiftSimRun.choices[0],2);
});
test('All decision branches render, and inline executable scripts remain prohibited',()=>{
 const h=harness(),s=h.shift,a=h.api;
 let visited=0;
 for(const c of s.CASES){
  for(let choice=0;choice<3;choice++){
   a.onAction('shiftOpen',{dataset:{id:c.id}});
   for(let i=0;i<3;i++){
    const index=choice;
    assert.doesNotMatch(h.app.innerHTML,/shift-feedback (?:strong|critical)/);
    a.onAction('shiftChoose',{dataset:{step:String(index)}});
    assert.equal(a.state.shiftSimRun.choices[i],index);
    a.onAction('shiftNext',{dataset:{}});
    visited++;
   }
   assert.equal(a.state.shiftSimRun.phase,'finished',c.id);
  }
 }
 assert.equal(visited,162);
 const index=read('index.html');
 for(const f of ['shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','shift-sim.css'])assert.ok(index.includes(f),f);
 assert.doesNotMatch(index,/<script>(?:.|\n)*?<\/script>/);
});

test('Keyboard and VoiceOver focus follows choice feedback, decisions and map stations',()=>{
 const h=harness(),a=h.api,seq=[];
 const node=selector=>({
   dataset:{id:'sala',step:'2'},hasAttribute(){return false},setAttribute(name,value){seq.push(['attr',selector,name,value])},
   focus(){seq.push(['focus',selector])},scrollIntoView(){seq.push(['scroll',selector])}
 });
 h.sandbox.document.querySelector=selector=>node(selector);
 h.sandbox.document.querySelectorAll=selector=>selector==='[data-action="shiftInspect"]'?[node('station-2')]:null;
 a.onAction('shiftOpen',{dataset:{id:'S01'}});
 assert.ok(seq.some(x=>x[1]==='.shift-case-header h1'), 'focus heading on open');
 a.onAction('shiftChoose',{dataset:{step:'0'}});
 assert.ok(seq.some(x=>x[1]==='.shift-feedback'), 'focus outcome after choice');
 a.onAction('shiftNext',{dataset:{}});
 assert.ok(seq.some(x=>x[1]==='.shift-decision h2'),'focus next question');
 a.onAction('shiftInspect',{dataset:{step:'2'}});
 assert.ok(seq.some(x=>x[1]==='station-2'),'map station retains focus');
});
test('In-place search filters the existing list without re-rendering the mobile text field',()=>{
 const h=harness(),sim=h.shift,cards=[
  {dataset:{caseId:'S02'},hidden:false},
  {dataset:{caseId:'B02'},hidden:false},
  {dataset:{caseId:'S01'},hidden:false}
 ];
 let renders=0;const indicator={textContent:''};
 const ctx={state:{shiftFilters:{role:'tutti',phase:'tutte',query:''}},
   document:{querySelectorAll(sel){return sel==='.shift-card[data-case-id]'?cards:null},querySelector(sel){return sel==='.shift-count'?indicator:null}},
   render(){renders++}};
 assert.equal(sim.search(ctx,'allergia'),true);
 assert.equal(renders,0,'no full redraw on mobile input');
 assert.ok(cards.some(c=>c.hidden)&&cards.some(c=>!c.hidden));
 assert.ok(indicator.textContent.includes('scenari trovati'));
 sim.search(ctx,'');
 assert.equal(cards.filter(c=>c.hidden).length,0);
 assert.equal(renders,0);
});
