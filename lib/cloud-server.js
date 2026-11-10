'use strict';
// Server-only functions for the OPTIONAL dedicated DopoTurno project.
// Publishable key is intentionally not shipped in client code.
// Auth tokens are HttpOnly cookies; no service_role key is ever used.
const COOKIE_A='dt_session',COOKIE_R='dt_refresh';
const MAX_BODY=300000;
function config(){
 const base=(process.env.DT_SUPABASE_URL||'').replace(/\/+$/,'');
 const key=process.env.DT_SUPABASE_PUBLISHABLE_KEY||'';
 // Fail closed: environment cannot redirect a backend to arbitrary hosts.
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base))return null;
 if(!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key))return null;
 return {base,key};
}
function json(res,status,data){
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.end(JSON.stringify(data));
}
function method(req,res,allowed){
 if(!allowed.includes(req.method)){res.setHeader('Allow',allowed.join(', '));json(res,405,{error:'Metodo non consentito'});return false}
 return true;
}
function originOk(req){
 const origin=req.headers?.origin,host=req.headers?.host;
 if(!origin||!host)return false;
 try{const url=new URL(origin);return url.protocol==='https:'&&url.host===host}catch{return false}
}
function body(req,max=8000){
 const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});
 if(Buffer.byteLength(raw,'utf8')>max)throw Object.assign(new Error('Dimensione richiesta eccessiva'),{code:413});
 const parsed=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error('Formato non valido');
 return parsed;
}
function cookies(req){
 const value=String(req.headers?.cookie||'');
 return Object.fromEntries(value.split(';').map(x=>x.trim()).filter(x=>x.includes('=')).map(x=>{
  const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))];
 }));
}
function setSession(res,entry){
 const token=entry.access_token||'',refresh=entry.refresh_token||'';
 if(!token||!refresh)throw new Error('Incomplete session');
 const max=Math.max(60,Math.min(3600,Number(entry.expires_in)||3600));
 const secure='; HttpOnly; Secure; SameSite=Lax; Path=/api';
 res.setHeader('Set-Cookie',[
  COOKIE_A+'='+encodeURIComponent(token)+'; Max-Age='+max+secure,
  COOKIE_R+'='+encodeURIComponent(refresh)+'; Max-Age=2592000'+secure
 ]);
}
function clearSession(res){
 const secure='; HttpOnly; Secure; SameSite=Lax; Path=/api';
 res.setHeader('Set-Cookie',[
  COOKIE_A+'=; Max-Age=0'+secure,
  COOKIE_R+'=; Max-Age=0'+secure
 ]);
}
async function upstream(cfg,path,{method='GET',token,body,prefer}={}){
 if(!path.startsWith('/auth/v1/')&&!path.startsWith('/rest/v1/'))throw Error('Unsafe upstream path');
 const headers={'apikey':cfg.key,'Accept':'application/json'};
 if(token)headers.Authorization='Bearer '+token;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(prefer)headers.Prefer=prefer;
 const response=await fetch(cfg.base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(12000)});
 const raw=await response.text();let data;
 try{data=raw?JSON.parse(raw):null}catch{data=null}
 return {ok:response.ok,status:response.status,data};
}
async function session(req,res,cfg){
 const c=cookies(req),token=c[COOKIE_A],refresh=c[COOKIE_R];
 if(token){
  const found=await upstream(cfg,'/auth/v1/user',{token});
  if(found.ok&&found.data?.id)return {token,user:found.data};
 }
 if(refresh){
  const renewed=await upstream(cfg,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:refresh}});
  if(renewed.ok&&renewed.data?.access_token){
   setSession(res,renewed.data);
   const found=await upstream(cfg,'/auth/v1/user',{token:renewed.data.access_token});
   if(found.ok&&found.data?.id)return {token:renewed.data.access_token,user:found.data};
  }
 }
 if(token||refresh)clearSession(res);
 return null;
}
function fail(res,error){
 const code=error?.code===413?413:500;
 json(res,code,{error:code===413?'Dati troppo grandi.':'Errore di connessione. Riprova.'});
}
function guarded(req,res){
 const cfg=config();
 if(!cfg){json(res,503,{error:'Account online non configurati.'});return null}
 if(req.method!=='GET'&&!originOk(req)){json(res,403,{error:'Origine non autorizzata.'});return null}
 return cfg;
}
function isUuid(str){return typeof str==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)}
function text(v,max){return typeof v==='string'?v.trim().slice(0,max+1):''}
function authResult(user){return {id:user.id,email:typeof user.email==='string'?user.email:'',confirmed:!!user.email_confirmed_at}}
module.exports={config,json,method,body,originOk,upstream,session,guarded,fail,setSession,clearSession,isUuid,text,authResult,MAX_BODY};
