'use strict';
const {config,json,method,body,upstream,session,guarded,fail,setSession,clearSession,text,authResult}=require('../lib/cloud-server');
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
module.exports=async function handler(req,res){
 if(!method(req,res,['GET','POST']))return;
 const cfg=guarded(req,res);if(!cfg)return;
 try{
  if(req.method==='GET'){
   const s=await session(req,res,cfg);
   json(res,200,{user:s?authResult(s.user):null});
   return;
  }
  const input=body(req,4096),action=input.action;
  if(action==='logout'){
   // Revocation is best effort; cookies are cleared regardless.
   const s=await session(req,res,cfg).catch(()=>null);
   if(s)await upstream(cfg,'/auth/v1/logout',{method:'POST',token:s.token}).catch(()=>{});
   clearSession(res);json(res,200,{user:null});return;
  }
  if(!['login','signup'].includes(action)){json(res,400,{error:'Operazione non valida.'});return}
  const email=text(input.email,254).toLowerCase(),password=input.password;
  if(!emailPattern.test(email)||email.length>254||typeof password!=='string'||password.length<10||password.length>128){
   json(res,400,{error:'Inserisci una email valida e una password da 10 a 128 caratteri.'});return;
  }
  const endpoint=action==='login'?'/auth/v1/token?grant_type=password':'/auth/v1/signup';
  const response=await upstream(cfg,endpoint,{method:'POST',body:{email,password}});
  if(!response.ok){
   json(res,action==='login'?401:400,{error:action==='login'?'Credenziali non valide oppure email da confermare.':'Registrazione non disponibile. Controlla i dati e riprova.'});
   return;
  }
  if(response.data?.access_token&&response.data?.refresh_token){
   setSession(res,response.data);
   const who=await upstream(cfg,'/auth/v1/user',{token:response.data.access_token});
   json(res,200,{user:who.ok?authResult(who.data):null,confirmationRequired:!who.ok});
  }else{
   json(res,200,{user:null,confirmationRequired:true,message:'Controlla la posta e conferma la tua email prima di accedere.'});
  }
 }catch(e){fail(res,e)}
};
