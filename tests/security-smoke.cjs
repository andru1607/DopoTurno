'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const page=read('index.html');
const config=JSON.parse(read('vercel.json'));
const policy=config.headers.find(x=>x.source==='/(.*)').headers.find(x=>x.key==='Content-Security-Policy').value;

function forum(){
  const sandbox={window:{},Date,Intl};
  vm.runInNewContext(read('confronti-forum.js'),sandbox,{filename:'confronti-forum.js',timeout:1500});
  return sandbox.window.DopoTurnoForum;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

test('HTML does not contain inline executable code',()=>{
  assert.equal((page.match(/<script\b/gi)||[]).length,18);
  assert.equal((page.match(/<script\b[^>]*\bsrc=/gi)||[]).length,18);
  assert.doesNotMatch(page,/<style[\s>]/i);
  assert.doesNotMatch(page,/\son[a-z]+\s*=/i);
  for(const name of ['academy-app.js','academy-sala-data.js','academy-extra-data.js','academy-assets.js','confronti-forum.js','intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js','turn-tips.js','shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','assessment-ledger.js','exam-recovery.js'])assert.ok(page.includes(name),name);
});

test('strict script CSP and isolation headers',()=>{
  assert.match(policy,/script-src 'self';/);
  assert.doesNotMatch(policy,/script-src 'self' 'unsafe-inline'/);
  for(const piece of ["script-src-attr 'none'","connect-src 'none'","frame-ancestors 'none'","base-uri 'none'","object-src 'none'"])assert.ok(policy.includes(piece));
  const headers=Object.fromEntries(config.headers[0].headers.map(h=>[h.key,h.value]));
  assert.equal(headers['X-Frame-Options'],'DENY');
  assert.equal(headers['Referrer-Policy'],'no-referrer');
  assert.equal(headers['X-Content-Type-Options'],'nosniff');
});

test('all application scripts can be parsed',()=>{
  for(const name of ['academy-assets.js','academy-sala-data.js','academy-extra-data.js','academy-app.js','confronti-forum.js','intermediate-course-builder.js','intermediate-sala.js','intermediate-cucina.js','intermediate-bar.js','learning-path.js','microlearning.js','turn-tips.js','shift-sim-sala.js','shift-sim-cucina.js','shift-sim-bar.js','shift-sim-engine.js','assessment-ledger.js','exam-recovery.js'])assert.doesNotThrow(()=>new vm.Script(read(name),{filename:name}));
});

test('forum recognizes common accidental identifiers',()=>{
  const f=forum();
  for(const [value,kind] of [
    ['La mail è mario.rossi@example.com','email'],
    ['Chiamami al +39 333 1234567','phone'],
    ['Mi trovi su https://esempio.it','url'],
    ['Il mio profilo è @persona123','handle'],
    ['Lavoro in Via Roma 12','address'],
    ['Hotel Da Giuseppe','venue']
  ])assert.ok(f.privacyRisks(value).some(x=>x.key===kind),kind);
  assert.equal(f.privacyRisks('Il cliente ha atteso dieci minuti').length,0);
});

test('forum escapes untrusted text in the feed',()=>{
  const f=forum();
  const saved={};
  const state={forumSearch:'',forumSort:'recenti',forumFilter:'tutti',forumOpened:null};
  f.ensure(saved);
  saved.forumThreads.push({
    id:'thread-unsafe',category:'Sala',role:'sala',topic:'domanda',title:'<script>alert(1)</script>',
    body:'<img src=x onerror=alert(1)>',createdAt:new Date().toISOString()
  });
  const html=f.render({state,saved,esc,ico:x=>x,header:()=>''});
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});

test('reporting is clearly marked as local only',()=>{
  const f=forum();const saved={};const state={modal:'forumReport'};
  f.ensure(saved);
  const html=f.modal({state,saved,esc,ico:x=>x});
  assert.match(html,/NON vengono inviate a moderatori/);
  assert.match(html,/nessuno la esaminerà/i);
  assert.match(f.render({state:{forumFilter:'tutti',forumSort:'recenti',forumSearch:'',forumOpened:null},saved,esc,ico:x=>x,header:()=>''}),/Cancella i miei dati di Confronti/);
});
