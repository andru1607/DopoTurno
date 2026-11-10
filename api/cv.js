'use strict';
const {json,method,body,upstream,session,guarded,fail,isUuid,text}=require('../lib/cloud-server');
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedFields=['owner_id','display_name','professional_title','area','summary','skills','updated_at'];
const cvSelect=allowedFields.join(',');
async function db(cfg,token,table,query,opts){
 return upstream(cfg,'/rest/v1/'+table+(query?'?'+new URLSearchParams(query):''),{token,...opts});
}
module.exports=async function handler(req,res){
 if(!method(req,res,['GET','POST']))return;
 const cfg=guarded(req,res);if(!cfg)return;
 try{
  const s=await session(req,res,cfg);if(!s){json(res,401,{error:'Accedi per gestire il curriculum online.'});return}
  if(req.method==='GET'){
   if(req.query?.scope==='received'){
    const out=await db(cfg,s.token,'dt_cv',{select:cvSelect,order:'updated_at.desc',limit:'20'});
    if(!out.ok){json(res,502,{error:'Impossibile leggere i CV autorizzati.'});return}
    json(res,200,{profiles:(out.data||[]).filter(x=>x.owner_id!==s.user.id)});return;
   }
   const own=await db(cfg,s.token,'dt_cv',{select:cvSelect,owner_id:'eq.'+s.user.id,limit:'1'});
   const grants=await db(cfg,s.token,'dt_cv_grants',{select:'id,viewer_email,expires_at,revoked_at',owner_id:'eq.'+s.user.id,order:'created_at.desc',limit:'50'});
   if(!own.ok||!grants.ok){json(res,502,{error:'Impossibile caricare i dati del CV.'});return}
   json(res,200,{profile:own.data?.[0]||null,grants:grants.data||[]});return;
  }
  const input=body(req,6500);
  if(input.action==='save'){
   const p=input.profile;
   if(!p||typeof p!=='object'||Array.isArray(p)){json(res,400,{error:'Dati CV non validi.'});return}
   const fields={display_name:text(p.name,130),professional_title:text(p.title,150),area:text(p.area,150),summary:text(p.summary,1500),skills:text(p.skills,600)};
   if(fields.display_name.length>130||fields.professional_title.length>150||fields.area.length>150||fields.summary.length>1500||fields.skills.length>600){
    json(res,400,{error:'Alcuni campi del CV sono troppo lunghi.'});return;
   }
   const out=await db(cfg,s.token,'dt_cv',{on_conflict:'owner_id'},{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{owner_id:s.user.id,...fields,updated_at:new Date().toISOString()}});
   if(!out.ok){json(res,502,{error:'Non è stato possibile salvare il curriculum.'});return}
   json(res,200,{success:true});return;
  }
  if(input.action==='grant'){
   const email=text(input.viewerEmail,254).toLowerCase(),days=Number(input.days);
   if(!EMAIL.test(email)||email.length>254||email===s.user.email?.toLowerCase()||![7,30,90].includes(days)){json(res,400,{error:'Email destinatario o durata non validi.'});return}
   const expires_at=new Date(Date.now()+days*86400000).toISOString();
   const out=await db(cfg,s.token,'dt_cv_grants',{on_conflict:'owner_id,viewer_email'},{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{owner_id:s.user.id,viewer_email:email,expires_at,revoked_at:null}});
   if(!out.ok){json(res,502,{error:'L’autorizzazione non è stata creata. Prima salva il CV.'});return}
   json(res,200,{success:true});return;
  }
  if(input.action==='revoke'){
   if(!isUuid(input.id)){json(res,400,{error:'Autorizzazione non valida.'});return}
   const out=await db(cfg,s.token,'dt_cv_grants',{id:'eq.'+input.id,owner_id:'eq.'+s.user.id},{method:'PATCH',prefer:'return=minimal',body:{revoked_at:new Date().toISOString()}});
   if(!out.ok){json(res,502,{error:'Revoca non riuscita.'});return}
   json(res,200,{success:true});return;
  }
  json(res,400,{error:'Operazione non valida.'});
 }catch(e){fail(res,e)}
};
