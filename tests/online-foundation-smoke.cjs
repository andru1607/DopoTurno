'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cloud=require('../lib/cloud-server');
const bridge=require('../lib/web-bridge.cjs');
const base='https://dopoturno.example.vercel.app';
const realEnv={DT_SUPABASE_URL:process.env.DT_SUPABASE_URL,DT_SUPABASE_PUBLISHABLE_KEY:process.env.DT_SUPABASE_PUBLISHABLE_KEY};
function resetEnv(){
 if(realEnv.DT_SUPABASE_URL===undefined)delete process.env.DT_SUPABASE_URL;else process.env.DT_SUPABASE_URL=realEnv.DT_SUPABASE_URL;
 if(realEnv.DT_SUPABASE_PUBLISHABLE_KEY===undefined)delete process.env.DT_SUPABASE_PUBLISHABLE_KEY;else process.env.DT_SUPABASE_PUBLISHABLE_KEY=realEnv.DT_SUPABASE_PUBLISHABLE_KEY;
}
function configured(){
 process.env.DT_SUPABASE_URL='https://test-dopoturno.supabase.co';
 process.env.DT_SUPABASE_PUBLISHABLE_KEY='sb_publishable_0123456789012345678901';
}
function request(path,method='GET',body,origin=base){
 return new Request(base+path,{method,headers:{...(method!=='GET'?{origin,'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});
}
test('Online foundation is fail-closed without a DEDICATED project',async()=>{
 const oldURL=process.env.DT_SUPABASE_URL,oldKey=process.env.DT_SUPABASE_PUBLISHABLE_KEY;
 delete process.env.DT_SUPABASE_URL;delete process.env.DT_SUPABASE_PUBLISHABLE_KEY;
 try{
  assert.equal(cloud.config(),null);
  const {default:status}=await import('../api/status.mjs');
  const response=await status.fetch(request('/api/status'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{configured:false,mode:'local'});
  const {default:auth}=await import('../api/auth.mjs');
  const unavailable=await auth.fetch(request('/api/auth'));
  assert.equal(unavailable.status,503);
 }finally{if(oldURL!==undefined)process.env.DT_SUPABASE_URL=oldURL;else delete process.env.DT_SUPABASE_URL;if(oldKey!==undefined)process.env.DT_SUPABASE_PUBLISHABLE_KEY=oldKey;else delete process.env.DT_SUPABASE_PUBLISHABLE_KEY}
});
test('Supabase URL and credentials must match a restricted publishable key and trusted Supabase host',()=>{
 configured();
 assert.equal(cloud.config().base,'https://test-dopoturno.supabase.co');
 process.env.DT_SUPABASE_URL='https://attacker.example.org';
 assert.equal(cloud.config(),null);
 process.env.DT_SUPABASE_URL='https://test-dopoturno.supabase.co';
 process.env.DT_SUPABASE_PUBLISHABLE_KEY='service_role_must_never_work';
 assert.equal(cloud.config(),null);
 resetEnv();
});
test('Mutations reject cross-site requests before touching Supabase',async()=>{
 configured();
 const {default:auth}=await import('../api/auth.mjs');
 const res=await auth.fetch(request('/api/auth','POST',{action:'login',email:'worker@example.com',password:'correcthorsebatterystaple'},'https://attacker.example.com'));
 assert.equal(res.status,403);
 assert.match((await res.json()).error,/Origine/);
 resetEnv();
});
test('Authentication cookies are HttpOnly, Secure and not in JSON responses',async()=>{
 configured();
 const originalFetch=global.fetch,token='jwt_test_token_do_not_expose',refresh='refresh_token_sensitive';
 global.fetch=async(url,init)=>{
  if(url.includes('grant_type=password'))return new Response(JSON.stringify({access_token:token,refresh_token:refresh,expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'9e1ae582-6f68-4bca-bd66-f00abc7421bb',email:'worker@example.com',email_confirmed_at:'2026-11-10T12:00:00Z'}),{status:200});
  throw Error('Unexpected upstream');
 };
 try{
  const {default:auth}=await import('../api/auth.mjs');
  const response=await auth.fetch(request('/api/auth','POST',{action:'login',email:'worker@example.com',password:'correcthorsebatterystaple'}));
  assert.equal(response.status,200);
  const value=await response.text();assert.doesNotMatch(value,/jwt_test|refresh_token_sensitive/);
  assert.match(value,/worker@example.com/);
  const cookies=response.headers.getSetCookie?response.headers.getSetCookie():[response.headers.get('set-cookie')||''];
  assert.equal(cookies.length,2);
  for(const c of cookies){assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.match(c,/SameSite=Lax/);assert.match(c,/Path=\/api/);}
 }finally{global.fetch=originalFetch;resetEnv()}
});
test('Community, CV and progress stay inaccessible without an authenticated session',async()=>{
 configured();
 const originalFetch=global.fetch;global.fetch=async()=>{throw Error('Should not call upstream when no auth cookies')};
 try{
  for(const endpoint of ['community','cv','progress']){
   const {default:entry}=await import('../api/'+endpoint+'.mjs');
   const response=await entry.fetch(request('/api/'+endpoint));
   assert.equal(response.status,401,endpoint);
  }
 }finally{global.fetch=originalFetch;resetEnv()}
});
test('Oversize payloads rejected before handling',async()=>{
 const out=await bridge(request('/api/any','POST',{x:'x'.repeat(300001)}),async()=>{throw Error('Must not run')});
 assert.equal(out.status,413);
});
test('Online UI escapes untrusted title and body; does not send local posts on boot',()=>{
 const sandbox={window:{},Intl,Promise,Date,fetch:undefined,confirm:()=>true,Blob};
 vm.createContext(sandbox);vm.runInContext(read('online-client.js'),sandbox,{filename:'online-client.js'});
 const ui=sandbox.window.DopoTurnoOnline;
 assert.ok(ui);
 assert.equal(ui.hasUser(),false);
 assert.match(ui.authPanel(),/Accesso online non ancora attivo|Verifica della disponibilità/);
 ui.data.checked=true;ui.data.configured=true;ui.data.user={id:'owner',email:'test@example.com'};
 ui.data.kind='messaggio';ui.data.posts=[{id:'x',author_id:'other',kind:'messaggio',category:'sala',title:'<script>alert(1)</script>',body:'<img src=x onerror=alert(1)>',created_at:new Date().toISOString()}];
 const html=ui.communityPage('messaggio');
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<img src=x onerror/);
 assert.match(ui.cvPanel(),/Non|Controlla chi può leggerlo/);
});
test('Database schema is RLS-first, scopes CV access and forbids invisible publication',()=>{
 const sql=read('db/dopoturno_online_schema.sql');
 for(const name of ['dt_posts','dt_comments','dt_reports','dt_progress','dt_cv','dt_cv_grants']){
  assert.match(sql,new RegExp('alter table public\\.'+name+' enable row level security'));
 }
 assert.match(sql,/viewer_email=lower\(\(select auth\.jwt\(\)->>'email'\)\)/);
 assert.match(sql,/revoked_at is null and g\.expires_at>now\(\)/);
 assert.match(sql,/owner_id=\(select auth\.uid\(\)\)/);
 assert.doesNotMatch(sql,/grant\s+select\s+on\s+public\.dt_reports\s+to\s+authenticated/i);
 assert.doesNotMatch(sql,/grant\s+.*\s+to anon/i);
});
