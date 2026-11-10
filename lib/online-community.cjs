'use strict';
const {json,method,body,upstream,session,guarded,fail,isUuid,text}=require('./cloud-server');
const kinds=['messaggio','confronto'],cats=['sala','cucina','bar','lavoro'];
function qp(o){return new URLSearchParams(o).toString()}
async function db(cfg,token,table,query,opts){
 return upstream(cfg,'/rest/v1/'+table+(query?'?'+query:''),{token,...opts});
}
module.exports=async function handler(req,res){
 if(!method(req,res,['GET','POST','DELETE']))return;
 const cfg=guarded(req,res);if(!cfg)return;
 try{
  const s=await session(req,res,cfg);
  if(!s){json(res,401,{error:'Accedi per partecipare alle discussioni online.'});return}
  if(req.method==='GET'){
   const kind=kinds.includes(req.query?.kind)?req.query.kind:'messaggio';
   const posts=await db(cfg,s.token,'dt_posts',qp({select:'id,author_id,kind,category,title,body,created_at',kind:'eq.'+kind,order:'created_at.desc',limit:'30'}));
   if(!posts.ok){json(res,502,{error:'Non è stato possibile caricare le conversazioni.'});return}
   const ids=(posts.data||[]).map(p=>p.id).filter(isUuid);
   let comments=[];
   if(ids.length){
    const out=await db(cfg,s.token,'dt_comments',qp({select:'id,post_id,author_id,body,created_at',post_id:'in.('+ids.join(',')+')',order:'created_at.asc',limit:'120'}));
    if(out.ok&&Array.isArray(out.data))comments=out.data;
   }
   json(res,200,{posts:Array.isArray(posts.data)?posts.data:[],comments,viewerId:s.user.id});return;
  }
  if(req.method==='POST'){
   const input=body(req,5000);
   if(input.action==='post'){
    const title=text(input.title,120),content=text(input.body,2000);
    if(!kinds.includes(input.kind)||!cats.includes(input.category)||title.length<10||title.length>120||content.length<40||content.length>2000){json(res,400,{error:'Titolo, reparto o contenuto non validi.'});return}
    const posted=await db(cfg,s.token,'dt_posts',qp({select:'id'}),{method:'POST',prefer:'return=representation',body:{author_id:s.user.id,kind:input.kind,category:input.category,title,body:content}});
    if(!posted.ok){json(res,400,{error:'Non è stato possibile pubblicare il contenuto.'});return}
    json(res,201,{id:posted.data?.[0]?.id||null});return;
   }
   if(input.action==='comment'){
    const content=text(input.body,1200);
    if(!isUuid(input.postId)||content.length<2||content.length>1200){json(res,400,{error:'Commento non valido.'});return}
    const posted=await db(cfg,s.token,'dt_comments','',{method:'POST',prefer:'return=minimal',body:{post_id:input.postId,author_id:s.user.id,body:content}});
    if(!posted.ok){json(res,400,{error:'Non è stato possibile aggiungere il commento.'});return}
    json(res,201,{success:true});return;
   }
   if(input.action==='report'){
    if(!isUuid(input.postId)||!['spam','privacy','abusi','altro'].includes(input.reason)){json(res,400,{error:'Segnalazione non valida.'});return}
    const reported=await db(cfg,s.token,'dt_reports','',{method:'POST',prefer:'return=minimal',body:{post_id:input.postId,reporter_id:s.user.id,reason:input.reason}});
    if(!reported.ok){json(res,400,{error:'Segnalazione non inviata oppure già presente.'});return}
    json(res,201,{success:true});return;
   }
   json(res,400,{error:'Azione non valida.'});return;
  }
  const postId=req.query?.postId,commentId=req.query?.commentId;
  if((!!postId===!!commentId)||!isUuid(postId||commentId)){json(res,400,{error:'Risorsa non valida.'});return}
  const table=postId?'dt_posts':'dt_comments',id=postId||commentId;
  const deleted=await db(cfg,s.token,table,qp({id:'eq.'+id,author_id:'eq.'+s.user.id}),{method:'DELETE',prefer:'return=minimal'});
  if(!deleted.ok){json(res,400,{error:'Impossibile eliminare il contenuto.'});return}
  json(res,200,{success:true});
 }catch(e){fail(res,e)}
};
